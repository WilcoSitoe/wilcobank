import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Extrato from '../components/Extrato';
import {
  FaCheckCircle,
  FaPaperPlane,
  FaMoneyBillWave,
  FaCoins,
  FaUniversity,
  FaFileAlt,
  FaLightbulb,
  FaSpinner,
  FaDoorOpen,
  FaUser,
  FaArrowDown,
  FaArrowRight,
  FaWallet,
  FaReceipt,
  FaExclamationTriangle,
  FaArrowUp
} from 'react-icons/fa';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const clienteId = location.state?.id_cliente;

  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('saldo');

  const [valorLev, setValorLev] = useState('');
  const [contaDestino, setContaDestino] = useState('');
  const [valorTrans, setValorTrans] = useState('');
  const [taxaCalculada, setTaxaCalculada] = useState(0);

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

  useEffect(() => {
    if (valorTrans && !isNaN(parseFloat(valorTrans))) {
      setTaxaCalculada(calcularTaxa(parseFloat(valorTrans)));
    } else {
      setTaxaCalculada(0);
    }
  }, [valorTrans]);

  const calcularTaxa = (valor) => {
    const TAXA_PERCENTUAL = 0.02;
    const VALOR_MINIMO_PARA_TAXA = 100;
    const VALOR_MAXIMO_TAXA = 500;
    if (!valor || valor < VALOR_MINIMO_PARA_TAXA) return 0;
    let taxa = valor * TAXA_PERCENTUAL;
    if (taxa > VALOR_MAXIMO_TAXA) taxa = VALOR_MAXIMO_TAXA;
    return Math.round(taxa * 100) / 100;
  };

  const carregarDados = async () => {
    try {
      const res = await api.get(`/clientes/${clienteId}`);
      setDados(res.data);
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

  const handleLevantamento = async (e) => {
    e.preventDefault();
    if (operacaoLoading) return;
    setOperacaoLoading(true);
    setOperacaoMensagem('A processar levantamento...');
    try {
      const res = await api.post(`/clientes/${clienteId}/levantamento`, { valor: parseFloat(valorLev) });
      setOperacaoMensagem('Levantamento realizado com sucesso!');
      setTimeout(() => {
        mostrarNotificacao(`Sucesso! Saldo atual: ${formatarMoeda(res.data.novo_saldo)}`, 'success');
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

  const handleTransferencia = async (e) => {
    e.preventDefault();
    if (operacaoLoading) return;
    const valor = parseFloat(valorTrans);
    const totalComTaxa = valor + taxaCalculada;
    if (totalComTaxa > dados.saldo) {
      mostrarNotificacao(`Saldo insuficiente. Necessitas de ${formatarMoeda(totalComTaxa)}`, 'error');
      return;
    }
    setOperacaoLoading(true);
    setOperacaoMensagem('A processar transferência...');
    try {
      const res = await api.post(`/clientes/${clienteId}/transferencia`, {
        valor: valor,
        conta_destino: contaDestino
      });
      setOperacaoMensagem('Transferência realizada com sucesso!');
      setTimeout(() => {
        mostrarNotificacao(`Transferência realizada! Novo saldo: ${formatarMoeda(res.data.novo_saldo)}`, 'success');
        setContaDestino('');
        setValorTrans('');
        setTaxaCalculada(0);
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

  const formatarMoeda = (val) =>
    new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val || 0);

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
    { id: 'saldo', label: 'Ver Dados', icon: <FaUser /> },
    { id: 'levantamento', label: 'Levantamento', icon: <FaArrowDown /> },
    { id: 'transferencia', label: 'Transferência', icon: <FaArrowRight /> },
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
            background: 'linear-gradient(135deg, #e94560 0%, #ff6b6b 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(233,69,96,0.3)'
          }}>
            <FaUniversity size={20} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '0.5px' }}>
              WilcoBank
            </h1>
            <span style={{ fontSize: '11px', color: '#a0aec0', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Área do Cliente
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
            <FaUser color="#e94560" />
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

        {/* Card de Saldo */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4f46e5 100%)',
          color: 'white',
          padding: '32px',
          borderRadius: '16px',
          marginBottom: '28px',
          boxShadow: '0 8px 30px rgba(30,60,114,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ margin: '0 0 8px 0', opacity: 0.85, fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaWallet /> Saldo Disponível
            </p>
            <h1 style={{ margin: 0, fontSize: '2.8rem', fontWeight: 700 }}>
              {formatarMoeda(dados.saldo)}
            </h1>
            <p style={{ margin: '8px 0 0 0', opacity: 0.7, fontSize: '13px' }}>
              Conta {dados.numero_conta} · {dados.nome_tipo}
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
          {/* Círculo decorativo */}
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

          {/* ABA: VER DADOS */}
          {activeTab === 'saldo' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaUser color="#4f46e5" /> Dados da Conta
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Nome Completo', value: `${dados.nome_cliente} ${dados.apelido_cliente || ''}`, icon: <FaUser color="#4f46e5" /> },
                  { label: 'Email', value: dados.email_cliente, icon: <FaUniversity color="#0891b8" /> },
                  { label: 'Tipo de Conta', value: dados.nome_tipo, icon: <FaWallet color="#059669" /> },
                  { label: 'Número da Conta', value: dados.numero_conta, icon: <FaReceipt color="#7c3aed" /> },
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
            </div>
          )}

          {/* ABA: LEVANTAMENTO */}
          {activeTab === 'levantamento' && (
            <form onSubmit={handleLevantamento}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaArrowDown color="#f59e0b" /> Realizar Levantamento
              </h3>

              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Valor (MT)
              </label>
              <input
                type="number"
                value={valorLev}
                onChange={(e) => setValorLev(e.target.value)}
                placeholder="0.00"
                required
                min="0.01"
                step="0.01"
                disabled={operacaoLoading}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  fontSize: '16px',
                  marginBottom: '20px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  opacity: operacaoLoading ? 0.6 : 1
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />

              <button
                type="submit"
                disabled={operacaoLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: operacaoLoading ? '#d1d5db' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: operacaoLoading ? 'not-allowed' : 'pointer',
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

          {/* ABA: TRANSFERÊNCIA */}
          {activeTab === 'transferencia' && (
            <form onSubmit={handleTransferencia}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaArrowRight color="#059669" /> Transferência Bancária
              </h3>

              <div style={{
                background: '#eff6ff',
                padding: '14px',
                borderRadius: '10px',
                marginBottom: '20px',
                borderLeft: '4px solid #3b82f6',
                fontSize: '13px',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <FaLightbulb size={16} style={{ marginTop: '2px', flexShrink: 0, color: '#3b82f6' }} />
                <span>Transferências só entre contas correntes. Taxa de 2% para valores ≥ 100 MT (máx. 500 MT).</span>
              </div>

              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Número da Conta Destino
              </label>
              <input
                type="text"
                value={contaDestino}
                onChange={(e) => setContaDestino(e.target.value)}
                placeholder="Ex: 123456789"
                required
                disabled={operacaoLoading}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  fontSize: '16px',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  opacity: operacaoLoading ? 0.6 : 1
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />

              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Valor a Transferir (MT)
              </label>
              <input
                type="number"
                value={valorTrans}
                onChange={(e) => setValorTrans(e.target.value)}
                placeholder="0.00"
                required
                min="0.01"
                step="0.01"
                disabled={operacaoLoading}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  fontSize: '16px',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  opacity: operacaoLoading ? 0.6 : 1
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />

              {/* RESUMO COM TAXA */}
              {parseFloat(valorTrans) > 0 && (
                <div style={{
                  background: '#f9fafb',
                  padding: '18px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ margin: '0 0 12px 0', fontWeight: 700, fontSize: '14px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaMoneyBillWave color="#059669" /> Resumo da Transferência
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                    <span style={{ color: '#6b7280' }}>Valor a transferir:</span>
                    <span style={{ fontWeight: 600 }}>{formatarMoeda(parseFloat(valorTrans) || 0)}</span>
                  </div>

                  {taxaCalculada > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                        <span style={{ color: '#dc2626' }}>Taxa de serviço (2%):</span>
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>-{formatarMoeda(taxaCalculada)}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '10px',
                        borderTop: '1px solid #e5e7eb',
                        fontWeight: 700,
                        fontSize: '15px',
                        color: '#111827'
                      }}>
                        <span>Total a debitar:</span>
                        <span>{formatarMoeda((parseFloat(valorTrans) || 0) + taxaCalculada)}</span>
                      </div>
                    </>
                  )}

                  {taxaCalculada === 0 && parseFloat(valorTrans) >= 100 && (
                    <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#059669', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaCheckCircle /> Isento de taxa (promoção especial!)
                    </p>
                  )}

                  {parseFloat(valorTrans) < 100 && parseFloat(valorTrans) > 0 && (
                    <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#6b7280', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaLightbulb /> Transferências abaixo de 100 MT não têm taxa.
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={operacaoLoading || parseFloat(valorTrans) <= 0 || !contaDestino}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: (operacaoLoading || parseFloat(valorTrans) <= 0 || !contaDestino) ? '#d1d5db' : 'linear-gradient(135deg, #059669, #10b981)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: (operacaoLoading || parseFloat(valorTrans) <= 0 || !contaDestino) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {operacaoLoading ? <FaSpinner className="spin" /> : <FaPaperPlane />}
                {operacaoLoading ? 'A processar...' : 'Confirmar Transferência'}
              </button>
            </form>
          )}

          {/* ABA: EXTRATO */}
          {activeTab === 'extrato' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaReceipt color="#6b7280" /> Extrato Bancário
              </h3>
              <Extrato clienteId={clienteId} tipoConta={dados?.nome_tipo} />
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
          <FaSpinner className="spin" size={48} color="#4f46e5" />
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
              background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
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