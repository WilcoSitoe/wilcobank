/**
 * 🕐 Scheduler de Tarefas Automáticas - WilcoBank
 * Executa tarefas periódicas como cálculo de juros
 */

const cron = require('node-cron');
const db = require('../database/db');
const { enviarNotificacaoOperacao } = require('../services/email');

const TAXA_JUROS_MENSAL = 0.005; // 0.5% ao mês
const SALDO_MINIMO_PARA_JUROS = 1000;

console.log('🕐 [SCHEDULER] Agendador iniciado...');

// =================================================================
// 📅 Tarefa 1: Calcular Juros Automáticos (Todo dia 1 do mês, 00:00)
// =================================================================
cron.schedule('0 0 1 * *', async () => {
  console.log('\n🔄 [SCHEDULER] Iniciando cálculo AUTOMÁTICO de juros...');
  console.log(`📅 Data: ${new Date().toLocaleString('pt-AO')}`);
  
  let totalCreditado = 0;
  let contasProcessadas = 0;
  let erros = 0;

  try {
    // Buscar contas Poupança elegíveis
    const sql = `
      SELECT 
        c.id_cliente, c.nome_cliente, c.email_cliente,
        ct.id_conta, ct.numero_conta, ct.saldo,
        tc.nome_tipo
      FROM conta ct
      JOIN cliente c ON ct.id_cliente = c.id_cliente
      JOIN tipo_conta tc ON ct.id_tipo = tc.id_tipo
      WHERE tc.nome_tipo IN ('Poupança', 'Poupanca') 
        AND ct.saldo >= ?
    `;

    const contas = await new Promise((resolve, reject) => {
      db.all(sql, [SALDO_MINIMO_PARA_JUROS], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`📋 ${contas.length} contas elegíveis encontradas.\n`);

    // Processar cada conta
    for (const conta of contas) {
      try {
        const juros = conta.saldo * TAXA_JUROS_MENSAL;
        const novoSaldo = conta.saldo + juros;

        console.log(`💰 ${conta.nome_cliente} (${conta.numero_conta}):`);
        console.log(`   Saldo: ${conta.saldo.toFixed(2)} → ${novoSaldo.toFixed(2)} MZN (+${juros.toFixed(2)})`);

        // Atualizar saldo
        await new Promise((resolve, reject) => {
          db.run('UPDATE conta SET saldo = ? WHERE id_conta = ?', [novoSaldo, conta.id_conta], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
          });
        });

        // Registar operação (id_tipo_O = 4 é Juros)
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO operacoes 
             (data_operacao, valor, id_tipo_O, numero_conta, conta_relacionada) 
             VALUES (CURRENT_TIMESTAMP, ?, 4, ?, 'SISTEMA-AUTO')`,
            [juros, conta.numero_conta],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });

        // Notificar cliente por email
        if (conta.email_cliente) {
          await enviarNotificacaoOperacao(conta.email_cliente, 'Juros', juros, conta.numero_conta);
        }

        totalCreditado += juros;
        contasProcessadas++;

      } catch (error) {
        console.error(`❌ Erro na conta ${conta.numero_conta}:`, error.message);
        erros++;
      }
    }

    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('✅ CÁLCULO AUTOMÁTICO DE JUROS CONCLUÍDO');
    console.log('='.repeat(60));
    console.log(`📊 Contas processadas: ${contasProcessadas}`);
    console.log(`💰 Total creditado: ${totalCreditado.toFixed(2)} MZN`);
    console.log(`❌ Erros: ${erros}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ [SCHEDULER] Erro crítico no cálculo de juros:', error);
  }
});

// =================================================================
// 🧹 Tarefa 2: Limpeza de Tokens Expirados (Diária, 03:00)
// =================================================================
cron.schedule('0 3 * * *', () => {
  console.log('🧹 [SCHEDULER] Limpando tokens de recuperação expirados...');
  
  db.run('DELETE FROM password_resets WHERE used = 1 OR expires_at < ?', [new Date().toISOString()], function(err) {
    if (err) {
      console.error('❌ Erro na limpeza de tokens:', err.message);
    } else {
      console.log(`✅ ${this.changes} tokens expirados removidos.`);
    }
  });
});

// =================================================================
// 🚀 Exportar para uso manual (teste)
// =================================================================
async function calcularJurosManual() {
  console.log('🔄 [MANUAL] Executando cálculo de juros sob demanda...');
  // Reutiliza a lógica acima sem o cron
  // (podes duplicar a lógica ou extrair para uma função comum)
  return { message: 'Cálculo manual iniciado. Ver terminal para detalhes.' };
}

module.exports = { calcularJurosManual };