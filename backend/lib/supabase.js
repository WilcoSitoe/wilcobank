// backend/lib/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltam variáveis de ambiente do Supabase');
  process.exit(1);
}

// Criar cliente com chave de serviço (acesso total)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Testar conexão ao iniciar
supabase
  .from('tipo_conta')
  .select('count')
  .limit(1)
  .then(({ error }) => {
    if (error) {
      console.error('❌ Erro ao conectar ao Supabase:', error.message);
    } else {
      console.log('✅ Conectado ao Supabase com sucesso!');
    }
  });

module.exports = supabase;