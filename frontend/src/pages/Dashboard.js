import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Container, Row, Col, Card, ListGroup } from 'react-bootstrap';
import { Form } from 'react-bootstrap';
import Calendar from 'react-calendar'; // Import the Calendar component
import "react-calendar/dist/Calendar.css"; // Import Calendar's CSS for styling


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
  const [receitaPorMes, setReceitaPorMes] = useState({});
  // Declare missing state variables
  const [mesSelecionado, setMesSelecionado] = useState(''); // Month selected
  const [mesInicio, setMesInicio] = useState(''); // Start month
  const [mesFim, setMesFim] = useState(''); // End month
  const savedRole = localStorage.getItem("role");
  useEffect(() => {
    document.title = "Fisiomais - Dashboards ";
}, []);

  useEffect(() => {
    if (savedRole === "cliente")  {
      
      return; 
    }
  
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
  
        const receitaMensalResponse = await axios.get('http://localhost:5000/dashboards/receita_por_mes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setReceitaPorMes(receitaMensalResponse.data);
  
      } catch (error) {
        if (error.response && error.response.status === 401) {
          alert('Sua sessão expirou. Por favor, faça login novamente.');
          localStorage.removeItem('token'); // Remove o token inválido
          window.location.href = '/login'; // Redireciona para a página de login
        } else {
          console.error('Erro ao buscar dados do dashboard:', error);
        }
      }
    };
  
    fetchDashboardData();
  }, []);
  


  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const mesAtual = new Date().getMonth(); // Mês atual, de 0 (Janeiro) a 11 (Dezembro)
  const mesUltimo = mesAtual === 0 ? 11 : mesAtual - 1; // Mês anterior (se Janeiro, pega Dezembro)

  const overviewData = {
    labels: [
      'Agendamentos',
      'Clientes',
      'Colaboradores',
      'Serviços',
      'Clínicas'  // Adicionando clínicas
    ],
    datasets: [
      {
        label: 'Totais',
        data: [
          dashboardData.total_agendamentos,
          dashboardData.total_clientes,
          dashboardData.total_colaboradores,
          dashboardData.total_servicos,
          dashboardData.total_clinicas,  // Exibindo o total de clínicas
        ],
        backgroundColor: [
          '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e',  // Dados de agendamentos, clientes, colaboradores e serviços
          '#f39c12',  // Receita Total
          '#3498db',  // Receita Ano Atual
          '#e74c3c',  // Receita Mês Atual
          '#2ecc71',  // Receita Último Ano
          '#9b59b6',  // Receita Último Mês
          '#8e44ad',  // Cor para Clínicas
        ],
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


  const receitaFiltrada = (() => {
    if (mesSelecionado) {
      // Retorna apenas o mês específico selecionado
      return { [mesSelecionado]: receitaPorMes[mesSelecionado] || 0 };
    }

    if (!mesInicio && !mesFim) {
      return receitaPorMes; // Nenhum intervalo selecionado
    }

    // Ordena os meses disponíveis de forma crescente (levando em consideração mês/ano)
    const meses = Object.keys(receitaPorMes).sort((a, b) => {
      const [mesA, anoA] = a.split('/').map(Number);
      const [mesB, anoB] = b.split('/').map(Number);
      return anoA === anoB ? mesA - mesB : anoA - anoB;
    });

    const inicioIndex = mesInicio ? meses.indexOf(mesInicio) : 0;
    const fimIndex = mesFim ? meses.indexOf(mesFim) : meses.length - 1;

    // Retorna os meses dentro do intervalo
    return meses
      .slice(inicioIndex, fimIndex + 1)
      .reduce((acc, mes) => {
        acc[mes] = receitaPorMes[mes];
        return acc;
      }, {});
  })();


  const FiltroMesCalendario = ({ setMesSelecionado, setMesInicio, setMesFim }) => {
    const handleDateChange = (date) => {
      const selectedMonth = date.getMonth(); // Pega o mês selecionado (0 - janeiro, 11 - dezembro)
      const selectedYear = date.getFullYear(); // Pega o ano selecionado

      // Converte a data selecionada para o nome do mês no formato 'mm/yyyy'
      const monthString = `${selectedMonth + 1 < 10 ? '0' : ''}${selectedMonth + 1}/${selectedYear}`;

      // Atualiza os estados com o mês selecionado
      setMesSelecionado(monthString); // Mês selecionado como "mm/yyyy"

      // Configura mesInicio e mesFim para o intervalo de um único mês
      setMesInicio(monthString); // Início e fim do intervalo são o mesmo mês
      setMesFim(monthString);     // Isso garante que o gráfico mostre apenas esse mês
    };

    return (
      <Container className="d-flex justify-content-center align-items-center" >
        <div>
          <Calendar
            onChange={handleDateChange}
            view="year" // Exibe o calendário por anos
            minDetail="year" // A partir do nível de visualização de ano
            maxDetail="year" // Limita a visualização para ano, sem mostrar os dias
            showNavigation={true} // Permite navegação entre anos
            showNeighboringMonth={false} // Remove os meses vizinhos
            minDate={new Date(2020, 0, 1)} // Limita a seleção a partir de janeiro de 2020, pode ser alterado conforme necessário
          />
        </div>
      </Container>
    );
  };






  // Dados do Gráfico Atualizados
  const receitaMensalData = {
    labels: Object.keys(receitaFiltrada),
    datasets: [
      {
        label: 'Receita por Mês (R$)',
        data: Object.values(receitaFiltrada),
        backgroundColor: '#4e73df',
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  };

  // Meses disponíveis
  const mesesDisponiveis = Object.keys(receitaPorMes);



  return (
    <Container className="my-2 text-center">
      <Row className="mt-9">
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
              <Row className="mt-9 justify-content-center">
                <Col xs={12}>
                  <div className="text-center mb-2">
                    <small className="text-muted"> Ano atual ({new Date().getFullYear()})</small>
                  </div>
                  <h4 className="text-success text-center font-weight-bold bg-light p-2 rounded shadow-sm d-flex flex-column align-items-center">

                    <span className="ml-2">R$ {dashboardData.receita_ano_atual}</span>
                  </h4>
                </Col>

              </Row>

              <Row className="mt-9">
                <Col xs={12} md={6}>
                  <div className="text-center mb-2">
                    <small className="text-muted"> Mês atual ({new Date().toLocaleString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() + new Date().toLocaleString('pt-BR', { month: 'long' }).slice(1)})</small>
                  </div>
                  <h4 className="text-success text-center font-weight-bold bg-light p-1 rounded shadow-sm d-flex flex-column align-items-center">

                    <span>R$ {dashboardData.receita_mes_atual}</span>
                  </h4>

                </Col>

                <Col xs={12} md={6}>
                  <div className="text-center mb-2">
                    <small className="text-muted">
                      Último Mês ({new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())})
                    </small>
                  </div>
                  <h4 className="text-info text-center font-weight-bold bg-light p-1 rounded shadow-sm d-flex flex-column align-items-center">

                    <span>R$ {dashboardData.receita_ultimo_mes}</span>
                  </h4>
                </Col>
              </Row>
              <Row className="mt-9 justify-content-center">
                <Col xs={12} md={6}>
                <small className="text-muted mt-2">Média mensal de {new Date().getFullYear()}</small> {/* Exibir média mensal */}
                  <h4 className="text-success text-center font-weight-bold bg-light p-1 rounded shadow-sm d-flex flex-column align-items-center">
                    <span>R$ {dashboardData.receita_mes_atual}</span>
                    
                  </h4>
                </Col>
                </Row>
              <Row className="mt-9">
                <Col xs={12} md={6}>
                  <div className="text-center mb-2">
                    <small className="text-muted"> Último Ano ({new Date().getFullYear() - 1})</small>
                  </div>
                  <h4 className="text-warning text-center font-weight-bold bg-light p-2 rounded shadow-sm d-flex flex-column align-items-center">
                    <span>R$ {dashboardData.receita_ultimo_ano}</span>
                  </h4>
                </Col>
                <Col xs={12} md={6}>
                  <div className="text-center mb-2">
                    <small className=" text-muted">Total acumulado</small>
                  </div>
                  <h4 className="text-danger text-center font-weight-bold bg-light p-2 rounded shadow-sm d-flex flex-column align-items-center">

                    <span>R$ {dashboardData.total_receita}</span>
                  </h4>
                </Col>
              </Row>


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
                <ListGroup.Item>
                  <strong>Total de Clinicas:</strong> {dashboardData.total_clinicas}
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
              <h4 >Serviços Populares</h4>
            </Card.Header>
            <Card.Body>
              <Pie data={servicosPopularesData} options={options} />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow">
            <Form>
              {/* Filtro por Mês Específico */}
              <Form.Group controlId="filtroMesEspecifico">
                <Form.Label className='text-center'>Selecionar um Mês Específico</Form.Label>
                <FiltroMesCalendario
                  setMesSelecionado={setMesSelecionado}
                  setMesInicio={setMesInicio}
                  setMesFim={setMesFim}
                />
              </Form.Group>

              <Row className="mt-2">
                {/* Filtro Mês Inicial */}
                <Form.Label className='text-center'>Intervalo entre meses</Form.Label>
                <Col md={6}>

                  <Form.Group controlId="filtroInicio">
                    <Form.Label className='text-center'>Mês Inicial</Form.Label>
                    <Form.Control
                      as="select"
                      value={mesInicio}
                      onChange={(e) => {
                        setMesInicio(e.target.value);
                        setMesSelecionado(''); // Limpa a seleção de mês específico ao selecionar um intervalo
                      }}
                    >
                      <option value="">Todos os Meses</option>
                      {mesesDisponiveis.map((mes) => (
                        <option key={mes} value={mes}>
                          {mes}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>

                {/* Filtro Mês Final */}
                <Col md={6}>
                  <Form.Group controlId="filtroFim">
                    <Form.Label className='text-center'>Mês Final</Form.Label>
                    <Form.Control
                      as="select"
                      value={mesFim}
                      onChange={(e) => {
                        setMesFim(e.target.value);
                        setMesSelecionado(''); // Limpa a seleção de mês específico ao selecionar um intervalo
                      }}
                    >
                      <option value="">Todos os Meses</option>
                      {mesesDisponiveis.map((mes) => (
                        <option key={mes} value={mes}>
                          {mes}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>
            </Form>

            <Card.Header className="bg-primary text-white">
              <h4>Receita Mensal</h4>
            </Card.Header>
            <Card.Body>
              {/* Gráfico */}
              <Bar data={receitaMensalData} options={options} />
            </Card.Body>
          </Card>
        </Col>
      </Row>


      <Row className="mt-4">

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
        <Col md={6}>
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

