import { useNavigate } from 'react-router-dom';
import {
  FaUniversity,
  FaPhone,
  FaWhatsapp,
  FaEnvelope,
  FaClock,
  FaArrowLeft,
  FaUser,
  FaHeadset
} from 'react-icons/fa';

export default function Suporte() {
  const navigate = useNavigate();

  // CONFIGURAÇÃO: Dados de contacto do Admin
  const adminContact = {
    nome: 'Administrador Wilco',
    telefone: '+258 843991992', // ← ALTERE PARA O NÚMERO REAL
    email: 'admin@wilcobank.com',
    horario: 'Seg-Sex: 08:00 - 18:00'
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      fontFamily: 'Segoe UI',
      background: '#f5f5f5'
    }}>
      {/* Lado Esquerdo - Informação */}
      <div style={{ 
        width: '50%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '40px',
        background: 'white',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          background: 'rgb(40,40,60)', 
          color: 'white', 
          padding: '15px 30px', 
          borderRadius: '50px',
          marginBottom: '30px',
          fontFamily: 'Rockwell',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FaUniversity /> WilcoBank
        </div>

        <h2 style={{ 
          fontFamily: 'Rockwell', 
          color: 'rgb(40,40,60)', 
          fontSize: '26px',
          textAlign: 'center',
          marginBottom: '10px'
        }}>
          Registo de Novos Clientes
        </h2>

        <p style={{ 
          color: 'rgb(100,100,120)', 
          textAlign: 'center', 
          maxWidth: '400px',
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          Por medidas de segurança, o registo de novas contas é realizado exclusivamente pela nossa equipa de suporte.
        </p>

        {/* Card de Contacto */}
        <div style={{ 
          width: '100%', 
          maxWidth: '400px', 
          background: '#f9f9f9', 
          padding: '25px', 
          borderRadius: '12px',
          border: '2px solid rgb(40,40,60)',
          marginBottom: '30px'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            color: 'rgb(40,40,60)', 
            fontFamily: 'Rockwell',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaHeadset /> Contacte-nos para apoio
          </h3>

          <div style={{ marginBottom: '15px' }}>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaUser size={12} /> <strong>Responsável:</strong>
            </p>
            <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold', color: 'rgb(40,40,60)' }}>
              {adminContact.nome}
            </p>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaPhone size={12} /> <strong>Telefone / WhatsApp:</strong>
            </p>
            <a 
              href={`https://wa.me/${adminContact.telefone.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                margin: '5px 0', 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#25D366', 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FaWhatsapp /> {adminContact.telefone}
            </a>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaEnvelope size={12} /> <strong>Email:</strong>
            </p>
            <a 
              href={`mailto:${adminContact.email}`}
              style={{ 
                margin: '5px 0', 
                fontSize: '15px', 
                color: 'rgb(70,130,180)', 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FaEnvelope size={14} /> {adminContact.email}
            </a>
          </div>

          <div>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaClock size={12} /> <strong>Horário de Atendimento:</strong>
            </p>
            <p style={{ margin: '5px 0', fontSize: '15px', fontWeight: '500', color: 'rgb(40,40,60)' }}>
              {adminContact.horario}
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          style={{ 
            padding: '12px 40px', 
            background: 'rgb(70,130,180)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontFamily: 'Rockwell',
            fontSize: '14px',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgb(50,100,150)'}
          onMouseOut={(e) => e.target.style.background = 'rgb(70,130,180)'}
        >
          <FaArrowLeft /> Voltar ao Login
        </button>
      </div>

      {/* Lado Direito - Branding */}
      <div style={{ 
        width: '50%', 
        background: 'rgb(40,40,60)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Efeito decorativo */}
        <div style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          top: '20%',
          right: '10%'
        }} />
        <div style={{
          position: 'absolute',
          width: '150px',
          height: '150px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          bottom: '15%',
          left: '15%'
        }} />

        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <h1 style={{ color: 'white', fontFamily: 'Rockwell', fontSize: '52px', margin: '0 0 15px 0' }}>
            WBank
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', fontStyle: 'italic' }}>
            Confiança e Credibilidade
          </p>
        </div>
      </div>
    </div>
  );
}