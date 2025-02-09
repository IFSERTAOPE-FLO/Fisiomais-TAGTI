import React, { useState } from "react";
import { Button, Card } from "react-bootstrap";
import CriarPlanoTratamento from "./CriarPlanoTratamento";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/Planosdetratamento.css";

function HistoricoPlanos() {
  const [showCreatePlano, setShowCreatePlano] = useState(false);

  // Dados fictícios para a tabela
  const planos = [
    { id: 1, cliente: "João da Silva", colaborador: "Maria Oliveira", diagnostico: "Lombalgia", data_inicio: "2025-01-01", data_fim: "2025-03-01" },
    { id: 2, cliente: "Ana Souza", colaborador: "Carlos Pereira", diagnostico: "Hérnia Discal", data_inicio: "2025-02-01", data_fim: "2025-04-01" },
  ];

  return (
    <div className="container my-5">
      <div className="row">
        {/* Coluna da esquerda: Histórico de planos */}
        <div className="col-md-7">
          <Card className="shadow p-3">
            <Card.Header className="text-primary text-center">
              <h4>Histórico dos Planos de Tratamento</h4>
            </Card.Header>
            <Card.Body>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Colaborador</th>
                    <th>Diagnóstico</th>
                    <th>Início</th>
                    <th>Término</th>
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
            </Card.Body>
          </Card>
        </div>

        {/* Coluna da direita: Criar novo plano */}
        <div className="col-md-5">
          <Card className="shadow p-3">
            <Card.Header className="text-center custom-title">
              <h4>{showCreatePlano ? "Novo Plano de Tratamento" : "Adicionar Plano"}</h4>
            </Card.Header>
            <Card.Body>
              {showCreatePlano ? (
                <CriarPlanoTratamento />
              ) : (
                <div className="text-center">
                  <p>Clique no botão abaixo para adicionar um novo plano de tratamento.</p>
                  <Button className="custom-button" onClick={() => setShowCreatePlano(true)}>
                    Criar Novo Plano
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default HistoricoPlanos;
