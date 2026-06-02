/**
 * 📜 Script: Calcular Juros Automáticos na Poupança
 * Execução: node scripts/calcular-juros.js
 */

require('dotenv').config();
const db = require('../database/db');
const { enviarNotificacaoOperacao } = require('../services/email');

const TAXA_JUROS_MENSAL = 0.005; // 0.5% ao mês
const SALDO_MINIMO_PARA_JUROS = 1000; // Mínimo para receber juros

console.log('🔄 Iniciando cálculo de juros mensais...');
console.log(`📊 Taxa: ${(TAXA_JUROS_MENSAL * 100).toFixed(2)}% ao mês`);
console.log(`💰 Saldo mínimo para juros: ${SALDO_MINIMO_PARA_JUROS.toFixed(2)} MZN\n`);

async function calcularJuros() {
  let totalCreditado = 0;
  let contasProcessadas = 0;
  let erros = 0;

  // 1. Buscar todas as contas Poupança com saldo >= mínimo
  const sql = `
    SELECT 
      c.id_cliente,
      c.nome_cliente,
      c.email_cliente,
      ct.id_conta,
      ct.numero_conta,
      ct.saldo,
      tc.nome_tipo
    FROM conta ct
    JOIN cliente c ON ct.id_cliente = c.id_cliente
    JOIN tipo_conta tc ON ct.id_tipo = tc.id_tipo
    WHERE tc.nome_tipo = 'Poupanca' 
      AND ct.saldo >= ?
  `;

  db.all(sql, [SALDO_MINIMO_PARA_JUROS], async (err, contas) => {
    if (err) {
      console.error('❌ Erro ao buscar contas:', err.message);
      process.exit(1);
    }

    console.log(`📋 Encontradas ${contas.length} contas elegíveis para juros.\n`);

    // 2. Processar cada conta
    for (const conta of contas) {
      try {
        const juros = conta.saldo * TAXA_JUROS_MENSAL;
        const novoSaldo = conta.saldo + juros;

        console.log(`💰 ${conta.nome_cliente} (${conta.numero_conta}):`);
        console.log(`   Saldo anterior: ${conta.saldo.toFixed(2)} MZN`);
        console.log(`   Juros (0.5%): +${juros.toFixed(2)} MZN`);
        console.log(`   Novo saldo: ${novoSaldo.toFixed(2)} MZN\n`);

        // 3. Atualizar saldo da conta
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE conta SET saldo = ? WHERE id_conta = ?',
            [novoSaldo, conta.id_conta],
            function(err) {
              if (err) reject(err);
              else resolve(this.changes);
            }
          );
        });

        // 4. Registar operação de juros (id_tipo_O = 4)
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO operacoes 
             (data_operacao, valor, id_tipo_O, numero_conta, conta_relacionada) 
             VALUES (CURRENT_TIMESTAMP, ?, 4, ?, 'SISTEMA')`,
            [juros, conta.numero_conta],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });

        // 5. Enviar notificação por email (em background)
        setTimeout(() => {
          enviarNotificacaoOperacao(
            conta.email_cliente,
            'Juros',
            juros,
            conta.numero_conta
          ).catch(err => console.error(`⚠️ Erro email ${conta.email_cliente}:`, err.message));
        }, 0);

        totalCreditado += juros;
        contasProcessadas++;

      } catch (error) {
        console.error(`❌ Erro ao processar conta ${conta.numero_conta}:`, error.message);
        erros++;
      }
    }

    // 6. Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('✅ CÁLCULO DE JUROS CONCLUÍDO');
    console.log('='.repeat(60));
    console.log(`📊 Contas processadas: ${contasProcessadas}`);
    console.log(`💰 Total creditado: ${totalCreditado.toFixed(2)} MZN`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📅 Data: ${new Date().toLocaleString('pt-MZ')}`);
    console.log('='.repeat(60) + '\n');

    process.exit();
  });
}

// Executar se chamado diretamente
if (require.main === module) {
  calcularJuros();
}

module.exports = { calcularJuros };