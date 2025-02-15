import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';
import { Form, Button, Modal } from 'react-bootstrap';
import { FaClipboardList, FaClipboardCheck, FaPlus } from 'react-icons/fa';
import "./css/Planosdetratamento.css";

const apiBaseUrl = "http://localhost:5000/";

const IniciarPlanoTratamento = ({ idCliente, onSelectPlano }) => {
  const [planos, setPlanos] = useState([]);
  const [selectedPlano, setSelectedPlano] = useState(null);

  // Estado para controlar o modal de novo plano
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  // Estado para o formulário de novo plano (incluindo o campo 'servicos')
  const [newPlanForm, setNewPlanForm] = useState({
    diagnostico: "",
    objetivos: "",
    metodologia: "",
    duracao_prevista: "",
    valor: "",
    servicos: []  // Campo para os serviços selecionados
  });

  // Exemplo: estado para os serviços disponíveis (deve ser carregado do backend)
  const [servicos, setServicos] = useState([]);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    // Buscar os planos de tratamento ao montar o componente
    fetchPlanos();
    // Buscar os serviços disponíveis (caso ainda não esteja implementado)
    fetchServicos();
  }, []);

  const fetchPlanos = () => {
    axios
      .get(`${apiBaseUrl}planos_de_tratamento/`, { headers })
      .then(response => setPlanos(response.data))
      .catch(error => console.error('Erro ao buscar planos', error));
  };

  // Exemplo de função para buscar serviços disponíveis
  const fetchServicos = () => {
    axios
      .get(`${apiBaseUrl}servicos/listar_todos_servicos`, { headers })
      .then(response => {
        // Mapeia os dados para o formato utilizado no frontend
        const servicosFormatados = response.data.map(servico => ({
          id_servico: servico.ID_Servico,
          nome: servico.Nome_servico,
          descricao: servico.Descricao,
          valor: servico.Valor,
          tipos: servico.Tipos,
          planos: servico.Planos,
          colaboradores: servico.Colaboradores
        }));
        setServicos(servicosFormatados);
      })
      .catch(error => console.error('Erro ao buscar serviços', error));
  };

  // Mapeia os planos para o formato aceito pelo react-select
  const options = planos.map(plano => ({
    value: plano,
    label: plano.diagnostico
  }));

  const handleSelect = (option) => {
    const plano = option ? option.value : null;
    setSelectedPlano(plano);
    if (plano && onSelectPlano) {
      onSelectPlano(plano.id_plano_tratamento);
    }
  };

  // Manipulador para atualizar os campos do formulário de novo plano
  const handleNewPlanInputChange = (e) => {
    setNewPlanForm({ ...newPlanForm, [e.target.name]: e.target.value });
  };

  // Manipulador para atualizar os serviços selecionados
  const handleServicoCheckboxChange = (servicoId, checked) => {
    // Se o checkbox foi marcado, adiciona o serviço com quantidade padrão 1;
    // se desmarcado, remove-o
    const updatedServicos = checked
      ? [...newPlanForm.servicos, { id_servico: servicoId, quantidade_sessoes: 1 }]
      : newPlanForm.servicos.filter(s => s.id_servico !== servicoId);
    setNewPlanForm({ ...newPlanForm, servicos: updatedServicos });
  };

  // Manipulador para atualizar a quantidade de sessões para um serviço selecionado
  const handleServicoQuantidadeChange = (servicoId, quantidade) => {
    const updatedServicos = newPlanForm.servicos.map(s =>
      s.id_servico === servicoId ? { ...s, quantidade_sessoes: quantidade } : s
    );
    setNewPlanForm({ ...newPlanForm, servicos: updatedServicos });
  };

  const handleNewPlanSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${apiBaseUrl}planos_de_tratamento/criar`,
        newPlanForm,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (response.status === 200 || response.status === 201) {
        // Atualiza a lista de planos
        fetchPlanos();
        // Fecha o modal e limpa o formulário
        setShowNewPlanModal(false);
        setNewPlanForm({
          diagnostico: "",
          objetivos: "",
          metodologia: "",
          duracao_prevista: "",
          valor: "",
          servicos: []
        });
      }
    } catch (error) {
      console.error("Erro ao criar novo plano de tratamento", error);
    }
  };

  return (
    <div className="border rounded shadow-sm bg-white p-3">
      {/* Cabeçalho com título e botão para abrir o modal de novo plano */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="text-secondary d-flex align-items-center mb-0">
          <FaClipboardCheck className="me-2" /> Diagnóstico:
        </h6>
        <Button 
          variant="outline-primary" 
           size="sm" 
           onClick={() => setShowNewPlanModal(true)}
            style={{ borderColor: "#36ab9c", color: "#36ab9c", fontWeight: "bold", borderRadius: "8px" }}
            >
             <FaPlus className="me-1" /> Adicionar novo plano de tratamento
             </Button>

      </div>

      {/* Select pesquisável para escolher um plano existente */}
      <Form.Group className="mb-3">
        <Select
          options={options}
          onChange={handleSelect}
          placeholder="Selecione ou pesquise um diagnóstico..."
          isClearable
        />
      </Form.Group>

      {/* Exibição dos detalhes do plano selecionado */}
      {selectedPlano && (
        <div className="mt-3 p-2 border border-primary rounded bg-light">
          <h6 className="text-primary d-flex align-items-center mb-2">
            <FaClipboardList className="me-2" /> Protocolo Selecionado
          </h6>
          <div className="small">
            <p className="mb-1">
              <strong>Metodologia:</strong> {selectedPlano.metodologia}
            </p>
            <p className="mb-1">
              <strong>Valor Total:</strong> R$ {selectedPlano.valor?.toFixed(2)}
            </p>
            <p className="mb-1">
              <strong>Duração:</strong> {selectedPlano.duracao_prevista} semanas
            </p>
            {selectedPlano.servicos && selectedPlano.servicos.length > 0 && (
              <div>
                <strong>Serviços:</strong>
                <ul className="list-unstyled mb-0">
                  {selectedPlano.servicos.map(servico => (
                    <li key={servico.id_servico} className="small">
                      {servico.nome} (Sessões: {servico.quantidade_sessoes})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para adicionar um novo plano de tratamento */}
      <Modal show={showNewPlanModal} onHide={() => setShowNewPlanModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Novo Plano de Tratamento</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleNewPlanSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Diagnóstico</Form.Label>
              <Form.Control
                type="text"
                name="diagnostico"
                value={newPlanForm.diagnostico}
                onChange={handleNewPlanInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Objetivos</Form.Label>
              <Form.Control
                as="textarea"
                name="objetivos"
                value={newPlanForm.objetivos}
                onChange={handleNewPlanInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Metodologia</Form.Label>
              <Form.Control
                as="textarea"
                name="metodologia"
                value={newPlanForm.metodologia}
                onChange={handleNewPlanInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Duração Prevista (semanas)</Form.Label>
              <Form.Control
                type="number"
                name="duracao_prevista"
                value={newPlanForm.duracao_prevista}
                onChange={handleNewPlanInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Valor</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                name="valor"
                value={newPlanForm.valor}
                onChange={handleNewPlanInputChange}
              />
            </Form.Group>
            {/* Linha para seleção dos serviços */}
            <Form.Group className="mb-3">
              <Form.Label>Serviços Associados</Form.Label>
              <div className="row">
                {servicos.map(servico => (
                  <div key={servico.id_servico} className="col-md-6 mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`servico-${servico.id_servico}`}
                        checked={newPlanForm.servicos.some(s => s.id_servico === servico.id_servico)}
                        onChange={(e) =>
                          handleServicoCheckboxChange(servico.id_servico, e.target.checked)
                        }
                      />
                      <label className="form-check-label text-dark" htmlFor={`servico-${servico.id_servico}`}>
                        {servico.nome}
                      </label>
                    </div>
                    {newPlanForm.servicos.some(s => s.id_servico === servico.id_servico) && (
                      <div className="d-flex align-items-center mt-2">
                        <label className="me-2 mb-0" style={{ minWidth: '80px', fontSize: '0.9rem' }}>
                          Sessões:
                        </label>
                        <input
                          type="number"
                          placeholder="Qtd."
                          value={
                            newPlanForm.servicos.find(s => s.id_servico === servico.id_servico)
                              ?.quantidade_sessoes || ""
                          }
                          onChange={(e) =>
                            handleServicoQuantidadeChange(servico.id_servico, parseInt(e.target.value, 10))
                          }
                          className="form-control w-50"
                          min="1"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>


            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNewPlanModal(false)}>
              Cancelar
            </Button>
            <Button className="btn btn2-custom" type="submit">
              Salvar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default IniciarPlanoTratamento;
