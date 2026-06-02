const express = require('express');
const router = express.Router();
const prisma = require('../database/prismaClient'); // ✅ NOVO
const { enviarNotificacaoOperacao } = require('../services/email');
const { 
  TAXA_TRANSFERENCIA_PERCENTUAL, 
  VALOR_MINIMO_PARA_TAXA, 
  VALOR_MAXIMO_TAXA 
} = require('../config/constants');

// =================================================================
// GET /api/clientes - Listar todos (Admin)
// =================================================================
router.get('/', async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        contas: {
          include: {
            tipo: true
          }
        }
      },
      orderBy: { id_cliente: 'asc' }
    });
    
    const resultado = clientes.map(c => ({
      id_cliente: c.id_cliente,
      nome_cliente: c.nome_cliente,
      apelido_cliente: c.apelido_cliente,
      email_cliente: c.email_cliente,
      numero_conta: c.contas?.[0]?.numero_conta,
      saldo: c.contas?.[0]?.saldo,
      tipo_conta: c.contas?.[0]?.tipo?.nome_tipo
    }));
    
    res.json(resultado);
  } catch (err) {
    console.error('❌ Erro ao listar clientes:', err);
    res.status(500).json({ error: err.message });
  }
});

// =================================================================
// GET /api/clientes/:id - Dados do cliente (Dashboard)
// =================================================================
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: parseInt(id) },
      include: {
        contas: {
          include: {
            tipo: true
          }
        }
      }
    });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    const conta = cliente.contas?.[0];
    
    res.json({
      id_cliente: cliente.id_cliente,
      nome_cliente: cliente.nome_cliente,
      email_cliente: cliente.email_cliente,
      id_conta: conta?.id_conta,
      numero_conta: conta?.numero_conta,
      saldo: conta?.saldo,
      nome_tipo: conta?.tipo?.nome_tipo
    });
  } catch (err) {
    console.error('❌ Erro ao buscar cliente:', err);
    res.status(500).json({ error: err.message });
  }
});

// =================================================================
// DELETE /api/clientes/:id - Eliminar cliente
// =================================================================
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: parseInt(id) },
      include: { contas: true }
    });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    const numero_conta = cliente.contas?.[0]?.numero_conta;
    const email = cliente.email_cliente;

    // Eliminar em cascata numa transação
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar operações relacionadas
      if (numero_conta) {
        await tx.operacao.deleteMany({
          where: { numero_conta }
        });
        
        // 2. Eliminar conta
        await tx.conta.deleteMany({
          where: { id_cliente: parseInt(id) }
        });
      }
      
      // 3. Eliminar histórico de senhas
      await tx.passwordHistory.deleteMany({
        where: { id_cliente: parseInt(id) }
      });
      
      // 4. Eliminar resets de senha
      await tx.passwordReset.deleteMany({
        where: { email }
      });
      
      // 5. Eliminar cliente
      await tx.cliente.delete({
        where: { id_cliente: parseInt(id) }
      });
    });
    
    // Notificar (background)
    setTimeout(() => {
      enviarNotificacaoOperacao(email, 'Conta Eliminada', 0, numero_conta)
        .catch(err => console.error('⚠️ Erro notificação:', err.message));
    }, 0);
    
    res.json({ message: 'Cliente eliminado com sucesso' });
  } catch (err) {
    console.error('❌ Erro ao eliminar:', err);
    res.status(500).json({ error: err.message });
  }
});

// =================================================================
// POST /api/clientes/:id/deposito
// =================================================================
router.post('/:id/deposito', async (req, res) => {
  const { id } = req.params;
  const { valor } = req.body;
  
  if (!valor || valor <= 0) {
    return res.status(400).json({ error: 'Insira um valor válido maior que zero' });
  }
  
  try {
    const conta = await prisma.conta.findFirst({
      where: { id_cliente: parseInt(id) },
      include: { cliente: true }
    });
    
    if (!conta) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }
    
    const novoSaldo = conta.saldo + parseFloat(valor);
    
    await prisma.$transaction([
      prisma.conta.update({
        where: { id_conta: conta.id_conta },
        data: { saldo: novoSaldo }
      }),
      prisma.operacao.create({
        data: {
          valor: parseFloat(valor),
          id_tipo_O: 2, // Depósito
          numero_conta: conta.numero_conta
        }
      })
    ]);
    
    // Notificar (background)
    setTimeout(() => {
      enviarNotificacaoOperacao(conta.cliente.email_cliente, 'Deposito', parseFloat(valor), conta.numero_conta)
        .catch(err => console.error('⚠️ Erro notificação:', err.message));
    }, 0);
    
    res.json({ message: 'Depósito realizado com sucesso', novo_saldo: novoSaldo });
  } catch (err) {
    console.error('❌ Erro no depósito:', err);
    res.status(500).json({ error: err.message });
  }
});

