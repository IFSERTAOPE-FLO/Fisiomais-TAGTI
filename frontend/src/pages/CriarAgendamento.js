import React, { useState, useEffect, useCallback } from 'react';
import '../css/CriarAgendamento.css';
import '../css/Estilos.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import EscolherDiasHorariosClientesModal from '../components/EscolherDiasHorariosClientesModal';

function CriarAgendamento() {
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [servico, setServico] = useState('');
  const [colaborador, setColaborador] = useState('');
  const [cliente, setCliente] = useState('');
  const [clinica, setClinica] = useState('');  // Estado para armazenar a clínica selecionada
  const [servicos, setServicos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clinicas, setClinicas] = useState([]);  // Estado para armazenar as clínicas
  const [role, setRole] = useState('');
  const [planos, setPlanos] = useState([]);
  const [tipoServico, setTipoServico] = useState('');
  const [valorServico, setValorServico] = useState(0);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [planoSelecionado, setPlanoSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [diasPermitidos, setDiasPermitidos] = useState([]);
  const [feriados, setFeriados] = useState([]);

  const [modalShow, setModalShow] = useState(false);
  const [diasHorariosModal, setDiasHorariosModal] = useState([]);
  const [diasHorariosTexto, setDiasHorariosTexto] = useState(''); // Estado para armazenar o texto dos dias e horários



  useEffect(() => {
    const savedRole = localStorage.getItem('role');
    setRole(savedRole);

    if (savedRole === 'cliente') {
      const userId = localStorage.getItem('userId');
      setCliente(userId);
    }

    if (savedRole === 'colaborador') {
      const userId = localStorage.getItem('userId');
      setColaborador(userId);
      if (userId) {
        fetchHorariosDisponiveis(userId, data);
        fetchDiasPermitidos(userId); // Chama a função de horários disponíveis com o ID do colaborador

      }
    }
    fetchClinicas();
    fetchServicos();
    fetchClientes();
    fetchFeriados();
  }, [data]);


  const fetchServicos = async () => {
    try {
      const token = localStorage.getItem('token');  // Supondo que o token JWT esteja armazenado no localStorage
      const response = await fetch('http://localhost:5000/servicos/listar_servicos', {
        headers: {
          'Authorization': `Bearer ${token}`  // Envia o token JWT no cabeçalho
        }
      });

      if (response.ok) {
        const servicosData = await response.json();
        setServicos(servicosData);
      } else {
        console.error('Erro ao buscar serviços: ', response.status);
      }
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    }
  };
  const handleClinicaChange = (e) => {
    setClinica(e.target.value);
    setColaborador(''); // Resetando o colaborador selecionado
    setColaboradores([]); // Limpando a lista de colaboradores
  };




  const fetchFeriados = () => {
    const year = new Date().getFullYear();
    setFeriados([
      `${year}-01-01`, // Ano Novo
      `${year}-03-01`, // Carnaval
      `${year}-03-02`, // Carnaval
      `${year}-03-03`, // Carnaval
      `${year}-03-04`, // Quarta-feira de cinzas      
      `${year}-03-30`, // Sexta-feira Santa
      `${year}-04-21`, // Tiradentes
      `${year}-05-01`, // Dia do Trabalhador
      `${year}-06-19`, // Corpus Christi (data variável, pode ser necessário ajustar)
      `${year}-09-07`, // Independência do Brasil
      `${year}-10-12`, // Nossa Senhora Aparecida
      `${year}-11-02`, // Finados
      `${year}-11-15`, // Proclamação da República
      `${year}-12-24`, // Natal
      `${year}-12-25`, // Natal 
    ]);
  };


  const fetchClinicas = async () => {
    try {
      const response = await fetch('http://localhost:5000/clinicas');
      if (response.ok) {
        setClinicas(await response.json());
      }
    } catch (error) {
      console.error('Erro ao buscar clínicas:', error);
    }
  };



  const fetchColaboradores = useCallback(async () => {
    if (!servico || !clinica) return;


    try {
      const response = await fetch(
        `http://localhost:5000/colaboradores/listar?servico_id=${servico}&clinica_id=${clinica}`
      );
      if (response.ok) {
        const colaboradoresData = await response.json();
        setColaboradores(colaboradoresData);
      }
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
    }
  }, [servico, clinica]); // Apenas quando "servico" ou "clinica" mudarem

  useEffect(() => {
    if (servico && clinica) {
      setColaboradores([]); // Limpando a lista antes de buscar novos dados
      fetchColaboradores(); // Buscando colaboradores
    }
  }, [servico, clinica, fetchColaboradores]);

  useEffect(() => {
    if (servico) {
      fetchColaboradores();
      const servicoSelecionado = servicos.find((s) => s.ID_Servico === parseInt(servico));
      if (servicoSelecionado) {
        if (servicoSelecionado.Tipos.includes('pilates')) {
          setTipoServico('pilates');
          setPlanos(servicoSelecionado.Planos || []);
          setValorServico(0); // Valor 0, pois Pilates não tem valor fixo
        } else if (servicoSelecionado.Tipos.includes('fisioterapia')) {
          setTipoServico('fisioterapia');
          setValorServico(servicoSelecionado.Valor || 0);
          setPlanos([]); // Fisioterapia não tem planos
        }
      }
    }
  }, [servico, fetchColaboradores, servicos]);

  useEffect(() => {
    if (colaborador) {
      fetchHorariosDisponiveis(colaborador);

    }
    setHora('');
  }, [colaborador]);


  const fetchHorariosDisponiveis = async (colaboradorId, dataSelecionada) => {
    if (!colaboradorId || !dataSelecionada) return; // Garante que o ID do colaborador e a data sejam válidos
    try {
      const response = await fetch(
        `http://localhost:5000/agendamentos/horarios-disponiveis/${colaboradorId}?data=${dataSelecionada}`
      );
      if (response.ok) {
        const horarios = await response.json();
        console.log('Horários Disponíveis:', horarios); // Verifique o formato da resposta
        if (Array.isArray(horarios.horarios_disponiveis)) {
          setHorariosDisponiveis(horarios.horarios_disponiveis);
        } else {
          setHorariosDisponiveis([]); // Se não for um array, defina como array vazio
        }
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

  const handleOpenModal = () => {
    // Lógica para abrir o modal
    setModalShow(true); // Supondo que você esteja usando `setModalShow` para gerenciar a exibição do modal.
  };


  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

    if (tipoServico !== 'pilates' && !hora) {
      alert('Por favor, selecione um horário válido.');
      setLoading(false);
      return;
    }

    const colaboradorId = role === 'colaborador' ? localStorage.getItem('userId') : colaborador;
    const dataEscolhida = new Date(data + 'T' + hora + ':00');
    const dataHoraISO = dataEscolhida.toISOString();

    const agendamentoData = {
      servico_id: servico,
      colaborador_id: colaboradorId,
      data: dataHoraISO,
      cliente_id: cliente,
      plano_id: tipoServico === 'pilates' ? planoSelecionado || null : null,
      dias_e_horarios: diasHorariosTexto, // Incluindo os dias e horários
    };

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Por favor, faça login para agendar.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/agendamentos/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(agendamentoData),
      });

      if (response.ok) {
        const successData = await response.json();
        alert(successData.message || 'Pedido de agendamento realizado com sucesso! Aguarde a confirmação por e-mail');
        fetchHorariosDisponiveis(colaborador || localStorage.getItem('userId'), data);
        
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Erro ao agendar a sessão.');
      }
    } catch (error) {
      console.error('Erro no agendamento:', error);
    }
    setLoading(false);
  };



  const isDateDisabled = (date) => {
    const diaSemana = date.getDay();
    const dataFormatada = date.toISOString().split('T')[0];

    return !diasPermitidos.includes(diaSemana) || feriados.includes(dataFormatada);
  };

  const handleDateChange = (value) => {
    const dataEscolhida = value.toISOString().split('T')[0];
    setData(dataEscolhida);

    // Se for um colaborador logado, buscar os horários disponíveis para a data escolhida
    if (role === 'colaborador') {
      const savedUserId = localStorage.getItem('userId'); // Obtém o ID do colaborador logado
      if (savedUserId) {
        fetchHorariosDisponiveis(savedUserId, dataEscolhida); // Passa o ID do colaborador logado
      }
    } else if (colaborador) {
      fetchHorariosDisponiveis(colaborador, dataEscolhida); // Caso o colaborador seja selecionado
    }
  };

  // UseEffect to fetch horariosDisponiveis when either colaborador or data changes
  useEffect(() => {
    if (colaborador && data) {
      fetchHorariosDisponiveis(colaborador, data); // Atualiza os horários disponíveis
    }
  }, [colaborador, data]);
  const fetchDiasPermitidos = async (colaboradorId) => {
    if (!colaboradorId) {
      console.error('Colaborador não definido. Abortando chamada à API.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/agendamentos/dias-permitidos/${colaboradorId}`);
      if (response.ok) {
        const data = await response.json();
        setDiasPermitidos(data.dias_permitidos);
      } else {
        console.error('Erro ao buscar dias permitidos:', response.status);
      }
    } catch (error) {
      console.error('Erro ao buscar dias permitidos:', error);
    }
  };


  useEffect(() => {
    const savedUserId = localStorage.getItem('userId'); // Obtém o ID do usuário do localStorage

    if (role === 'colaborador' && savedUserId) {
      fetchDiasPermitidos(savedUserId); // Use o userId salvo

    } else if (colaborador) {
      fetchDiasPermitidos(colaborador);
    }
  }, [role, colaborador]);


  return (

    <div className="container py-5 background-gif">


      <div className="row align-items-center agendamentoback">

        <div className="col-md-6">

          <div className="card shadow-lg border-0 ">
            <div className="card-header text-center  rounded-top">
              <h3 className="fw-bold  text-primary ">Agendar atendimento</h3>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  {role === 'colaborador' && role !== 'admin' ? (
                    <input
                      type="hidden"
                      id="clinica"
                      value={localStorage.getItem('clinicaId')} // Assumindo que 'clinicaId' está armazenado no localStorage
                      required
                    />
                  ) : (
                    <>
                      <label htmlFor="clinica" className="form-label">
                        Clínica
                      </label>
                      <select
                        id="clinica"
                        className="form-select"
                        value={clinica}
                        onChange={handleClinicaChange} // Alterando a função para o novo manipulador
                        required
                      >
                        <option value="">Selecione uma clínica</option>
                        {clinicas.map((clin) => (
                          <option key={clin.ID_Clinica} value={clin.ID_Clinica}>
                            {clin.Nome}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

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

                {tipoServico === "fisioterapia" && valorServico > 0 && (
                  <div className="mb-3">
                    <label htmlFor="valor" className="form-label">Valor do Serviço</label>
                    <div className="flex-column gap-2">
                      <span className="fw-bold btn-plano mb-2 align-items-center p-2 border btn-plano rounded">
                        {`R$ ${valorServico}`}
                      </span>
                    </div>
                  </div>
                )}


                {tipoServico === 'pilates' && (
                  <div className="mb-3">
                    <label className="form-label">Plano de Pilates</label>
                    <div className="row">
                      {planos.map((plano) => (
                        <div key={plano.ID_Plano} className="col-md-6 mb-6">
                          <div
                            className={`d-flex justify-content-between align-items-center p-3 border btn-plano rounded ${planoSelecionado === plano.ID_Plano ? 'active' : ''}`}
                            onClick={() => setPlanoSelecionado(plano.ID_Plano)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="flex-grow-1">
                              <strong>{plano.Nome_plano}</strong>
                            </div>
                            <div className="text-end">
                              <span className="fw-bold">R$ {plano.Valor}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className='mb-3 mt-2'>
                    <label className="form-label">Qual é a sua disponibilidade?</label>
                    <div className="mb-6 d-flex align-items-center gap-3">
                    <input
                        type="text"
                        className="form-control py-2 rounded"
                        value={diasHorariosTexto}
                        readOnly
                        placeholder="Nenhum horário selecionado"
                        style={{                          
                          whiteSpace: 'nowrap', // Impede a quebra de linha
                          overflowX: 'auto', // Permite rolagem horizontal
                          textOverflow: 'ellipsis', // Adiciona "..." caso o texto ultrapasse
                        }}
                      />
                      <button onClick={handleOpenModal} className=" btn-plano rounded">
                        Escolher Dias e Horários
                      </button>
                      </div>
                    </div>
                  </div>
                )}
                <EscolherDiasHorariosClientesModal
                  show={modalShow}
                  onHide={() => setModalShow(false)}
                  onSubmit={(diasEHoras) => {
                    setDiasHorariosModal(diasEHoras); // Atualiza o estado com os dados do modal
                    setDiasHorariosTexto(diasEHoras); // Atualiza o texto exibido no input
                    setModalShow(false); // Fecha o modal
                  }}
                />

                {/* Collaborator Selection */}
                <div className="mb-3">
                  {role !== 'colaborador' && ( // Exibe a label apenas se o usuário não for colaborador
                    <label htmlFor="colaborador" className="form-label">Colaborador</label>
                  )}

                  {role === 'colaborador' && role !== 'admin' ? (
                    <input
                      type="hidden"
                      id="colaborador"
                      value={localStorage.getItem('userId')}
                      required
                    />
                  ) : (
                    <select
                      id="colaborador"
                      className="form-select"
                      value={colaborador}
                      onChange={(e) => setColaborador(e.target.value)}
                      required
                    >
                      <option value="">Selecione um colaborador</option>
                      {colaboradores.map((colab) => (
                        <option key={colab.id_colaborador} value={colab.id_colaborador}>
                          {colab.nome}
                        </option>
                      ))}
                    </select>
                  )}


                </div>
                {tipoServico !== 'pilates' && (

                  <div className="row ">
                    {/* Calendário */}
                    <div className="col-md-8 mb-3">
                      <label htmlFor="data" className="form-label">Data</label>
                      <Calendar
                        onChange={handleDateChange}
                        tileDisabled={({ date }) => isDateDisabled(date)}
                        minDate={new Date()} // Desabilita datas anteriores ao dia atual
                      />
                    </div>

                    {/* Horário */}
                    <div className="col-md-4 mb-3">
                      <label htmlFor="hora" className="form-label">Horário</label>
                      {Array.isArray(horariosDisponiveis) && horariosDisponiveis.length > 0 ? (
                        <select
                          id="hora"
                          className="form-select"
                          value={hora}
                          onChange={(e) => setHora(e.target.value)}
                          required
                        >
                          <option value="">Escolha o horário</option>
                          {horariosDisponiveis.map((horario, index) => (
                            <option key={index} value={horario}>
                              {horario}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="alert alert-warning" role="alert">
                          Nenhum horário disponível!
                        </div>
                      )}
                    </div>


                  </div>
                )}
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

                <button
                  type="submit"
                  className="btn btn-signup w-100 text-uppercase fw-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <i className="bi bi-arrow-repeat spinner"></i>
                  ) : (
                    <i className="bi bi-calendar-check"></i>
                  )}
                  {' '}
                  {loading ? 'Carregando...' : 'Agendar sessão'}
                </button>

              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6  ">
          <div className="row  justify-content-start ">

            <div className="col-md-1 d-flex flex-column flex-md-column flex-sm-row ">
              {/* Imagem Logo 3 */}
              <img
                src="/images/logo2.png"
                alt="Logo 3"
                className="animate-subir-descer3 me-2 img-fluid max-size imagens-container"
              />
              <img
                src="/images/logo3.png"
                alt="Logo 3"
                className="animate-subir-descer4 me-2 img-fluid max-size imagens-container"
              />
              <img
                src="/images/logo1.png"
                alt="Logo 3"
                className="animate-subir-descer2 me-2 img-fluid max-size imagens-container"
              />
            </div>

            <div className="col-md-11  justify-content-start text-align ">
              <img
                src="/images/smart.gif"
                alt="Smart"
                className="img-fluid"
              />
            </div>

          </div>
          < br />
          < br />
        </div>
        <div>
        </div>
      </div>
    </div>
  );
}

export default CriarAgendamento;