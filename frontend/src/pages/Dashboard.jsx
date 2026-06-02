import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Extrato from '../components/Extrato';

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
  
  // ✅ Estado para taxa de transferência calculada
  const [taxaCalculada, setTaxaCalculada] = useState(0);

  useEffect(() => {
    if (!clienteId) {
      alert('Sessão expirada. Faça login novamente.');
      navigate('/');
      return;
    }
    carregarDados();
  }, [clienteId, navigate]);

  // ✅ Efeito para recalcular taxa quando o valor da transferência muda
  useEffect(() => {
    if (valorTrans && !isNaN(parseFloat(valorTrans))) {
      setTaxaCalculada(calcularTaxa(parseFloat(valorTrans)));
    } else {
      setTaxaCalculada(0);
    }
  }, [valorTrans]);

  // ✅ Função para calcular taxa (mesma lógica do backend)
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

  const handleLevantamento = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/clientes/${clienteId}/levantamento`, { valor: parseFloat(valorLev) });
      alert(`✅ Sucesso! Saldo atual: ${formatarMoeda(res.data.novo_saldo)}`);
      setValorLev('');
      carregarDados();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  const handleTransferencia = async (e) => {
    e.preventDefault();
    
    const valor = parseFloat(valorTrans);
    const totalComTaxa = valor + taxaCalculada;
    
    // ✅ Validar saldo incluindo a taxa
    if (totalComTaxa > dados.saldo) {
      alert(`❌ Saldo insuficiente. Necessitas de ${formatarMoeda(totalComTaxa)} (valor: ${formatarMoeda(valor)} + taxa: ${formatarMoeda(taxaCalculada)})`);
      return;
    }
    
    try {
      const res = await api.post(`/clientes/${clienteId}/transferencia`, { 
        valor: valor, 
        conta_destino: contaDestino 
      });
      
      // ✅ Mostrar resumo com taxa no alerta de sucesso
      alert(`✅ Transferência realizada!\n\n📤 Valor enviado: ${formatarMoeda(valor)}\n💸 Taxa de serviço: ${formatarMoeda(res.data.taxa_cobrada || 0)}\n💰 Total debitado: ${formatarMoeda(res.data.valor_total_debitado || totalComTaxa)}\n🏦 Novo saldo: ${formatarMoeda(res.data.novo_saldo)}`);
      
      setContaDestino('');
      setValorTrans('');
      setTaxaCalculada(0);
      carregarDados();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  // ✅ Formatador de moeda MZN (Metical)
  const formatarMoeda = (val) => 
    new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val || 0);

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Carregando...</p>;
  if (!dados) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Erro ao carregar dados.</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
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
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
      }}>
        <p style={{ margin: 0, opacity: 0.8 }}>Saldo Disponível</p>
        <h1 style={{ margin: '10px 0 0 0', fontSize: '2.5rem' }}>{formatarMoeda(dados.saldo)}</h1>
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
          border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' 
        }}>
          📜 Extrato
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

        {/* ABA: LEVANTAMENTO */}
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
              style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }}
            />
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>
              Confirmar Levantamento
            </button>
          </form>
        )}

        {/* ABA: TRANSFERÊNCIA — COM RESUMO DE TAXA EM TEMPO REAL */}
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
              color: '#1565c0'
            }}>
              💡 Transferências só podem ser realizadas entre contas correntes. É cobrada uma taxa de 2% para valores ≥ 100 MT (máx. 500 MT).
            </div>
            
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Número da Conta Destino</label>
            <input 
              type="text" 
              value={contaDestino} 
              onChange={(e) => setContaDestino(e.target.value)} 
              placeholder="Ex: 123456789 (apenas Conta Corrente)" 
              required 
              style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }}
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
              style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }}
            />
            
            {/* ✅ RESUMO DA TRANSFERÊNCIA COM TAXA */}
            {parseFloat(valorTrans) > 0 && (
              <div style={{ 
                background: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid #dee2e6'
              }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>💰 Resumo da Transferência</p>
                
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
                  <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#28a745', fontStyle: 'italic' }}>
                    ✅ Isento de taxa (promoção especial!)
                  </p>
                )}
                
                {parseFloat(valorTrans) < 100 && parseFloat(valorTrans) > 0 && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                    💡 Transferências abaixo de 100 MT não têm taxa.
                  </p>
                )}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={parseFloat(valorTrans) <= 0 || !contaDestino}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: (parseFloat(valorTrans) <= 0 || !contaDestino) ? '#ccc' : '#27ae60', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                fontSize: '16px', 
                cursor: (parseFloat(valorTrans) <= 0 || !contaDestino) ? 'not-allowed' : 'pointer', 
                fontWeight: 'bold' 
              }}
            >
              {(parseFloat(valorTrans) <= 0 || !contaDestino) ? 'Preencha todos os campos' : 'Confirmar Transferência'}
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