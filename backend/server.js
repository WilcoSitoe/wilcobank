require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./database/prismaClient'); // ✅ NOVO: Prisma Client

const { loginLimiter, resetLimiter, logLoginAttempts } = require('./middleware/rateLimit');

const app = express();

// ✅ TRUST PROXY (necessário para Railway/Vercel - proxy reverso)
app.set('trust proxy', 1);

// ✅ CORS CONFIGURADO para produção e desenvolvimento
app.use(cors({
  origin: [
    'http://localhost:5173',                    // Desenvolvimento local (Vite)
    'http://localhost:3000',                    // Alternativo local
    'https://wilcobank.vercel.app',             // Teu domínio no Vercel
    'https://wilcobank-production.vercel.app',  // URL alternativo do Vercel
    /\.vercel\.app$/                            // Qualquer subdomínio vercel.app
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 🔒 Cabeçalhos de segurança adicionais
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
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
  res.json({ 
    message: 'WilcoBank API rodando com Prisma + Supabase!',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// ✅ Health check (Railway usa isto para verificar se está vivo)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', database: 'connected' });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🗄️  Database: PostgreSQL (Supabase via Prisma)`);
  console.log(`🔒 Rate Limiting: ATIVO`);
  console.log(`📊 Login attempts logging: ATIVO`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});

// ✅ Graceful shutdown — desliga o Prisma quando o servidor parar
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