import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Registrar() {
  const [form, setForm] = useState({
    nome: '', 
    apelido: '', 
    email: '', 
    bi: '', 
    sexo: 'Masculino',
    senha: '', 
    numero_conta: '', 
    tipo: '1'
  });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    
    // Validar apenas números para o campo numero_conta
    if (id === 'numero_conta' && !/^\d*$/.test(value)) {
      return; // Ignora caracteres não numéricos
    }
    
    // Limitar BI a 14 caracteres (formato angolano)
    if (id === 'bi' && value.length > 14) {
      return;
    }
    
    setForm({ ...form, [id]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações adicionais
    if (!form.nome || !form.apelido || !form.email || !form.bi || !form.senha || !form.numero_conta) {
      alert('⚠️ Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    if (form.numero_conta.length < 4) {
      alert('⚠️ Número da conta deve ter pelo menos 4 dígitos');
      return;
    }
    
    if (form.senha.length < 6) {
      alert('⚠️ A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (!/^\d+$/.test(form.numero_conta)) {
      alert('⚠️ Número da conta deve conter apenas dígitos');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await api.post('/auth/register', form);
      alert('✅ Cliente cadastrado com sucesso!\nID: ' + res.data.id_cliente + '\nConta: ' + res.data.numero_conta);
      navigate('/admin');
    } catch (err) {
      console.error('Erro detalhado:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Erro desconhecido';
      alert('❌ Erro ao cadastrar: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '40px auto', 
      padding: '30px', 
      background: 'white', 
      borderRadius: '8px', 
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        color: 'rgb(40,40,60)', 
        fontFamily: 'Rockwell',
        marginBottom: '10px'
      }}>
        Registrar Cliente e Conta
      </h2>
      <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
        Preencha os dados abaixo para criar um novo cliente
      </p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <fieldset style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '6px' }}>
          <legend style={{ fontWeight: 'bold', color: 'rgb(40,40,60)' }}>Dados do Cliente</legend>
          
          <input 
            id="nome" 
            placeholder="Nome *" 
            value={form.nome}
            onChange={handleChange} 
            required 
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
          />
          
          <input 
            id="apelido" 
            placeholder="Apelido *" 
            value={form.apelido}
            onChange={handleChange} 
            required 
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
          />
          
          <input 
            id="email" 
            type="email" 
            placeholder="Email *" 
            value={form.email}
            onChange={handleChange} 
            required 
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
          />
          
          <input 
            id="bi" 
            placeholder="Número do BI *" 
            value={form.bi}
            onChange={handleChange} 
            required 
            maxLength="14"
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
          />
          <small style={{ color: '#666', display: 'block', marginBottom: '10px' }}>Ex: 001234567LA001</small>
          
          <select 
            id="sexo" 
            value={form.sexo}
            onChange={handleChange} 
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          >
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
          
          <input 
            id="senha" 
            type="password" 
            placeholder="Senha (mín. 6 caracteres) *" 
            value={form.senha}
            onChange={handleChange} 
            required 
            minLength="6"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
          />
        </fieldset>

        <fieldset style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '6px' }}>
          <legend style={{ fontWeight: 'bold', color: 'rgb(40,40,60)' }}>Dados da Conta</legend>
          
          <input 
            id="numero_conta" 
            placeholder="Número da Conta (apenas números) *" 
            value={form.numero_conta}
            onChange={handleChange} 
            required 
            minLength="4"
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
          />
          
          <select 
            id="tipo" 
            value={form.tipo}
            onChange={handleChange} 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          >
            <option value="1">Conta Corrente</option>
            <option value="2">Conta Poupança</option>
          </select>
        </fieldset>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '12px 30px', 
              background: loading ? '#90EE90' : 'rgb(34,139,34)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/admin')} 
            style={{ 
              padding: '12px 30px', 
              background: 'rgb(180,70,70)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              fontWeight: 'bold' 
            }}
          >
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}