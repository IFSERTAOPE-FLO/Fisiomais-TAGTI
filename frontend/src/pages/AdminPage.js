import React, { useState, useEffect} from 'react';
import '../css/AdminPage.css';
import "bootstrap/dist/css/bootstrap.min.css";
import GerenciarUsuarios from "../components/GerenciarUsuarios";
import GerenciarServicos from "../components/GerenciarServicos";
import GerenciarClinicas from "../components/GerenciarClinicas";
import CriarAgendamento from "./CriarAgendamento";
import VisualizarAgendamentos from "./VisualizarAgendamentos";
import Dashboard from "./Dashboard";



const AdminPage = () => {
  const savedRole = localStorage.getItem("role");
  
  // Recupera a opção selecionada do localStorage, se existir
  const savedOpcao = localStorage.getItem("opcaoSelecionada") || "dashboard";
  
  const [opcaoSelecionada, setOpcaoSelecionada] = useState(savedOpcao);

  useEffect(() => {
    // Salva a opção selecionada no localStorage sempre que mudar
    localStorage.setItem("opcaoSelecionada", opcaoSelecionada);
  }, [opcaoSelecionada]);

  const handleOpcaoChange = (opcao) => {
    setOpcaoSelecionada(opcao);
  };
  return (
    
    <div className="container-fluid   p-4 bg-light rounded shadow">
       {/* Sub-navbar com Bootstrap */}
<nav className="navbar navbar-expand-lg navbar-light bg-subnavbar mb-4 rounded">
  <div className="container-fluid">
    <ul className="navbar-nav mx-auto">
    <li className="nav-item">
        <a
          href="#dashboard"
          className={`nav-link ${opcaoSelecionada === "dashboard" ? "active" : ""}`}
          onClick={() => handleOpcaoChange("dashboard")}
        >
          Dashboard
        </a>
      </li>
      <li className="nav-item">
        <a
          href="#usuarios"
          className={`nav-link ${opcaoSelecionada === "usuarios" ? "active" : ""}`}
          onClick={() => handleOpcaoChange("usuarios")}
        >
          Gerenciar Usuários
        </a>
      </li>
      <li className="nav-item">
        <a
          href="#servicos"
          className={`nav-link ${opcaoSelecionada === "servicos" ? "active" : ""}`}
          onClick={() => handleOpcaoChange("servicos")}
        >
          Gerenciar Serviços
        </a>
      </li>
      <li className="nav-item">
        <a
          href="#clinicas"
          className={`nav-link ${opcaoSelecionada === "clinicas" ? "active" : ""}`}
          onClick={() => handleOpcaoChange("clinicas")}
        >
          Gerenciar Clínicas
        </a>
      </li>
      <li className="nav-item">
        <a
          href="#criarAgendamento"
          className={`nav-link ${opcaoSelecionada === "criarAgendamento" ? "active" : ""}`}
          onClick={() => handleOpcaoChange("criarAgendamento")}
        >
          Adicionar Agendamento
        </a>
      </li>
      <li className="nav-item z-bot">
        <a
          href="#visualizarAgendamentos"
          className={`nav-link ${opcaoSelecionada === "visualizarAgendamentos" ? "active" : ""}`}
          onClick={() => handleOpcaoChange("visualizarAgendamentos")}
        >
          Visualizar Agendamentos
        </a>
      </li>
      
      
    </ul>
  </div>
</nav>



    


      {/* Conteúdo baseado na opção selecionada */}
      {opcaoSelecionada === "usuarios" && <GerenciarUsuarios />}
      {opcaoSelecionada === "servicos" && <GerenciarServicos />}
      {opcaoSelecionada === "clinicas" && <GerenciarClinicas />}
      {opcaoSelecionada === "criarAgendamento" && <CriarAgendamento />}
      {opcaoSelecionada === "visualizarAgendamentos" && <VisualizarAgendamentos />}
      {opcaoSelecionada === "dashboard" && <Dashboard />}
      </div>
  );
};

export default AdminPage;
