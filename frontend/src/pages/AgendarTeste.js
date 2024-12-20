import React, { useState, useEffect, useCallback } from 'react';
import '../css/CriarAgendamento.css'; // Importar o arquivo CSS para estilos
import '../css/Estilos.css'; // Importar o arquivo CSS para estilos
import Calendar from 'react-calendar'; // Biblioteca React-Calendar
import 'react-calendar/dist/Calendar.css'; // Estilos do React-Calendar


function AgendarTeste() {
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [servico, setServico] = useState('');
  const [colaborador, setColaborador] = useState('');
  const [cliente, setCliente] = useState('');
  const [servicos, setServicos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [role, setRole] = useState('');
  const [planos, setPlanos] = useState([]);
  const [tipoServico, setTipoServico] = useState('');
  const [valorServico, setValorServico] = useState(0)
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [planoSelecionado, setPlanoSelecionado] = useState('');
  const [loading, setLoading] = useState(false); // Estado para o carregamento
  const [diasPermitidos, setDiasPermitidos] = useState([]);
  const [feriados, setFeriados] = useState([]);

  useEffect(() => {
    const savedRole = localStorage.getItem('role');
    setRole(savedRole);

    if (savedRole === 'cliente') {
      const userId = localStorage.getItem('userId');
      setCliente(userId);
      console.log('ID do cliente logado:', userId);
    }

    if (savedRole === 'colaborador') {
      const userId = localStorage.getItem('userId');
      setColaborador(userId); // Define automaticamente o colaborador logado
      fetchHorariosColaborador(userId); // Carrega os horários do colaborador logado
    }

    fetchServicos();
    fetchClientes();
    fetchFeriados();
  }, []);

  const fetchServicos = async () => {
    try {
      const response = await fetch('http://localhost:5000/servicos/listar_servicos');
      if (response.ok) {
        const servicosData = await response.json();
        setServicos(servicosData);
      } else {
        console.error('Erro ao buscar serviços');
      }
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    }
  };

  const fetchFeriados = () => {
    // Exemplo de feriados nacionais
    setFeriados([
      '2024-01-01', // Ano Novo
      '2024-04-21', // Tiradentes
      '2024-05-01', // Dia do Trabalho
      '2024-09-07', // Independência do Brasil
      '2024-12-25', // Natal
    ]);
  };




  const fetchColaboradores = useCallback(async () => {
    if (servico) {
      try {
        const response = await fetch(`http://localhost:5000/colaboradores?servico_id=${servico}`);
        if (response.ok) {
          setColaboradores(await response.json());
        } else {
          console.error('Erro ao buscar colaboradores');
        }
      } catch (error) {
        console.error('Erro ao buscar colaboradores:', error);
      }
    }
  }, [servico]);

  useEffect(() => {
    if (servico) {
      fetchColaboradores();
      const servicoSelecionado = servicos.find((s) => s.ID_Servico === parseInt(servico));
      if (servicoSelecionado) {
        if (servicoSelecionado.Tipo === 'pilates') {
          setTipoServico('pilates');
          setPlanos(servicoSelecionado.Planos || []);
          setValorServico(0); // Zera o valor para serviços de pilates
        } else if (servicoSelecionado.Tipo === 'fisioterapia') {
          setTipoServico('fisioterapia');
          setValorServico(servicoSelecionado.Valor || 0); // Configura o valor do serviço
          setPlanos([]); // Zera os planos
        } else {
          setTipoServico('');
          setPlanos([]);
          setValorServico(0);
        }
      }
    }
  }, [servico, fetchColaboradores, servicos]);


  useEffect(() => {
    if (colaborador) {
      fetchHorariosColaborador(colaborador);
      fetchHorariosDisponiveis (colaborador);
    }
  }, [colaborador]);

  const fetchHorariosColaborador = async (colaboradorId) => {
    try {
      const response = await fetch(`http://localhost:5000/horarios/horarios-colaborador/${colaboradorId}`);
      if (response.ok) {
        const horarios = await response.json();
        setHorariosDisponiveis(horarios);

        // Extrair dias da semana permitidos (segunda = 1, terça = 2, etc.)
        const dias = horarios.map((h) => h.dia_semana);
        setDiasPermitidos(dias);
      }
    } catch (error) {
      console.error('Erro ao buscar horários do colaborador:', error);
    }
  };
  const fetchHorariosDisponiveis = async (colaboradorId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/agendamentos/horarios-disponiveis/${colaboradorId}`
      );
      if (response.ok) {
        const horarios = await response.json();
        setHorariosDisponiveis(horarios); // Atualiza a lista de horários disponíveis
      } else {
        const errorData = await response.json();
        console.error('Erro ao buscar horários disponíveis:', errorData.message);
      }
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
    }
  };
  

  const fetchClientes = async () => {
    try {
      const response = await fetch('http://localhost:5000/clientes');
      if (response.ok) {
        setClientes(await response.json());
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };


  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    const dataEscolhida = new Date(data);
    dataEscolhida.setDate(dataEscolhida.getDate() + 1);
    const dataFormatada = dataEscolhida.toISOString().split('T')[0];
    const dataHora = `${dataFormatada} ${hora}:00`;

    const agendamentoData = {
      servico_id: servico,
      colaborador_id: colaborador,
      data: dataHora,
      cliente_id: cliente,
      plano_id: planoSelecionado // Adiciona o plano selecionado
    };

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Por favor, faça login para agendar.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/agendamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(agendamentoData),
      });

      if (response.ok) {
        alert('Agendamento realizado com sucesso!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Erro ao agendar a sessão.');
      }
    } catch (error) {
      alert('Erro ao enviar agendamento.');
      console.error('Erro no agendamento:', error);
    }
    setLoading(false);
  };

  const isDateDisabled = (date) => {
    const diaSemana = date.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const dataFormatada = date.toISOString().split('T')[0];

    // Verifica se a data é um feriado ou não está nos dias permitidos
    return !diasPermitidos.includes(diaSemana) || feriados.includes(dataFormatada);
  };

  const handleDateChange = (value) => {
    setData(value.toISOString().split('T')[0]);
  };

  return (
    <div className="container py-5 background-gif">
      <div className="row align-items-center">
        <div className="col-md-5 agendamentoback " >
          <div className="card shadow-lg border-0 ">
            <div className="card-header text-center  rounded-top">
              <h3 className="fw-bold  text-primary ">Agendar atendimento</h3>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="servico" className="form-label">Serviço</label>
                  <select
                    id="servico"
                    className="form-select"
                    value={servico}
                    onChange={(e) => setServico(e.target.value)}
                    required
                  >
                    <option value="">Selecione um serviço</option>
                    {servicos.map((serv) => (
                      <option key={serv.ID_Servico} value={serv.ID_Servico}>
                        {serv.Nome_servico}
                      </option>
                    ))}
                  </select>
                </div>

                {tipoServico === "fisioterapia" && valorServico && (
                  <div className="mb-3">
                    <label htmlFor="valor" className="form-label ">Valor do Serviço</label>
                    <div className=" flex-column  gap-2">
                      <span className="fw-bold btn-plano  mb-2  align-items-center p-2 border btn-plano rounded">{`R$ ${valorServico}`}</span>
                    </div>


                  </div>
                )}

                {tipoServico === 'pilates' && (
                  <div className="mb-3">
                    <label className="form-label">Plano de Pilates</label>
                    <div className="d-flex flex-column  gap-2">
                      {planos.map((plano) => (
                        <div
                          key={plano.ID_Plano}
                          className={`d-flex justify-content-between align-items-center p-3 border btn-plano rounded ${planoSelecionado === plano.ID_Plano ? 'active' : ''}`}
                          onClick={() => setPlanoSelecionado(plano.ID_Plano)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="flex-grow-1">
                            <strong>{plano.Nome_plano}</strong>
                          </div>
                          <div className="text-end">
                            <span className="fw-bold  ">R$ {plano.Valor}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collaborator Selection */}
                {role !== 'colaborador' && (
                  <div className="mb-3">
                    <label htmlFor="colaborador" className="form-label">Colaborador</label>
                    <select
                      id="colaborador"
                      className="form-select"
                      value={colaborador}
                      onChange={(e) => setColaborador(e.target.value)}
                      required
                    >
                      <option value="">Selecione um colaborador</option>
                      {colaboradores.map((colab) => (
                        <option key={colab.ID_Colaborador} value={colab.ID_Colaborador}>
                          {colab.Nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="row">

                  <div className="mb-3">
                    <label htmlFor="data" className="form-label">Data</label>
                    <Calendar
                      onChange={handleDateChange}
                      //tileDisabled={({ date }) => isDateDisabled(date)}  implementar a funcionalidade              
                      minDate={new Date()} // Desabilita datas anteriores ao dia atual
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="hora" className="form-label">Selecione um Horário</label>
                    <select
                      id="hora"
                      className="form-select"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      required
                    >
                      <option value="">Escolha um horário</option>
                      {horariosDisponiveis.map((horario, index) => (
                        <option key={index} value={horario}>
                          {horario}
                        </option>
                      ))}
                    </select>
                  </div>



                </div>

                <div className="mb-3">

                  {role === 'cliente' ? (
                    <br />
                  ) : (
                    <>
                      <label htmlFor="cliente" className="form-label">Cliente</label>
                      <select
                        id="cliente"
                        className="form-select"
                        value={cliente}
                        onChange={(e) => setCliente(e.target.value)}
                        required
                      >
                        <option value="">Selecione um cliente</option>
                        {clientes.map((cli) => (
                          <option key={cli.ID_Cliente} value={cli.ID_Cliente}>
                            {cli.Nome}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                </div>

                <button type="submit" className="btn btn-signup w-100 text-uppercase fw-bold">
                  {loading ? (
                    <i className="bi bi-arrow-repeat spinner"></i>
                  ) : (
                    <i className="bi bi-calendar-check"></i>
                  )}{' '}
                  {loading ? 'Carregando...' : 'Agendar sessão'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div>
          {/* Coluna de imagens */}
          <div className="col-md-5 d-flex flex-wrap justify-content-center align-items-center">
            <img src="/images/logo.png" alt="Logo 1" className="img-fluid animate-subir-descer4 m-2" style={{ maxWidth: '200px' }} />
            <img src="/images/logo1.png" alt="Logo 2" className="img-fluid animate-subir-descer2 m-2" style={{ maxWidth: '75px' }} />
            <img src="/images/logo2.png" alt="Logo 3" className="img-fluid animate-subir-descer2 m-2" style={{ maxWidth: '75px' }} />
            <img src="/images/logo3.png" alt="Logo 4" className="img-fluid animate-subir-descer2 m-2" style={{ maxWidth: '75px' }} />
            <img src="/images/logo4.png" alt="Logo 5" className="img-fluid animate-subir-descer2 m-2" style={{ maxWidth: '90px' }} />
            <img src="/images/smart.png" alt="Smart" className="img-fluid m-2" style={{ maxWidth: '300px' }} />
            <img src="/images/client.gif" alt="Client" className="img-fluid m-2" style={{ maxWidth: '250px' }} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default AgendarTeste;