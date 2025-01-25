
import axios from 'axios';
import React, { useState, useEffect } from 'react'; 
import '../css/Planosdetratamento.css';
function CriarPlanoTratamento() {
  const [cliente, setCliente] = useState('');
  const [clientes, setClientes] = useState([]);
  const [formData, setFormData] = useState({
    id_cliente: '',
    id_colaborador: '',
    id_servico: '',
    diagnostico: '',
    objetivos: '',
    metodologia: '',
    duracao_prevista: '',
    data_inicio: '',
    data_fim: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const fetchClientes = async () => {
    try {
      const response = await fetch('http://localhost:5000/clientes');
      if (response.ok) {
        setClientes(await response.json());
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };
  useEffect(() => {
    fetchClientes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/planos_de_tratamento/criar_planos_de_tratamento', formData);
      setMessage(response.data.message);
      setError('');
    } catch (error) {
      setError('Erro ao criar plano de tratamento.');
      setMessage('');
    }
  };

  return (
    <div className="container my-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white text-center">
          <h2>Criar Novo Plano de Tratamento</h2>
        </div>
        <div className="card-body">
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
            <label htmlFor="cliente" className="form-label">Cliente</label>
                      <select
                        id="cliente"
                        className="form-select"
                        value={cliente}
                        onChange={(e) => setCliente(e.target.value)}
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
            <div className="mb-3">
              <label htmlFor="id_colaborador" className="form-label">ID do Colaborador</label>
              <input
                type="text"
                className="form-control"
                id="id_colaborador"
                name="id_colaborador"
                value={formData.id_colaborador}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="id_servico" className="form-label">ID do Serviço</label>
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
              <label htmlFor="diagnostico" className="form-label">Diagnóstico</label>
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
              <label htmlFor="objetivos" className="form-label">Objetivos</label>
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
              <label htmlFor="metodologia" className="form-label">Metodologia</label>
              <textarea
                className="form-control"
                id="metodologia"
                name="metodologia"
                value={formData.metodologia}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="duracao_prevista" className="form-label">Duração Prevista (semanas)</label>
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
              <label htmlFor="data_inicio" className="form-label">Data de Início</label>
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
              <label htmlFor="data_fim" className="form-label">Data de Término</label>
              <input
                type="date"
                className="form-control"
                id="data_fim"
                name="data_fim"
                value={formData.data_fim}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn btn-signup">Criar Plano</button>
            <button type="submit" className="btn btn-login">Criar Plano</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CriarPlanoTratamento;
