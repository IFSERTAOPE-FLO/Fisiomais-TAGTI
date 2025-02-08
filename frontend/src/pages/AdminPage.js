import React, { useState, useEffect } from 'react';
import '../css/AdminPage.css';
import "bootstrap/dist/css/bootstrap.min.css";
import GerenciarUsuarios from "../components/GerenciarUsuarios";
import GerenciarServicos from "../components/GerenciarServicos";
import GerenciarClinicas from "../components/GerenciarClinicas";
import CriarAgendamento from "./CriarAgendamento";
import VisualizarAgendamentos from "./VisualizarAgendamentos";
import CalendarioInterativo from "./CalendarioInterativo";
import Dashboard from "./Dashboard";
import GerenciarPagamentos from "./GerenciarPagamentos";
import GerenciarAulasPilates from "../components/pilates/usuariocolaborador/GerenciarAulasPilates";  // Importação do novo componente
import PlanosTratamento from "../components/planosTratamento/PlanosTratamento";  // Importação do novo componente

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
    <div className="container-fluid p-4 bg-light rounded shadow">
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
                <i className="bi bi-house-door"></i> Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#usuarios"
                className={`nav-link ${opcaoSelecionada === "usuarios" ? "active" : ""}`}
                onClick={() => handleOpcaoChange("usuarios")}
              >
                <i className="bi bi-person-lines-fill"></i> Gerenciar Usuários
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#servicos"
                className={`nav-link ${opcaoSelecionada === "servicos" ? "active" : ""}`}
                onClick={() => handleOpcaoChange("servicos")}
              >
                <i className="bi bi-person-bounding-box"></i> Gerenciar Serviços
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#clinicas"
                className={`nav-link ${opcaoSelecionada === "clinicas" ? "active" : ""}`}
                onClick={() => handleOpcaoChange("clinicas")}
              >
                <i className="bi bi-hospital"></i> Gerenciar Clínicas
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#gerenciarPagamentos"
                className={`nav-link ${opcaoSelecionada === "gerenciarPagamentos" ? "active" : ""}`}
                onClick={() => handleOpcaoChange("gerenciarPagamentos")}
              >
                <i className="bi bi-wallet2"></i> Gerenciar Pagamentos
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#planosTratamento"
                className={`nav-link ${opcaoSelecionada === "planosTratamento" ? "active" : ""}`}
                onClick={() => handleOpcaoChange("planosTratamento")}
              >
                <i className=""></i> Planos de Tratamento
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#aulasPilates"
                className={`nav-link ${opcaoSelecionada === "aulasPilates" ? "active" : ""}`}
                onClick={() => handleOpcaoChange("aulasPilates")}
              >
                <i className="bi bi-calendar-day"></i> Gerenciar Aulas de Pilates
              </a>
            </li>
            <li className="nav-item dropdown">
              <a
                className={`nav-link dropdown-toggle ${opcaoSelecionada === "criarAgendamento" || opcaoSelecionada === "visualizarAgendamentos" || opcaoSelecionada === "CalendarioInterativo" ? "active" : ""}`}
                href="#"
                id="agendamentoDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-calendar-check"></i> Agendamentos
              </a>
              <ul className="dropdown-menu dropdownAgendamentos" aria-labelledby="agendamentoDropdown">
                <li className="agendamentoDropdown">
                  <a
                    className={`dropdown-item ${opcaoSelecionada === "criarAgendamento" ? "active" : ""}`}
                    href="#criarAgendamento"
                    onClick={() => handleOpcaoChange("criarAgendamento")}
                  >
                    <i className="bi bi-calendar-plus"></i> Agendar
                  </a>
                </li>
                <li>
                  <a
                    className={`dropdown-item ${opcaoSelecionada === "visualizarAgendamentos" ? "active" : ""}`}
                    href="#visualizarAgendamentos"
                    onClick={() => handleOpcaoChange("visualizarAgendamentos")}
                  >
                    <i className="bi bi-calendar-check"></i> Lista
                  </a>
                </li>
                <li>
                  <a
                    className={`dropdown-item ${opcaoSelecionada === "CalendarioInterativo" ? "active" : ""}`}
                    href="#CalendarioAgendamentos"
                    onClick={() => handleOpcaoChange("CalendarioInterativo")}
                  >
                    <i className="bi bi-calendar-event"></i> Calendário 
                  </a>
                </li>
              </ul>
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
      {opcaoSelecionada === "CalendarioInterativo" && <CalendarioInterativo />}
      {opcaoSelecionada === "dashboard" && <Dashboard />}
      {opcaoSelecionada === "gerenciarPagamentos" && <GerenciarPagamentos />}
      {opcaoSelecionada === "aulasPilates" && <GerenciarAulasPilates />}  {/* Nova renderização */}
      {opcaoSelecionada === "planosTratamento" && <PlanosTratamento />}  {/* Nova renderização */}
    </div>
  );
};

export default AdminPage;
