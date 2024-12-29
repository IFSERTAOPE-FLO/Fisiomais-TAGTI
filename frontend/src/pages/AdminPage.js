import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import GerenciarUsuarios from "../components/GerenciarUsuarios"; 
import GerenciarServicos from "../components/GerenciarServicos"; 
import GerenciarClinicas from "../components/GerenciarClinicas";
import CriarAgendamento from "./CriarAgendamento";
import VisualizarAgendamentos from "./VisualizarAgendamentos";


const AdminPage = () => {
  const [opcaoSelecionada, setOpcaoSelecionada] = useState("");

  const handleOpcaoChange = (opcao) => {
    setOpcaoSelecionada(opcao);
  };

  return (
    <div className="container-fluid   p-4 bg-light rounded shadow">
      <h1 className="text-center mb-4 cor-pink">Painel do Administrador</h1>

     
      {/* Sub-navbar com Bootstrap */}
  <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4 rounded">
    <div className="container-fluid">
      <ul className="navbar-nav mx-auto">
        <li className="nav-item">
          <a
            href="#"
            className={`nav-link ${opcaoSelecionada === "usuarios" ? "active" : ""}`}
            onClick={() => handleOpcaoChange("usuarios")}
          >
            Gerenciar Usuários
          </a>
        </li>
        <li className="nav-item">
          <a
            href="#"
            className={`nav-link ${opcaoSelecionada === "servicos" ? "active" : ""}`}
            onClick={() => handleOpcaoChange("servicos")}
          >
            Gerenciar Serviços
          </a>
        </li>
        <li className="nav-item">
          <a
            href="#"
            className={`nav-link ${opcaoSelecionada === "clinicas" ? "active" : ""}`}
            onClick={() => handleOpcaoChange("clinicas")}
          >
            Gerenciar Clínicas
          </a>
        </li>
        <li className="nav-item">
          <a
            href="#"
            className={`nav-link ${opcaoSelecionada === "criarAgendamento" ? "active" : ""}`}
            onClick={() => handleOpcaoChange("criarAgendamento")}
          >
            Adicionar Agendamento
          </a>
        </li>
        <li className="nav-item">
          <a
            href="#"
            className={`nav-link ${opcaoSelecionada === "visualizarAgendamentos" ? "active" : ""}`}
            onClick={() => handleOpcaoChange("visualizarAgendamentos")}
          >
            VisualizarAgendamentos
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
</div>
  );
};

export default AdminPage;