// =================================================================
// POST /api/clientes/:id/levantamento
// =================================================================
router.post('/:id/levantamento', async (req, res) => {
  const { id } = req.params;
  const { valor } = req.body;
  
  if (!valor || valor <= 0) {
    return res.status(400).json({ error: 'Valor inválido' });
  }
  
  try {
    const conta = await prisma.conta.findFirst({
      where: { id_cliente: parseInt(id) },
      include: { cliente: true }
    });
    
    if (!conta || conta.saldo < valor) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }
    
    const novoSaldo = conta.saldo - parseFloat(valor);
    
    await prisma.$transaction([
      prisma.conta.update({
        where: { id_conta: conta.id_conta },
        data: { saldo: novoSaldo }
      }),
      prisma.operacao.create({
        data: {
          valor: parseFloat(valor),
          id_tipo_O: 1, // Levantamento
          numero_conta: conta.numero_conta
        }
      })
    ]);
    
    // Notificar (background)
    setTimeout(() => {
      enviarNotificacaoOperacao(conta.cliente.email_cliente, 'Levantamento', parseFloat(valor), conta.numero_conta)
        .catch(err => console.error('⚠️ Erro notificação:', err.message));
    }, 0);
    
    res.json({ message: 'Levantamento realizado!', novo_saldo: novoSaldo });
  } catch (err) {
    console.error('❌ Erro no levantamento:', err);
    res.status(500).json({ error: err.message });
  }
});

// =================================================================
// POST /api/clientes/:id/transferencia - COM TAXA
// =================================================================
router.post('/:id/transferencia', async (req, res) => {
  const { id } = req.params;
  const { valor, conta_destino } = req.body;
  
  if (!valor || valor <= 0 || !conta_destino) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }
  
  try {
    // Buscar conta ORIGEM
    const origem = await prisma.conta.findFirst({
      where: { id_cliente: parseInt(id) },
      include: {
        tipo: true,
        cliente: true
      }
    });
    
    if (!origem || origem.tipo?.nome_tipo !== 'Corrente') {
      return res.status(400).json({ error: 'Transferências só podem ser feitas a partir de Conta Corrente' });
    }
    
    // Calcular taxa
    let taxa = 0;
    if (valor >= VALOR_MINIMO_PARA_TAXA) {
      taxa = valor * TAXA_TRANSFERENCIA_PERCENTUAL;
      if (taxa > VALOR_MAXIMO_TAXA) taxa = VALOR_MAXIMO_TAXA;
      taxa = Math.round(taxa * 100) / 100;
    }
    
    const valorTotalDebitado = parseFloat(valor) + taxa;
    
    if (origem.saldo < valorTotalDebitado) {
      return res.status(400).json({ 
        error: `Saldo insuficiente. Necessitas de ${valorTotalDebitado.toFixed(2)} MZN` 
      });
    }
    
    // Buscar conta DESTINO
    const destino = await prisma.conta.findUnique({
      where: { numero_conta: conta_destino },
      include: {
        tipo: true,
        cliente: true
      }
    });
    
    if (!destino || destino.tipo?.nome_tipo !== 'Corrente') {
      return res.status(400).json({ error: 'Só é possível transferir para Conta Corrente' });
    }
    
    if (origem.numero_conta === destino.numero_conta) {
      return res.status(400).json({ error: 'Não pode transferir para a própria conta' });
    }
    
    // Executar transferência numa transação
    await prisma.$transaction([
      // 1. Debitar da origem
      prisma.conta.update({
        where: { id_conta: origem.id_conta },
        data: { saldo: { decrement: valorTotalDebitado } }
      }),
      // 2. Creditar no destino
      prisma.conta.update({
        where: { id_conta: destino.id_conta },
        data: { saldo: { increment: parseFloat(valor) } }
      }),
      // 3. Registar transferência
      prisma.operacao.create({
        data: {
          valor: parseFloat(valor),
          id_tipo_O: 3, // Transferência
          numero_conta: origem.numero_conta,
          conta_relacionada: destino.numero_conta,
          taxa_cobrada: taxa
        }
      })
    ]);

    // 4. Registar taxa como receita do banco (fora da transação principal para não falhar se der erro)
    if (taxa > 0) {
      await prisma.operacao.create({
        data: {
          valor: taxa,
          id_tipo_O: 5, // Taxa de Serviço
          numero_conta: origem.numero_conta,
          conta_relacionada: 'BANCO',
          descricao: `Taxa de transferência para conta ${conta_destino}`,
          taxa_cobrada: taxa
        }
      });
    }
    
    // Notificar (background)
    setTimeout(() => {
      enviarNotificacaoOperacao(
        origem.cliente.email_cliente,
        'Transferencia',
        parseFloat(valor),
        origem.numero_conta,
        { contaDestino: destino.numero_conta, taxa: taxa }
      ).catch(err => console.error('⚠️ Erro notificação:', err.message));
    }, 0);
    
    res.json({
      message: 'Transferência realizada!',
      novo_saldo: origem.saldo - valorTotalDebitado,
      conta_destino: destino.numero_conta,
      taxa_cobrada: taxa,
      valor_total_debitado: valorTotalDebitado
    });
    
  } catch (err) {
    console.error('❌ Erro na transferência:', err);
    res.status(500).json({ error: err.message });
  }
});

