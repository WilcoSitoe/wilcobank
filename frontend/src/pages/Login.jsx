import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaLock, FaLightbulb, FaTimes, FaUniversity, FaUser, FaKey, FaArrowRight, FaEnvelope, FaHeadset } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecover, setShowRecover] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [notificacao, setNotificacao] = useState(null);

  const navigate = useNavigate();

  const mostrarNotificacao = (msg, tipo) => {
    setNotificacao({ msg, tipo });
    setTimeout(() => setNotificacao(null), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, senha });
      const { id, tipoConta, nome, conta, token, role } = res.data;

      localStorage.setItem('wilcobank_user', JSON.stringify({ id, nome, conta, tipoConta, token, role }));

      mostrarNotificacao(`Bem-vindo, ${nome}!`, 'success');

      if (tipoConta === 'admin' || role === 'admin') {
        navigate('/admin');
      } else {
        const tipoNormalizado = tipoConta?.toLowerCase().replace(/ç/g, 'c').replace(/ã/g, 'a');

        if (tipoNormalizado === 'poupanca' || tipoConta === '2' || tipoConta === 2) {
          navigate('/poupanca', { state: { id_cliente: id, nome, conta, tipoConta } });
        } else {
          navigate('/dashboard', { state: { id_cliente: id, nome, conta, tipoConta } });
        }
      }
    } catch (err) {
      console.error('Erro no login:', err);
      mostrarNotificacao('Email ou senha incorretos!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverPassword = async (e) => {
    e.preventDefault();
    setRecoverLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: recoverEmail });
      mostrarNotificacao(`${res.data.message} Verifica a tua caixa de entrada.`, 'success');
      setShowRecover(false);
      setRecoverEmail('');
    } catch (err) {
      console.error('Erro na recuperação:', err);
      mostrarNotificacao('Erro ao solicitar recuperação. Tenta novamente.', 'error');
    } finally {
      setRecoverLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Segoe UI, sans-serif', position: 'relative', overflow: 'hidden' }}>

      {/* Notificação */}
      {notificacao && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          padding: '14px 22px',
          borderRadius: '10px',
          color: 'white',
          fontWeight: 500,
          fontSize: '14px',
          zIndex: 5000,
          animation: 'slideIn 0.3s ease',
          background: notificacao.tipo === 'success' ? '#28a745' : '#dc3545',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {notificacao.tipo === 'success' ? <FaArrowRight /> : <FaTimes />}
          {notificacao.msg}
        </div>
      )}

      {/* ===== LADO ESQUERDO - LOGIN ===== */}
      <div style={{ 
        width: '50%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: '#f8fafc',
        padding: '40px',
        position: 'relative'
      }}>
        {/* Logo no topo */}
        <div style={{ 
          position: 'absolute', 
          top: '32px', 
          left: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #e94560 0%, #ff6b6b 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaUniversity size={18} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '18px', color: '#1a1a2e' }}>WilcoBank</span>
        </div>

        <div style={{ width: '380px', maxWidth: '100%' }}>
          {/* Título */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '28px', 
              fontWeight: 700, 
              color: '#1e293b',
              letterSpacing: '-0.5px'
            }}>
              Bem-vindo de volta
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
              Entre na sua conta para aceder ao WilcoBank
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email - label alinhado à esquerda */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontWeight: 600, 
                marginBottom: '8px', 
                fontSize: '14px',
                color: '#374151',
                textAlign: 'left'
              }}>
                <FaEnvelope style={{ marginRight: '6px', color: '#6b7280', fontSize: '12px' }} />
                Email
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
                  padding: '12px 14px', 
                  borderRadius: '10px', 
                  border: '1px solid #d1d5db',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                  opacity: (loading || showRecover) ? 0.7 : 1
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#4f46e5';
                  e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Senha - label alinhado à esquerda */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ 
                display: 'block', 
                fontWeight: 600, 
                marginBottom: '8px', 
                fontSize: '14px',
                color: '#374151',
                textAlign: 'left'
              }}>
                <FaKey style={{ marginRight: '6px', color: '#6b7280', fontSize: '12px' }} />
                Senha
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
                  padding: '12px 14px', 
                  borderRadius: '10px', 
                  border: '1px solid #d1d5db',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                  opacity: (loading || showRecover) ? 0.7 : 1
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#4f46e5';
                  e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Link Recuperar Senha - alinhado à direita */}
            <div style={{ marginBottom: '24px', textAlign: 'right' }}>
              <button 
                type="button"
                onClick={() => setShowRecover(true)}
                disabled={loading}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#4f46e5', 
                  cursor: 'pointer', 
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: 0,
                  fontFamily: 'inherit',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#4338ca'}
                onMouseLeave={e => e.currentTarget.style.color = '#4f46e5'}
              >
                Esqueceu a senha?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading || showRecover}
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: (loading || showRecover) ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '10px', 
                cursor: (loading || showRecover) ? 'not-allowed' : 'pointer', 
                fontWeight: 600,
                fontSize: '15px',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: (loading || showRecover) ? 'none' : '0 4px 14px rgba(79,70,229,0.35)'
              }}
              onMouseEnter={e => {
                if (!loading && !showRecover) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.35)';
              }}
            >
              {loading ? 'Entrando...' : <><FaLock size={14} /> Entrar</>}
            </button>
          </form>

          <p style={{ marginTop: '24px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
            Não tem conta?{' '}
            <button 
              onClick={() => navigate('/suporte')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#4f46e5', 
                cursor: 'pointer', 
                fontWeight: 600,
                fontSize: '14px',
                padding: 0,
                fontFamily: 'inherit'
              }}
            >
              Contacte-nos para registo
            </button>
          </p>
        </div>
      </div>

      {/* ===== LADO DIREITO - HERO ===== */}
      <div style={{ 
        width: '50%', 
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Círculos decorativos */}
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(233,69,96,0.1)',
          top: '-80px',
          right: '-80px'
        }} />
        <div style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(79,70,229,0.1)',
          bottom: '60px',
          left: '-60px'
        }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #e94560 0%, #ff6b6b 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 30px rgba(233,69,96,0.3)'
          }}>
            <FaUniversity size={36} color="white" />
          </div>

          <h1 style={{ 
            color: 'white', 
            fontSize: '42px', 
            fontWeight: 700,
            margin: '0 0 12px 0',
            letterSpacing: '-0.5px'
          }}>
            WilcoBank
          </h1>
          <p style={{ 
            color: '#a0aec0', 
            fontSize: '18px',
            margin: '0 0 40px 0',
            fontStyle: 'italic'
          }}>
            Confiança e Credibilidade
          </p>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            alignItems: 'center'
          }}>
            {[
              { icon: <FaLock size={16} />, text: 'Segurança garantida' },
              { icon: <FaUniversity size={16} />, text: 'Operações bancárias 24/7' },
              { icon: <FaHeadset size={16} />, text: 'Suporte dedicado' }
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#cbd5e1',
                fontSize: '15px',
                background: 'rgba(255,255,255,0.05)',
                padding: '10px 20px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <span style={{ color: '#e94560' }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MODAL RECUPERAR SENHA ===== */}
      {showRecover && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 4000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            position: 'relative',
            animation: 'modalIn 0.3s ease'
          }}>
            {/* Botão Fechar */}
            <button 
              onClick={() => { setShowRecover(false); setRecoverEmail(''); }}
              disabled={recoverLoading}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
            >
              <FaTimes size={14} color="#6b7280" />
            </button>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '20px',
                fontWeight: 700,
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <FaLock color="#4f46e5" /> Recuperar Senha
              </h3>
              <p style={{ 
                color: '#64748b', 
                fontSize: '14px', 
                margin: 0,
                lineHeight: '1.5'
              }}>
                Digite o email cadastrado e enviaremos instruções para redefinir sua senha.
              </p>
            </div>

            <form onSubmit={handleRecoverPassword}>
              <label style={{ 
                display: 'block', 
                fontWeight: 600, 
                marginBottom: '8px', 
                fontSize: '14px',
                color: '#374151',
                textAlign: 'left'
              }}>
                <FaEnvelope style={{ marginRight: '6px', color: '#6b7280', fontSize: '12px' }} />
                Email
              </label>
              <input 
                type="email" 
                value={recoverEmail}
                onChange={(e) => setRecoverEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={recoverLoading}
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  marginBottom: '20px',
                  borderRadius: '10px', 
                  border: '1px solid #d1d5db',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                  opacity: recoverLoading ? 0.7 : 1
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#4f46e5';
                  e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />

              <button 
                type="submit"
                disabled={recoverLoading}
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  background: recoverLoading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '10px', 
                  cursor: recoverLoading ? 'not-allowed' : 'pointer', 
                  fontWeight: 600,
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {recoverLoading ? 'Enviando...' : <><FaArrowRight size={14} /> Enviar Instruções</>}
              </button>
            </form>

            <p style={{ 
              marginTop: '16px', 
              fontSize: '13px', 
              color: '#9ca3af', 
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <FaLightbulb size={12} /> Verifica a tua caixa de entrada (e spam) para o link.
            </p>
          </div>
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