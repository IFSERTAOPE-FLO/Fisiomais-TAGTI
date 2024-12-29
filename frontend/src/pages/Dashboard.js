import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Container, Row, Col, Card, ListGroup } from 'react-bootstrap';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardOverview = () => {
  const [dashboardData, setDashboardData] = useState({
    total_agendamentos: 0,
    total_clientes: 0,
    total_colaboradores: 0,
    total_servicos: 0,
    total_receita: '0',
  });
  
  const [servicosData, setServicosData] = useState([]);
  const [agendamentosPorClinica, setAgendamentosPorClinica] = useState([]);
  const [agendamentosPorColaborador, setAgendamentosPorColaborador] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const overviewResponse = await axios.get('http://localhost:5000/dashboards/overview', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setDashboardData(overviewResponse.data);

        const servicosResponse = await axios.get('http://localhost:5000/dashboards/servicos/populares', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setServicosData(servicosResponse.data);

        const clinicaResponse = await axios.get('http://localhost:5000/dashboards/agendamentos_por_clinica', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setAgendamentosPorClinica(clinicaResponse.data);

        const colaboradorResponse = await axios.get('http://localhost:5000/dashboards/agendamentos_por_colaborador', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setAgendamentosPorColaborador(colaboradorResponse.data);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const overviewData = {
    labels: ['Agendamentos', 'Clientes', 'Colaboradores', 'Serviços'],
    datasets: [
      {
        label: 'Totais',
        data: [
          dashboardData.total_agendamentos,
          dashboardData.total_clientes,
          dashboardData.total_colaboradores,
          dashboardData.total_servicos,
        ],
        backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'],
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  };

  const generateRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const servicosPopularesData = {
    labels: Object.keys(servicosData),
    datasets: [
      {
        label: 'Serviços Populares',
        data: Object.values(servicosData),
        backgroundColor: Object.keys(servicosData).map(() => generateRandomColor()),
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  };

  const agendamentosClinicaData = {
    labels: Object.keys(agendamentosPorClinica),
    datasets: [
      {
        label: 'Agendamentos por Clínica',
        data: Object.values(agendamentosPorClinica),
        backgroundColor: '#36b9cc',
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  };

  const agendamentosColaboradorData = {
    labels: Object.keys(agendamentosPorColaborador),
    datasets: [
      {
        label: 'Agendamentos por Colaborador',
        data: Object.values(agendamentosPorColaborador),
        backgroundColor: '#f6c23e',
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Container className="my-2">
      <Row>
        <Col md={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h3>Dashboard Overview</h3>
            </Card.Header>
            <Card.Body>
              <Bar data={overviewData} options={options} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow">
            <Card.Header className="bg-warning text-white">
              <h3>Receita Total</h3>
            </Card.Header>
            <Card.Body>
              <h4>R$ {dashboardData.total_receita}</h4>
            </Card.Body>
          </Card>
          <Card className="shadow mt-3">
            <Card.Header className="bg-info text-white">
              <h4>Informações</h4>
            </Card.Header>
            <Card.Body>
              <ListGroup>
                <ListGroup.Item>
                  <strong>Total de Agendamentos:</strong> {dashboardData.total_agendamentos}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Total de Clientes:</strong> {dashboardData.total_clientes}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Total de Colaboradores:</strong> {dashboardData.total_colaboradores}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Total de Serviços:</strong> {dashboardData.total_servicos}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <Card className="shadow">
            <Card.Header className="bg-info text-white">
              <h4>Serviços Populares</h4>
            </Card.Header>
            <Card.Body>
              <Pie data={servicosPopularesData} options={options} />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow">
            <Card.Header className="bg-success text-white">
              <h4>Agendamentos por Clínica</h4>
            </Card.Header>
            <Card.Body>
              <Bar data={agendamentosClinicaData} options={options} />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mt-4">
          <Card className="shadow">
            <Card.Header className="bg-danger text-white">
              <h4>Agendamentos por Colaborador</h4>
            </Card.Header>
            <Card.Body>
              <Bar data={agendamentosColaboradorData} options={options} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardOverview;