// =================================================================
// GET /api/clientes/:id/extrato
// =================================================================
router.get('/:id/extrato', async (req, res) => {
  const { id } = req.params;
  const { data_inicio, data_fim } = req.query;
  
  try {
    // Buscar conta do cliente
    const conta = await prisma.conta.findFirst({
      where: { id_cliente: parseInt(id) },
      select: { numero_conta: true }
    });

    if (!conta) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    let where = {
      numero_conta: conta.numero_conta
    };

    if (data_inicio && data_fim) {
      where.data_operacao = {
        gte: new Date(data_inicio),
        lte: new Date(data_fim)
      };
    }

    const operacoes = await prisma.operacao.findMany({
      where,
      include: {
        tipo: true
      },
      orderBy: { data_operacao: 'desc' },
      take: 50
    });
    
    const extrato = operacoes.map(row => ({
      id: row.id_operacao,
      data: new Date(row.data_operacao).toLocaleString('pt-MZ'),
      tipo: row.tipo?.nome_operacao || 'Outro',
      valor: row.valor,
      conta: row.numero_conta,
      conta_relacionada: row.conta_relacionada,
      taxa_cobrada: row.taxa_cobrada || 0,
      classe: row.tipo?.nome_operacao === 'Deposito' ? 'deposito' : 
              row.tipo?.nome_operacao === 'Levantamento' ? 'levantamento' : 'transferencia'
    }));
    
    res.json(extrato);
  } catch (err) {
    console.error('❌ Erro ao buscar extrato:', err);
    res.status(500).json({ error: 'Erro ao carregar extrato' });
  }
});

// =================================================================
// POST /api/clientes/:id/calcular-juros
// =================================================================
router.post('/:id/calcular-juros', async (req, res) => {
  const { id } = req.params;
  const TAXA_JUROS = 0.005;
  const SALDO_MINIMO = 1000;
  
  try {
    const conta = await prisma.conta.findFirst({
      where: { id_cliente: parseInt(id) },
      include: {
        tipo: true,
        cliente: true
      }
    });
    
    if (!conta || !['Poupança', 'Poupanca'].includes(conta.tipo?.nome_tipo)) {
      return res.status(400).json({ error: 'Apenas contas Poupança recebem juros' });
    }
    
    if (conta.saldo < SALDO_MINIMO) {
      return res.status(400).json({ error: `Saldo mínimo de ${SALDO_MINIMO} MZN necessário` });
    }
    
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
    
    // Notificar (background)
    setTimeout(() => {
      enviarNotificacaoOperacao(conta.cliente.email_cliente, 'Juros', juros, conta.numero_conta)
        .catch(err => console.error('⚠️ Erro email juros:', err.message));
    }, 0);
    
    res.json({
      message: `✅ Juros de ${juros.toFixed(2)} MZN creditados!`,
      novo_saldo: novoSaldo,
      juros: juros
    });
    
  } catch (err) {
    console.error('❌ Erro ao calcular juros:', err);
    res.status(500).json({ error: 'Erro ao processar juros' });
  }
});

module.exports = router;