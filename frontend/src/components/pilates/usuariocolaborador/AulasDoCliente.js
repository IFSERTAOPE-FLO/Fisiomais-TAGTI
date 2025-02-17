// AulasDoCliente.js
import React, { useState, useEffect } from "react";

const AulasDoCliente = ({ clienteId }) => {
  const [aulas, setAulas] = useState([]);
  const [erro, setErro] = useState("");
  const token = localStorage.getItem("token");
  const apiBaseUrl = "http://localhost:5000/";

  const buscarAulasDoCliente = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}pilates/cliente/${clienteId}/aulas`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAulas(data.aulas);
      } else {
        setErro(data.message || "Erro ao buscar aulas do cliente.");
      }
    } catch (err) {
      setErro("Erro na requisição.");
    }
  };

  useEffect(() => {
    if (clienteId) {
      buscarAulasDoCliente();
    }
  }, [clienteId]);

  return (
    <div className="container mt-4">      
      {erro && <div className="alert alert-danger">{erro}</div>}
      {aulas.length === 0 ? (
        <p>Não há aulas para este cliente.</p>
      ) : (
        <div className="row">
          {aulas.map((aula) => (
            <div key={aula.idAula} className="col-md-6 mb-3">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  {/* Cabeçalho com dia da semana e horário */}
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h5 className="mb-0 text-primary">{aula.diaSemana}</h5>
                        <span className="badge bg-primary-subtle text-primary">
                          <i className="bi bi-clock me-1"></i>
                          {aula.horaInicio} - {aula.horaFim}
                        </span>
                      </div>
                      {/* Informações do colaborador e clínica */}
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <div className="d-flex align-items-center gap-1">
                          <i className="bi bi-person-badge text-muted"></i>
                          <span>{aula.colaborador ? aula.colaborador.nome : "N/D"}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <i className="bi bi-geo-alt text-muted"></i>
                          <span>{aula.clinica || "Local não informado"}</span>
                        </div>
                      </div>
                      {/* (Opcional) Exibição do Serviço */}
                      {aula.servico && (
                        <p className="mb-1">
                          <i className="bi bi-gear text-muted me-1"></i>
                          <strong>Serviço:</strong> {aula.servico}
                        </p>
                      )}
                      {/* Progresso de Participação */}
                      <div className="d-flex align-items-center gap-2 mt-3">
                        <div className="progress flex-grow-1" style={{ height: "8px" }}>
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{ width: `${(aula.numAlunos / aula.limiteAlunos) * 100}%` }}
                          ></div>
                        </div>
                        <small className="text-muted">
                          {aula.limiteAlunos - aula.numAlunos} vagas restantes
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer text-end">
                  <small className="text-muted">ID Aula: {aula.idAula}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AulasDoCliente;
