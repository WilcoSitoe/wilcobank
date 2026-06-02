import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Extrato({ clienteId, tipoConta }) {
  const [transacoes, setTransacoes] = useState([]);
  const [status, setStatus] = useState('loading');
  const [debugInfo, setDebugInfo] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  // ✅ Estados do filtro simplificado
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroValor, setFiltroValor] = useState('');

  console.log('🔍 [EXTRATO] Renderizado - clienteId:', clienteId);

  useEffect(() => {
    if (!clienteId) {
      console.error('❌ [EXTRATO] clienteId é nulo ou undefined');
      setStatus('error');
      setDebugInfo('❌ clienteId não fornecido');
      return;
    }

    console.log('🔄 [EXTRATO] Iniciando carregamento para cliente:', clienteId);
    setStatus('loading');

    const url = `/clientes/${clienteId}/extrato`;
    console.log('📡 [EXTRATO] Fazendo request:', url);

    api.get(url)
      .then(res => {
        console.log('✅ [EXTRATO] Response recebido:', res.data);
        console.log('📊 [EXTRATO] Número de transações:', res.data?.length);
        if (res.data && res.data.length > 0) {
          console.log('📋 [EXTRATO] Primeira transação:', res.data[0]);
        }
        setTransacoes(res.data);
        setStatus('success');
        setDebugInfo(`✅ ${res.data.length} transações carregadas`);
      })
      .catch(err => {
        console.error('❌ [EXTRATO] Erro na requisição:', err);
        console.error('❌ [EXTRATO] Response:', err.response?.data);
        console.error('❌ [EXTRATO] Status:', err.response?.status);
        setStatus('error');
        setDebugInfo(`❌ ${err.message} - ${err.response?.status || 'Sem resposta'}`);
      });
  }, [clienteId]);

  const formatarMoeda = (val) => 
    new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val || 0);

  // ✅ Aplicar filtros simplificados
  const transacoesFiltradas = transacoes.filter(t => {
    // Filtro por tipo
    if (filtroTipo && t.tipo !== filtroTipo) return false;

    // Filtro por valor (igual ou maior que o digitado)
    if (filtroValor && t.valor < parseFloat(filtroValor)) return false;

    return true;
  });

  const limparFiltros = () => {
    setFiltroTipo('');
    setFiltroValor('');
  };

  // 🔹 Função de Exportação (apenas PDF)
  const exportarExtrato = (formato) => {
    if (!clienteId) {
      alert('❌ Erro: Cliente não identificado');
      return;
    }

    setExportLoading(true);

    const data_inicio = ''; 
    const data_fim = '';

    const url = `/extrato/${clienteId}/export?format=${formato}&data_inicio=${data_inicio}&data_fim=${data_fim}`;

    console.log(`📤 [EXPORT] Solicitando PDF: ${api.defaults.baseURL}${url}`);

    const downloadUrl = `${api.defaults.baseURL}${url}`;
    const newWindow = window.open(downloadUrl, '_blank');

    setTimeout(() => {
      setExportLoading(false);
      if (newWindow && !newWindow.closed) {
        alert(`✅ A gerar extrato PDF...\n\n💡 Se o download não iniciar, verifica se os popups estão bloqueados.`);
      } else {
        alert(`⚠️ Popup bloqueado!\n\nPermite popups para ${window.location.origin} e tenta novamente.`);
      }
    }, 1500);
  };

  // Debug visual sempre visível (útil em desenvolvimento)
  return (
    <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' }}>

      {/* 🔧 Debug Box */}
      <div style={{ background: 'white', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '2px solid #ddd' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🔧 Debug do Extrato</h4>
        <p style={{ margin: '5px 0' }}>
          <strong>Cliente ID:</strong> {clienteId || '❌ undefined'}
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Status:</strong> {status}
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Transações:</strong> {Array.isArray(transacoes) ? transacoes.length : '❌ não é array'}
        </p>
        <p style={{ margin: '5px 0', color: status === 'error' ? '#c00' : '#666' }}>
          <strong>Info:</strong> {debugInfo || 'Carregando...'}
        </p>
      </div>

      {/* ✅ PAINEL DE FILTROS SIMPLIFICADO */}
      {status === 'success' && transacoes.length > 0 && (
        <div style={{ 
          background: 'white', 
          padding: '15px', 
          borderRadius: '6px', 
          marginBottom: '15px', 
          border: '2px solid #ddd' 
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '13px' }}>🔍 Filtrar Transações</h4>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Tipo */}
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '4px' }}>Tipo</label>
              <select 
                value={filtroTipo} 
                onChange={(e) => setFiltroTipo(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', fontFamily: 'monospace' }}
              >
                <option value="">Todos</option>
                <option value="Deposito">Depósito</option>
                <option value="Levantamento">Levantamento</option>
                <option value="Transferencia">Transferência</option>
                <option value="Juros">Juros</option>
                <option value="Taxa de Serviço">Taxa de Serviço</option>
              </select>
            </div>

            {/* Valor (um campo só) */}
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '4px' }}>Valor mín. (MT)</label>
              <input 
                type="number" 
                value={filtroValor} 
                onChange={(e) => setFiltroValor(e.target.value)}
                placeholder="Digite o valor..."
                min="0"
                step="0.01"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', fontFamily: 'monospace' }}
              />
            </div>

            {/* Botão limpar */}
            <div>
              <button 
                onClick={limparFiltros}
                style={{ 
                  padding: '8px 16px', 
                  background: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}
              >
                ✕ Limpar
              </button>
            </div>
          </div>

          <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#666' }}>
            📊 Mostrando <strong>{transacoesFiltradas.length}</strong> de <strong>{transacoes.length}</strong> transações
            {(filtroTipo || filtroValor) && (
              <span> (filtros ativos)</span>
            )}
          </p>
        </div>
      )}

      {/* 📤 Botão de Exportação PDF */}
      {status === 'success' && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>

          <div style={{ display: 'flex', gap: '8px', marginRight: 'auto' }}>
            {['todos', 'deposito', 'levantamento', 'transferencia'].map(f => (
              <button
                key={f}
                onClick={() => {}} 
                style={{
                  padding: '6px 12px',
                  background: '#eee',
                  color: '#333',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  textTransform: 'capitalize'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', background: '#ddd', height: '24px', margin: '0 8px' }} />

          <button 
            onClick={() => exportarExtrato('pdf')}
            disabled={exportLoading || transacoes.length === 0}
            style={{ 
              padding: '10px 20px', 
              background: exportLoading ? '#999' : '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '20px', 
              cursor: exportLoading ? 'not-allowed' : 'pointer', 
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s',
              boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)'
            }}
            title="Exportar extrato em PDF (formato profissional)"
          >
            {exportLoading ? '⏳ A gerar...' : '📄 Exportar PDF'}
          </button>
        </div>
      )}

      {/* Estado: Carregando */}
      {status === 'loading' && (
        <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
          <p style={{ fontSize: '18px' }}>🔄 Carregando extrato...</p>
          <p style={{ fontSize: '12px' }}>Aguardando resposta da API...</p>
        </div>
      )}

      {/* Estado: Erro */}
      {status === 'error' && (
        <div style={{ background: '#fee', border: '2px solid #fcc', borderRadius: '8px', padding: '20px', color: '#c00' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>❌ Erro ao carregar extrato</p>
          <p style={{ margin: 0, fontFamily: 'monospace' }}>{debugInfo}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '15px', padding: '8px 16px', background: '#c00', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            🔄 Recarregar Página
          </button>
        </div>
      )}

      {/* Estado: Sem transações */}
      {status === 'success' && transacoesFiltradas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p style={{ fontSize: '48px', margin: '0 0 10px 0' }}>📭</p>
          <p style={{ margin: 0, fontWeight: '500' }}>Nenhuma transação encontrada</p>
          {(filtroTipo || filtroValor) && (
            <p style={{ margin: '10px 0 0 0', fontSize: '13px' }}>
              Tente ajustar os filtros ou clique em "Limpar"
            </p>
          )}
          {!filtroTipo && !filtroValor && (
            <p style={{ margin: '10px 0 0 0', fontSize: '13px' }}>
              As operações realizadas aparecerão aqui
            </p>
          )}
        </div>
      )}

      {/* Estado: Sucesso com dados - Tabela */}
      {status === 'success' && transacoesFiltradas.length > 0 && (
        <div>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
            ✅ {transacoesFiltradas.length} transações encontradas
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px' }}>Data</th>
                  <th style={{ padding: '10px' }}>Tipo</th>
                  <th style={{ padding: '10px' }}>Valor</th>
                  <th style={{ padding: '10px' }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {transacoesFiltradas.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #eee', background: 'white' }}>
                    <td style={{ padding: '10px', color: '#555', fontSize: '13px' }}>{t.data}</td>
                    <td style={{ padding: '10px', fontSize: '13px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {t.tipo === 'Deposito' && '🟢'}
                        {t.tipo === 'Levantamento' && '🔴'}
                        {t.tipo === 'Transferencia' && '🔵'} 
                        {t.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '13px', color: t.tipo === 'Levantamento' ? '#dc3545' : '#28a745' }}>
                      {t.tipo === 'Levantamento' ? '-' : '+'}{formatarMoeda(t.valor)}
                    </td>
                    <td style={{ padding: '10px', color: '#1e3c72', fontWeight: '500', fontSize: '13px' }}>
                      {formatarMoeda(t.saldo_apos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#999', marginTop: '15px' }}>
            📋 A mostrar {transacoesFiltradas.length} transações • Última atualização: {new Date().toLocaleTimeString('pt-AO')}
          </p>
        </div>
      )}
    </div>
  );
}