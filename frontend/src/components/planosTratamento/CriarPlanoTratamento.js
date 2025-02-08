import axios from "axios"; 
import React, { useState, useEffect } from "react";
import "./css/Planosdetratamento.css";

function CriarPlanoTratamento() {
  const [cliente, setCliente] = useState("");
  const [colaborador, setColaborador] = useState("");
  const [clientes, setClientes] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [anamneseFile, setAnamneseFile] = useState(null);
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const [todosServicos, setTodosServicos] = useState([]);

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

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch("http://localhost:5000/clientes");
        if (response.ok) setClientes(await response.json());
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      }
    };

    const fetchColaboradores = async () => {
      try {
        const response = await axios.get("http://localhost:5000/colaboradores/todos");
        setColaboradores(response.data);
      } catch (error) {
        console.error("Erro ao buscar colaboradores:", error);
      }
    };

    const fetchServicos = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/servicos/listar_todos_servicos', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
    
        if (!response.ok) {
          throw new Error("Erro ao buscar serviços");
        }
    
        const data = await response.json();
        setTodosServicos(data.map(s => s.Nome_servico));
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
      }
    };
    

    fetchClientes();
    fetchColaboradores();
    fetchServicos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDiagnosticoChange = (e) => {
    setFormData({ ...formData, diagnostico: e.target.value });
  };

  const handleServicoChange = (servico) => {
    setServicosSelecionados((prevSelecionados) =>
      prevSelecionados.includes(servico)
        ? prevSelecionados.filter((s) => s !== servico)
        : [...prevSelecionados, servico]
    );
  };

  const handleFileChange = (e) => {
    setAnamneseFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataUpload = new FormData();
    
    // Adicionar serviços selecionados ao formData
    const dadosPlano = {
      ...formData,
      servicos: servicosSelecionados
    };

    Object.keys(dadosPlano).forEach((key) => {
      formDataUpload.append(key, dadosPlano[key]);
    });

    if (anamneseFile) formDataUpload.append("anamnese", anamneseFile);

    try {
      const response = await axios.post(
        "http://localhost:5000/planos_de_tratamento/criar_planos_de_tratamento",
        formDataUpload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert(response.data.message);
    } catch (error) {
      alert("Erro ao criar plano de tratamento.");
    }
  };

  return (
    <div className="container my-5">
      <div className="card shadow">
        <div className="card-header custom-header text-primary text-center">
          <h2 >Criar Novo Plano de Tratamento</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Cliente</label>
              <select 
                className="form-select" 
                value={cliente} 
                onChange={(e) => {
                  setCliente(e.target.value);
                  setFormData({ ...formData, id_cliente: e.target.value });
                }} 
                required
              >
                <option value="">Selecione um cliente</option>
                {clientes.map(cli => (
                  <option key={cli.ID_Cliente} value={cli.ID_Cliente}>{cli.Nome}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Colaborador</label>
              <select 
                className="form-select" 
                value={colaborador} 
                onChange={(e) => {
                  setColaborador(e.target.value);
                  setFormData({ ...formData, id_colaborador: e.target.value });
                }} 
                required
              >
                <option value="">Selecione um colaborador</option>
                {colaboradores.map(col => (
                  <option key={col.id_colaborador} value={col.id_colaborador}>{col.nome}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Diagnóstico</label>
              <input
                type="text"
                className="form-control"
                name="diagnostico"
                value={formData.diagnostico}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3 ">
              <label className="form-label">Serviços Disponíveis</label>
              {todosServicos.map((servico, index) => (
                <div key={index} className="form-check">
                  <input
                    className="form-check-input "
                    type="checkbox"
                    value={servico}
                    checked={servicosSelecionados.includes(servico)}
                    onChange={() => handleServicoChange(servico)}
                  />
                  <label className="form-check-label text-dark">
                    {servico}
                  </label>
                </div>
              ))}
            </div>

            {/* Restante dos campos do formulário */}
            <div className="mb-3">
              <label className="form-label">Objetivos</label>
              <textarea 
                className="form-control" 
                name="objetivos" 
                value={formData.objetivos} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Metodologia</label>
              <textarea 
                className="form-control" 
                name="metodologia" 
                value={formData.metodologia} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Duração Prevista (semanas)</label>
              <input 
                type="number" 
                className="form-control" 
                name="duracao_prevista" 
                value={formData.duracao_prevista} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Data de Início</label>
              <input 
                type="date" 
                className="form-control" 
                name="data_inicio" 
                value={formData.data_inicio} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Data de Término</label>
              <input 
                type="date" 
                className="form-control" 
                name="data_fim" 
                value={formData.data_fim} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Ficha de Anamnese</label>
              <input 
                type="file" 
                className="form-control" 
                accept=".pdf,.doc,.docx" 
                onChange={handleFileChange} 
                required 
              />
            </div>

            <button type="submit" className="btn btn-signup">Criar Plano</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CriarPlanoTratamento;