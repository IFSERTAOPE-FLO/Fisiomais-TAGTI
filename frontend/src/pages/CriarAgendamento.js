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
  const [role, setRole] = useState('');  // Armazena o papel do usuário logado
  
  const horarios = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

  useEffect(() => {
    const savedRole = localStorage.getItem('role');
    setRole(savedRole);  // Define o papel do usuário logado

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
    const dataHora = `${data} ${hora}:00`;

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
    <div className="container">
      <h2 className="text-center mb-4">Agendar Sessão</h2>
      
      <form onSubmit={handleSubmit} className="row g-3">
        <div className="row mb-3  d-flex justify-content-center">
          <div className="col-md-2">
            <label className="form-label">Data:</label>
            <input
              type="date"
              className="form-control"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
            />
          </div>

          <div className="col-md-1">
            <label className="form-label">Hora:</label>
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
          <div className="col-md-3 ">
            <label className="form-label">Serviço:</label>
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
          {/* Colaborador */}
          <div className="col-md-3">
            <label className="form-label">Colaborador:</label>
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

          {/* Cliente */}
          <div className="col-md-3">
            <label className="form-label">Cliente:</label>
            <select
              className="form-control"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              required
            >
              <option value="">Selecione um cliente</option>
              {role === 'cliente' ? (
                // Se o usuário for um cliente, exibe apenas o cliente logado
                <option key={localStorage.getItem('userName')} value={localStorage.getItem('userName')}>
                  {localStorage.getItem('userName')}
                </option>
              ) : (
                // Se o usuário for colaborador, exibe todos os clientes
                clientes.map((cli) => (
                  <option key={cli.ID_Cliente} value={cli.ID_Cliente}>
                    {cli.Nome}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Botão de envio */}
        <div className="col-12 text-center">
          <button type="submit" className="btn btn-outline-success w-auto mx-auto d-block">
            Agendar
          </button>
        </div>
      </form>
    </div>
  );
}

export default Agendamento;
