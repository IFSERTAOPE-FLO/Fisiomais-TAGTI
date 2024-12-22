import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import { FaCalendarAlt } from 'react-icons/fa'; // Ícone de calendário
import '../css/Estilos.css';
import Calendar from 'react-calendar'; // Para exibir o calendário

const VisualizarAgendamentos = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [erro, setErro] = useState(null);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateFilterModal, setShowDateFilterModal] = useState(false); // Para controlar o novo modal de filtro de data
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchAgendamentos = async () => {
      try {
        const response = await axios.get('http://localhost:5000/agendamentos/listar_agendamentos', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (response.data.length === 0) {
          setAgendamentos([]);
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
      setLoading(true);
      await axios.delete(`http://localhost:5000/agendamentos/deletar_agendamento/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAgendamentos(agendamentos.filter((ag) => ag.id !== id));
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      setErro('Erro ao deletar agendamento. Tente novamente.');
    }
  };

  const handleNotifyAdmin = async () => {
    try {
      setLoading(true);
      await axios.post(
        'http://localhost:5000/api/notificar_admin',
        { agendamento_id: selectedAgendamento.id },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      alert('Administrador notificado com sucesso!');
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao notificar admin:', error);
      alert('Erro ao notificar admin.');
    }
    setLoading(false);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleDateFilter = (date) => {
    setSelectedDate(date);
    setShowDateFilterModal(false); // Fecha o modal de filtro de data após selecionar a data
  };

  const sortedAgendamentos = React.useMemo(() => {
    let filteredAgendamentos = agendamentos;

    // Filtrando por data selecionada
    if (selectedDate) {
      filteredAgendamentos = filteredAgendamentos.filter(
        (agendamento) =>
          new Date(agendamento.data).toLocaleDateString() === new Date(selectedDate).toLocaleDateString()
      );
    }

    // Ordenando agendamentos por data e hora
    filteredAgendamentos.sort((a, b) => {
      const dateA = new Date(a.data);
      const dateB = new Date(b.data);

      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }

      const timeA = a.hora.split(':').map(Number);
      const timeB = b.hora.split(':').map(Number);

      const minutesA = timeA[0] * 60 + timeA[1];
      const minutesB = timeB[0] * 60 + timeB[1];

      return minutesA - minutesB;
    });

    // Se houver a configuração de ordenação, aplicar
    if (sortConfig.key) {
      filteredAgendamentos.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredAgendamentos;
  }, [agendamentos, sortConfig, selectedDate]);

  const handleConfirmarNegar = async (agendamentoId, novoStatus) => {
    try {
      setLoading(true);
      await axios.put(
        `http://localhost:5000/agendamentos/confirmar_negativo_agendamento/${agendamentoId}`,
        { status: novoStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      // Atualiza a lista de agendamentos após a confirmação ou negação
      setAgendamentos(agendamentos.map((ag) =>
        ag.id === agendamentoId ? { ...ag, status: novoStatus } : ag
      ));
    } catch (error) {
      console.error('Erro ao confirmar ou negar agendamento:', error);
      setErro('Erro ao confirmar ou negar agendamento. Tente novamente.');
    }
    setLoading(false);
  };

  return (
    <div className="container col-md-8 my-5">
      <div className="card shadow">
        <div className="card-header ">
          <h2 className="text-center text-primary fw-bold">Visualizar Agendamentos</h2>
        </div>

        <div className="card-body">
          {erro && agendamentos.length > 0 && <div className="alert alert-danger">{erro}</div>}

          <table className="table table-striped table-bordered mt-4 agendamento-header">
            <thead className="agendamento-header">
              <tr>
                <th>#</th>
                <th
                  onClick={() => handleSort('nome_cliente')}
                  style={{ cursor: 'pointer' }}
                >
                  Nome Cliente{' '}
                  {sortConfig.key === 'nome_cliente' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                </th>

                <th
                  onClick={() => handleSort('data')}
                  style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                >
                  Data{' '}
                  {sortConfig.key === 'data' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  <Button
                    variant="btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDateFilterModal(true);
                    }}
                    className="ms-2 align-top p-0 text-white"
                    style={{ lineHeight: 1, height: 'auto' }}
                  >
                    <FaCalendarAlt />
                  </Button>
                </th>
                <th>Hora</th>
                <th>Serviço</th>
                <th>Valor (R$)</th>
                <th>Colaborador</th>
                <th>Status</th> {/* Coluna para exibir o status */}
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {sortedAgendamentos.length > 0 ? (
                sortedAgendamentos.map((agendamento, index) => (
                  <tr key={agendamento.id}>
                    <td>{index + 1}</td>
                    <td>{agendamento.nome_cliente || 'Cliente não informado'}</td>
                    <td>{new Date(agendamento.data).toLocaleDateString()}</td>
                    <td>{agendamento.hora || 'Hora não informada'}</td>
                    <td>{agendamento.nome_servico || 'Serviço não encontrado'}</td>
                    <td>
                      {agendamento.nome_plano && agendamento.valor_plano ? (
                        <div>
                          <strong>{agendamento.nome_plano}:</strong> {' '}
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agendamento.valor_plano)}
                        </div>
                      ) : (
                        <span>
                          {agendamento.valor_servico
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agendamento.valor_servico)
                            : 'Valor não disponível'}
                        </span>
                      )}
                    </td>
                    <td>{agendamento.nome_colaborador || 'Colaborador não encontrado'}</td>
                    <td>
                      <span
                        className={`badge 
              ${agendamento.status === 'confirmado' ? 'badge-success' :
                            agendamento.status === 'negado' ? 'badge-danger' : 'badge-warning'} 
              text-${agendamento.status === 'pendente' ? 'dark' : 'dark'}`}
                      >
                        {agendamento.status === 'confirmado' ? 'Confirmado' :
                          agendamento.status === 'negado' ? 'Negado' : 'Pendente'}
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

          {/* Modal de filtro de data */}
          <Modal show={showDateFilterModal} onHide={() => setShowDateFilterModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Filtro de Datas</Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex justify-content-center align-items-center">
              <Calendar value={selectedDate} onChange={handleDateFilter} />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="btn btn-secondary" onClick={() => setShowDateFilterModal(false)}>
                Fechar
              </Button>
            </Modal.Footer>
          </Modal>

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

                {selectedAgendamento.nome_plano && selectedAgendamento.valor_plano ? (
                  <>
                    <p><strong>Plano:</strong> {selectedAgendamento.nome_plano}</p>
                    <p><strong>Valor do Plano:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAgendamento.valor_plano)}</p>
                  </>
                ) : (
                  <p><strong>Valor do Serviço:</strong> {selectedAgendamento.valor_servico ?
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAgendamento.valor_servico)
                    : 'Não disponível'}</p>
                )}


                <p><strong>Colaborador:</strong> {selectedAgendamento.nome_colaborador}</p>
                <p><strong>Status:</strong>{' '}
                  <span className={` ${selectedAgendamento.status === 'confirmado' ? 'text-dark' : 'text-dark'}`}>
                    {selectedAgendamento.status === 'confirmado' ? 'Confirmado' : 'Pendente'}</span>

                </p>
              </Modal.Body>



              <Modal.Footer>
                {role === 'admin' && (
                  <>
                    <Button variant="btn btn-danger" onClick={() => handleDeleteAgendamento(selectedAgendamento.id)}>
                      Deletar Agendamento
                    </Button>
                    {/* Botões para confirmar ou negar o agendamento */}
                    <Button variant="btn btn-success" onClick={() => handleConfirmarNegar(selectedAgendamento.id, 'confirmado')}>
                      Confirmar
                    </Button>
                    <Button variant="btn btn-danger" onClick={() => handleConfirmarNegar(selectedAgendamento.id, 'negado')}>
                      Negar
                    </Button>
                  </>
                )}
                {role !== 'admin' && (
                  <Button variant="btn btn-warning" onClick={() => handleNotifyAdmin()} disabled={loading}>
                    {loading ? (
                      <i className="bi bi-arrow-repeat spinner"></i>
                    ) : (
                      'Solicitar Cancelamento'
                    )}
                    {loading ? ' Carregando...' : ''}
                  </Button>
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

export default VisualizarAgendamentos;
