import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Extrato from '../components/Extrato';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaPaperPlane,
  FaMoneyBillWave,
  FaCoins,
  FaUniversity,
  FaFileAlt,
  FaLightbulb,
  FaSpinner,
  FaLock
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

  // Estado para taxa de transferência calculada
  const [taxaCalculada, setTaxaCalculada] = useState(0);

  // NOVO: Estado para loading overlay durante operações
  const [operacaoLoading, setOperacaoLoading] = useState(false);
  const [operacaoMensagem, setOperacaoMensagem] = useState('');

  useEffect(() => {
    if (!clienteId) {
      alert('Sessão expirada. Faça login novamente.');
      navigate('/');
      return;
    }
    carregarDados();
  }, [clienteId, navigate]);

  // Efeito para recalcular taxa quando o valor da transferência muda
  useEffect(() => {
    if (valorTrans && !isNaN(parseFloat(valorTrans))) {
      setTaxaCalculada(calcularTaxa(parseFloat(valorTrans)));
    } else {
      setTaxaCalculada(0);
    }
  }, [valorTrans]);

  // Função para calcular taxa (mesma lógica do backend)
  const calcularTaxa = (valor) => {
    const TAXA_PERCENTUAL = 0.02; // 2%
    const VALOR_MINIMO_PARA_TAXA = 100; // Transferências < 100 MT são gratuitas
    const VALOR_MAXIMO_TAXA = 500; // Taxa máxima de 500 MT

    if (!valor || valor < VALOR_MINIMO_PARA_TAXA) return 0;

    let taxa = valor * TAXA_PERCENTUAL;
    if (taxa > VALOR_MAXIMO_TAXA) taxa = VALOR_MAXIMO_TAXA;

    return Math.round(taxa * 100) / 100; // Arredondar para 2 casas decimais
  };

  const carregarDados = async () => {
    try {
      const res = await api.get(`/clientes/${clienteId}`);
      setDados(res.data);
    } catch (err) {
      alert('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  // NOVO: Handler de levantamento com loading overlay
  const handleLevantamento = async (e) => {
    e.preventDefault();

    // Bloquear múltiplos cliques
    if (operacaoLoading) return;

    setOperacaoLoading(true);
    setOperacaoMensagem('A processar levantamento...');

    try {
      const res = await api.post(`/clientes/${clienteId}/levantamento`, { valor: parseFloat(valorLev) });

      setOperacaoMensagem('Levantamento realizado com sucesso!');

      // Pequeno delay para mostrar sucesso antes de fechar
      setTimeout(() => {
        alert(`Sucesso! Saldo atual: ${formatarMoeda(res.data.novo_saldo)}`);
        setValorLev('');
        setOperacaoLoading(false);
        setOperacaoMensagem('');
        carregarDados();
      }, 1000);

    } catch (err) {
      setOperacaoLoading(false);
      setOperacaoMensagem('');
      alert('Erro: ' + (err.response?.data?.error || err.message));
    }
  };

  // NOVO: Handler de transferência com loading overlay
  const handleTransferencia = async (e) => {
    e.preventDefault();

    // Bloquear múltiplos cliques
    if (operacaoLoading) return;

    const valor = parseFloat(valorTrans);
    const totalComTaxa = valor + taxaCalculada;

    // Validar saldo incluindo a taxa
    if (totalComTaxa > dados.saldo) {
      alert(`Saldo insuficiente. Necessitas de ${formatarMoeda(totalComTaxa)} (valor: ${formatarMoeda(valor)} + taxa: ${formatarMoeda(taxaCalculada)})`);
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

      // Pequeno delay para mostrar sucesso antes de fechar
      setTimeout(() => {
        alert(`Transferência realizada!\n\nValor enviado: ${formatarMoeda(valor)}\nTaxa de serviço: ${formatarMoeda(res.data.taxa_cobrada || 0)}\nTotal debitado: ${formatarMoeda(res.data.valor_total_debitado || totalComTaxa)}\nNovo saldo: ${formatarMoeda(res.data.novo_saldo)}`);

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
      alert('Erro: ' + (err.response?.data?.error || err.message));
    }
  };

  // Formatador de moeda MZN (Metical)
  const formatarMoeda = (val) => 
    new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val || 0);

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Carregando...</p>;
  if (!dados) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Erro ao carregar dados.</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>

      {/* NOVO: Loading Overlay - bloqueia toda a tela durante operação */}
      {operacaoLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            padding: '40px 60px',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            maxWidth: '400px',
            width: '90%'
          }}>
            <FaSpinner 
              size={48} 
              color="#1e3c72" 
              style={{ 
                animation: 'spin 1s linear infinite',
                marginBottom: '20px'
              }} 
            />
            <h3 style={{ 
              margin: '0 0 10px 0', 
              color: '#1e3c72', 
              fontFamily: 'Rockwell',
              fontSize: '20px'
            }}>
              {operacaoMensagem || 'A processar...'}
            </h3>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Por favor, aguarde. Não feche esta janela.
            </p>
            <div style={{
              marginTop: '20px',
              width: '100%',
              height: '4px',
              background: '#e0e0e0',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, #1e3c72, #2a5298)',
                animation: 'loadingBar 1.5s ease-in-out infinite',
                borderRadius: '2px'
              }} />
            </div>
          </div>
        </div>
      )}

      {/* CSS para animações */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'Rockwell', color: '#222' }}>Olá, {dados.nome_cliente}!</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Conta: <strong>{dados.numero_conta}</strong> ({dados.nome_tipo})</p>
        </div>
        <button onClick={() => navigate('/')} style={{ padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sair</button>
      </div>

      {/* Card de Saldo */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
        color: 'white', 
        padding: '30px', 
        borderRadius: '12px', 
        marginBottom: '30px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <FaCoins size={40} style={{ opacity: 0.8 }} />
        <div>
          <p style={{ margin: 0, opacity: 0.8 }}>Saldo Disponível</p>
          <h1 style={{ margin: '10px 0 0 0', fontSize: '2.5rem' }}>{formatarMoeda(dados.saldo)}</h1>
        </div>
      </div>

      {/* Botões de Ação */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('saldo')} style={{ flex: 1, padding: '12px', background: activeTab === 'saldo' ? '#333' : '#eee', color: activeTab === 'saldo' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Ver Dados</button>
        <button onClick={() => setActiveTab('levantamento')} style={{ flex: 1, padding: '12px', background: activeTab === 'levantamento' ? '#f39c12' : '#eee', color: activeTab === 'levantamento' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Levantamento</button> 
        <button onClick={() => setActiveTab('transferencia')} style={{ flex: 1, padding: '12px', background: activeTab === 'transferencia' ? '#27ae60' : '#eee', color: activeTab === 'transferencia' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Transferência</button>
        <button onClick={() => setActiveTab('extrato')} style={{ 
          flex: 1, padding: '12px', 
          background: activeTab === 'extrato' ? '#6c757d' : '#eee', 
          color: activeTab === 'extrato' ? 'white' : '#333', 
          border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
        }}>
          <FaFileAlt /> Extrato
        </button>
      </div>

      {/* Área de Conteúdo */}
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', minHeight: '200px' }}>

        {/* ABA: VER DADOS */}
        {activeTab === 'saldo' && (
          <div>
            <h3 style={{ marginTop: 0, fontFamily: 'Rockwell' }}>Dados da Conta</h3>
            <p><strong>Nome:</strong> {dados.nome_cliente}</p>
            <p><strong>Email:</strong> {dados.email_cliente}</p>
            <p><strong>Tipo:</strong> {dados.nome_tipo}</p>
            <p><strong>Número:</strong> {dados.numero_conta}</p>
          </div>
        )}

        {/* ABA: LEVANTAMENTO - COM LOADING */}
        {activeTab === 'levantamento' && (
          <form onSubmit={handleLevantamento}>
            <h3 style={{ marginTop: 0, fontFamily: 'Rockwell' }}>Realizar Levantamento</h3>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Valor (MT)</label>
            <input 
              type="number" 
              value={valorLev} 
              onChange={(e) => setValorLev(e.target.value)} 
              placeholder="0.00" 
              required 
              disabled={operacaoLoading}
              style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', opacity: operacaoLoading ? 0.6 : 1 }}
            />
            <button 
              type="submit" 
              disabled={operacaoLoading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: operacaoLoading ? '#ccc' : '#f39c12', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                fontSize: '16px', 
                cursor: operacaoLoading ? 'not-allowed' : 'pointer', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {operacaoLoading ? <><FaSpinner className="spin" /> A processar...</> : 'Confirmar Levantamento'}
            </button>
          </form>
        )}

        {/* ABA: TRANSFERÊNCIA - COM LOADING */}
        {activeTab === 'transferencia' && (
          <form onSubmit={handleTransferencia}>
            <h3 style={{ marginTop: 0, fontFamily: 'Rockwell' }}>Transferência Bancária</h3>

            <div style={{ 
              background: '#e3f2fd', 
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '20px',
              borderLeft: '4px solid #2196F3',
              fontSize: '13px',
              color: '#1565c0',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <FaLightbulb size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>Transferências só podem ser realizadas entre contas correntes. É cobrada uma taxa de 2% para valores ≥ 100 MT (máx. 500 MT).</span>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Número da Conta Destino</label>
            <input 
              type="text" 
              value={contaDestino} 
              onChange={(e) => setContaDestino(e.target.value)} 
              placeholder="Ex: 123456789 (apenas Conta Corrente)" 
              required 
              disabled={operacaoLoading}
              style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', opacity: operacaoLoading ? 0.6 : 1 }}
            />

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Valor a Transferir (MT)</label>
            <input 
              type="number" 
              value={valorTrans} 
              onChange={(e) => setValorTrans(e.target.value)} 
              placeholder="0.00" 
              required 
              min="0.01"
              step="0.01"
              disabled={operacaoLoading}
              style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', opacity: operacaoLoading ? 0.6 : 1 }}
            />

            {/* RESUMO DA TRANSFERÊNCIA COM TAXA */}
            {parseFloat(valorTrans) > 0 && (
              <div style={{ 
                background: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid #dee2e6'
              }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaMoneyBillWave /> Resumo da Transferência
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
                  <span style={{ color: '#666' }}>Valor a transferir:</span>
                  <span>{formatarMoeda(parseFloat(valorTrans) || 0)}</span>
                </div>

                {taxaCalculada > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
                      <span style={{ color: '#dc3545' }}>Taxa de serviço (2%):</span>
                      <span style={{ color: '#dc3545', fontWeight: 'bold' }}>-{formatarMoeda(taxaCalculada)}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      paddingTop: '10px', 
                      borderTop: '1px solid #ddd',
                      fontWeight: 'bold',
                      fontSize: '15px'
                    }}>
                      <span>Total a debitar:</span>
                      <span>{formatarMoeda((parseFloat(valorTrans) || 0) + taxaCalculada)}</span>
                    </div>
                  </>
                )}

                {taxaCalculada === 0 && parseFloat(valorTrans) >= 100 && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#28a745', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaCheckCircle /> Isento de taxa (promoção especial!)
                  </p>
                )}

                {parseFloat(valorTrans) < 100 && parseFloat(valorTrans) > 0 && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                background: (operacaoLoading || parseFloat(valorTrans) <= 0 || !contaDestino) ? '#ccc' : '#27ae60', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                fontSize: '16px', 
                cursor: (operacaoLoading || parseFloat(valorTrans) <= 0 || !contaDestino) ? 'not-allowed' : 'pointer', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {operacaoLoading ? <><FaSpinner className="spin" /> A processar...</> : <><FaPaperPlane /> Confirmar Transferência</>}
            </button>
          </form>
        )}

        {/* ABA: EXTRATO */}
        {activeTab === 'extrato' && (
          <Extrato clienteId={clienteId} tipoConta={dados?.nome_tipo} />
        )}

      </div>
    </div>
  );
}