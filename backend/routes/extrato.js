const express = require('express');
const router = express.Router();
const prisma = require('../database/prismaClient');
const PDFDocument = require('pdfkit');

// =================================================================
// GET /api/extrato/:id - Listar transações do cliente (JSON)
// =================================================================
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: parseInt(id) },
      include: {
        contas: {
          include: { tipo: true }
        }
      }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const contaPrincipal = cliente.contas?.[0];
    if (!contaPrincipal) {
      return res.status(404).json({ error: 'Cliente não tem conta' });
    }

    // Buscar transações da conta
    const transacoes = await prisma.operacao.findMany({
      where: { numero_conta: contaPrincipal.numero_conta },
      include: { tipo: true },
      orderBy: { data_operacao: 'desc' }
    });

    // Formatar para o frontend
    const transacoesFormatadas = transacoes.map(t => ({
      id: t.id_operacao,
      data: new Date(t.data_operacao).toLocaleString('pt-MZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      tipo: t.tipo?.nome_operacao || 'Outro',
      valor: t.valor,
      saldo_apos: contaPrincipal.saldo, // Simplificado - saldo atual
      conta_relacionada: t.conta_relacionada
    }));

    res.json(transacoesFormatadas);

  } catch (err) {
    console.error('❌ Erro ao listar extrato:', err);
    res.status(500).json({ error: 'Erro ao carregar extrato' });
  }
});

// =================================================================
// GET /api/extrato/:id/export?format=pdf|csv&data_inicio&data_fim
// =================================================================
router.get('/:id/export', async (req, res) => {
  const { id } = req.params;
  const { format = 'pdf', data_inicio, data_fim } = req.query;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: parseInt(id) },
      include: {
        contas: {
          include: { tipo: true }
        }
      }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const contaPrincipal = cliente.contas?.[0];

    let where = {
      numero_conta: contaPrincipal?.numero_conta
    };

    if (data_inicio && data_fim) {
      where.data_operacao = {
        gte: new Date(data_inicio),
        lte: new Date(data_fim)
      };
    }

    const transacoes = await prisma.operacao.findMany({
      where,
      include: { tipo: true },
      orderBy: { data_operacao: 'desc' }
    });

    const transacoesComSaldo = transacoes.map(t => ({
      ...t,
      tipo_operacao: t.tipo?.nome_operacao || 'Outro',
      saldo_apos: contaPrincipal?.saldo || 0
    }));

    if (format === 'csv') {
      exportarCSV(res, cliente, transacoesComSaldo, contaPrincipal, data_inicio, data_fim);
    } else {
      exportarPDF(res, cliente, transacoesComSaldo, contaPrincipal, data_inicio, data_fim);
    }

  } catch (err) {
    console.error('❌ Erro ao exportar extrato:', err);
    res.status(500).json({ error: 'Erro ao exportar extrato' });
  }
});

