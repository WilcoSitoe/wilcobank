import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecover, setShowRecover] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await api.post('/auth/login', { email, senha });
      const { id, tipoConta, nome, conta, token, role } = res.data;
      
      localStorage.setItem('wilcobank_user', JSON.stringify({ id, nome, conta, tipoConta, token, role }));
      
      alert(`Bem-vindo, ${nome}!`);
      
      // ✅ REDIRECIONAMENTO: Admin vai para /admin
      if (tipoConta === 'admin' || role === 'admin') {
        navigate('/admin');
      } else {
        // Normaliza o tipo de conta para comparação (remove cedilhas, lowercase)
        const tipoNormalizado = tipoConta?.toLowerCase().replace(/ç/g, 'c').replace(/ã/g, 'a');
        
        if (tipoNormalizado === 'poupanca' || tipoConta === '2' || tipoConta === 2) {
          // ✅ Redireciona para a tela de Poupança
          navigate('/poupanca', { 
            state: { id_cliente: id, nome, conta, tipoConta } 
          });
        } else {
          // ✅ Redireciona para a tela padrão (Conta Corrente)
          navigate('/dashboard', { 
            state: { id_cliente: id, nome, conta, tipoConta } 
          });
        }
      }
    } catch (err) {
      console.error('Erro no login:', err);
      alert('❌ ' + (err.response?.data?.error || 'Email ou senha incorretos!'));
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverPassword = async (e) => {
    e.preventDefault();
    setRecoverLoading(true);
    
    try {
      const res = await api.post('/auth/forgot-password', { email: recoverEmail });
      
      alert(`✅ ${res.data.message}\n\n💡 Dica: Verifica a tua caixa de entrada para o link de recuperação.`);
      
      setShowRecover(false);
      setRecoverEmail('');
    } catch (err) {
      console.error('Erro na recuperação:', err);
      alert('❌ ' + (err.response?.data?.error || 'Erro ao solicitar recuperação. Tenta novamente.'));
    } finally {
      setRecoverLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Segoe UI', position: 'relative' }}>
      <div style={{ 
        width: '50%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: 'white' 
      }}>
        <h2 style={{ fontFamily: 'Rockwell', color: 'rgb(40,40,60)', fontSize: '28px' }}>
          WilcoBank
        </h2>
        <p style={{ color: 'rgb(100,100,120)', fontStyle: 'italic' }}>
          Confiança e Credibilidade
        </p>
        
        <form onSubmit={handleLogin} style={{ width: '350px', marginTop: '30px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '25px', color: 'rgb(40,40,60)' }}>
            Acesse sua conta
          </h3>
          
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '13px' }}>
              Email:
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              required
              disabled={loading || showRecover}
              style={{ 
                width: '100%', 
                padding: '10px 14px', 
                borderRadius: '6px', 
                border: '1px solid #ccc',
                fontSize: '15px',
                opacity: (loading || showRecover) ? 0.7 : 1
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '13px' }}>
              Senha:
            </label>
            <input 
              type="password" 
              value={senha} 
              onChange={e => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              required
              disabled={loading || showRecover}
              style={{ 
                width: '100%', 
                padding: '10px 14px', 
                borderRadius: '6px', 
                border: '1px solid #ccc',
                fontSize: '15px',
                opacity: (loading || showRecover) ? 0.7 : 1
              }}
            />
          </div>
          
          {/* Link Recuperar Senha */}
          <div style={{ marginBottom: '20px', textAlign: 'right' }}>
            <button 
              type="button"
              onClick={() => setShowRecover(true)}
              disabled={loading}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'rgb(70,130,180)', 
                cursor: 'pointer', 
                fontSize: '13px',
                textDecoration: 'underline',
                padding: 0,
                fontFamily: 'inherit'
              }}
            >
              Esqueceu a senha?
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || showRecover}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: (loading || showRecover) ? '#90a4ae' : 'rgb(70,130,180)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: (loading || showRecover) ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold',
              fontSize: '14px',
              fontFamily: 'Rockwell',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <p style={{ marginTop: '20px', fontSize: '13px', color: '#666' }}>
          Não tem conta?{' '}
          <button 
            onClick={() => navigate('/suporte')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'rgb(70,130,180)', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              fontSize: '13px',
              textDecoration: 'none',
              padding: 0,
              fontFamily: 'inherit'
            }}
          >
            Contacte-nos para registo
          </button>
        </p>
      </div>
      
      <div style={{ 
        width: '50%', 
        background: 'rgb(40,40,60)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <h1 style={{ color: 'white', fontFamily: 'Rockwell', fontSize: '48px' }}>
          WBank
        </h1>
      </div>

      {/* 🔐 Modal de Recuperar Senha */}
      {showRecover && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            {/* Botão Fechar */}
            <button 
              onClick={() => { setShowRecover(false); setRecoverEmail(''); }}
              disabled={recoverLoading}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: '#f1f1f1',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>

            <h3 style={{ 
              margin: '0 0 10px 0', 
              fontFamily: 'Rockwell', 
              color: 'rgb(40,40,60)',
              fontSize: '20px'
            }}>
              🔐 Recuperar Senha
            </h3>
            <p style={{ 
              color: '#666', 
              fontSize: '14px', 
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              Digite o email cadastrado e enviaremos instruções para redefinir sua senha.
            </p>
            
            <form onSubmit={handleRecoverPassword}>
              <input 
                type="email" 
                value={recoverEmail}
                onChange={(e) => setRecoverEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={recoverLoading}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  marginBottom: '15px', 
                  borderRadius: '6px', 
                  border: '1px solid #ccc',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
              
              <button 
                type="submit"
                disabled={recoverLoading}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: recoverLoading ? '#90a4ae' : 'rgb(70,130,180)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: recoverLoading ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold',
                  fontSize: '14px',
                  fontFamily: 'Rockwell',
                  transition: 'background 0.2s'
                }}
              >
                {recoverLoading ? 'Enviando...' : 'Enviar Instruções'}
              </button>
            </form>
            
            <p style={{ 
              marginTop: '15px', 
              fontSize: '12px', 
              color: '#999', 
              textAlign: 'center' 
            }}>
              💡 Verifica a tua caixa de entrada (e spam) para o link de recuperação.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}