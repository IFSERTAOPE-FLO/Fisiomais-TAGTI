import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import "../css/Estilos.css";
import "../css/Home.css";

function PlanosTratamento() {
  const [planos, setPlanos] = useState([]);

  const adicionarPlano = () => {
    setPlanos([
      ...planos,
      { id: planos.length + 1, descricao: "", progresso: "", data: "" },
    ]);
  };

  const atualizarPlano = (id, campo, valor) => {
    setPlanos(
      planos.map((plano) =>
        plano.id === id ? { ...plano, [campo]: valor } : plano
      )
    );
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center fw-bold text-primary mb-3">
        Gerenciamento de Planos de Tratamento
      </h1>
      <p className="text-center text-primary mb-3">
        Aqui você pode acompanhar o progresso de seus pacientes e criar novos
        planos de tratamento personalizados.
      </p>
      
      <div className="d-flex justify-content-end mb-4">
        <button
          className="btn"
          style={{ backgroundColor: "#BC155B", color: "#fff" }}
          onClick={adicionarPlano}
        >
          <i className="bi bi-plus-circle"></i> Novo Plano de Tratamento
        </button>
      </div>

      {planos.length === 0 ? (
        <p className="text-center text-secondary">Nenhum plano de tratamento cadastrado ainda.</p>
      ) : (
        planos.map((plano) => (
          <div key={plano.id} className="card mb-3 shadow-sm">
            <div className="card-body">
              <h5 className="card-title text-primary">
                Plano de Tratamento #{plano.id}
              </h5>
              <div className="mb-3">
                <label className="form-label text-secondary">
                  Descrição do Tratamento
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={plano.descricao}
                  onChange={(e) =>
                    atualizarPlano(plano.id, "descricao", e.target.value)
                  }
                ></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label text-secondary">
                  Progresso do Cliente
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={plano.progresso}
                  onChange={(e) =>
                    atualizarPlano(plano.id, "progresso", e.target.value)
                  }
                ></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label text-secondary">
                  Data do Plano
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={plano.data}
                  onChange={(e) =>
                    atualizarPlano(plano.id, "data", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        ))
      )}

      <div className="mt-4 text-center">
        <Link
          to="/"
          className="btn"
          style={{
            borderColor: "#BC155B",
            color: "#BC155B",
          }}
        >
          <i className="bi bi-arrow-left"></i> Voltar para Home
        </Link>
      </div>
    </div>
  );
}

export default PlanosTratamento;





