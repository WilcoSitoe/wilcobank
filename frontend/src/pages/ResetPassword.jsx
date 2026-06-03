import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaLock, FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (novaSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    
    try {
      await api.post('/auth/reset-password', { token, novaSenha });
      
      setSuccess(true);
      alert('Senha redefinida com sucesso! Redirecionando para login...');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao redefinir senha. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <FaCheckCircle size={48} color="#22c55e" style={{ marginBottom: '15px' }} />
          <h2 style={{ color: '#22c55e', fontFamily: 'Rockwell' }}>Sucesso!</h2>
          <p style={{ color: '#666' }}>A tua senha foi redefinida. Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'Rockwell', color: '#28283C', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <FaLock color="rgb(70,130,180)" /> Redefinir Senha
        </h2>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '25px' }}>
          Digita a tua nova senha abaixo
        </p>
        
        {error && (
          <div style={{ background: '#fee', color: '#c00', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaExclamationTriangle /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="password"
            placeholder="Nova senha (mín. 6 caracteres)"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
            required
            disabled={loading}
            style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }}
          />
          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmarSenha}
            onChange={e => setConfirmarSenha(e.target.value)}
            required
            disabled={loading}
            style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '12px', 
              background: loading ? '#90a4ae' : 'rgb(70,130,180)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold',
              fontFamily: 'Rockwell',
              fontSize: '14px'
            }}
          >
            {loading ? 'Processando...' : 'Redefinir Senha'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#999' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ background: 'none', border: 'none', color: 'rgb(70,130,180)', cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}
          >
            <FaArrowLeft /> Voltar ao login
          </button>
        </p>
      </div>
    </div>
  );
}