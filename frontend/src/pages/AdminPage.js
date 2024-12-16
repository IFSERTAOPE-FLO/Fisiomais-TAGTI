import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import GerenciarUsuarios from "../components/GerenciarUsuarios"; // Importando o componente de Gerenciar Usuários
import GerenciarServicos from "../components/GerenciarServicos"; // Importando o componente de Gerenciar Serviços

const AdminPage = () => {
  const [opcaoSelecionada, setOpcaoSelecionada] = useState("");

  const handleOpcaoChange = (opcao) => {
    setOpcaoSelecionada(opcao);
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4 text-primary">Painel do Administrador</h1>

      {/* Escolha de Opção */}
      <div className="row mb-4">
        <div className="col-12 text-center">
          <button
            className="btn btn-login mx-2"
            onClick={() => handleOpcaoChange("usuarios")}
          >
            Gerenciar Usuários
          </button>
          <button
            className="btn btn-signup mx-2"
            onClick={() => handleOpcaoChange("servicos")}
          >
            Gerenciar Serviços
          </button>
        </div>
      </div>

      {/* Conteúdo baseado na opção selecionada */}
      {opcaoSelecionada === "usuarios" && <GerenciarUsuarios />}
      {opcaoSelecionada === "servicos" && <GerenciarServicos />}
    </div>
  );
};

export default AdminPage;
