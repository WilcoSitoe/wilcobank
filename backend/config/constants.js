/**
 * ⚙️ Configurações Globais do WilcoBank
 */

module.exports = {
  // 💰 Taxa de transferência entre contas Corrente
  // Opção A: Percentagem (ex: 0.02 = 2%)
  TAXA_TRANSFERENCIA_PERCENTUAL: 0.02,
  
  // Opção B: Valor fixo em MZN (descomenta se preferires fixo)
  // TAXA_TRANSFERENCIA_FIXA: 50,
  
  // Usa percentual ou fixo? (true = percentual, false = fixo)
  USAR_TAXA_PERCENTUAL: true,
  
  // Valor mínimo para aplicar taxa (transferências abaixo são gratuitas)
  VALOR_MINIMO_PARA_TAXA: 100,
  
  // Valor máximo da taxa (para limitar em transferências grandes)
  VALOR_MAXIMO_TAXA: 500,
  
  // Moeda do sistema
  MOEDA: 'MZN',
  LOCALE: 'pt-MZ'
};