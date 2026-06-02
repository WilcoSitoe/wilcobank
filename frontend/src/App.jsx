import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Registrar from './pages/Registrar'; //importa a pagina de registro 
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard'
import Suporte from './pages/Suporte';
import './App.css';
import ResetPassword from './pages/ResetPassword'; 
import Poupanca from './pages/Poupanca';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/registrar" element={<Registrar />} /> {/* Rota para a página de registro */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/suporte" element={<Suporte />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} /> {/* Rota para a página de reset de senha */}
        <Route path="/poupanca" element={<Poupanca />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;