import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FaUniversity,
  FaUsers,
  FaChartBar,
  FaCoins,
  FaTrash,
  FaSpinner,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaFlask,
  FaSearch,
  FaFilePdf,
  FaTimes,
  FaPlusCircle,
  FaMinusCircle,
  FaExchangeAlt,
  FaChartLine,
  FaMoneyBillWave
} from 'react-icons/fa';

export default function Admin() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('wilcobank_user'));
    if (!user || user.role !== 'admin') {
      alert('Acesso negado!');
      navigate('/login');
    }
  }, [navigate]);

  // Estados para Gestão de Clientes
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [depositModal, setDepositModal] = useState(null);
  const [depositValue, setDepositValue] = useState('');

  // Estados para Relatórios
  const [relatorios, setRelatorios] = useState(null);
  const [loadingRelatorios, setLoadingRelatorios] = useState(true);
  const [jurosTestLoading, setJurosTestLoading] = useState(false);

  // Estados para Pesquisa e Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTransacoes, setFilteredTransacoes] = useState([]);

  // Aba ativa: 'clientes' | 'relatorios'
  const [activeTab, setActiveTab] = useState('clientes');

  useEffect(() => {
    if (activeTab === 'clientes') carregarClientes();
    if (activeTab === 'relatorios') carregarRelatorios();
  }, [activeTab]);

  // Filtrar transações quando searchTerm ou relatorios mudam
  useEffect(() => {
    if (relatorios?.transacoesRecentes) {
      if (!searchTerm.trim()) {
        setFilteredTransacoes(relatorios.transacoesRecentes);
      } else {
        const termo = searchTerm.toLowerCase();
        const filtradas = relatorios.transacoesRecentes.filter(t => 
          t.nome_cliente?.toLowerCase().includes(termo) ||
          t.id_cliente?.toString().includes(termo) ||
          t.numero_conta?.includes(termo) ||
          t.tipo?.toLowerCase().includes(termo)
        );
        setFilteredTransacoes(filtradas);
      }
    }
  }, [searchTerm, relatorios]);

  // Carregar lista de clientes
  const carregarClientes = async () => {
    try {
      const res = await api.get('/clientes');
      setClientes(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setLoadingClientes(false);
    }
  };

  // Carregar relatórios financeiros
  const carregarRelatorios = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setRelatorios(res.data);
      setFilteredTransacoes(res.data.transacoesRecentes || []);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    } finally {
      setLoadingRelatorios(false);
    }
  };

  // Função para testar cálculo de juros automáticos
  const handleTestarJuros = async () => {
    if (!window.confirm('Executar cálculo de juros AGORA?\n\nIsto creditará 0.5% em todas as contas Poupança com saldo >= 1.000 MT.\n\nEsta ação é irreversível.')) {
      return;
    }

    setJurosTestLoading(true);
    try {
      const res = await api.post('/admin/testar-juros');
      alert(`${res.data.message}\n\nVerifica o terminal do backend para ver o resumo detalhado.`);
      if (activeTab === 'relatorios') carregarRelatorios();
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message));
    } finally {
      setJurosTestLoading(false);
    }
  };

  // Função para exportar PDF - COMPATÍVEL COM jspdf-autotable@5.x (MZN)
  const handleExportarPDF = () => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(16);
    doc.setTextColor(30, 30, 60);
    doc.text('WilcoBank - Relatório de Transações', 14, 20);

    // Data de geração (pt-MZ)
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-MZ')}`, 14, 30);

    // Filtro aplicado
    if (searchTerm.trim()) {
      doc.text(`Filtro aplicado: "${searchTerm}"`, 14, 38);
      doc.text(`Total de resultados: ${filteredTransacoes.length}`, 140, 38);
    } else {
      doc.text(`Total de transações: ${filteredTransacoes.length}`, 14, 38);
    }

    // Preparar dados para a tabela
    const tableData = filteredTransacoes.map(t => {
      // Mostrar taxa se existir
      const valorComTaxa = t.taxa_cobrada > 0 
        ? `${t.valor.toFixed(2)} MT (+${t.taxa_cobrada.toFixed(2)} MT taxa)`
        : `${t.valor.toFixed(2)} MT`;

      return [
        new Date(t.data_operacao).toLocaleString('pt-MZ'),
        t.tipo || 'Outro',
        t.nome_cliente || 'N/A',
        valorComTaxa,
        t.numero_conta || 'N/A'
      ];
    });

    // Criar tabela com autoTable
    autoTable(doc, {
      startY: 45,
      head: [['Data/Hora', 'Tipo', 'Cliente', 'Valor', 'Conta']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [30, 30, 60],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 50 },
        3: { cellWidth: 45, halign: 'right' },
        4: { cellWidth: 35 }
      },
      didParseCell: (data) => {
        // Colorir valores positivos/negativos
        if (data.section === 'body' && data.column.index === 3) {
          const raw = data.cell.raw;
          if (raw.includes('-') || raw.includes('taxa')) {
            data.cell.styles.textColor = [220, 53, 69]; // Vermelho para taxas/levantamentos
          } else {
            data.cell.styles.textColor = [40, 167, 69]; // Verde para depósitos
          }
        }
      }
    });

    // Rodapé com paginação
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
      doc.text('© 2026 WilcoBank - Todos os direitos reservados', 140, doc.internal.pageSize.height - 10);
    }

    // Salvar PDF
    const filename = `transacoes_wilcobank_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(filename);
  };

  // Formatador de moeda MZN (Metical)
  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined) return '0,00 MT';
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(valor);
  };

  // Eliminar cliente
  const handleDelete = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja eliminar o cliente "${nome}"?\nEsta ação é irreversível.`)) return;
    try {
      await api.delete(`/clientes/${id}`);
      setClientes(prev => prev.filter(c => c.id_cliente !== id));
      alert('Cliente eliminado com sucesso!');
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message));
    }
  };

  // Fazer depósito
  const handleDeposit = async (e) => {
    e.preventDefault();
    const valor = parseFloat(depositValue);
    if (!valor || valor <= 0) { alert('Insira um valor válido'); return; }
    try {
      const res = await api.post(`/clientes/${depositModal.id_cliente}/deposito`, { valor });
      alert(`Depósito de ${formatarMoeda(valor)} realizado!`);
      setDepositModal(null);
      setDepositValue('');
      carregarClientes();
      if (activeTab === 'relatorios') carregarRelatorios();
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message));
    }
  };

  // Componente Card para KPIs
  const KpiCard = ({ titulo, valor, cor, icone }) => (
    <div style={{ 
      background: 'white', padding: '20px', borderRadius: '12px', 
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: `4px solid ${cor}`,
      display: 'flex', alignItems: 'center', gap: '15px'
    }}>
      <span style={{ fontSize: '28px', display: 'flex', alignItems: 'center', color: cor }}>{icone}</span>
      <div>
        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666', textTransform: 'uppercase' }}>{titulo}</p>
        <h3 style={{ margin: 0, color: cor, fontFamily: 'Rockwell', fontSize: '22px' }}>{valor}</h3>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Segoe UI' }}>

      {/* Header */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px',
        background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <h1 style={{ fontFamily: 'Rockwell', color: '#28283C', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaUniversity color="#1e3c72" /> WilcoBank Admin
        </h1>
        <button onClick={() => navigate('/')} style={{ 
          padding: '10px 20px', background: '#f44336', color: 'white', 
          border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' 
        }}>
          Sair
        </button>
      </div>

      {/* Abas de Navegação */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('clientes')} style={{ 
          flex: 1, padding: '12px', 
          background: activeTab === 'clientes' ? '#1e3c72' : '#eee', 
          color: activeTab === 'clientes' ? 'white' : '#333', 
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}>
          <FaUsers /> Gestão de Clientes
        </button>
        <button onClick={() => setActiveTab('relatorios')} style={{ 
          flex: 1, padding: '12px', 
          background: activeTab === 'relatorios' ? '#1e3c72' : '#eee', 
          color: activeTab === 'relatorios' ? 'white' : '#333', 
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}>
          <FaChartBar /> Relatórios Financeiros
        </button>
      </div>

      {/* CONTEÚDO: Aba Clientes */}
      {activeTab === 'clientes' && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ fontFamily: 'Rockwell', color: '#28283C', margin: 0 }}>Lista de Clientes</h2>
            <button onClick={() => navigate('/registrar')} style={{ 
              padding: '8px 16px', background: '#28a745', color: 'white', 
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' 
            }}>
              + Novo Cliente
            </button>
          </div>

          {loadingClientes ? (
            <p style={{ textAlign: 'center', padding: '30px' }}>Carregando clientes...</p>
          ) : clientes.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Nenhum cliente cadastrado.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px' }}>Nome</th>
                    <th style={{ padding: '12px' }}>Conta</th>
                    <th style={{ padding: '12px' }}>Tipo</th>
                    <th style={{ padding: '12px' }}>Saldo</th>
                    <th style={{ padding: '12px' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c, i) => (
                    <tr key={c.id_cliente} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>#{c.id_cliente}</td>
                      <td style={{ padding: '12px' }}>{c.nome_cliente} {c.apelido_cliente}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>{c.numero_conta || '---'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: c.tipo_conta === 'Corrente' ? '#e3f2fd' : '#fff3e0', color: c.tipo_conta === 'Corrente' ? '#1976d2' : '#e65100', fontSize: '12px', fontWeight: 'bold' }}>
                          {c.tipo_conta || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: c.saldo > 0 ? '#28a745' : '#666', fontWeight: 'bold' }}>
                        {formatarMoeda(c.saldo)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#555' }}>{c.email_cliente}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => setDepositModal({ id_cliente: c.id_cliente, nome: c.nome_cliente, numero_conta: c.numero_conta })} style={{ padding: '6px 12px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaCoins /> Depósito
                          </button>
                          <button onClick={() => handleDelete(c.id_cliente, `${c.nome_cliente} ${c.apelido_cliente}`)} style={{ padding: '6px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaTrash /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO: Aba Relatórios */}
      {activeTab === 'relatorios' && (
        <div>
          {loadingRelatorios ? (
            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <FaSpinner className="spin" /> Carregando relatórios...
              </p>
            </div>
          ) : !relatorios ? (
            <div style={{ background: '#fee', padding: '20px', borderRadius: '12px', color: '#c00', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaExclamationTriangle /> Erro ao carregar relatórios. Verifica se a rota `/api/admin/dashboard` está configurada no backend.
            </div>
          ) : (
            <>
              {/* KPIs - COM NOVO CARD DE LUCRO COM TAXAS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                <KpiCard titulo="Total Clientes" valor={relatorios.totalClientes} cor="#1e3c72" icone={<FaUsers />} />
                <KpiCard titulo="Saldo Total Banco" valor={formatarMoeda(relatorios.saldoTotal)} cor="#2a5298" icone={<FaUniversity />} />
                <KpiCard titulo="Depósitos (Mês)" valor={formatarMoeda(relatorios.depositosMes)} cor="#28a745" icone={<FaArrowUp />} />
                <KpiCard titulo="Levantamentos (Mês)" valor={formatarMoeda(relatorios.levantamentosMes)} cor="#dc3545" icone={<FaArrowDown />} />

                {/* NOVO: Lucro com Taxas de Transferência */}
                <KpiCard 
                  titulo="Lucro com Taxas (Mês)" 
                  valor={formatarMoeda(relatorios.lucroTaxasMes || 0)} 
                  cor="#9c27b0" 
                  icone={<FaCoins />} 
                />
              </div>

              {/* Botão de Teste de Juros Automáticos */}
              <div style={{ 
                background: '#f3e5f5', 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '25px', 
                borderLeft: '4px solid #9c27b0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#6a1b9a', fontFamily: 'Rockwell', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaFlask /> Testar Juros Automáticos
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                    Executa manualmente o cálculo de 0.5% para todas as contas Poupança elegíveis.
                  </p>
                </div>
                <button 
                  onClick={handleTestarJuros}
                  disabled={jurosTestLoading}
                  style={{ 
                    padding: '10px 20px', 
                    background: jurosTestLoading ? '#ccc' : '#9c27b0', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: jurosTestLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.2s'
                  }}
                >
                  {jurosTestLoading ? <><FaSpinner className="spin" /> A processar...</> : <><FaCoins /> Testar Juros Agora</>}
                </button>
              </div>

              {/* CAMPO DE PESQUISA E BOTÃO PDF */}
              <div style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '12px', 
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                    <input
                      type="text"
                      placeholder="Pesquisar por nome, ID ou número de conta..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 40px',
                        borderRadius: '8px',
                        border: '2px solid #ddd',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                  <button
                    onClick={handleExportarPDF}
                    disabled={filteredTransacoes.length === 0}
                    style={{
                      padding: '12px 24px',
                      background: filteredTransacoes.length === 0 ? '#ccc' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: filteredTransacoes.length === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <FaFilePdf /> Exportar PDF
                  </button>
                  {searchTerm && (
                    <button
                      onClick={() => { setSearchTerm(''); setFilteredTransacoes(relatorios.transacoesRecentes || []); }}
                      style={{
                        padding: '12px 20px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <FaTimes /> Limpar
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '13px', color: '#666' }}>
                  {searchTerm ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaChartBar /> <strong>{filteredTransacoes.length}</strong> resultado(s) encontrado(s) para "<strong>{searchTerm}</strong>"
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaChartBar /> A mostrar <strong>{filteredTransacoes.length}</strong> transação(ões)
                    </span>
                  )}
                </div>
              </div>

              {/* Tabela de Transações Recentes */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#28283C', fontFamily: 'Rockwell', marginBottom: '15px' }}>
                  Últimas Transações
                </h3>

                {filteredTransacoes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p style={{ fontSize: '48px', margin: '0 0 10px 0', display: 'flex', justifyContent: 'center' }}>
                      <FaSearch size={48} />
                    </p>
                    <p style={{ margin: 0, fontWeight: '500' }}>Nenhuma transação encontrada</p>
                    {searchTerm && (
                      <p style={{ margin: '10px 0 0 0', fontSize: '13px' }}>
                        Tente pesquisar com outros termos ou limpe o filtro
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: '12px' }}>Data</th>
                          <th style={{ padding: '12px' }}>Tipo</th>
                          <th style={{ padding: '12px' }}>Cliente</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransacoes.map((t, i) => (
                          <tr key={t.id_operacao || i} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '12px', color: '#555', fontSize: '14px' }}>
                              {new Date(t.data_operacao).toLocaleString('pt-MZ')}
                            </td>
                            <td style={{ padding: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {t.tipo === 'Deposito' && <FaPlusCircle color="#28a745" />}
                              {t.tipo === 'Levantamento' && <FaMinusCircle color="#dc3545" />}
                              {t.tipo === 'Transferencia' && <FaExchangeAlt color="#007bff" />}
                              {t.tipo === 'Juros' && <FaChartLine color="#9c27b0" />}
                              {t.tipo === 'Taxa de Serviço' && <FaMoneyBillWave color="#6c757d" />}
                              {t.tipo || 'Outro'}
                            </td>
                            <td style={{ padding: '12px', fontWeight: '500', fontSize: '14px' }}>
                              {t.nome_cliente || 'N/A'}
                            </td>
                            <td style={{ 
                              padding: '12px', 
                              textAlign: 'right', 
                              fontWeight: 'bold', 
                              fontSize: '14px',
                              color: t.tipo === 'Levantamento' || t.tipo === 'Taxa de Serviço' ? '#dc3545' : '#28a745'
                            }}>
                              {t.valor?.toFixed(2)} MT
                              {t.taxa_cobrada > 0 && (
                                <span style={{ display: 'block', fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
                                  +{t.taxa_cobrada.toFixed(2)} MT taxa
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal de Depósito */}
      {depositModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontFamily: 'Rockwell', color: '#28283C', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaCoins color="#9c27b0" /> Depositar em {depositModal.nome}
            </h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
              Conta: <strong>{depositModal.numero_conta}</strong>
            </p>
            <form onSubmit={handleDeposit}>
              <input
                type="number" step="0.01" min="0.01"
                placeholder="Valor do depósito (MT)"
                value={depositValue}
                onChange={(e) => setDepositValue(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '15px' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Confirmar
                </button>
                <button type="button" onClick={() => { setDepositModal(null); setDepositValue(''); }} style={{ flex: 1, padding: '12px', background: '#ccc', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}