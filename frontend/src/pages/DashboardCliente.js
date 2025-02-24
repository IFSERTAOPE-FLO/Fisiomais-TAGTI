import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Table,
  Badge,
  Alert,
  Modal,
  Button
} from 'react-bootstrap';
import Perfil from "./Perfil";
import { Link } from "react-router-dom";

const DashboardClientes = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [erro, setErro] = useState(null);
  const [showPerfil, setShowPerfil] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Buscar agendamentos
        const agendamentosRes = await axios.get('http://localhost:5000/agendamentos/listar_agendamentos', { headers });
        const agora = new Date();
        const proximosAgendamentos = agendamentosRes.data
          .filter(agendamento => new Date(agendamento.data) >= agora)
          .sort((a, b) => new Date(a.data) - new Date(b.data))
          .slice(0, 5);
        setAgendamentos(proximosAgendamentos);

        // Buscar pagamentos
        const pagamentosRes = await axios.get('http://localhost:5000/pagamentos/listar', { headers });
        setPagamentos(pagamentosRes.data.pagamentos || []);

        // Buscar serviços
        const servicosRes = await axios.get('http://localhost:5000/servicos/listar_servicos', { headers });
        setServicos(servicosRes.data || []);

        // Buscar aulas de pilates
        const aulasRes = await axios.get('http://localhost:5000/pilates/cliente/minhas_aulas', { headers });
        setAulas(aulasRes.data || []);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setErro('Erro ao carregar dados. Tente recarregar a página.');
      }
    };

    fetchData();
  }, []);


  // Funções para abrir e fechar o Modal de edição do perfil
  const handleOpenPerfil = () => setShowPerfil(true);
  const handleClosePerfil = () => setShowPerfil(false);

  return (
    <Container className="mt-4">
      {/* Botão para exibir o formulário de edição de perfil */}

      <div className="row align-items-center mb-3">
        <div className="col-4"></div>
        <div className="col-4 text-center text-secondary">
          <h2 className="mb-0">
            <i className="bi bi-clipboard-check me-2"></i>
            Dashboard do Cliente
          </h2>
        </div>
        <div className="col-4 text-end">
          <button className='btn btn-login' onClick={handleOpenPerfil}>
            <i className="bi bi-person-circle me-2"></i> Editar Perfil
          </button>
        </div>
      </div>

      {erro && <Alert variant="danger">{erro}</Alert>}

      <Row className="g-4">
        {/* Agendamentos Futuros */}
        <Col md={6} lg={4}>
          <Card>
            <Card.Header className="d-flex align-items-center">
              <i className="bi bi-calendar-event me-2"></i>
              <span>Agendamentos Futuros</span>
            </Card.Header>
            <ListGroup variant="flush">
              {agendamentos.length ? (
                agendamentos.map((agendamento) => (
                  <ListGroup.Item key={agendamento.id} className="d-flex justify-content-between">
                    <div>
                      <strong>{agendamento.servico}</strong>
                      <div className="text-muted small">
                        {new Date(agendamento.data).toLocaleDateString("pt-BR", {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    <Badge bg={agendamento.status.toLowerCase() === "confirmado" ? "success" : "info"} className="d-flex align-items-center justify-content-center">
                      {agendamento.status.charAt(0).toUpperCase() + agendamento.status.slice(1)}
                    </Badge>
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item className="text-muted">Nenhum agendamento</ListGroup.Item>
              )}
            </ListGroup>
            <Card.Footer className="text-center mt-3">
              <Link className="btn btn-signup" to="/clientepage?opcaoSelecionada=CalendarioInterativo">
                <i className="bi bi-calendar-event"></i>
                <span> Ver Calendário</span>
              </Link>
            </Card.Footer>
          </Card>
        </Col>


        {/* Histórico de Pagamentos */}
        <Col md={6} lg={4}>
          <Card>
            <Card.Header className="d-flex align-items-center">
              <i className="bi bi-cash-coin me-2"></i>
              <span>Histórico de Pagamentos</span>
            </Card.Header>
            <ListGroup
              variant="flush"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {pagamentos.length ? (
                pagamentos.map((pagamento) => (
                  <ListGroup.Item key={pagamento.id_pagamento} className="d-flex justify-content-between">
                    <div>
                      <strong>{pagamento.servico.nome}</strong>
                      <div className="text-muted small">
                        {pagamento.data_pagamento
                          ? new Date(pagamento.data_pagamento).toLocaleDateString("pt-BR")
                          : "Pagamento Pendente"}
                      </div>

                    </div>
                    <div>
                      <Badge bg={pagamento.status === 'pago' ? 'success' : 'warning'}>
                        R$ {pagamento.valor}
                      </Badge>
                    </div>
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item className="text-muted">Nenhum pagamento</ListGroup.Item>
              )}

            </ListGroup>
          </Card>
        </Col>


        {/* Serviços Disponíveis */}
        <Col md={6} lg={4}>
          <Card>
            <Card.Header className="d-flex align-items-center">
              <i className="bi bi-person-workspace me-2"></i>
              <span>Serviços Disponíveis</span>
            </Card.Header>
            <div className="accordion" id="servicosAccordion">
              {servicos.map((servico) => {
                const safeNomeServico = servico.Nome_servico.replace(/\s+/g, "-"); // Substitui espaços por hífen para evitar erros no ID

                return (
                  <div className="accordion-item" key={safeNomeServico}>
                    <h2 className="accordion-header" id={`heading-${safeNomeServico}`}>
                      <button
                        className="accordion-button collapsed small d-flex align-items-center"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#collapse-${safeNomeServico}`}
                        aria-expanded="false"
                        aria-controls={`collapse-${safeNomeServico}`}
                        style={{ fontSize: "0.775rem", fontWeight: "bold", padding: "8px 12px" }}
                      >
                        <span>{servico.Nome_servico}</span>
                        <Badge bg="secondary" className="ms-auto" style={{ fontSize: "0.75rem" }}>
                          {servico.Tipos}
                        </Badge>
                      </button>
                    </h2>

                    <div
                      id={`collapse-${safeNomeServico}`}
                      className="accordion-collapse collapse"
                      aria-labelledby={`heading-${safeNomeServico}`}
                      data-bs-parent="#servicosAccordion"
                    >
                      <div className="accordion-body text-muted small" style={{ fontSize: "0.75rem" }}>
                        {servico.Descricao}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>


        {/* Aulas de Pilates */}
        <Col xs={12}>
          <Card className="mt-4">
            <Card.Header>
              <h5 className="mb-0">Minhas Aulas de Pilates</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
              {aulas.length > 0 ? (
                <div className="accordion" id="aulasAccordion">
                  {aulas.map((aula) => (
                    <div className="accordion-item" key={aula.id_aula}>
                      <h2 className="accordion-header" id={`heading-${aula.id_aula}`}>
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#collapse-${aula.id_aula}`}
                          aria-expanded="false"
                          aria-controls={`collapse-${aula.id_aula}`}
                        >
                          <div className="d-flex flex-column gap-2 w-100">
                            {/* Cabeçalho Principal */}
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{aula.dia_semana}</strong>
                                <br />
                                {aula.hora_inicio} - {aula.hora_fim}
                              </div>
                              <Badge
                                bg={aula.num_alunos >= aula.limite_alunos ? 'danger' : 'success'}
                                className="fs-6"
                              >
                                {aula.num_alunos}/{aula.limite_alunos}
                              </Badge>
                            </div>

                            {/* Detalhes da Aula */}
                            <div className="d-flex flex-wrap gap-3">
                              {/* Instrutor */}
                              <div className="d-flex align-items-center gap-1">
                                <i className="bi bi-person-badge text-muted"></i>
                                <span>{aula.colaborador?.nome || 'N/A'}</span>
                              </div>

                              {/* Clínica */}
                              <div className="d-flex align-items-center gap-1">
                                <i className="bi bi-geo-alt text-muted"></i>
                                <span>{aula.clinica || 'N/A'}</span>
                              </div>

                              {/* Serviço */}
                              <div className="d-flex align-items-center gap-1">
                                <i className="bi bi-clipboard-check text-muted"></i>
                                <span>{aula.servico}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      </h2>

                      {/* Corpo Expandível */}
                      <div
                        id={`collapse-${aula.id_aula}`}
                        className="accordion-collapse collapse"
                        aria-labelledby={`heading-${aula.id_aula}`}
                        data-bs-parent="#aulasAccordion"
                      >
                        <div className="accordion-body">
                          <div className="d-flex flex-column gap-2">
                            <div>
                              <strong>Data de Inscrição:</strong>{' '}
                              {new Date(aula.data_inscricao).toLocaleDateString()}
                            </div>
                            <div>
                              <strong>Status:</strong>{' '}
                              <Badge
                                bg={aula.num_alunos >= aula.limite_alunos ? 'danger' : 'success'}
                                className="text-uppercase"
                              >
                                {aula.num_alunos >= aula.limite_alunos ? 'Lotado' : 'Disponível'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  Nenhuma aula de pilates agendada
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal para edição do Perfil */}
      <Modal show={showPerfil} onHide={handleClosePerfil} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar Perfil</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Perfil />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default DashboardClientes;
