const rateLimit = require('express-rate-limit');

// 🔐 Login: Máximo 5 tentativas a cada 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas permitidas
  message: { 
    error: 'Muitas tentativas de login. Por segurança, aguarda 15 minutos antes de tentar novamente.',
    retryAfter: 900 // 15 minutos em segundos
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  // ✅ Handler personalizado para logging detalhado
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    const bloqueioAte = new Date(Date.now() + options.windowMs);
    
    // ✅ Usa req.ip diretamente (sem keyGenerator personalizado)
    const ip = req.ip || 'unknown';
    
    console.log(`\n🚨 [RATE LIMIT - LOGIN]`);
    console.log(`   📍 IP: ${ip}`);
    console.log(`   📧 Email tentado: ${req.body?.email || 'N/A'}`);
    console.log(`   🔒 Bloqueado até: ${bloqueioAte.toLocaleString('pt-AO')}`);
    console.log(`   ⏱️  Retry-After: ${retryAfter} segundos\n`);
    
    res.status(429).json({ 
      error: 'Muitas tentativas de login. Aguarda 15 minutos.',
      retryAfter: retryAfter,
      blockedUntil: bloqueioAte.toISOString()
    });
  },
});

// 🔑 Recuperação de Senha: Máximo 3 solicitações a cada 1 hora por IP
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 tentativas permitidas
  message: { 
    error: 'Muitas solicitações de recuperação. Aguarda 1 hora antes de tentar novamente.',
    retryAfter: 3600 // 1 hora em segundos
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  // ✅ Handler personalizado
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    const bloqueioAte = new Date(Date.now() + options.windowMs);
    
    const ip = req.ip || 'unknown';
    
    console.log(`\n🚨 [RATE LIMIT - RESET PASSWORD]`);
    console.log(`   📍 IP: ${ip}`);
    console.log(`   📧 Email tentado: ${req.body?.email || 'N/A'}`);
    console.log(`   🔒 Bloqueado até: ${bloqueioAte.toLocaleString('pt-AO')}`);
    console.log(`   ⏱️  Retry-After: ${retryAfter} segundos\n`);
    
    res.status(429).json({ 
      error: 'Muitas solicitações. Aguarda 1 hora.',
      retryAfter: retryAfter,
      blockedUntil: bloqueioAte.toISOString()
    });
  },
});

// 📊 Middleware opcional para LOGAR todas as tentativas de login
const logLoginAttempts = (req, res, next) => {
  if (req.method === 'POST' && req.path.includes('/login')) {
    const timestamp = new Date().toLocaleString('pt-AO');
    const ip = req.ip || 'unknown';
    console.log(`🔍 [LOGIN ATTEMPT] ${timestamp} | IP: ${ip} | Email: ${req.body?.email || 'N/A'}`);
  }
  next();
};

module.exports = { loginLimiter, resetLimiter, logLoginAttempts };