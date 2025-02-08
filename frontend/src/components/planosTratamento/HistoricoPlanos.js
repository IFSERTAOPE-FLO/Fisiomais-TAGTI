import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import CriarPlanoTratamento from "./CriarPlanoTratamento"; // Importando o componente de criação de plano

function HistoricoPlanos() {
  const [showModal, setShowModal] = useState(false);
  const [showCreatePlano, setShowCreatePlano] = useState(false); // Novo estado para controlar a visibilidade da página de criação

  // Dados fictícios para a tabela
  const planos = [
    {
      id: 1,
      cliente: "João da Silva",
      colaborador: "Maria Oliveira",
      diagnostico: "Lombalgia",
      data_inicio: "2025-01-01",
      data_fim: "2025-03-01",
    },
    {
      id: 2,
      cliente: "Ana Souza",
      colaborador: "Carlos Pereira",
      diagnostico: "Hérnia Discal",
      data_inicio: "2025-02-01",
      data_fim: "2025-04-01",
    },
    // Adicione mais planos fictícios aqui se quiser
  ];

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <div className="container my-5">
      <div className="card shadow">
        <div className="card-header custom-header text-primary text-center">
          <h2>Histórico dos Planos de Tratamento</h2>
        </div>
        <div className="card-body">
          {/* Exibe o histórico de planos ou o formulário de criação */}
          {showCreatePlano ? (
            <CriarPlanoTratamento /> // Exibe o componente de criação de plano
          ) : (
            <>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Colaborador</th>
                    <th>Diagnóstico</th>
                    <th>Data de Início</th>
                    <th>Data de Término</th>
                  </tr>
                </thead>
                <tbody>
                  {planos.map((plano) => (
                    <tr key={plano.id}>
                      <td>{plano.id}</td>
                      <td>{plano.cliente}</td>
                      <td>{plano.colaborador}</td>
                      <td>{plano.diagnostico}</td>
                      <td>{plano.data_inicio}</td>
                      <td>{plano.data_fim}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Botão para exibir o formulário de criação de plano */}
              <Button variant="primary" onClick={() => setShowCreatePlano(true)}>
                Criar Novo Plano de Tratamento
              </Button>
            </>
          )}

          {/* Modal para redirecionar (caso ainda queira usar) */}
          <Modal show={showModal} onHide={handleCloseModal}>
            <Modal.Header closeButton>
              <Modal.Title>Criar Novo Plano</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Você está prestes a criar um novo plano de tratamento. Deseja continuar?</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Fechar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleCloseModal();
                  setShowCreatePlano(true); // Alterna para mostrar o formulário de criação
                }}
              >
                Ir para Criar Plano
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default HistoricoPlanos;
