import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Container, Row, Col, Card, ListGroup, Alert, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faUsers, faUserMd, faClinicMedical} from '@fortawesome/free-solid-svg-icons';

import "react-calendar/dist/Calendar.css";

// Registrar elementos necessários no Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Constantes de configuração
const CHART_COLORS = {
  primary: '#4e73df',
  success: '#1cc88a',
  info: '#36b9cc',
  warning: '#f6c23e',
  danger: '#e74a3b'
};

const LoadingSpinner = () => (
  <div className="text-center my-5">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Carregando...</span>
    </div>
    <p className="mt-2">Carregando dados...</p>
  </div>
);

const MetricCard = ({ title, value, icon, color }) => (
  <Col md={3} className="mb-4">
    <Card className={`border-left-${color} shadow h-100 py-2`}>
      <Card.Body>
        <Row className="no-gutters align-items-center">
          <Col className="col-auto mr-3">
            <FontAwesomeIcon icon={icon} className={`fa-2x text-${color}`} />
          </Col>
          <Col>
            <div className="text-xs font-weight-bold text-uppercase mb-1">
              {title}
            </div>
            <div className="h5 mb-0 font-weight-bold text-gray-800">
              {value}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  </Col>
);

const DashboardOverview = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [servicosData, setServicosData] = useState({});
  const [agendamentosData, setAgendamentosData] = useState({ clinica: {}, colaborador: {} });
  const [receitaPorMes, setReceitaPorMes] = useState({});
  const [filtro, setFiltro] = useState({ tipo: 'todos', mesUnico: '', intervalo: { inicio: '', fim: '' } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showServicosPopulares, setShowServicosPopulares] = useState(false);
  const [showAgendamentosClinica, setShowAgendamentosClinica] = useState(false);
  const [showAgendamentosColaborador, setShowAgendamentosColaborador] = useState(false);

  const savedRole = localStorage.getItem("role");

  const getColorPalette = (length) => {
    const palette = Object.values(CHART_COLORS);
    return Array.from({ length }, (_, i) => palette[i % palette.length]);
  };

  const handleError = (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          setError('Acesso negado. Permissões insuficientes.');
          break;
        case 500:
          setError('Erro interno do servidor. Tente novamente mais tarde.');
          break;
        default:
          setError('Ocorreu um erro inesperado.');
      }
    } else {
      setError('Não foi possível conectar ao servidor. Verifique sua conexão.');
    }
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Fisiomais - Dashboards";

    if (savedRole === "cliente") return;

    const fetchData = async () => {
      try {
        const endpoints = [
          'overview',
          'servicos/populares',
          'agendamentos_por_clinica',
          'agendamentos_por_colaborador',
          'receita_por_mes'
        ];

        const responses = await Promise.all(
          endpoints.map(endpoint =>
            axios.get(`http://localhost:5000/dashboards/${endpoint}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
          )
        );

        setDashboardData(responses[0].data);
        setServicosData(responses[1].data);
        setAgendamentosData({
          clinica: responses[2].data,
          colaborador: responses[3].data
        });
        setReceitaPorMes(responses[4].data);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [savedRole]);

  const generateChartData = (labels, data, label, color) => ({
    labels,
    datasets: [{
      label,
      data,
      backgroundColor: getColorPalette(labels.length),
      borderColor: '#fff',
      borderWidth: 1
    }]
  });

  const chartOptions = (title) => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: title },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: R$ ${ctx.raw?.toFixed(2) || 0}`
        }
      }
    },
    scales: { y: { beginAtZero: true } }
  });

  const handleFilterChange = (newFilter) => {
    setFiltro(prev => ({ ...prev, ...newFilter }));
  };

  const filteredRevenueData = () => {
    const meses = Object.keys(receitaPorMes).sort((a, b) => {
      const [ma, aa] = a.split('/').map(Number);
      const [mb, ab] = b.split('/').map(Number);
      return new Date(aa, ma) - new Date(ab, mb);
    });

    switch (filtro.tipo) {
      case 'mes-unico':
        return { [filtro.mesUnico]: receitaPorMes[filtro.mesUnico] || 0 };
      case 'intervalo':
        const start = meses.indexOf(filtro.intervalo.inicio);
        const end = meses.indexOf(filtro.intervalo.fim);
        return meses.slice(start, end + 1).reduce((acc, mes) => {
          acc[mes] = receitaPorMes[mes];
          return acc;
        }, {});
      default:
        return receitaPorMes;
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <Alert variant="danger" className="mt-4">
      {error}
      <Button variant="link" onClick={() => window.location.reload()}>
        Tentar novamente
      </Button>
    </Alert>
  );

  return (
    <Container className="my-4">
      <Row className="mb-4">
        <MetricCard
          title="Agendamentos"
          value={dashboardData.total_agendamentos}
          icon={faCalendarAlt}
          color="primary"
        />
        <MetricCard
          title="Clientes"
          value={dashboardData.total_clientes}
          icon={faUsers}
          color="success"
        />
        <MetricCard
          title="Colaboradores"
          value={dashboardData.total_colaboradores}
          icon={faUserMd}
          color="info"
        />
        <MetricCard
          title="Clínicas"
          value={dashboardData.total_clinicas}
          icon={faClinicMedical}
          color="warning"
        />
      </Row>

      <Row className="mb-4">
        <Col md={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h4>Desempenho Financeiro</h4>
            </Card.Header>
            <Card.Body>
              <Line
                data={generateChartData(
                  Object.keys(filteredRevenueData()),
                  Object.values(filteredRevenueData()),
                  'Receita Mensal',
                  CHART_COLORS.primary
                )}
                options={chartOptions('Receita Mensal (R$)')}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow h-100">
            <Card.Header className="bg-success text-white">
              <h4>Resumo Financeiro</h4>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Receita Total:</strong> R$ {dashboardData.total_receita}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Média Mensal:</strong> R$ {dashboardData.media_mensal_ano_atual}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Último Mês:</strong> R$ {dashboardData.receita_ultimo_mes}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Último Ano:</strong> R$ {dashboardData.receita_ultimo_ano}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Button
            variant="info"
            className="me-2"
            onClick={() => setShowServicosPopulares(!showServicosPopulares)}
          >
            {showServicosPopulares ? 'Ocultar Serviços Populares' : 'Exibir Serviços Populares'}
          </Button>
          <Button
            variant="success"
            className="me-2"
            onClick={() => setShowAgendamentosClinica(!showAgendamentosClinica)}
          >
            {showAgendamentosClinica ? 'Ocultar Agendamentos por Clínica' : 'Exibir Agendamentos por Clínica'}
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowAgendamentosColaborador(!showAgendamentosColaborador)}
          >
            {showAgendamentosColaborador ? 'Ocultar Agendamentos por Colaborador' : 'Exibir Agendamentos por Colaborador'}
          </Button>
        </Col>
      </Row>

      {showServicosPopulares && (
        <Row className="mb-4">
          <Col md={6}>
            <Card className="shadow">
              <Card.Header className="bg-info text-white">
                <h4>Serviços Populares</h4>
              </Card.Header>
              <Card.Body>
                <Pie
                  data={generateChartData(
                    Object.keys(servicosData),
                    Object.values(servicosData),
                    'Agendamentos por Serviço'
                  )}
                  options={chartOptions('Distribuição de Serviços')}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {showAgendamentosClinica && (
        <Row className="mb-4">
          <Col md={6}>
            <Card className="shadow">
              <Card.Header className="bg-success text-white">
                <h4>Agendamentos por Clínica</h4>
              </Card.Header>
              <Card.Body>
                <Bar
                  data={generateChartData(
                    Object.keys(agendamentosData.clinica),
                    Object.values(agendamentosData.clinica),
                    'Agendamentos'
                  )}
                  options={chartOptions('Distribuição por Clínica')}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {showAgendamentosColaborador && (
        <Row className="mb-4">
          <Col md={6}>
            <Card className="shadow">
              <Card.Header className="bg-danger text-white">
                <h4>Agendamentos por Colaborador</h4>
              </Card.Header>
              <Card.Body>
                <Bar
                  data={generateChartData(
                    Object.keys(agendamentosData.colaborador),
                    Object.values(agendamentosData.colaborador),
                    'Agendamentos'
                  )}
                  options={chartOptions('Distribuição por Colaborador')}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default DashboardOverview;