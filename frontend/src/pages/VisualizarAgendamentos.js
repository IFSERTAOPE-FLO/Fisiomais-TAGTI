import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';

const VisualizarDados = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [erro, setErro] = useState(null);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState('');

  useEffect(() => {
    const fetchAgendamentos = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/listar_agendamentos', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.data.length === 0) {
          setAgendamentos([]); // Apenas setando um array vazio, sem mensagem de erro
        } else {
          setAgendamentos(response.data);
        }
      } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        setErro('Erro ao buscar agendamentos. Tente novamente.');
      }
    };

    const fetchRole = () => {
      const savedRole = localStorage.getItem('role');
      if (savedRole) {
        setRole(savedRole);
      }
    };

    fetchAgendamentos();
    fetchRole();
  }, []);

  const handleShowDetails = (agendamento) => {
    setSelectedAgendamento(agendamento);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAgendamento(null);
  };

  const handleDeleteAgendamento = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/deletar_agendamento/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAgendamentos(agendamentos.filter(ag => ag.id !== id)); // Atualiza a lista localmente
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      setErro('Erro ao deletar agendamento. Tente novamente.');
    }
  };

  const handleNotifyAdmin = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/notificar_admin', {
        agendamento_id: selectedAgendamento.id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Administrador notificado com sucesso!');
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao notificar admin:', error);
      alert('Erro ao notificar admin.');
    }
  };
  

  return (
    <div className="container col-md-6 my-5">
      <div className="card shadow">
        <div className="card-header agendamento-header">
          <h2 className="text-center agendamento-titulo fw-bold">Visualizar Agendamentos</h2>
        </div>
  
        <div className="card-body">
          {erro && <div className="alert alert-danger">{erro}</div>}
  
          <table className="table table-striped table-bordered mt-4 agendamento-header">
            <thead>
              <tr >
                <th>#</th>
                <th>Nome Cliente</th>
                <th>Data</th>
                <th>Hora</th>
                <th>Serviço</th>
                <th>Valor (R$)</th>
                <th>Colaborador</th>
                <th>Status</th> {/* Coluna para exibir o status */}
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.length > 0 ? (
                agendamentos.map((agendamento, index) => (
                  <tr key={agendamento.id}>
                    <td>{index + 1}</td>
                    <td>{agendamento.nome_cliente || 'Cliente não informado'}</td>
                    <td>{new Date(agendamento.data).toLocaleDateString()}</td>
                    <td>{agendamento.hora || 'Hora não informada'}</td>
                    <td>{agendamento.nome_servico || 'Serviço não encontrado'}</td>
                    <td>
                      {agendamento.nome_servico === 'Pilates' && agendamento.plano_pagamento && agendamento.plano_pagamento.length > 0 ? (
                        <ul>
                          {agendamento.plano_pagamento.map((plano, index) => (
                            <li key={index}>
                              {plano.plano} -{' '}
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(plano.valor)}
                            </li>
                          ))}
                        </ul>
                      ) : agendamento.nome_servico.includes('Fisioterapia') && agendamento.valor_servico ? (
                        <span>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(agendamento.valor_servico)}
                        </span>
                      ) : (
                        'Valor não disponível'
                      )}
                    </td>
                    <td>{agendamento.nome_colaborador || 'Colaborador não encontrado'}</td>
                    <td>
                      <span className={`badge ${agendamento.status === 'confirmado' ? 'badge-success' : 'badge-warning'}`}>
                        {agendamento.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline-info btn-sm"
                        onClick={() => handleShowDetails(agendamento)}
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center">
                    Nenhum agendamento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
  
          {/* Modal de detalhes do agendamento */}
          {selectedAgendamento && (
            <Modal show={showModal} onHide={handleCloseModal}>
              <Modal.Header closeButton>
                <Modal.Title>Detalhes do Agendamento</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p><strong>Cliente:</strong> {selectedAgendamento.nome_cliente}</p>
                <p><strong>Data:</strong> {new Date(selectedAgendamento.data).toLocaleDateString()}</p>
                <p><strong>Hora:</strong> {selectedAgendamento.hora}</p>
                <p><strong>Serviço:</strong> {selectedAgendamento.nome_servico}</p>
                <p><strong>Valor:</strong> 
                  {selectedAgendamento.valor_servico ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAgendamento.valor_servico) : 'Não disponível'}
                </p>
                <p><strong>Colaborador:</strong> {selectedAgendamento.nome_colaborador}</p>
                <p><strong>Status:</strong>
                  <span className={`badge ${selectedAgendamento.status === 'confirmado' ? 'badge-success' : 'badge-warning'}`}>
                    {selectedAgendamento.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                  </span>
                </p>
              </Modal.Body>
              <Modal.Footer>
                {role === 'admin' && (
                  <>
                    <Button variant="btn btn-danger" onClick={() => handleDeleteAgendamento(selectedAgendamento.id)}>
                      Deletar Agendamento
                    </Button>
                    <Button variant="btn btn-warning" onClick={handleNotifyAdmin}>
                      Notificar Admin
                    </Button>
                  </>
                )}
                <Button variant="btn btn-secondary" onClick={handleCloseModal}>
                  Fechar
                </Button>
              </Modal.Footer>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualizarDados;
