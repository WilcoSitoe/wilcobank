import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FaUniversity, FaUsers, FaChartBar, FaCoins, FaTrash,
  FaSpinner, FaExclamationTriangle, FaArrowUp, FaArrowDown,
  FaFlask, FaSearch, FaFilePdf, FaTimes, FaPlusCircle,
  FaMinusCircle, FaExchangeAlt, FaChartLine, FaMoneyBillWave,
  FaCheckCircle, FaDoorOpen, FaUserShield, FaPercentage,
  FaUserPlus, FaFilter
} from 'react-icons/fa';

export default function Admin() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('clientes');
  const [clientes, setClientes] = useState([]);
  const [relatorios, setRelatorios] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalDeposito, setModalDeposito] = useState({ aberto: false, cliente: null });
  const [valorDeposito, setValorDeposito] = useState('');
  const [operacaoLoading, setOperacaoLoading] = useState(false);
  const [notificacao, setNotificacao] = useState(null);

  // Estados para filtro de transações na aba Relatórios
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCliente, setFiltroCliente] = useState('');

  // Verificar auth
  useEffect(() => {
    const token = localStorage.getItem('token');
    const tipo = localStorage.getItem('tipo');
    if (!token || tipo !== 'admin') {
      navigate('/');
    }
  }, [navigate]);

  // Carregar dados
  useEffect(() => {
    carregarClientes();
    carregarRelatorios();
  }, []);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      setError('');
      // CORREÇÃO: endpoint /clientes em vez de /admin/clientes
      const res = await api.get('/clientes');
      setClientes(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError('Erro ao carregar clientes. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const carregarRelatorios = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      setRelatorios(res.data);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tipo');
    localStorage.removeItem('cliente');
    localStorage.removeItem('wilcobank_user');
    navigate('/');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja eliminar este cliente?')) return;
    try {
      setOperacaoLoading(true);
      // CORREÇÃO: endpoint /clientes/:id em vez de /admin/clientes/:id
      await api.delete(`/clientes/${id}`);
      mostrarNotificacao('Cliente eliminado com sucesso!', 'success');
      carregarClientes();
      carregarRelatorios();
    } catch (err) {
      mostrarNotificacao(err.response?.data?.error || 'Erro ao eliminar cliente', 'error');
    } finally {
      setOperacaoLoading(false);
    }
  };

  const abrirModalDeposito = (cliente) => {
    setModalDeposito({ aberto: true, cliente });
    setValorDeposito('');
  };

  const handleDeposito = async (e) => {
    e.preventDefault();
    if (!valorDeposito || parseFloat(valorDeposito) <= 0) {
      mostrarNotificacao('Digite um valor válido', 'error');
      return;
    }
    try {
      setOperacaoLoading(true);
      // CORREÇÃO: endpoint /clientes/:id/deposito em vez de /admin/deposito
      await api.post(`/clientes/${modalDeposito.cliente.id_cliente}/deposito`, {
        valor: parseFloat(valorDeposito)
      });
      mostrarNotificacao(`Depósito de ${valorDeposito} MT realizado!`, 'success');
      setModalDeposito({ aberto: false, cliente: null });
      setValorDeposito('');
      carregarClientes();
      carregarRelatorios();
    } catch (err) {
      mostrarNotificacao(err.response?.data?.error || 'Erro no depósito', 'error');
    } finally {
      setOperacaoLoading(false);
    }
  };

  const handleTestarJuros = async () => {
    try {
      setOperacaoLoading(true);
      await api.post('/admin/testar-juros');
      mostrarNotificacao('Juros calculados com sucesso!', 'success');
      carregarRelatorios();
      carregarClientes();
    } catch (err) {
      mostrarNotificacao('Erro ao calcular juros', 'error');
    } finally {
      setOperacaoLoading(false);
    }
  };

  const mostrarNotificacao = (msg, tipo) => {
    setNotificacao({ msg, tipo });
    setTimeout(() => setNotificacao(null), 4000);
  };

  // Filtro de transações (aba Relatórios)
  const transacoesFiltradas = relatorios?.transacoesRecentes?.filter(t => {
    if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) return false;
    const termo = filtroCliente.toLowerCase().trim();
    if (!termo) return true;
    return (
      (t.nome_cliente && t.nome_cliente.toLowerCase().includes(termo)) ||
      (t.numero_conta && t.numero_conta.includes(termo))
    );
  }) || [];

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'Deposito': return <FaPlusCircle color="#28a745" />;
      case 'Levantamento': return <FaMinusCircle color="#dc3545" />;
      case 'Transferencia': return <FaExchangeAlt color="#007bff" />;
      case 'Juros': return <FaChartLine color="#9c27b0" />;
      case 'Taxa de Serviço': return <FaMoneyBillWave color="#6c757d" />;
      default: return <FaCoins color="#666" />;
    }
  };

  const exportarPDF = () => {
    if (transacoesFiltradas.length === 0) {
      mostrarNotificacao('Nenhuma transação para exportar', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      mostrarNotificacao('Permita popups para exportar PDF', 'error');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Transações - WilcoBank</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          h1 { color: #1a1a2e; border-bottom: 3px solid #e94560; padding-bottom: 10px; }
          h2 { color: #666; font-size: 16px; margin-top: 30px; }
          .filtros { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 13px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #1a1a2e; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
          tr:nth-child(even) { background: #f9fafb; }
          .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; }
          .total { font-weight: bold; color: #1a1a2e; }
          .badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }
          .badge-deposito { background: #d4edda; color: #155724; }
          .badge-levantamento { background: #f8d7da; color: #721c24; }
          .badge-transferencia { background: #cce5ff; color: #004085; }
          .badge-juros { background: #e2d4f0; color: #4a148c; }
          .badge-taxa { background: #e2e3e5; color: #383d41; }
        </style>
      </head>
      <body>
        <h1><span style="color: #e94560;">●</span> WilcoBank</h1>
        <h2>Relatório de Transações Financeiras</h2>
        <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-MZ')}</p>
        <p><strong>Total de Transações:</strong> ${transacoesFiltradas.length}</p>

        <div class="filtros">
          <strong>Filtros aplicados:</strong> 
          Tipo: ${filtroTipo === 'todos' ? 'Todos' : filtroTipo} | 
          Cliente/Conta: ${filtroCliente || 'Todos'}
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Taxa</th>
            </tr>
          </thead>
          <tbody>
            ${transacoesFiltradas.map(t => {
              let badgeClass = 'badge-taxa';
              if (t.tipo === 'Deposito') badgeClass = 'badge-deposito';
              else if (t.tipo === 'Levantamento') badgeClass = 'badge-levantamento';
              else if (t.tipo === 'Transferencia') badgeClass = 'badge-transferencia';
              else if (t.tipo === 'Juros') badgeClass = 'badge-juros';

              return `
                <tr>
                  <td>#${t.id_operacao}</td>
                  <td>${new Date(t.data_operacao).toLocaleDateString('pt-MZ')} ${new Date(t.data_operacao).toLocaleTimeString('pt-MZ', {hour: '2-digit', minute: '2-digit'})}</td>
                  <td>${t.nome_cliente}</td>
                  <td><span class="badge ${badgeClass}">${t.tipo}</span></td>
                  <td class="total">${t.valor?.toLocaleString('pt-MZ')} MT</td>
                  <td>${t.taxa_cobrada > 0 ? t.taxa_cobrada + ' MT' : '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>WilcoBank - Relatório gerado em ${new Date().toLocaleString('pt-MZ')}</p>
          <p>Este documento é confidencial.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

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
              Painel Administrativo
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/registrar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #059669, #10b981)',
              border: 'none',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(5,150,105,0.3)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(5,150,105,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(5,150,105,0.3)';
            }}
          >
            <FaUserPlus size={14} />
            Cadastrar Cliente
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.08)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '13px'
          }}>
            <FaUserShield color="#e94560" />
            <span>Admin</span>
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

      {/* ===== CONTEÚDO PRINCIPAL ===== */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px' }}>

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

        {/* KPIs */}
        {relatorios && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '28px'
          }}>
            {[
              { label: 'Total Clientes', valor: relatorios.totalClientes, icon: <FaUsers size={22} />, color: '#4f46e5', bg: '#eef2ff' },
              { label: 'Saldo Total', valor: `${relatorios.saldoTotal?.toLocaleString('pt-MZ')} MT`, icon: <FaCoins size={22} />, color: '#059669', bg: '#ecfdf5' },
              { label: 'Depósitos (Mês)', valor: `${relatorios.depositosMes?.toLocaleString('pt-MZ')} MT`, icon: <FaArrowUp size={22} />, color: '#0891b8', bg: '#ecfeff' },
              { label: 'Levantamentos (Mês)', valor: `${relatorios.levantamentosMes?.toLocaleString('pt-MZ')} MT`, icon: <FaArrowDown size={22} />, color: '#dc2626', bg: '#fef2f2' },
              { label: 'Lucro com Taxas', valor: `${relatorios.lucroTaxasMes?.toLocaleString('pt-MZ')} MT`, icon: <FaPercentage size={22} />, color: '#7c3aed', bg: '#f5f3ff' },
              { label: 'Transferências', valor: `${relatorios.transferenciasMes?.toLocaleString('pt-MZ')} MT`, icon: <FaExchangeAlt size={22} />, color: '#ea580c', bg: '#fff7ed' },
            ].map((kpi, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: '14px',
                padding: '22px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: '1px solid #e5e7eb',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>{kpi.label}</span>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: kpi.bg,
                    color: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {kpi.icon}
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
                  {kpi.valor}
                </div>
              </div>
            ))}
          </div>
        )}

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
          width: 'fit-content'
        }}>
          <button
            onClick={() => setAbaAtiva('clientes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              background: abaAtiva === 'clientes' ? '#1a1a2e' : 'transparent',
              color: abaAtiva === 'clientes' ? 'white' : '#6b7280'
            }}
          >
            <FaUsers /> Gestão de Clientes
          </button>
          <button
            onClick={() => setAbaAtiva('relatorios')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              background: abaAtiva === 'relatorios' ? '#1a1a2e' : 'transparent',
              color: abaAtiva === 'relatorios' ? 'white' : '#6b7280'
            }}
          >
            <FaChartBar /> Relatórios Financeiros
          </button>
        </div>

        {/* ABA CLIENTES - SEM BARRA DE PESQUISA */}
        {abaAtiva === 'clientes' && (
          <div style={{
            background: 'white',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaUsers color="#4f46e5" /> Clientes Registrados
              </h2>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
              </span>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '20px',
                color: '#dc2626',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <FaExclamationTriangle />
                {error}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <FaSpinner className="spin" size={32} style={{ marginBottom: '12px' }} />
                <p>A carregar clientes...</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cliente</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conta</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: '#6b7280', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saldo</th>
                      <th style={{ textAlign: 'center', padding: '12px', color: '#6b7280', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((c, idx) => (
                      <tr key={c.id_cliente} style={{
                        borderBottom: '1px solid #f3f4f6',
                        background: idx % 2 === 0 ? 'white' : '#fafafa',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafafa'}
                      >
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '13px'
                            }}>
                              {c.nome_cliente?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#111827' }}>{c.nome_cliente} {c.apelido_cliente}</div>
                              <div style={{ fontSize: '12px', color: '#9ca3af' }}>{c.email_cliente}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 12px', color: '#6b7280', fontFamily: 'monospace', fontSize: '13px' }}>{c.numero_conta || '-'}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: c.tipo_conta === 'Poupanca' ? '#ecfdf5' : '#eef2ff',
                            color: c.tipo_conta === 'Poupanca' ? '#059669' : '#4f46e5'
                          }}>
                            {c.tipo_conta || 'Corrente'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, color: '#111827' }}>
                          {c.saldo?.toLocaleString('pt-MZ')} MT
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => abrirModalDeposito(c)}
                              disabled={operacaoLoading}
                              title="Depositar"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#ecfdf5',
                                color: '#059669',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                              onMouseLeave={e => e.currentTarget.style.background = '#ecfdf5'}
                            >
                              <FaCoins size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id_cliente)}
                              disabled={operacaoLoading}
                              title="Eliminar"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#fef2f2',
                                color: '#dc2626',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                              onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {clientes.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                          <FaUsers size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                          <p>Nenhum cliente registrado</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ABA RELATÓRIOS - COM FILTROS */}
        {abaAtiva === 'relatorios' && (
          <div style={{
            background: 'white',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaChartBar color="#0891b8" /> Transações Recentes
              </h2>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Filtro por tipo de operação */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '6px 12px'
                }}>
                  <FaFilter color="#9ca3af" size={14} />
                  <select
                    value={filtroTipo}
                    onChange={e => setFiltroTipo(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      color: '#374151',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    <option value="todos">Todos os tipos</option>
                    <option value="Deposito">Depósito</option>
                    <option value="Levantamento">Levantamento</option>
                    <option value="Transferencia">Transferência</option>
                    <option value="Juros">Juros</option>
                    <option value="Taxa de Serviço">Taxa de Serviço</option>
                  </select>
                </div>

                {/* Filtro por cliente/conta */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  minWidth: '220px'
                }}>
                  <FaSearch color="#9ca3af" size={14} />
                  <input
                    type="text"
                    placeholder="Nome do cliente ou conta..."
                    value={filtroCliente}
                    onChange={e => setFiltroCliente(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '13px',
                      width: '100%',
                      fontFamily: 'inherit'
                    }}
                  />
                  {filtroCliente && (
                    <button 
                      onClick={() => setFiltroCliente('')} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <FaTimes color="#9ca3af" size={12} />
                    </button>
                  )}
                </div>

                {/* Botão Exportar PDF */}
                <button
                  onClick={exportarPDF}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#dc2626',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#dc2626';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#fef2f2';
                    e.currentTarget.style.color = '#dc2626';
                  }}
                >
                  <FaFilePdf /> Exportar PDF
                </button>

                <button
                  onClick={handleTestarJuros}
                  disabled={operacaoLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    opacity: operacaoLoading ? 0.6 : 1
                  }}
                >
                  {operacaoLoading ? <FaSpinner className="spin" /> : <FaFlask />}
                  Testar Juros Automáticos
                </button>
              </div>
            </div>

            {/* Info de filtros aplicados */}
            {(filtroTipo !== 'todos' || filtroCliente) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                padding: '8px 14px',
                background: '#eff6ff',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#1e40af'
              }}>
                <FaFilter size={12} />
                <span>Filtros: </span>
                {filtroTipo !== 'todos' && (
                  <span style={{
                    padding: '2px 8px',
                    background: '#dbeafe',
                    borderRadius: '12px',
                    fontWeight: 600
                  }}>
                    Tipo: {filtroTipo}
                  </span>
                )}
                {filtroCliente && (
                  <span style={{
                    padding: '2px 8px',
                    background: '#dbeafe',
                    borderRadius: '12px',
                    fontWeight: 600
                  }}>
                    Cliente/Conta: "{filtroCliente}"
                  </span>
                )}
                <span style={{ marginLeft: 'auto', color: '#6b7280' }}>
                  {transacoesFiltradas.length} resultado(s)
                </span>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <FaSpinner className="spin" size={32} style={{ marginBottom: '12px' }} />
                <p>A carregar relatórios...</p>
              </div>
            ) : transacoesFiltradas.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cliente</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: '#6b7280', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: '#6b7280', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Taxa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacoesFiltradas.map((t, idx) => (
                      <tr key={t.id_operacao} style={{
                        borderBottom: '1px solid #f3f4f6',
                        background: idx % 2 === 0 ? 'white' : '#fafafa'
                      }}>
                        <td style={{ padding: '14px 12px', color: '#6b7280', fontSize: '13px' }}>
                          {new Date(t.data_operacao).toLocaleDateString('pt-MZ')}
                        </td>
                        <td style={{ padding: '14px 12px', fontWeight: 500, color: '#111827' }}>{t.nome_cliente}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: t.tipo === 'Deposito' ? '#ecfdf5' :
                                       t.tipo === 'Levantamento' ? '#fef2f2' :
                                       t.tipo === 'Transferencia' ? '#eff6ff' :
                                       t.tipo === 'Juros' ? '#faf5ff' : '#f3f4f6',
                            color: t.tipo === 'Deposito' ? '#059669' :
                                   t.tipo === 'Levantamento' ? '#dc2626' :
                                   t.tipo === 'Transferencia' ? '#2563eb' :
                                   t.tipo === 'Juros' ? '#7c3aed' : '#4b5563'
                          }}>
                            {getTipoIcon(t.tipo)} {t.tipo}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, color: '#111827' }}>
                          {t.valor?.toLocaleString('pt-MZ')} MT
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right', color: '#6b7280', fontSize: '13px' }}>
                          {t.taxa_cobrada > 0 ? `${t.taxa_cobrada} MT` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                <FaChartBar size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p>Nenhuma transação encontrada com os filtros aplicados</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL DEPÓSITO */}
      {modalDeposito.aberto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'modalIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaCoins color="#059669" /> Depósito para {modalDeposito.cliente?.nome_cliente}
              </h3>
              <button
                onClick={() => setModalDeposito({ aberto: false, cliente: null })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <FaTimes color="#9ca3af" size={20} />
              </button>
            </div>
            <form onSubmit={handleDeposito}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Valor (MT)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={valorDeposito}
                onChange={e => setValorDeposito(e.target.value)}
                required
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
                  outline: 'none'
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
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: operacaoLoading ? 0.7 : 1
                }}
              >
                {operacaoLoading ? <FaSpinner className="spin" /> : <FaCheckCircle />}
                {operacaoLoading ? 'A processar...' : 'Confirmar Depósito'}
              </button>
            </form>
          </div>
        </div>
      )}

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
          <p style={{ color: '#4b5563', fontWeight: 500, fontSize: '16px' }}>A processar operação...</p>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes modalIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
