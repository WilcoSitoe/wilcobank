const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../database/prismaClient');
const { enviarEmailRecuperacao, enviarNotificacaoOperacao } = require('../services/email');

// =================================================================
// POST /api/auth/login
// =================================================================
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    if (email === 'admin@wilcobank.com' && senha === 'admin123') {
      const token = jwt.sign(
        { id: 0, email: 'admin@wilcobank.com', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        id: 0,
        nome: 'Administrador',
        email: 'admin@wilcobank.com',
        conta: 'WB000000',
        tipoConta: 'admin',
        role: 'admin',
        token
      });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { email_cliente: email },
      include: {
        contas: {
          include: { tipo: true }
        }
      }
    });

    if (!cliente) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const senhaValida = await bcrypt.compare(senha, cliente.senha_cliente);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: cliente.id_cliente, email: cliente.email_cliente },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const contaPrincipal = cliente.contas?.[0];

    res.json({
      id: cliente.id_cliente,
      nome: cliente.nome_cliente,
      email: cliente.email_cliente,
      conta: contaPrincipal?.numero_conta,
      tipoConta: contaPrincipal?.tipo?.nome_tipo,
      role: 'cliente',
      token
    });

  } catch (err) {
    console.error('❌ Erro no login:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// =================================================================
// POST /api/auth/register
// =================================================================
router.post('/register', async (req, res) => {
  const { nome, apelido, email, bi, sexo, senha, numero_conta, tipo } = req.body;

  if (!nome || !email || !senha || !numero_conta) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
  }

  try {
    const existente = await prisma.cliente.findUnique({
      where: { email_cliente: email }
    });

    if (existente) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    if (bi) {
      const biExistente = await prisma.cliente.findUnique({
        where: { BI_cliente: bi }
      });
      if (biExistente) {
        return res.status(400).json({ error: 'BI já cadastrado' });
      }
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const resultado = await prisma.$transaction(async (tx) => {
      const novoCliente = await tx.cliente.create({
        data: {
          nome_cliente: nome,
          apelido_cliente: apelido,
          email_cliente: email,
          senha_cliente: senhaHash,
          sexo_cliente: sexo,
          BI_cliente: bi
        }
      });

      await tx.conta.create({
        data: {
          numero_conta: numero_conta,
          id_tipo: parseInt(tipo),
          id_cliente: novoCliente.id_cliente,
          saldo: 0
        }
      });

      await tx.passwordHistory.create({
        data: {
          id_cliente: novoCliente.id_cliente,
          senha_hash: senhaHash
        }
      });

      return novoCliente;
    });

    setTimeout(() => {
      enviarNotificacaoOperacao(email, 'Conta Criada', 0, numero_conta)
        .catch(err => console.error('⚠️ Erro notificação:', err.message));
    }, 0);

    res.status(201).json({
      message: 'Cliente cadastrado com sucesso',
      id_cliente: resultado.id_cliente,
      numero_conta
    });

  } catch (err) {
    console.error('❌ Erro no registo:', err);
    res.status(500).json({ error: err.message || 'Erro ao processar registo' });
  }
});

// =================================================================
// POST /api/auth/forgot-password
// =================================================================
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório' });
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { email_cliente: email },
      select: { id_cliente: true, email_cliente: true }
    });

    if (!cliente) {
      return res.json({ message: 'Se o email existir, receberá instruções.' });
    }

    const token = jwt.sign(
      { email: cliente.email_cliente, type: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await prisma.passwordReset.deleteMany({
      where: { email: cliente.email_cliente }
    });

    // CORREÇÃO: expires_at como String ISO, não DateTime
    await prisma.passwordReset.create({
      data: {
        email: cliente.email_cliente,
        token,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        used: 0
      }
    });

    setTimeout(() => {
      enviarEmailRecuperacao(cliente.email_cliente, token)
        .catch(err => console.error('⚠️ Erro email recuperação:', err.message));
    }, 0);

    res.json({ message: 'Se o email existir, receberá instruções.' });

  } catch (err) {
    console.error('❌ Erro forgot-password:', err);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

// =================================================================
// POST /api/auth/reset-password
// =================================================================
router.post('/reset-password', async (req, res) => {
  const { token, novaSenha } = req.body;

  if (!token || !novaSenha || novaSenha.length < 6) {
    return res.status(400).json({ error: 'Token inválido ou senha muito curta (mín. 6 caracteres)' });
  }

  try {
    const reset = await prisma.passwordReset.findFirst({
      where: { token }
    });

    if (!reset || reset.used === 1 || new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Link inválido ou expirado' });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { email_cliente: reset.email },
      select: { id_cliente: true, email_cliente: true }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const historico = await prisma.passwordHistory.findMany({
      where: { id_cliente: cliente.id_cliente },
      orderBy: { data_criacao: 'desc' },
      take: 3
    });

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    for (const registo of historico) {
      if (await bcrypt.compare(novaSenha, registo.senha_hash)) {
        return res.status(400).json({ error: 'Não podes reutilizar uma das últimas 3 senhas' });
      }
    }

    await prisma.$transaction([
      prisma.cliente.update({
        where: { id_cliente: cliente.id_cliente },
        data: { senha_cliente: novaSenhaHash }
      }),
      prisma.passwordHistory.create({
        data: {
          id_cliente: cliente.id_cliente,
          senha_hash: novaSenhaHash
        }
      }),
      prisma.passwordReset.update({
        where: { id_reset: reset.id_reset },
        data: { used: 1 }
      })
    ]);

    res.json({ message: 'Senha redefinida com sucesso!' });

  } catch (err) {
    console.error('❌ Erro reset-password:', err);
    res.status(500).json({ error: 'Erro ao redefinir senha: ' + err.message });
  }
});

module.exports = router;