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
import Profile from "./pages/Profile";
import VisualizarDados from "./pages/VisualizarDados";



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
          <Route path="/profile" element={<Profile />} />     
          <Route path="/VisualizarDados" element={<VisualizarDados />} />  
          
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;