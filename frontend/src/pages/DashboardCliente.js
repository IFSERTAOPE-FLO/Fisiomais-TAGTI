import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, ListGroup, Table, Badge, Alert } from 'react-bootstrap';

const DashboardClientes = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch agendamentos
        const agendamentosRes = await axios.get('http://localhost:5000/agendamentos/listar_agendamentos', { headers });
        setAgendamentos(agendamentosRes.data.length ? agendamentosRes.data : []);

        // Fetch pagamentos
        const pagamentosRes = await axios.get('http://localhost:5000/pagamentos/listar', { headers });
        setPagamentos(pagamentosRes.data.pagamentos || []);

        // Fetch serviços
        const servicosRes = await axios.get('http://localhost:5000/servicos/listar_servicos', { headers });
        setServicos(servicosRes.data || []);

        // Fetch aulas de pilates
        const aulasRes = await axios.get('http://localhost:5000/pilates/cliente/minhas_aulas', { headers });
        setAulas(aulasRes.data || []);

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setErro('Erro ao carregar dados. Tente recarregar a página.');
      }
    };

    fetchData();
  }, []);

  return (
    <Container  className="mt-4">
      <h2 className="mb-4 text-center text-secondary">
        <i className="bi bi-clipboard-check me-2"></i>
        Dashboard do Cliente
      </h2>

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
                      <div className="text-muted small">{agendamento.data}</div>
                    </div>
                    <Badge bg="info">Agendado</Badge>
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
            <ListGroup variant="flush">
              {servicos.map((servico) => (
                <ListGroup.Item key={servico.id}>
                  <div className="d-flex justify-content-between">
                    <span>{servico.nome}</span>
                    <Badge bg="secondary">{servico.categoria}</Badge>
                  </div>
                  {servico.descricao && (
                    <div className="text-muted small mt-1">{servico.descricao}</div>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
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
    </Container>
  );
};

export default DashboardClientes;