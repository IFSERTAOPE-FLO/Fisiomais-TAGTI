import React, { useState, useEffect } from 'react';
import '../css/AdminPage.css';
import "bootstrap/dist/css/bootstrap.min.css";
import GerenciarPagamentos from "./GerenciarPagamentos";
import CalendarioInterativo from "./CalendarioInterativo";
import VisualizarAgendamentos from "./VisualizarAgendamentos";
import CriarAgendamento from "./CriarAgendamento";
import MinhasAulasCliente from "../components/pilates/usuariocliente/MinhasAulasCliente";
import Dashboard from "./Dashboard";

const ClientPage = () => {
  const savedRole = localStorage.getItem("role");

  // Recupera a opção selecionada do localStorage
  const savedOpcao = localStorage.getItem("opcaoSelecionada") || "dashboard";

  const [opcaoSelecionada, setOpcaoSelecionada] = useState(savedOpcao);

  useEffect(() => {
    localStorage.setItem("opcaoSelecionada", opcaoSelecionada);
  }, [opcaoSelecionada]);

  const handleOpcaoChange = (opcao) => {
    setOpcaoSelecionada(opcao);
  };

  return (
    <div className="container-fluid p-4 bg-light rounded shadow">
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
                href="#pagamentos"
                className={`nav-link ${opcaoSelecionada === "pagamentos" ? "active" : ""}`}
                onClick={() => handleOpcaoChange("pagamentos")}
              >
                <i className="bi bi-wallet2"></i> Pagamentos
              </a>
            </li>

            <li className="nav-item dropdown">
              <a
                className={`nav-link dropdown-toggle ${opcaoSelecionada.startsWith("agendamento") ? "active" : ""}`}
                href="#"
                id="agendamentoDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-calendar-check"></i> Agendamentos
              </a>
              <ul className="dropdown-menu dropdownAgendamentos" aria-labelledby="agendamentoDropdown">
                <li>
                  <a
                    className={`dropdown-item ${opcaoSelecionada === "criarAgendamento" ? "active" : ""}`}
                    href="#criarAgendamento"
                    onClick={() => handleOpcaoChange("criarAgendamento")}
                  >
                    <i className="bi bi-calendar-plus"></i> Novo Agendamento
                  </a>
                </li>
                <li>
                  <a
                    className={`dropdown-item ${opcaoSelecionada === "visualizarAgendamentos" ? "active" : ""}`}
                    href="#visualizarAgendamentos"
                    onClick={() => handleOpcaoChange("visualizarAgendamentos")}
                  >
                    <i className="bi bi-calendar-check"></i> Meus Agendamentos
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

            <li className="nav-item">
              <a
                className={`nav-link ${opcaoSelecionada === "minhasAulas" ? "active" : ""}`}
                href="#minhas-aulas-pilates"
                onClick={() => handleOpcaoChange("minhasAulas")}
              >
                <i className="bi bi-heart-pulse"></i> Minhas Aulas
              </a>
            </li>

          </ul>
        </div>
      </nav>

      {/* Renderização dos componentes */}
      {opcaoSelecionada === "dashboard" && <Dashboard />}
      {opcaoSelecionada === "pagamentos" && <GerenciarPagamentos />}
      {opcaoSelecionada === "criarAgendamento" && <CriarAgendamento />}
      {opcaoSelecionada === "visualizarAgendamentos" && <VisualizarAgendamentos />}
      {opcaoSelecionada === "CalendarioInterativo" && <CalendarioInterativo />}
      {opcaoSelecionada === "minhasAulas" && <MinhasAulasCliente />}

    </div>
  );
};

export default ClientPage;