import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/Estilos.css";

function PlanosTratamento() {
  const [cliente, setCliente] = useState({
    nome: "",
    idade: "",
    telefone: "",
    email: "",
    diagnostico: "",
    objetivo: "",
    progresso: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCliente({ ...cliente, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Dados do cliente:", cliente);
    alert("Informações do cliente salvas com sucesso!");
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center fw-bold text-primary mb-4">
        Plano de Tratamento
      </h1>
      <p className="text-center text-secondary mb-4">
        Preencha as informações do cliente para criar um histórico de progresso.
      </p>

      <form className="bg-light p-4 rounded shadow" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="nome" className="form-label fw-bold">
            Nome do Cliente
          </label>
          <input
            type="text"
            className="form-control"
            id="nome"
            name="nome"
            value={cliente.nome}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="idade" className="form-label fw-bold">
            Idade
          </label>
          <input
            type="number"
            className="form-control"
            id="idade"
            name="idade"
            value={cliente.idade}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="telefone" className="form-label fw-bold">
            Telefone
          </label>
          <input
            type="tel"
            className="form-control"
            id="telefone"
            name="telefone"
            value={cliente.telefone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label fw-bold">
            Email
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            value={cliente.email}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="diagnostico" className="form-label fw-bold">
            Diagnóstico
          </label>
          <textarea
            className="form-control"
            id="diagnostico"
            name="diagnostico"
            rows="3"
            value={cliente.diagnostico}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="mb-3">
          <label htmlFor="objetivo" className="form-label fw-bold">
            Objetivo do Tratamento
          </label>
          <textarea
            className="form-control"
            id="objetivo"
            name="objetivo"
            rows="3"
            value={cliente.objetivo}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="mb-3">
          <label htmlFor="progresso" className="form-label fw-bold">
            Progresso Atual
          </label>
          <textarea
            className="form-control"
            id="progresso"
            name="progresso"
            rows="3"
            value={cliente.progresso}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="text-center">
          <button type="submit" className="btn btn-primary">
            Salvar Informações
          </button>
        </div>
      </form>
    </div>
  );
}

export default PlanosTratamento;
