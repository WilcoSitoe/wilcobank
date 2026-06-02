const nodemailer = require('nodemailer');

// 🔐 Configurar transporter com fallback para Ethereal
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // false para porta 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Para testes locais com certificados auto-assinados (opcional)
  tls: {
    rejectUnauthorized: false // ⚠️ Apenas para desenvolvimento!
  }
});

// Função para enviar email de recuperação
async function enviarEmailRecuperacao(email, token) {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;

  // ✅ CORREÇÃO: Usar EMAIL_FROM diretamente se existir, senão formatar
  const fromAddress = process.env.EMAIL_FROM 
    ? process.env.EMAIL_FROM 
    : `"WilcoBank Suporte" <noreply@wilcobank.com>`;

  const mailOptions = {
    from: fromAddress, // ← Agora usa o valor correto
    to: email,
    subject: '🔐 Recuperação de Senha - WilcoBank',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #1e3c72; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px 15px; margin: 15px 0; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">🏦 WilcoBank</h2>
          </div>
          <div class="content">
            <p>Olá,</p>
            <p>Recebemos um pedido para redefinir a tua senha na plataforma WilcoBank.</p>
            
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">🔐 Redefinir Senha</a>
            </p>
            
            <p style="text-align: center; font-size: 13px; color: #666;">
              Ou copia e cola este link no teu navegador:<br>
              <a href="${resetLink}" style="word-break: break-all; color: #1e3c72;">${resetLink}</a>
            </p>
            
            <div class="warning">
              ⚠️ <strong>Atenção:</strong> Este link expira em <strong>1 hora</strong>.<br>
              Se não fizeste este pedido, ignora este email. A tua senha permanece segura.
            </div>
            
            <p style="font-size: 13px; color: #666;">
              Por segurança, nunca partilhes este link com ninguém. A equipa WilcoBank nunca pedirá a tua senha por email.
            </p>
          </div>
          <div class="footer">
            <p>© 2026 WilcoBank - Todos os direitos reservados<br>
            Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `WilcoBank - Recuperação de Senha\n\nClica neste link para redefinir a tua senha:\n${resetLink}\n\nEste link expira em 1 hora.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado para ${email}: ${info.messageId}`);
    
    // Para Ethereal: mostra link de pré-visualização
    if (process.env.EMAIL_HOST?.includes('ethereal')) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔍 Pré-visualizar email: ${previewUrl}`);
      }
    }
    
    return info;
  } catch (error) {
    console.error(`❌ Erro ao enviar email para ${email}:`, {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error; // Propaga o erro para o auth.js lidar
  }
}

// 🔔 Notificação Automática de Operações Bancárias
async function enviarNotificacaoOperacao(email, tipoOperacao, valor, conta, detalhes = {}) {
  // Configuração visual por tipo de operação
  const config = {
    'Deposito': { 
      icon: '🟢', 
      color: '#28a745', 
      titulo: 'Depósito Confirmado',
      msg: 'Um depósito foi confirmado na tua conta.'
    },
    'Levantamento': { 
      icon: '🔴', 
      color: '#dc3545', 
      titulo: 'Levantamento Realizado',
      msg: 'Um levantamento foi realizado da tua conta.'
    },
    'Transferencia': { 
      icon: '🔵', 
      color: '#007bff', 
      titulo: 'Transferência Efetuada',
      msg: 'Uma transferência foi processada na tua conta.'
    },
    'Senha Alterada': { 
      icon: '🔐', 
      color: '#6c757d', 
      titulo: 'Senha Alterada',
      msg: 'A tua senha foi alterada com sucesso.'
    }
  };
  
  const cfg = config[tipoOperacao] || config['Deposito'];
  const valorFormatado = valor > 0 
    ? new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(valor)
    : '---';
  const dataFormatada = new Date().toLocaleString('pt-MZ');

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'WilcoBank <noreply@wilcobank.com>',
    to: email,
    subject: `${cfg.icon} ${cfg.titulo} - WilcoBank`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notificação WilcoBank</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f7fa;">
        <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 25px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🏦 WilcoBank</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Segurança e Confiança</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <div style="text-align: center; margin-bottom: 25px;">
              <span style="font-size: 48px;">${cfg.icon}</span>
              <h2 style="margin: 15px 0 10px 0; color: ${cfg.color};">${cfg.titulo}</h2>
              <p style="margin: 0; color: #666;">${cfg.msg}</p>
            </div>
            
            <!-- Details Table -->
            <table style="width: 100%; border-collapse: collapse; margin: 25px 0; background: #f8f9fa; border-radius: 8px; overflow: hidden;">
              <tbody>
                <tr>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #eee; color: #666; width: 40%;">Conta</td>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #eee; font-weight: bold; font-family: monospace;">${conta}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #eee; color: #666;">Data/Hora</td>
                  <td style="padding: 12px 20px; border-bottom: 1px solid #eee; font-weight: bold;">${dataFormatada}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; color: #666;">Valor</td>
                  <td style="padding: 12px 20px; font-weight: bold; color: ${cfg.color}; font-size: 18px;">${valorFormatado}</td>
                </tr>
                ${detalhes.contaDestino ? `
                <tr>
                  <td style="padding: 12px 20px; border-top: 1px solid #eee; color: #666;">Conta Destino</td>
                  <td style="padding: 12px 20px; border-top: 1px solid #eee; font-weight: bold; font-family: monospace;">${detalhes.contaDestino}</td>
                </tr>` : ''}
              </tbody>
            </table>
            
            <!-- Security Notice -->
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 0 6px 6px 0; margin: 25px 0;">
              <p style="margin: 0; font-size: 13px; color: #856404;">
                <strong>⚠️ Atenção:</strong> Se não reconheces esta operação, contacta o suporte imediatamente em 
                <a href="mailto:suporte@wilcobank.com" style="color: #856404;">suporte@wilcobank.com</a>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p style="margin: 0 0 10px 0;">
              © 2026 WilcoBank - Todos os direitos reservados<br>
              Este é um email automático, por favor não responda.
            </p>
            <p style="margin: 0;">
              <a href="${process.env.FRONTEND_URL}" style="color: #1e3c72; text-decoration: none;">Aceder à minha conta</a>
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `,
    text: `WilcoBank - ${cfg.titulo}\n\n${cfg.msg}\n\nConta: ${conta}\nData: ${dataFormatada}\nValor: ${valorFormatado}\n\nSe não reconheces esta operação, contacta suporte@wilcobank.com`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Notificação enviada para ${email}: ${info.messageId}`);
    
    // Log para Ethereal (apenas em desenvolvimento)
    if (process.env.EMAIL_HOST?.includes('ethereal')) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`🔍 Pré-visualizar: ${previewUrl}`);
    }
    
    return info;
  } catch (error) {
    console.error(`⚠️ Falha ao enviar notificação para ${email}:`, error.message);
    // Não lança erro para não interromper a operação bancária
    return null;
  }
}

// ✅ ATUALIZAR O EXPORT NO FINAL DO FICHEIRO:
module.exports = { enviarEmailRecuperacao, enviarNotificacaoOperacao };

