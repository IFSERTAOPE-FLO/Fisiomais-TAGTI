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
                    <Badge bg="info" className="d-flex align-items-center justify-content-center">
                      {agendamento.status.charAt(0).toUpperCase() + agendamento.status.slice(1)}
                    </Badge>
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item className="text-muted">Nenhum agendamento</ListGroup.Item>
              )}
            </ListGroup>

          </Card>
        </Col>

        {/* Histórico de Pagamentos */}
        <Col md={6} lg={4}>
          <Card>
            <Card.Header className="d-flex align-items-center">
              <i className="bi bi-cash-coin me-2"></i>
              <span>Histórico de Pagamentos</span>
            </Card.Header>
            <ListGroup variant="flush">
              {pagamentos.length ? (
                pagamentos.map((pagamento) => (
                  <ListGroup.Item key={pagamento.id} className="d-flex justify-content-between">
                    <div>
                      <strong>{pagamento.servico}</strong>
                      <div className="text-muted small">{new Date(pagamento.data).toLocaleDateString()}</div>
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
              {servicos.map((servico, index) => (
                <div className="accordion-item" key={servico.id}>
                  <h2 className="accordion-header" id={`heading-${index}`}>
                    <button
                      className="accordion-button collapsed small"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#collapse-${index}`}
                      aria-expanded="false"
                      aria-controls={`collapse-${index}`}
                      style={{ fontSize: "0.775rem", fontWeight: "bold", padding: "8px 12px" }}
                    >
                      <span className="me-2">{servico.Nome_servico}</span>
                      <Badge bg="secondary" style={{ fontSize: "0.75rem" }}>{servico.Tipos}</Badge>
                    </button>
                  </h2>
                  <div
                    id={`collapse-${index}`}
                    className="accordion-collapse collapse"
                    aria-labelledby={`heading-${index}`}
                    data-bs-parent="#servicosAccordion"
                  >
                    <div className="accordion-body text-muted small" style={{ fontSize: "0.75rem" }}>
                      {servico.Descricao}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Aulas de Pilates */}
        <Col xs={12}>
          <Card className="mt-4">
            <Card.Header>
              <h5 className="mb-0">Minhas Aulas de Pilates</h5>
            </Card.Header>
            <Card.Body>
              {aulas.length > 0 ? (
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>Dia</th>
                      <th>Horário</th>
                      <th>Instrutor</th>
                      <th>Clínica</th>
                      <th>Serviço</th>
                      <th>Inscrição</th>
                      <th>Vagas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aulas.map((aula) => (
                      <tr key={aula.id_aula}>
                        <td>{aula.dia_semana}</td>
                        <td>{aula.hora_inicio} - {aula.hora_fim}</td>
                        <td>{aula.colaborador?.nome || 'N/A'}</td>
                        <td>{aula.clinica || 'N/A'}</td>
                        <td>{aula.servico}</td>
                        <td>{new Date(aula.data_inscricao).toLocaleDateString()}</td>
                        <td>
                          <Badge bg={aula.num_alunos >= aula.limite_alunos ? 'danger' : 'success'}>
                            {aula.num_alunos}/{aula.limite_alunos}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
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
