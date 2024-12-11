//npm install jwt-decode
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar"; // Importa o componente Navbar
import "./App.css";
import Footer from "./components/Footer";



// Páginas
import Home from "./pages/Home";
import AddColaborador from "./pages/AddColaborador";
import AddCliente from './pages/AddCliente'; 
import CriarAgendamento from "./pages/CriarAgendamento";
import Contato from "./pages/Contato";
import SobreNos from "./pages/SobreNos";
import Cadastro from "./pages/Cadastro";
import Perfil from "./pages/Perfil";
import VisualizarAgendamentos from "./pages/VisualizarAgendamentos";
import AdminPage from "./pages/AdminPage"; 



function App() {
  return (
    <Router>
      <div>
        <Navbar /> {/* Navbar separada */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/addcolaborador" element={<AddColaborador />} />
          <Route path="/addcliente" element={<AddCliente />} />
          <Route path="/criaragendamento" element={<CriarAgendamento />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/sobrenos" element={<SobreNos />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/perfil" element={<Perfil />} />     
          <Route path="/visualizaragendamentos" element={<VisualizarAgendamentos />} />           
          <Route path="/adminPage" element={<AdminPage />} /> 
          
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;