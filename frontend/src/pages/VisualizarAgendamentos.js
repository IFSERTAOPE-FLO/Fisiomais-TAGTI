import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import { FaCalendarAlt } from 'react-icons/fa'; // Ícone de calendário
import '../css/Estilos.css';
import Calendar from 'react-calendar'; // Para exibir o calendário
import Paginator from '../components/Paginator';


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
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const [pesquisaTipo, setPesquisaTipo] = useState('Número do Agendamento'); // Estado para o tipo de pesquisa
  const [pesquisaValor, setPesquisaValor] = useState(''); // Estado para o valor da pesquisa



  // A tabela agora vai exibir agendamentos filtrados

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
    setLoading(false);
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

    if (selectedDate) {
      const adjustedDate = new Date(selectedDate);
      adjustedDate.setHours(adjustedDate.getHours() - 3); // Soma 3 horas

      filteredAgendamentos = filteredAgendamentos.filter(
        (agendamento) =>
          new Date(agendamento.data).toLocaleDateString() === adjustedDate.toLocaleDateString()
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
  // Função de filtragem
  const agendamentosFiltrados = sortedAgendamentos.filter((agendamento) => {
    switch (pesquisaTipo) {
      case 'agendamento':
        return agendamento.id.toString().includes(pesquisaValor);
      case 'cliente':
        return agendamento.cliente.toLowerCase().includes(pesquisaValor.toLowerCase());
      case 'colaborador':
        return agendamento.colaborador.toLowerCase().includes(pesquisaValor.toLowerCase());

      case 'clinica':
        return agendamento.clinica?.nome.toLowerCase().includes(pesquisaValor.toLowerCase());
      default:
        return true;
    }
  });

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAgendamentos = agendamentosFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  // Filtragem dos usuários com base no nome

  return (
    <div className="container  my-2">
      <div className="card shadow">
        <div className="card-header ">
          <h2 className="text-center text-primary fw-bold">Visualizar Agendamentos</h2>
        </div>


        <div className="card-body">
          <div className="col-md-2 col-lg-12 d-flex justify-content-center align-items-center">
            <div className="input-group">
              <select
                className="form-select"
                value={pesquisaTipo}
                onChange={(e) => setPesquisaTipo(e.target.value)}
              >
                <option value="agendamento">Nº do Agendamento</option>
                {role !== 'cliente' && (
                  <option value="cliente">Cliente</option>
                )
                }
                <option value="colaborador">Colaborador</option>
                <option value="clinica">Clínica</option>
              </select>
              <input
                type="text"
                className="form-control"
                placeholder={`Pesquisar por ${pesquisaTipo === 'agendamento' ? 'ID' : pesquisaTipo}`}
                value={pesquisaValor}
                onChange={(e) => setPesquisaValor(e.target.value)}
              />
              <button className="btn btn-secondary" type="button">
                <i className="bi bi-search"></i>
              </button>
            </div>
          </div>
          <div className="table-responsive">

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
                  <th>Endereço da Clínica</th> {/* Nova coluna para exibir o endereço da clínica */}
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {sortedAgendamentos.length > 0 ? (
                  currentAgendamentos.map((agendamento, index) => (
                    <tr key={agendamento.id}>
                      <td>{agendamento.id}</td>
                      <td>{agendamento.cliente || 'Cliente não informado'}</td>
                      <td>{new Date(agendamento.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                      <td>{agendamento.hora || 'Hora não informada'}</td>
                      <td>{agendamento.servico || 'Serviço não encontrado'}</td>
                      <td>
                        {agendamento.plano?.nome && agendamento.plano?.valor ? (
                          <div>
                            <strong>{agendamento.plano.nome}:</strong> {' '}
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agendamento.plano.valor)}
                          </div>
                        ) : (
                          <span>
                            {agendamento.valor
                              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agendamento.valor)
                              : 'Valor não disponível'}
                          </span>
                        )}
                      </td>
                      <td>{agendamento.colaborador || 'Colaborador não encontrado'}</td>
                      <td>
                        <span
                          className={`badge 
                        ${agendamento.status === 'confirmado' ? 'badge-success' :
                              agendamento.status === 'negado' ? 'badge-danger' :
                                agendamento.status === 'cancelado' ? 'badge-secondary' :
                                  agendamento.status === 'remarcado' ? 'badge-info' :
                                    agendamento.status === 'nao_compareceu' ? 'badge-dark' :
                                      'badge-warning'} 
                        text-dark`}
                        >
                          {agendamento.status.charAt(0).toUpperCase() + agendamento.status.slice(1)} {/* Primeira letra maiúscula */}
                        </span>
                      </td>
                      <td>
                        <div>
                          {agendamento.clinica && agendamento.clinica.endereco ? (
                            <div>
                              <strong>{agendamento.clinica.nome}:</strong><br />
                              {agendamento.clinica.endereco.rua}, {agendamento.clinica.endereco.numero}, {agendamento.clinica.endereco.bairro}<br />
                              {agendamento.clinica.endereco.cidade} - {agendamento.clinica.endereco.estado}
                            </div>
                          ) : 'Endereço não disponível'}
                        </div>
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
                    <td colSpan="10" className="text-center">
                      Nenhum agendamento encontrado
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>


          {/* Modal de filtro de data */}
          <Modal show={showDateFilterModal} onHide={() => setShowDateFilterModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Filtro de Datas</Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex justify-content-center align-items-center">
              <Calendar
                value={selectedDate}
                onChange={handleDateFilter}
                tileClassName={({ date, view }) => {
                  if (view === 'month') {
                    const formattedDate = date.toISOString().split('T')[0];
                    const agendamentoDates = currentAgendamentos.map(agendamento =>
                      new Date(agendamento.data).toISOString().split('T')[0]
                    );
                    return agendamentoDates.includes(formattedDate) ? 'highlighted-date' : null;
                  }
                }}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="danger"
                onClick={() => {
                  setSelectedDate(null); // Limpa a data selecionada
                  setShowDateFilterModal(false); // Fecha o modal
                }}
              >
                Remover Filtro
              </Button>
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
                <div className="row mb-3">
                  <div className="col-12 col-md-6">
                    <strong>Cliente:</strong> {selectedAgendamento.cliente || 'Cliente não informado'}
                  </div>
                  <div className="col-12 col-md-6">
                    <strong>Colaborador:</strong> {selectedAgendamento.colaborador || 'Colaborador não encontrado'}
                  </div>
                  <div className="col-12 col-md-6">
                    <strong>Data:</strong> {new Date(selectedAgendamento.data).toLocaleDateString()}
                  </div>
                  <div className="col-12 col-md-6">
                    <strong>Hora:</strong> {selectedAgendamento.hora || 'Hora não informada'}
                  </div>

                  <div className="col-12 col-md-6">
                    <strong>Serviço:</strong> {selectedAgendamento.servico || 'Serviço não encontrado'}
                  </div>


                  {selectedAgendamento.plano?.nome && selectedAgendamento.plano?.valor ? (
                    <>
                      <div className="col-12 col-md-6">
                        <strong>Plano:</strong> {selectedAgendamento.plano.nome}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Valor do Plano:</strong>{' '}
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAgendamento.plano.valor)}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-12 col-md-6">
                        <strong>Valor do Serviço:</strong>{' '}
                        {selectedAgendamento.valor
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAgendamento.valor)
                          : 'Não disponível'}
                      </div>

                    </>
                  )}
                  <div className="col-12 col-md-6">
                    <strong>Status: </strong>
                    <span
                      className={` fw-bold
                        ${selectedAgendamento.status === 'confirmado'
                          ? 'text-success'
                          : selectedAgendamento.status === 'negado'
                            ? 'text-danger'
                            : selectedAgendamento.status === 'cancelado'
                              ? 'text-secondary'
                              : selectedAgendamento.status === 'remarcado'
                                ? 'text-info'
                                : selectedAgendamento.status === 'nao_compareceu'
                                  ? 'text-dark'
                                  : 'text-warning'
                        }
                      `}
                    >
                      {selectedAgendamento.status.charAt(0).toUpperCase() + selectedAgendamento.status.slice(1)}
                    </span>
                  </div>
                  <div className="row ">
                    <div className="col-12 col-md-6">
                      <strong>Clínica:</strong> {selectedAgendamento.clinica?.nome || 'Clínica não informada'}
                    </div>

                  </div>
                  {selectedAgendamento.clinica?.endereco ? (
                    <>
                      <div className="col-12 col-md-12">
                        <strong>Endereço da Clínica:</strong>
                      </div>
                      <div className="col-12 col-md-6">
                        {[
                          selectedAgendamento.clinica.endereco.rua,
                          selectedAgendamento.clinica.endereco.numero,
                          selectedAgendamento.clinica.endereco.bairro,
                          selectedAgendamento.clinica.endereco.cidade,
                          selectedAgendamento.clinica.endereco.estado,
                        ]
                          .filter(Boolean)
                          .join(', ') || 'Endereço não disponível'}
                      </div>
                    </>
                  ) : (

                    <div className="col-12 col-md-6">
                      <strong>Endereço da Clínica:</strong> Endereço não disponível
                    </div>

                  )}



                </div>
              </Modal.Body>


              <Modal.Footer>
                {(role === 'colaborador' || role === 'admin') && (
                  <>
                    <Button
                      variant="btn btn-success"
                      onClick={async () => {
                        await handleConfirmarNegar(selectedAgendamento.id, 'confirmado');
                        handleCloseModal(); // Fecha o modal após confirmar
                      }}
                      disabled={loading || selectedAgendamento.status === 'confirmado'}
                    >
                      {loading && selectedAgendamento.status !== 'confirmado' ? (
                        <>
                          <i className="bi bi-arrow-repeat spinner"></i> Carregando...
                        </>
                      ) : (
                        'Confirmar'
                      )}
                    </Button>

                    <Button
                      variant="btn btn-danger"
                      onClick={async () => {
                        await handleConfirmarNegar(selectedAgendamento.id, 'negado');
                        handleCloseModal(); // Fecha o modal após negar
                      }}
                      disabled={loading || selectedAgendamento.status === 'negado'}
                    >
                      {loading && selectedAgendamento.status !== 'negado' ? (
                        <>
                          <i className="bi bi-arrow-repeat spinner"></i> Carregando...
                        </>
                      ) : (
                        'Negar'
                      )}
                    </Button>



                    <Button
                      variant="btn btn-warning"
                      onClick={() => setShowStatusModal(true)} // Abre o modal para definir o novo status
                      disabled={loading}
                    >
                      Atualizar Status
                    </Button>
                  </>
                )}

                {role === 'admin' && (
                  <Button
                    variant="btn btn-danger"
                    onClick={() => handleDeleteAgendamento(selectedAgendamento.id)}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="bi bi-arrow-repeat spinner"></i> Carregando...
                      </>
                    ) : (
                      <i className="bi bi-trash"></i>  // Ícone da lixeira do Bootstrap
                    )}
                  </Button>
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
          <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Atualizar Status do Agendamento</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Selecione o novo status:</p>
              <select
                className="form-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="cancelado">Cancelado</option>
                <option value="nao_compareceu">Não Compareceu</option>
                <option value="remarcado">Remarcado</option>
              </select>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="btn btn-primary"
                onClick={() => handleConfirmarNegar(selectedAgendamento.id, newStatus)}
                disabled={loading || !newStatus}
              >
                {loading ? (
                  <>
                    <i className="bi bi-arrow-repeat spinner"></i> Carregando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </Button>

              <Button variant="btn btn-secondary" onClick={() => setShowStatusModal(false)}>
                Fechar
              </Button>
            </Modal.Footer>
          </Modal>

        </div>
      </div>
      {/* Paginador */}
      <Paginator
        currentPage={currentPage}
        totalItems={agendamentosFiltrados.length}  // Usando o total de agendamentos filtrados
        itemsPerPage={itemsPerPage}
        setCurrentPage={setCurrentPage}  // Passando a função corretamente como prop
      />

    </div>
  );
};

export default VisualizarAgendamentos;