// =================================================================
// 📊 Função: Exportar para CSV
// =================================================================
function exportarCSV(res, cliente, transacoes, conta, data_inicio, data_fim) {
  const periodo = data_inicio && data_fim 
    ? ` de ${new Date(data_inicio).toLocaleDateString('pt-MZ')} a ${new Date(data_fim).toLocaleDateString('pt-MZ')}` 
    : '';

  const headers = [
    'Data/Hora',
    'Tipo de Operação',
    'Valor (MZN)',
    'Conta',
    'Conta Relacionada',
    'Saldo Após Operação'
  ];

  const rows = transacoes.map(t => [
    new Date(t.data_operacao).toLocaleString('pt-MZ'),
    t.tipo_operacao,
    t.valor.toFixed(2).replace('.', ','),
    t.numero_conta,
    t.conta_relacionada || '',
    t.saldo_apos.toFixed(2).replace('.', ',')
  ]);

  const csvContent = [
    `WilcoBank - Extrato Bancário${periodo}`,
    `Cliente: ${cliente.nome_cliente} ${cliente.apelido_cliente || ''}`,
    `Conta: ${conta?.numero_conta} | Tipo: ${conta?.tipo?.nome_tipo}`,
    `BI: ${cliente.BI_cliente || ''} | Email: ${cliente.email_cliente}`,
    `Gerado em: ${new Date().toLocaleString('pt-MZ')}`,
    '',
    headers.join(';'),
    ...rows.map(r => r.join(';'))
  ].join('\n');

  const filename = `extrato_wilcobank_${conta?.numero_conta}_${new Date().toISOString().slice(0,10)}.csv`;

  res.setHeader('Content-Type', 'text/csv;charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
}

// =================================================================
// 📄 Função: Exportar para PDF (1 PÁGINA APENAS)
// =================================================================
function exportarPDF(res, cliente, transacoes, conta, data_inicio, data_fim) {
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 30,
    bufferPages: false,
    info: {
      Title: 'Extrato Bancário - WilcoBank',
      Author: 'WilcoBank',
      Subject: `Extrato da conta ${conta?.numero_conta}`,
      Creator: 'WilcoBank System'
    }
  });

  const filename = `extrato_wilcobank_${conta?.numero_conta}_${new Date().toISOString().slice(0,10)}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  // ========== HEADER COMPACTO ==========
  doc.rect(0, 0, 595, 80).fill('#1e3c72');

  doc.fillColor('#ffffff')
     .fontSize(20)
     .font('Helvetica-Bold')
     .text('WilcoBank', 40, 25);

  doc.fontSize(12)
     .font('Helvetica')
     .text('Extrato Bancário', 40, 48);

  doc.fontSize(9)
     .fillColor('#e0e0e0')
     .text(`Gerado em: ${new Date().toLocaleString('pt-MZ')}`, 40, 65);

  // ========== DADOS DO CLIENTE ==========
  let y = 95;

  doc.fillColor('#333333')
     .fontSize(11)
     .font('Helvetica-Bold')
     .text('Dados do Titular:', 40, y);

  y += 15;
  doc.font('Helvetica')
     .fontSize(9)
     .text(`Nome: ${cliente.nome_cliente} ${cliente.apelido_cliente || ''}`, 40, y)
     .text(`Conta: ${conta?.numero_conta} | Tipo: ${conta?.tipo?.nome_tipo}`, 250, y);

  y += 12;
  doc.text(`BI: ${cliente.BI_cliente || ''}`, 40, y)
     .text(`Email: ${cliente.email_cliente}`, 250, y);

  const periodo = data_inicio && data_fim 
    ? `Período: ${new Date(data_inicio).toLocaleDateString('pt-MZ')} a ${new Date(data_fim).toLocaleDateString('pt-MZ')}`
    : 'Período: Todas as transações';

  y += 20;
  doc.fontSize(8)
     .fillColor('#666')
     .text(periodo, 40, y);

  // ========== TABELA DE TRANSAÇÕES (COMPACTA) ==========
  y += 15;
  const margin = 40;
  const pageWidth = 595;
  const colWidths = { data: 100, operacao: 90, valor: 110, saldo: 110 };

  doc.font('Helvetica-Bold')
     .fontSize(8)
     .fillColor('#1e3c72')
     .text('Data/Hora', margin, y, { width: colWidths.data })
     .text('Operação', margin + colWidths.data, y, { width: colWidths.operacao })
     .text('Valor (MZN)', margin + colWidths.data + colWidths.operacao, y, { width: colWidths.valor, align: 'right' })
     .text('Saldo (MZN)', margin + colWidths.data + colWidths.operacao + colWidths.valor, y, { width: colWidths.saldo, align: 'right' });

  y += 12;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor('#ddd').stroke();
  y += 5;

  const transacoesParaMostrar = transacoes.slice(0, 20);

  transacoesParaMostrar.forEach((t, index) => {
    if (y > 720) return;

    const valorStr = t.tipo_operacao === 'Levantamento' 
      ? `-${Math.abs(t.valor).toFixed(2)}` 
      : `+${t.valor.toFixed(2)}`;

    const corValor = t.tipo_operacao === 'Levantamento' ? '#dc3545' : '#28a745';

    const dataCompacta = new Date(t.data_operacao).toLocaleString('pt-MZ', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });

    doc.font('Helvetica')
       .fontSize(7)
       .fillColor('#555')
       .text(dataCompacta, margin, y, { width: colWidths.data });

    doc.fillColor('#333')
       .text(t.tipo_operacao.substring(0, 8), margin + colWidths.data, y, { width: colWidths.operacao });

    doc.fillColor(corValor)
       .font('Helvetica-Bold')
       .text(valorStr, margin + colWidths.data + colWidths.operacao, y, { width: colWidths.valor, align: 'right' });

    doc.fillColor('#1e3c72')
       .text(t.saldo_apos.toFixed(2), margin + colWidths.data + colWidths.operacao + colWidths.valor, y, { width: colWidths.saldo, align: 'right' });

    y += 11;

    if (index < transacoesParaMostrar.length - 1 && y <= 720) {
      doc.moveTo(margin, y - 3).lineTo(pageWidth - margin, y - 3).strokeColor('#f0f0f0').stroke();
    }
  });

  // ========== RODAPÉ COM TOTAIS ==========
  y += 10;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor('#ddd').stroke();
  y += 10;

  const totalDepositos = transacoesParaMostrar
    .filter(t => t.tipo_operacao === 'Deposito')
    .reduce((sum, t) => sum + t.valor, 0);

  const totalLevantamentos = transacoesParaMostrar
    .filter(t => t.tipo_operacao === 'Levantamento')
    .reduce((sum, t) => sum + t.valor, 0);

  doc.font('Helvetica-Bold')
     .fontSize(9)
     .fillColor('#333')
     .text('Resumo:', margin, y);

  doc.font('Helvetica')
     .fontSize(8)
     .fillColor('#28a745')
     .text(`Depósitos: +${totalDepositos.toFixed(2)} MZN`, 120, y)
     .fillColor('#dc3545')
     .text(`Levantamentos: -${totalLevantamentos.toFixed(2)} MZN`, 240, y)
     .fillColor('#1e3c72')
     .font('Helvetica-Bold')
     .text(`Saldo: ${transacoes[0]?.saldo_apos?.toFixed(2) || '0.00'} MZN`, 380, y);

  // ========== FOOTER SIMPLES ==========
  y = 810;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor('#eee').stroke();
  y += 8;

  doc.fontSize(7)
     .fillColor('#999')
     .font('Helvetica-Oblique')
     .text('Documento gerado eletronicamente - WilcoBank © 2026', margin, y, { width: pageWidth - (margin * 2), align: 'center' });

  y += 10;
  doc.text('Válido sem carimbo ou assinatura | suporte@wilcobank.com', margin, y, { width: pageWidth - (margin * 2), align: 'center' });

  doc.end();
}

module.exports = router;