import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Extrato from "../components/Extrato";
import {
  FaUniversity,
  FaCoins,
  FaMoneyBillWave,
  FaFileAlt,
  FaExclamationTriangle,
  FaLightbulb,
  FaChartLine,
  FaSpinner,
  FaArrowDown,
  FaInfoCircle,
  FaUser,
  FaEnvelope,
  FaCreditCard,
  FaPiggyBank,
  FaDoorOpen,
  FaCheckCircle,
  FaWallet,
  FaReceipt
} from 'react-icons/fa';

export default function Poupanca() {
  const location = useLocation();
  const navigate = useNavigate();

  const clienteId = location.state?.id_cliente;
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('saldo');

  const [valorLev, setValorLev] = useState('');
  const [levantamentosRestantes, setLevantamentosRestantes] = useState(4);

  const [operacaoLoading, setOperacaoLoading] = useState(false);
  const [operacaoMensagem, setOperacaoMensagem] = useState('');
  const [notificacao, setNotificacao] = useState(null);

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
      mostrarNotificacao('Erro ao carregar dados.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tipo');
    localStorage.removeItem('cliente');
    navigate('/');
  };

  const mostrarNotificacao = (msg, tipo) => {
    setNotificacao({ msg, tipo });
    setTimeout(() => setNotificacao(null), 4000);
  };

  const handleCalcularJuros = async () => {
    if (dados.saldo < 1000) {
      mostrarNotificacao('Saldo mínimo de 1.000 MZN necessário para receber juros.', 'error');
      return;
    }
    if (operacaoLoading) return;

    setOperacaoLoading(true);
    setOperacaoMensagem('A calcular juros...');

    try {
      const res = await api.post(`/clientes/${clienteId}/calcular-juros`);
      setOperacaoMensagem('Juros creditados com sucesso!');
      setTimeout(() => {
        mostrarNotificacao(res.data.message, 'success');
        setOperacaoLoading(false);
        setOperacaoMensagem('');
        carregarDados();
      }, 1000);
    } catch (err) {
      setOperacaoLoading(false);
      setOperacaoMensagem('');
      mostrarNotificacao('Erro: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleLevantamento = async (e) => {
    e.preventDefault();
    if (operacaoLoading) return;

    if (levantamentosRestantes <= 0) {
      mostrarNotificacao('Atingiu o limite de 4 levantamentos mensais para conta Poupança.', 'error');
      return;
    }

    if (parseFloat(valorLev) > dados.saldo) {
      mostrarNotificacao('Saldo insuficiente', 'error');
      return;
    }

    if (dados.saldo - parseFloat(valorLev) < 1000) {
      mostrarNotificacao('Saldo mínimo da conta Poupança é 1.000 MZN', 'error');
      return;
    }

    setOperacaoLoading(true);
    setOperacaoMensagem('A processar levantamento...');

    try {
      const res = await api.post(`/clientes/${clienteId}/levantamento`, { valor: parseFloat(valorLev) });
      setOperacaoMensagem('Levantamento realizado com sucesso!');
      setTimeout(() => {
        mostrarNotificacao(`Levantamento realizado! Saldo: ${formatarMoeda(res.data.novo_saldo)}`, 'success');
        setLevantamentosRestantes(prev => prev - 1);
        setValorLev('');
        setOperacaoLoading(false);
        setOperacaoMensagem('');
        carregarDados();
      }, 1000);
    } catch (err) {
      setOperacaoLoading(false);
      setOperacaoMensagem('');
      mostrarNotificacao('Erro: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const formatarMoeda = (val) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val || 0);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <FaSpinner className="spin" size={40} style={{ marginBottom: '16px' }} />
          <p>A carregar dados...</p>
        </div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <div style={{ textAlign: 'center', color: '#dc2626' }}>
          <FaExclamationTriangle size={40} style={{ marginBottom: '16px' }} />
          <p>Erro ao carregar dados.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'saldo', label: 'Dados', icon: <FaInfoCircle /> },
    { id: 'levantamento', label: 'Levantar', icon: <FaArrowDown /> },
    { id: 'juros', label: 'Juros', icon: <FaChartLine /> },
    { id: 'extrato', label: 'Extrato', icon: <FaReceipt /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: 'Segoe UI, sans-serif' }}>
      {/* ===== NAVBAR ESTILOSO ===== */}
      <nav style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: 'white',
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(212,175,55,0.3)'
          }}>
            <FaUniversity size={20} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '0.5px' }}>
              WilcoBank
            </h1>
            <span style={{ fontSize: '11px', color: '#a0aec0', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Conta Poupança
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.08)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '13px'
          }}>
            <FaUser color="#d4af37" />
            <span>{dados.nome_cliente}</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              padding: '8px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(233,69,96,0.2)';
              e.currentTarget.style.borderColor = 'rgba(233,69,96,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
          >
            <FaDoorOpen size={16} />
            Sair
          </button>
        </div>
      </nav>

      {/* ===== CONTEÚDO ===== */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Notificação */}
        {notificacao && (
          <div style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            padding: '14px 22px',
            borderRadius: '10px',
            color: 'white',
            fontWeight: 500,
            fontSize: '14px',
            zIndex: 2000,
            animation: 'slideIn 0.3s ease',
            background: notificacao.tipo === 'success' ? '#28a745' : '#dc3545',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {notificacao.tipo === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
            {notificacao.msg}
          </div>
        )}

        {/* Card de Saldo Poupança */}
        <div style={{
          background: 'linear-gradient(135deg, #2d5016 0%, #3a7d23 50%, #059669 100%)',
          color: 'white',
          padding: '32px',
          borderRadius: '16px',
          marginBottom: '20px',
          boxShadow: '0 8px 30px rgba(45,80,22,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          border: '2px solid #d4af37'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                padding: '4px 12px',
                background: 'rgba(212,175,55,0.25)',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                border: '1px solid rgba(212,175,55,0.4)'
              }}>
                <FaPiggyBank style={{ marginRight: '4px' }} /> POUPANÇA
              </span>
            </div>
            <p style={{ margin: '0 0 8px 0', opacity: 0.85, fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaWallet /> Saldo Disponível
            </p>
            <h1 style={{ margin: 0, fontSize: '2.8rem', fontWeight: 700 }}>
              {formatarMoeda(dados.saldo)}
            </h1>
            <p style={{ margin: '8px 0 0 0', opacity: 0.7, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaChartLine /> Juros: 0.5% ao mês | Saldo mínimo: 1.000 MZN
            </p>
          </div>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <FaCoins size={36} style={{ opacity: 0.9 }} />
          </div>
          <div style={{
            position: 'absolute',
            right: '-40px',
            top: '-40px',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            zIndex: 0
          }} />
        </div>

        {/* Alerta de Limites */}
        <div style={{
          background: levantamentosRestantes > 0 ? '#fffbeb' : '#fef2f2',
          borderLeft: `4px solid ${levantamentosRestantes > 0 ? '#f59e0b' : '#dc2626'}`,
          padding: '14px 18px',
          borderRadius: '10px',
          marginBottom: '24px',
          fontSize: '14px',
          color: levantamentosRestantes > 0 ? '#92400e' : '#991b1b',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <FaExclamationTriangle size={18} style={{ marginTop: '2px', flexShrink: 0, color: levantamentosRestantes > 0 ? '#f59e0b' : '#dc2626' }} />
          <div>
            <strong style={{ fontWeight: 600 }}>Conta Poupança:</strong>{' '}
            {levantamentosRestantes > 0
              ? `Pode realizar mais ${levantamentosRestantes} levantamentos este mês.`
              : 'Atingiu o limite de 4 levantamentos mensais. Aguarde o próximo mês.'
            }
          </div>
        </div>

        {/* Abas */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          background: 'white',
          padding: '6px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #e5e7eb',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                background: activeTab === tab.id ? '#1a1a2e' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6b7280'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Card de Conteúdo */}
        <div style={{
          background: 'white',
          borderRadius: '14px',
          padding: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #e5e7eb',
          minHeight: '200px'
        }}>

          {/* ABA: DADOS */}
          {activeTab === 'saldo' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaInfoCircle color="#4f46e5" /> Dados da Conta Poupança
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Nome Completo', value: `${dados.nome_cliente} ${dados.apelido_cliente || ''}`, icon: <FaUser color="#4f46e5" /> },
                  { label: 'Email', value: dados.email_cliente, icon: <FaEnvelope color="#0891b8" /> },
                  { label: 'Número da Conta', value: dados.numero_conta, icon: <FaCreditCard color="#059669" /> },
                  { label: 'Tipo', value: 'Conta Poupança', icon: <FaPiggyBank color="#d4af37" /> },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {item.icon} {item.label}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '20px',
                padding: '18px',
                background: '#ecfdf5',
                borderRadius: '12px',
                borderLeft: '4px solid #059669'
              }}>
                <p style={{ margin: '0 0 10px 0', color: '#065f46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaLightbulb color="#059669" /> Vantagens da Poupança
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#065f46', fontSize: '14px', lineHeight: '1.8' }}>
                  <li>Rendimento de 0.5% ao mês</li>
                  <li>Segurança para seus objetivos</li>
                  <li>Saldo mínimo de 1.000 MZN</li>
                </ul>
              </div>
            </div>
          )}

          {/* ABA: LEVANTAMENTO */}
          {activeTab === 'levantamento' && (
            <form onSubmit={handleLevantamento}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaArrowDown color="#f59e0b" /> Levantar da Poupança
              </h3>

              {levantamentosRestantes <= 0 && (
                <div style={{
                  background: '#fef2f2',
                  color: '#991b1b',
                  padding: '14px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  <FaExclamationTriangle /> Atingiu o limite de 4 levantamentos este mês.
                </div>
              )}

              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Valor (MZN)
              </label>
              <input
                type="number"
                value={valorLev}
                onChange={(e) => setValorLev(e.target.value)}
                placeholder="0.00"
                required
                min="1"
                disabled={operacaoLoading || levantamentosRestantes <= 0}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  fontSize: '16px',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  opacity: (operacaoLoading || levantamentosRestantes <= 0) ? 0.6 : 1
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />

              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaInfoCircle size={12} /> Levantamentos restantes este mês: <strong style={{ color: '#111827' }}>{levantamentosRestantes}/4</strong>
              </p>

              <button
                type="submit"
                disabled={operacaoLoading || levantamentosRestantes <= 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: (operacaoLoading || levantamentosRestantes <= 0) ? '#d1d5db' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: (operacaoLoading || levantamentosRestantes <= 0) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {operacaoLoading ? <FaSpinner className="spin" /> : <FaArrowDown />}
                {operacaoLoading ? 'A processar...' : 'Confirmar Levantamento'}
              </button>
            </form>
          )}

          {/* ABA: JUROS */}
          {activeTab === 'juros' && (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <FaChartLine color="#7c3aed" /> Juros da Poupança
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '15px' }}>
                A tua conta rende <strong style={{ color: '#7c3aed' }}>0.5% ao mês</strong> sobre o saldo disponível.<br/>
                Saldo mínimo para accrual: <strong>1.000 MZN</strong>
              </p>

              <div style={{
                background: '#f5f3ff',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '28px',
                borderLeft: '4px solid #7c3aed',
                textAlign: 'left',
                maxWidth: '500px',
                margin: '0 auto 28px'
              }}>
                <p style={{ margin: 0, color: '#6b21a8', fontSize: '14px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <FaLightbulb size={18} style={{ marginTop: '2px', flexShrink: 0, color: '#7c3aed' }} />
                  <span>
                    <strong>Nota:</strong> Os juros são calculados automaticamente mensalmente pelo sistema.
                    Este botão permite simular/antecipar o crédito para testes.
                  </span>
                </p>
              </div>

              <button
                onClick={handleCalcularJuros}
                disabled={operacaoLoading || dados.saldo < 1000}
                style={{
                  padding: '14px 32px',
                  background: (operacaoLoading || dados.saldo < 1000) ? '#d1d5db' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: (operacaoLoading || dados.saldo < 1000) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: (operacaoLoading || dados.saldo < 1000) ? 'none' : '0 4px 15px rgba(124,58,237,0.3)'
                }}
              >
                {operacaoLoading ? <FaSpinner className="spin" /> : <FaCoins />}
                {operacaoLoading ? 'A calcular juros...' : 'Creditar Juros Agora'}
              </button>

              {dados.saldo < 1000 && (
                <p style={{ marginTop: '16px', color: '#dc2626', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <FaExclamationTriangle /> Saldo insuficiente para receber juros (Mínimo: 1.000 MZN).
                </p>
              )}
            </div>
          )}

          {/* ABA: EXTRATO */}
          {activeTab === 'extrato' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaReceipt color="#6b7280" /> Histórico de Transações
              </h3>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
                Todas as operações realizadas na sua conta Poupança
              </p>
              <Extrato clienteId={clienteId} tipoConta="Poupança" />
            </div>
          )}
        </div>
      </main>

      {/* LOADING OVERLAY GLOBAL */}
      {operacaoLoading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000,
          gap: '16px'
        }}>
          <FaSpinner className="spin" size={48} color="#059669" />
          <p style={{ color: '#4b5563', fontWeight: 500, fontSize: '16px' }}>{operacaoMensagem || 'A processar...'}</p>
          <div style={{
            width: '200px',
            height: '4px',
            background: '#e5e7eb',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #059669, #10b981)',
              animation: 'loadingBar 1.5s ease-in-out infinite',
              borderRadius: '2px'
            }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}