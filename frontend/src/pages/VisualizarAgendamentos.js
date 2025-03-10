import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { Modal, Button } from 'react-bootstrap';
import { FaCalendarAlt } from 'react-icons/fa'; // Ícone de calendário
import '../css/Estilos.css';
import Calendar from 'react-calendar'; // Para exibir o calendário
import Paginator from '../components/Paginator';

import { useLocation, Link } from 'react-router-dom'; // Importe o useLocation

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
  const [pesquisaStatus, setPesquisaStatus] = useState(''); // Estado para o status da pesquisa
  const [pesquisaTipo, setPesquisaTipo] = useState('Número do Agendamento'); // Estado para o tipo de pesquisa
  const [pesquisaValor, setPesquisaValor] = useState(''); // Estado para o valor da pesquisa

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const agendamentoId = queryParams.get('agendamentoId'); // Captura o parâmetro da URL

  const formatarDataBrasileira = (dataHora) => {
    const data = new Date(dataHora); // Converte a string para um objeto Date

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Meses começam do 0
    const ano = data.getFullYear();


    const hora = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${ano} ${hora}:${minutos}`; // Retorna a data e o horário no formato DD/MM/AAAA HH:mm
  };

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
  // Efeito para aplicar o filtro automaticamente ao carregar a página
  useEffect(() => {
    if (agendamentoId) {
      setPesquisaTipo('agendamento'); // Define o tipo de pesquisa como "agendamento"
      setPesquisaValor(agendamentoId); // Define o valor da pesquisa como o ID do agendamento
    }
  }, [agendamentoId]);

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
      if (selectedDate instanceof Date) {
        // Filtro por dia específico
        const adjustedDate = new Date(selectedDate);
        adjustedDate.setHours(adjustedDate.getHours() - 3); // Ajuste de fuso horário
        const targetTimestamp = adjustedDate.setHours(0, 0, 0, 0); // Definir à meia-noite (00:00:00) para evitar problemas com horários

        filteredAgendamentos = filteredAgendamentos.filter((agendamento) => {
          const agendamentoDate = new Date(agendamento.data).setHours(0, 0, 0, 0); // Ajuste da data para comparar apenas a data sem considerar o horário
          return agendamentoDate === targetTimestamp; // Compara os timestamps das datas
        });
      } else if (selectedDate.type === 'week') {
        // Filtro para semana atual
        const { start } = selectedDate;
        const end = new Date(start);
        end.setDate(start.getDate() + 6); // Final da semana
        filteredAgendamentos = filteredAgendamentos.filter((agendamento) => {
          const agendamentoDate = new Date(agendamento.data);
          return agendamentoDate >= start && agendamentoDate <= end;
        });
      } else if (selectedDate.type === 'month') {
        // Filtro para mês atual
        const { start } = selectedDate;
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // Final do mês
        filteredAgendamentos = filteredAgendamentos.filter((agendamento) => {
          const agendamentoDate = new Date(agendamento.data);
          return agendamentoDate >= start && agendamentoDate <= end;
        });
      }
    }

    // Ordenar por data e hora
    filteredAgendamentos.sort((a, b) => {
      const dateA = new Date(a.data);
      const dateB = new Date(b.data);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      const timeA = a.hora.split(':').map(Number);
      const timeB = b.hora.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });

    return filteredAgendamentos;
  }, [agendamentos, selectedDate]);




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
    // Filtro por tipo de pesquisa (agendamento, cliente, colaborador, etc.)
    const matchesPesquisaTipo = () => {
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
    };

    // Filtro por status
    const matchesPesquisaStatus = () => {
      if (pesquisaStatus === '') return true; // Se nenhum status for selecionado, retorna todos
      return agendamento.status === pesquisaStatus;
    };

    return matchesPesquisaTipo() && matchesPesquisaStatus();
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
          <h1 className="text-center text-primary ">Visualizar Agendamentos</h1>
        </div>


        <div className="card-body">
          <div className="col-12 d-flex flex-wrap justify-content-center align-items-center gap-2">
            {/* Grupo de Pesquisa */}
            <div className="input-group z-bot" style={{ maxWidth: "500px" }}>
              <span className="input-group-text">
                <i className="bi bi-funnel"></i>
              </span>
              <select
                className="form-select"
                value={pesquisaTipo}
                onChange={(e) => setPesquisaTipo(e.target.value)}
              >
                <option value="agendamento">Nº do Agendamento</option>
                {role !== "cliente" && <option value="cliente">Cliente</option>}
                <option value="colaborador">Colaborador</option>
                <option value="clinica">Clínica</option>
              </select>
            </div>

            {/* Campo de Entrada */}
            <div className="input-group z-bot" style={{ maxWidth: "400px" }}>
              <input
                type="text"
                className="form-control py-1"
                placeholder={`Pesquisar por ${pesquisaTipo === "agendamento" ? "ID" : pesquisaTipo}`}
                value={pesquisaValor}
                onChange={(e) => setPesquisaValor(e.target.value)}
              />
              <button className="btn btn-secondary" type="button">
                <i className="bi bi-search"></i>
              </button>
            </div>

            {/* Filtro de Status */}
            <div className="input-group z-bot" style={{ maxWidth: "300px" }}>
              <span className="input-group-text">
                <i className="bi bi-filter-circle"></i>
              </span>
              <select
                className="form-select"
                value={pesquisaStatus}
                onChange={(e) => setPesquisaStatus(e.target.value)}
              >
                <option value="">Todos os Status</option>
                <option value="confirmado">Confirmado</option>
                <option value="negado">Negado</option>
                <option value="cancelado">Cancelado</option>
                <option value="remarcado">Remarcado</option>
                <option value="nao_compareceu">Não Compareceu</option>
                <option value="concluido">Concluido</option>
              </select>
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
                  <th>Status</th>
                  <th>Pagamento</th>
                  <th>Endereço da Clínica</th>
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody className='text-center'>
                {sortedAgendamentos.length > 0 ? (
                  currentAgendamentos.map((agendamento, index) => (
                    <tr key={agendamento.id}>
                      <td>{agendamento.id}</td>
                      <td>{agendamento.cliente || 'Cliente não informado'}</td>
                      <td className="text-center">
                        {agendamento.data && !isNaN(new Date(agendamento.data).getTime()) ? (
                          <>
                            {new Date(agendamento.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                            {agendamento.status === 'Pedido de Remarcação' && (
                              ` - Solicitação de remarcação: ${formatarDataBrasileira(agendamento.dias_e_horarios)}`
                            )}
                          </>
                        ) : null}

                      </td>

                      <td>
                        {agendamento.status === 'confirmado' && agendamento.servico.toLowerCase().includes('pilates')
                          ? agendamento.dias_e_horarios || ''
                          : agendamento.hora || ''}

                      </td>

                      <td>{agendamento.servico || 'Serviço não encontrado'}</td>
                      <td>
                        {agendamento.plano?.nome && agendamento.plano?.valor ? (
                          <div>
                            <strong>{agendamento.plano.nome}:</strong> {' '}  {agendamento.plano.quantidade_aulas_por_semana} aulas por semana < br />
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
                          ${agendamento.status === 'confirmado' ? 'text-success' :
                              agendamento.status === 'pago' ? 'text-primary' :
                                agendamento.status === 'negado' ? 'text-danger' :
                                  agendamento.status === 'cancelado' ? 'text-secondary' :
                                    agendamento.status === 'remarcado' ? 'text-info' :
                                      agendamento.status === 'nao_compareceu' ? 'text-dark' :
                                        'badge-warning'} 
                          text-dark`}
                        >
                          {agendamento.status.charAt(0).toUpperCase() + agendamento.status.slice(1)} {/* Primeira letra maiúscula */}
                        </span>
                      </td>
                      <td>
                        {
                          agendamento.pagamento.status === "Pendente" ? (
                            <>
                              <i className="bi bi-hourglass-split" style={{ color: 'gray' }}></i>
                              <span style={{ color: 'gray' }}> </span>
                            </>
                          ) : agendamento.pagamento.status === "Pago" ? (
                            <>
                              <i className="bi bi-check-circle" style={{ color: 'green' }}></i>
                              <span style={{ color: 'green' }}></span>
                            </>
                          ) : agendamento.pagamento.status === "Cancelado" ? (
                            <>
                              <i className="bi bi-x-circle" style={{ color: 'red' }}></i>
                              <span style={{ color: 'red' }}></span>
                            </>
                          ) : <>
                            <i className="bi bi-hourglass-split" style={{ color: 'gray' }}></i>
                            <span style={{ color: 'gray' }}> </span>
                          </>
                        }
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
                      <td >
                        <button
                          className="btn btn-outline-info btn-sm "
                          onClick={() => handleShowDetails(agendamento)}
                        >
                          <i className="bi bi-info-circle "></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="text-center">
                      Nenhum agendamento encontrado
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>


          <Modal show={showDateFilterModal} onHide={() => setShowDateFilterModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Filtro de Datas</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="d-flex flex-column justify-content-center align-items-center">
                <Calendar value={selectedDate instanceof Date ? selectedDate : null} onChange={handleDateFilter} />
                <div className="mt-3 d-flex flex-column gap-2">

                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                className='btn btn-login'
                onClick={() => {
                  const currentDate = new Date();
                  currentDate.setHours(currentDate.getHours() + 3); // Adiciona 3 horas ao horário atual
                  const adjustedDate = new Date(currentDate.setHours(0, 0, 0, 0)); // Define o horário como meia-noite para comparação apenas da data
                  setSelectedDate(adjustedDate); // Define o filtro para o dia ajustado com +3 horas
                  setShowDateFilterModal(false);
                }}
              >
                Hoje
              </Button>



              <Button
                className='btn btn-login'
                variant="primary"
                onClick={() => {
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay()); // Início da semana
                  setSelectedDate({ type: 'week', start: startOfWeek }); // Filtro para semana atual
                  setShowDateFilterModal(false);
                }}
              >
                Esta Semana
              </Button>
              <Button
                className='btn btn-login'
                onClick={() => {
                  const today = new Date();
                  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // Início do mês
                  setSelectedDate({ type: 'month', start: startOfMonth }); // Filtro para mês atual
                  setShowDateFilterModal(false);
                }}
              >
                Este Mês
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setSelectedDate(null); // Limpa o filtro
                  setShowDateFilterModal(false); // Fecha o modal
                }}
              >
                Remover Filtro
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
                        <strong>Plano:</strong> {selectedAgendamento.plano.nome} < br /> {selectedAgendamento.plano.quantidade_aulas_por_semana} aulas por semana
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
                    <strong>Pagamento: </strong> {selectedAgendamento.pagamento.status || 'pendente'}
                  </div>
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
                                  : selectedAgendamento.status === 'pago'
                                    ? 'text-primary'
                                    : 'text-warning'
                        }
                      `}
                    >
                      {selectedAgendamento.status}
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
                      disabled={loading || selectedAgendamento.status?.toLowerCase() === 'confirmado'}
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
                        await handleConfirmarNegar(selectedAgendamento.id, 'cancelado');
                        handleCloseModal(); // Fecha o modal após negar
                      }}
                      disabled={loading || selectedAgendamento.status?.toLowerCase() === 'cancelado'}
                    >
                      {loading && selectedAgendamento.status !== 'cancelado' ? (
                        <>
                          <i className="bi bi-arrow-repeat spinner"></i> Carregando...
                        </>
                      ) : (
                        'Cancelar'
                      )}
                    </Button>

                    <Button
                      variant="btn btn-warning"
                      onClick={() => setShowStatusModal(true)} // Abre o modal para definir o novo status
                      disabled={loading}
                    >
                      Outros
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



                {role === 'cliente' && (
                  <Button variant="btn btn-warning" onClick={() => handleNotifyAdmin()} disabled={loading}>
                    {loading ? (
                      <i className="bi bi-arrow-repeat spinner"></i>
                    ) : (
                      'Solicitar Cancelamento'
                    )}
                    {loading ? ' Carregando...' : ''}
                  </Button>
                )}
                <Link
                  to={
                    selectedAgendamento && selectedAgendamento.pagamento
                      ? `/gerenciarPagamentos?pagamentoId=${selectedAgendamento.pagamento.id}`
                      : "#"
                  }
                  className="btn btn-info text-decoration-none"
                >
                  <i className="bi bi-wallet2"></i> Pagamento
                </Link>


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

                <option value="negar">Negar</option>
                <option value="nao_compareceu">Não Compareceu</option>
                <option value="remarcado">Remarcado</option>
                <option value="concluido">Concluido</option>
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
