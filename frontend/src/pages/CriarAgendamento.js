import React, { useState, useEffect } from 'react';
import '../css/CriarAgendamento.css'; // Importar o arquivo CSS para estilos
import '../css/Estilos.css'; // Importar o arquivo CSS para estilos

function Agendamento() {
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

  useEffect(() => {
    const savedRole = localStorage.getItem('role');
    setRole(savedRole);

    if (savedRole === 'cliente') {
      const userId = localStorage.getItem('userId');
      setCliente(userId);
      console.log('ID do cliente logado:', userId);
    }

    fetchServicos();
    fetchClientes();
  }, []);

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
  }, [servico, servicos]);

  useEffect(() => {
    if (data && servico) {
      fetchHorariosDisponiveis(data, servico);
    }
  }, [data, servico]);

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

  const fetchColaboradores = async () => {
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

  const fetchHorariosDisponiveis = async (data, servico_id) => {
    try {
      const response = await fetch(`http://localhost:5000/horarios-disponiveis?data=${data}&servico_id=${servico_id}`);
      if (response.ok) {
        const horarios = await response.json();
        setHorariosDisponiveis(horarios.map(h => h.horario));
      } else {
        console.error('Erro ao buscar horários disponíveis');
      }
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
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
      const response = await fetch('http://localhost:5000/agendamento', {
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
                    <label htmlFor="valor" className="form-label">Valor do Serviço</label>
                    <input
                      id="valor"
                      className="form-control"
                      type="text"
                      value={`R$ ${valorServico}`}
                      readOnly
                    />
                  </div>
                )}

                {tipoServico === 'pilates' && (
                  <div className="mb-3">
                    <label htmlFor="plano" className="form-label">Plano de Pilates</label>
                    <select
                      id="plano"
                      className="form-select"
                      value={planoSelecionado}
                      onChange={(e) => setPlanoSelecionado(parseInt(e.target.value, 10))}  // Certifique-se de enviar um número
                      required
                    >
                      <option value="">Selecione um plano</option>
                      {planos.map((plano) => (
                        <option key={plano.ID_Plano} value={plano.ID_Plano}>
                          {plano.Nome_plano}  R${plano.Valor}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="data" className="form-label">Data</label>
                    <input
                      id="data"
                      type="date"
                      className="form-control"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="hora" className="form-label">Hora</label>
                    <select
                      id="hora"
                      className="form-select"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      required
                    >
                      <option value="">Selecione o horário</option>
                      {horariosDisponiveis.map((horario) => (
                        <option key={horario} value={horario}>
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
      </div>
      <div>
        <div className="container" style={{ position: 'relative' }}>
          {/* Imagem Logo 1 */}
          <img
            src="/images/logo.png"
            alt="Logo 1"
            className="pulsar"
            style={{ width: '750px', height: 'auto', position: 'absolute', top: '-570px', left: '-170px', zIndex: -2 }}
          />

          {/* Imagem Logo 2 */}
          <img
            src="/images/logo1.png"
            alt="Logo 2"
            className="animate-subir-descer2"
            style={{ width: '75px', height: 'auto', position: 'absolute', top: '-125px', left: '880px' }}
          />

          {/* Imagem Logo 3 */}
          <img
            src="/images/logo2.png"
            alt="Logo 3"
            className="animate-subir-descer3"
            style={{ width: '75px', height: 'auto', position: 'absolute', top: '-245px', left: '880px' }}
          />

          {/* Imagem Logo 4 */}
          <img
            src="/images/logo3.png"
            alt="Logo 4"
            className="animate-subir-descer4"
            style={{ width: '75px', height: 'auto', position: 'absolute', top: '-380px', left: '880px' }}
          />

          {/* Imagem Logo 5 */}
          <img
            src="/images/logo4.png"
            alt="Logo 5"
            className="girar"
            style={{ width: '90px', height: 'auto', position: 'absolute', top: '-80px', left: '1400px' }}
          />

          {/* Imagem Smart */}
          <img
            src="/images/smart.png"
            alt="Smart"
            style={{ width: '700px', height: 'auto', position: 'absolute', top: '-540px', left: '820px' }}
          />

          {/* Imagem Client */}
          <img
            src="/images/client.gif"
            alt="Client"
            style={{ width: '500px', height: 'auto', position: 'absolute', top: '-364px', left: '960px' }}
          />
        </div>

      </div>
    </div>
  );
}

export default Agendamento;