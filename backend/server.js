require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./database/prismaClient'); // ✅ NOVO: Prisma Client

const { loginLimiter, resetLimiter, logLoginAttempts } = require('./middleware/rateLimit');

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());

// 🔒 Cabeçalhos de segurança
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ❌ REMOVIDO: initDB() — o Prisma não precisa disto, as tabelas já estão no Supabase

// ✅ 1. LOGAR tentativas de login
app.use(logLoginAttempts);

// ✅ 2. RATE LIMITING
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/forgot-password', resetLimiter);
app.use('/api/auth/reset-password', resetLimiter);

// ✅ 3. Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/extrato', require('./routes/extrato'));

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'WilcoBank API rodando com Prisma + Supabase!' });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🗄️  Database: PostgreSQL (Supabase via Prisma)`);
  console.log(`🔒 Rate Limiting: ATIVO`);
  console.log(`📊 Login attempts logging: ATIVO\n`);
});

// ✅ NOVO: Graceful shutdown — desliga o Prisma quando o servidor parar
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido. A desligar servidor e Prisma...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Servidor fechado.');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT recebido. A desligar servidor e Prisma...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Servidor fechado.');
    process.exit(0);
  });
});