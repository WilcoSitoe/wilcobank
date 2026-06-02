import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Extrato from "../components/Extrato";

export default function Poupanca() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const clienteId = location.state?.id_cliente;
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('saldo');
  
  const [valorLev, setValorLev] = useState('');
  const [levantamentosRestantes, setLevantamentosRestantes] = useState(4);
  const [jurosLoading, setJurosLoading] = useState(false);
  
  useEffect(() => {
    if (!clienteId) {
      alert('Sessão expirada. Faça login novamente.');
      navigate('/');
      return;
    }
    carregarDados();
  }, [clienteId, navigate]);

  const carregarDados = async () => {
    try {
      const res = await api.get(`/clientes/${clienteId}`);
      setDados(res.data);
      setLevantamentosRestantes(4);
    } catch (err) {
      alert('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Função para Calcular Juros
  const handleCalcularJuros = async () => {
    if (dados.saldo < 1000) {
      alert('❌ Saldo mínimo de 1.000 MZN necessário para receber juros.');
      return;
    }
    
    setJurosLoading(true);
    try {
      const res = await api.post(`/clientes/${clienteId}/calcular-juros`);
      alert(`✅ Sucesso!\n${res.data.message}`);
      carregarDados();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || err.message));
    } finally {
      setJurosLoading(false);
    }
  };

  const handleLevantamento = async (e) => {
    e.preventDefault();
    
    if (levantamentosRestantes <= 0) {
      alert('❌ Atingiu o limite de 4 levantamentos mensais para conta Poupança.');
      return;
    }
    
    if (parseFloat(valorLev) > dados.saldo) {
      alert('❌ Saldo insuficiente');
      return;
    }
    
    if (dados.saldo - parseFloat(valorLev) < 1000) {
      alert('❌ Saldo mínimo da conta Poupança é 1.000 MZN');
      return;
    }
    
    try {
      const res = await api.post(`/clientes/${clienteId}/levantamento`, { valor: parseFloat(valorLev) });
      alert(`✅ Levantamento realizado! Saldo atual: ${res.data.novo_saldo.toFixed(2)} MZN\nLevantamentos restantes este mês: ${levantamentosRestantes - 1}`);
      setLevantamentosRestantes(prev => prev - 1);
      setValorLev('');
      carregarDados();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  const formatarMoeda = (val) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val || 0);

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Carregando...</p>;
  if (!dados) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Erro ao carregar dados.</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'Rockwell', color: '#222' }}>Olá, {dados.nome_cliente}!</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Conta Poupança: <strong>{dados.numero_conta}</strong>
            <span style={{ marginLeft: '10px', background: '#d4af37', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
              🏦 POUPANÇA
            </span>
          </p>
        </div>
        <button onClick={() => navigate('/')} style={{ padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sair</button>
      </div>

      {/* Card de Saldo */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2d5016 0%, #3a7d23 100%)', 
        color: 'white', 
        padding: '30px', 
        borderRadius: '12px', 
        marginBottom: '30px',
        boxShadow: '0 4px 15px rgba(45,80,22,0.3)',
        border: '2px solid #d4af37'
      }}>
        <p style={{ margin: 0, opacity: 0.9, display: 'flex', alignItems: 'center', gap: '8px' }}>
           Saldo Disponível
        </p>
        <h1 style={{ margin: '10px 0 0 0', fontSize: '2.5rem' }}>{formatarMoeda(dados.saldo)}</h1>
        <p style={{ margin: '10px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
          📈 Juros: 0.5% ao mês | Saldo mínimo: 1.000 MZN
        </p>
      </div>

      {/* Alerta de Limites */}
      <div style={{ 
        background: '#fff3cd', 
        borderLeft: '4px solid #ffc107', 
        padding: '12px 16px', 
        borderRadius: '6px', 
        marginBottom: '20px',
        fontSize: '14px',
        color: '#856404'
      }}>
        ⚠️ <strong>Conta Poupança:</strong> 
        {levantamentosRestantes > 0 
          ? ` Pode realizar mais ${levantamentosRestantes} levantamentos este mês.`
          : ' Atingiu o limite de 4 levantamentos mensais. Aguarde o próximo mês.'
        }
      </div>

      {/* Botões de Ação - VERSÃO SIMPLIFICADA */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('saldo')} style={{ flex: 1, padding: '12px', background: activeTab === 'saldo' ? '#2d5016' : '#eee', color: activeTab === 'saldo' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', minWidth: '80px' }}>
           Dados
        </button>
        <button onClick={() => setActiveTab('levantamento')} style={{ flex: 1, padding: '12px', background: activeTab === 'levantamento' ? '#ffc107' : '#eee', color: activeTab === 'levantamento' ? '#333' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', minWidth: '80px' }}>
          💸 Levantar
        </button>
        <button onClick={() => setActiveTab('extrato')} style={{ flex: 1, padding: '12px', background: activeTab === 'extrato' ? '#6c757d' : '#eee', color: activeTab === 'extrato' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', minWidth: '80px' }}>
          📜 Extrato
        </button>
        <button onClick={() => setActiveTab('juros')} style={{ flex: 1, padding: '12px', background: activeTab === 'juros' ? '#9c27b0' : '#eee', color: activeTab === 'juros' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', minWidth: '80px' }}>
          💰 Juros
        </button>
      </div>

      {/* Área de Conteúdo */}
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', minHeight: '200px' }}>
        
        {activeTab === 'saldo' && (
          <div>
            <h3 style={{ color: '#2d5016', fontFamily: 'Rockwell' }}>📋 Dados da Conta Poupança</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '13px' }}>Nome</p>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#2d5016' }}>{dados.nome_cliente}</p>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '13px' }}>Email</p>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#2d5016' }}>{dados.email_cliente}</p>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '13px' }}>Número da Conta</p>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#2d5016' }}>{dados.numero_conta}</p>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '13px' }}>Tipo</p>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#2d5016' }}>💰 Conta Poupança</p>
              </div>
            </div>
            <div style={{ marginTop: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>
              <p style={{ margin: 0, color: '#2d5016' }}>
                <strong>💡 Vantagens da Poupança:</strong><br />
                • Rendimento de 0.5% ao mês<br />
                • Segurança para seus objetivos<br />
                • Saldo mínimo de 1.000 MZN
              </p>
            </div>
          </div>
        )}

        {activeTab === 'levantamento' && (
          <form onSubmit={handleLevantamento}>
            <h3 style={{ marginTop: 0, color: '#ffc107' }}>💸 Levantar da Poupança</h3>
            
            {levantamentosRestantes <= 0 && (
              <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '6px', marginBottom: '15px' }}>
                ⚠️ Atingiu o limite de 4 levantamentos este mês.
              </div>
            )}
            
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Valor (MZN)</label>
            <input 
              type="number" 
              value={valorLev} 
              onChange={(e) => setValorLev(e.target.value)} 
              placeholder="0.00" 
              required 
              min="1"
              disabled={levantamentosRestantes <= 0}
              style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', opacity: levantamentosRestantes <= 0 ? 0.6 : 1 }}
            />
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
              Levantamentos restantes este mês: <strong>{levantamentosRestantes}/4</strong>
            </p>
            <button 
              type="submit" 
              disabled={levantamentosRestantes <= 0}
              style={{ width: '100%', padding: '12px', background: levantamentosRestantes <= 0 ? '#ccc' : '#ffc107', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: levantamentosRestantes <= 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              {levantamentosRestantes <= 0 ? 'Limite Atingido' : 'Confirmar Levantamento'}
            </button>
          </form>
        )}

        {/* ABA: JUROS */}
        {activeTab === 'juros' && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ color: '#9c27b0', fontFamily: 'Rockwell', fontSize: '24px' }}> Juros da Poupança</h3>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '16px' }}>
              A tua conta rende <strong>0.5% ao mês</strong> sobre o saldo disponível.<br/>
              Saldo mínimo para accrual: <strong>1.000 MZN</strong>
            </p>
            
            <div style={{ background: '#f3e5f5', padding: '15px', borderRadius: '8px', marginBottom: '25px', borderLeft: '4px solid #9c27b0', textAlign: 'left' }}>
              <p style={{ margin: 0, color: '#6a1b9a', fontSize: '14px' }}>
                💡 <strong>Nota:</strong> Os juros são calculados automaticamente mensalmente pelo sistema. 
                Este botão permite simular/antecipar o crédito para testes.
              </p>
            </div>

            <button 
              onClick={handleCalcularJuros}
              disabled={jurosLoading || dados.saldo < 1000}
              style={{ 
                padding: '14px 28px', 
                background: jurosLoading || dados.saldo < 1000 ? '#ccc' : '#9c27b0', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '16px', 
                cursor: jurosLoading || dados.saldo < 1000 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                boxShadow: jurosLoading ? 'none' : '0 4px 12px rgba(156, 39, 176, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {jurosLoading ? '⏳ A calcular juros...' : '💰 Creditar Juros Agora'}
            </button>
            
            {dados.saldo < 1000 && (
              <p style={{ marginTop: '15px', color: '#dc3545', fontSize: '14px' }}>
                ⚠️ Saldo insuficiente para receber juros (Mínimo: 1.000 MZN).
              </p>
            )}
          </div>
        )}

        {/* ABA: EXTRATO */}
        {activeTab === 'extrato' && (
          <div>
            <h3 style={{ color: '#6c757d', fontFamily: 'Rockwell', marginTop: 0 }}>📜 Histórico de Transações</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              Todas as operações realizadas na sua conta Poupança
            </p>
            <Extrato clienteId={clienteId} tipoConta="Poupança" />
          </div>
        )}

      </div>
    </div>
  );
}