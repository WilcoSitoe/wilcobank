const express = require('express');
const router = express.Router();
const prisma = require('../database/prismaClient'); // ✅ NOVO

// GET /api/admin/dashboard - Dados completos para relatórios COM LUCRO DE TAXAS
router.get('/dashboard', async (req, res) => {
  try {
    const mesAtual = new Date();
    const inicioMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
    const fimMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0, 23, 59, 59);

    // 1. Total de clientes
    const totalClientes = await prisma.cliente.count();

    // 2. Saldo total do banco
    const saldoResult = await prisma.conta.aggregate({
      _sum: { saldo: true }
    });
    const saldoTotal = saldoResult._sum.saldo || 0;

    // 3. Depósitos do mês
    const depositosResult = await prisma.operacao.aggregate({
      where: {
        id_tipo_O: 2,
        data_operacao: { gte: inicioMes, lte: fimMes }
      },
      _sum: { valor: true }
    });
    const depositosMes = depositosResult._sum.valor || 0;

    // 4. Levantamentos do mês
    const levantamentosResult = await prisma.operacao.aggregate({
      where: {
        id_tipo_O: 1,
        data_operacao: { gte: inicioMes, lte: fimMes }
      },
      _sum: { valor: true }
    });
    const levantamentosMes = levantamentosResult._sum.valor || 0;

    // 5. Transferências do mês
    const transferenciasResult = await prisma.operacao.aggregate({
      where: {
        id_tipo_O: 3,
        data_operacao: { gte: inicioMes, lte: fimMes }
      },
      _sum: { valor: true }
    });
    const transferenciasMes = transferenciasResult._sum.valor || 0;

    // 6. Lucro com taxas este mês
    const taxasResult = await prisma.operacao.aggregate({
      where: {
        taxa_cobrada: { gt: 0 },
        data_operacao: { gte: inicioMes, lte: fimMes }
      },
      _sum: { taxa_cobrada: true },
      _count: { id_operacao: true }
    });
    const lucroTaxasMes = taxasResult._sum.taxa_cobrada || 0;
    const operacoesTaxasMes = taxasResult._count.id_operacao || 0;

    // 7. Tipos de conta (distribuição)
    const tiposConta = await prisma.tipoConta.findMany({
      include: {
        _count: {
          select: { contas: true }
        }
      }
    });

    const tiposFormatados = tiposConta.map(t => ({
      nome_tipo: t.nome_tipo,
      total_contas: t._count.contas
    }));

    // 8. Transações recentes com nome do cliente
    const recentes = await prisma.operacao.findMany({
      take: 15,
      orderBy: { data_operacao: 'desc' },
      include: {
        tipo: true,
        conta: {
          include: {
            cliente: {
              select: {
                nome_cliente: true,
                id_cliente: true
              }
            }
          }
        }
      }
    });

    const recentesFormatados = recentes.map(r => ({
      id_operacao: r.id_operacao,
      data_operacao: r.data_operacao,
      valor: r.valor,
      taxa_cobrada: r.taxa_cobrada || 0,
      tipo: r.tipo?.nome_operacao || 'Outro',
      nome_cliente: r.conta?.cliente?.nome_cliente,
      id_cliente: r.conta?.cliente?.id_cliente
    }));

    res.json({
      totalClientes,
      saldoTotal,
      depositosMes,
      levantamentosMes,
      transferenciasMes,
      lucroTaxasMes,
      operacoesTaxasMes,
      tiposConta: tiposFormatados,
      transacoesRecentes: recentesFormatados
    });

  } catch (err) {
    console.error('❌ Erro no dashboard:', err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

// =================================================================
// POST /api/admin/testar-juros - Executar juros em TODAS as contas poupança
// =================================================================
router.post('/testar-juros', async (req, res) => {
  const TAXA_JUROS = 0.005;
  const SALDO_MINIMO = 1000;
  
  try {
    // Buscar todas as contas poupança com saldo >= mínimo
    const contasPoupanca = await prisma.conta.findMany({
      where: {
        tipo: { nome_tipo: 'Poupanca' },
        saldo: { gte: SALDO_MINIMO }
      },
      include: {
        tipo: true,
        cliente: true
      }
    });

    if (contasPoupanca.length === 0) {
      return res.json({ message: 'Nenhuma conta poupança elegível para juros (saldo mínimo: 1.000 MT).' });
    }

    const resultados = [];

    // Aplicar juros a cada conta
    for (const conta of contasPoupanca) {
      const juros = conta.saldo * TAXA_JUROS;
      const novoSaldo = conta.saldo + juros;

      await prisma.$transaction([
        prisma.conta.update({
          where: { id_conta: conta.id_conta },
          data: { saldo: novoSaldo }
        }),
        prisma.operacao.create({
          data: {
            valor: juros,
            id_tipo_O: 4, // Juros
            numero_conta: conta.numero_conta,
            conta_relacionada: 'SISTEMA'
          }
        })
      ]);

      resultados.push({
        conta: conta.numero_conta,
        cliente: conta.cliente?.nome_cliente,
        juros: juros.toFixed(2),
        novo_saldo: novoSaldo.toFixed(2)
      });
    }

    res.json({
      message: `✅ Juros aplicados a ${resultados.length} conta(s) poupança!`,
      total_juros: resultados.reduce((sum, r) => sum + parseFloat(r.juros), 0).toFixed(2),
      contas: resultados
    });

  } catch (err) {
    console.error('❌ Erro ao aplicar juros:', err);
    res.status(500).json({ error: 'Erro ao processar juros' });
  }
});


module.exports = router;