
import axios from "axios";
import React, { useState, useEffect } from "react";
import "../css/Planosdetratamento.css";

function CriarPlanoTratamento() {
  const [cliente, setCliente] = useState("");
  const [colaborador, setColaborador] = useState("");
  const [clientes, setClientes] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);

  const [formData, setFormData] = useState({
    id_cliente: "",
    id_colaborador: "",
    id_servico: "",
    diagnostico: "",
    objetivos: "",
    metodologia: "",
    duracao_prevista: "",
    data_inicio: "",
    data_fim: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Função para buscar os clientes
  const fetchClientes = async () => {
    try {
      const response = await fetch("http://localhost:5000/clientes");
      if (response.ok) {
        setClientes(await response.json());
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  // Função para buscar os colaboradores (rota ajustada)
  const fetchColaboradores = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/colaboradores/todos"
      );
      setColaboradores(response.data);
    } catch (error) {
      console.error("Erro ao buscar colaboradores:", error);
    }
  };

  // Carrega clientes e colaboradores na inicialização
  useEffect(() => {
    fetchClientes();
    fetchColaboradores();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/planos_de_tratamento/criar_planos_de_tratamento",
        formData
      );
      setMessage(response.data.message);
      setError("");
    } catch (error) {
      setError("Erro ao criar plano de tratamento.");
      setMessage("");
    }
  };

  return (
    <div className="container my-5">
      <div className="card shadow">
        <div className="card-header custom-header text-white text-center">
          <h2>Criar Novo Plano de Tratamento</h2>
        </div>
        <div className="card-body">
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Seleção de Cliente */}
            <div className="mb-3">
              <label htmlFor="cliente" className="form-label">
                Cliente
              </label>
              <select
                id="cliente"
                className="form-select"
                value={cliente}
                onChange={(e) => {
                  setCliente(e.target.value);
                  setFormData({ ...formData, id_cliente: e.target.value });
                }}
                required
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((cli) => (
                  <option key={cli.ID_Cliente} value={cli.ID_Cliente}>
                    {cli.Nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Seleção de Colaborador */}
            <div className="mb-3">
              <label htmlFor="colaborador" className="form-label">
                Colaborador
              </label>
              <select
                id="colaborador"
                className="form-select"
                value={colaborador}
                onChange={(e) => {
                  setColaborador(e.target.value);
                  setFormData({ ...formData, id_colaborador: e.target.value });
                }}
                required
              >
                <option value="">Selecione um colaborador</option>
                {colaboradores.map((col) => (
                  <option key={col.id_colaborador} value={col.id_colaborador}>
                    {col.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Campos adicionais */}
            <div className="mb-3">
              <label htmlFor="id_servico" className="form-label">
                ID do Serviço
              </label>
              <input
                type="text"
                className="form-control"
                id="id_servico"
                name="id_servico"
                value={formData.id_servico}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="diagnostico" className="form-label">
                Diagnóstico
              </label>
              <textarea
                className="form-control"
                id="diagnostico"
                name="diagnostico"
                value={formData.diagnostico}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="objetivos" className="form-label">
                Objetivos
              </label>
              <textarea
                className="form-control"
                id="objetivos"
                name="objetivos"
                value={formData.objetivos}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="metodologia" className="form-label">
                Metodologia
              </label>
              <textarea
                className="form-control"
                id="metodologia"
                name="metodologia"
                value={formData.metodologia}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="duracao_prevista" className="form-label">
                Duração Prevista (semanas)
              </label>
              <input
                type="number"
                className="form-control"
                id="duracao_prevista"
                name="duracao_prevista"
                value={formData.duracao_prevista}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="data_inicio" className="form-label">
                Data de Início
              </label>
              <input
                type="date"
                className="form-control"
                id="data_inicio"
                name="data_inicio"
                value={formData.data_inicio}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="data_fim" className="form-label">
                Data de Término
              </label>
              <input
                type="date"
                className="form-control"
                id="data_fim"
                name="data_fim"
                value={formData.data_fim}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn btn-signup">
              Criar Plano
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CriarPlanoTratamento;


