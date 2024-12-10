import React, { useState, useEffect } from 'react';

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

  const horarios = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

  useEffect(() => {
    const savedRole = localStorage.getItem('role');
    setRole(savedRole);

    // Preenche automaticamente o cliente se for um cliente logado
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
    }
  }, [servico]);

  const fetchServicos = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/servicos');
      if (response.ok) {
        setServicos(await response.json());
      }
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    }
  };

  const fetchColaboradores = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/colaboradores');
      if (response.ok) {
        setColaboradores(await response.json());
      }
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/clientes');
      if (response.ok) {
        setClientes(await response.json());
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Adicionar um dia à data fornecida pelo usuário
    const dataEscolhida = new Date(data);
    dataEscolhida.setDate(dataEscolhida.getDate() + 1);

    // Formatando a data no formato adequado
    const dataFormatada = dataEscolhida.toISOString().split('T')[0];

    const dataHora = `${dataFormatada} ${hora}:00`;

    const agendamentoData = {
      servico_id: servico,
      colaborador_id: colaborador,
      data: dataHora,
      cliente_id: cliente,
    };

    const token = localStorage.getItem('token');

    if (!token) {
      alert('Por favor, faça login para agendar.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/agendamento', {
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
  };

  return (
    <div className="container col-md-5 my-5">
      <div className="card shadow agendamento">
        <div className="card-header agendamento-header">
          <h2 className="text-center agendamento-titulo">Agendar Atendimento</h2>
        </div>
  
        <div className="card-body ">
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="row mb-3 d-flex justify-content-center">
            <div className="col-md-3">
              <label className="form-label">Data</label>
              <input
                type="date"
                className="form-control rounded-3 shadow-sm"
                value={data}
                onChange={(e) => setData(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
              <div className="col-md-2">
                <label className="form-label">Hora</label>
                <select
                  className="form-control"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  required
                >
                  <option value="">Selecione o horário</option>
                  {horarios.map((horario, index) => (
                    <option key={index} value={horario}>
                      {horario}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Serviço</label>
                <select
                  className="form-control"
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
            </div>
  
            <div className="row mb-3 d-flex justify-content-center">
              <div className="col-md-4">
                <label className="form-label">Colaborador</label>
                <select
                  className="form-control"
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
  
              {role === 'cliente' ? (
                <div className="col-md-5">
                  <label className="form-label">Cliente</label>
                  <input
                    type="text"
                    className="form-control"
                    value={localStorage.getItem('userName')}
                    readOnly
                  />
                </div>
              ) : (
                <div className="col-md-5">
                  <label className="form-label">Cliente</label>
                  <select
                    className="form-control"
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
                </div>
              )}
            </div>
  
            <div className="col-12 text-center">
              <button type="submit" className="btn btn-signup w-auto mx-auto">
                Agendar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
  
}

export default Agendamento;
