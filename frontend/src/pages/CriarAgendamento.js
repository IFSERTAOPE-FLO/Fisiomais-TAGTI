  import React, { useState, useEffect } from 'react';
  import { jwtDecode } from 'jwt-decode'; // Corrigido a importação

  function Agendamento() {
    const [data, setData] = useState('');
    const [hora, setHora] = useState('');
    const [servico, setServico] = useState('');
    const [colaborador, setColaborador] = useState('');
    const [cliente, setCliente] = useState('');
    const [servicos, setServicos] = useState([]);
    const [colaboradores, setColaboradores] = useState([]);
    const [clientes, setClientes] = useState([]); // Novo estado para armazenar os clientes

    useEffect(() => {
      fetchServicos();
      fetchClientes(); // Carregar clientes quando o componente for montado
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
          const servicos = await response.json();
          setServicos(servicos);
        } else {
          console.error('Erro ao buscar os serviços');
        }
      } catch (error) {
        console.error('Erro ao fazer a requisição para serviços:', error);
      }
    };

    const fetchColaboradores = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/colaboradores');
        if (response.ok) {
          const colaboradores = await response.json();
          setColaboradores(colaboradores);
        } else {
          console.error('Erro ao buscar os colaboradores');
        }
      } catch (error) {
        console.error('Erro ao fazer a requisição para colaboradores:', error);
      }
    };

    const fetchClientes = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/clientes');
        if (response.ok) {
          const clientes = await response.json();
          setClientes(clientes);
        } else {
          console.error('Erro ao buscar os clientes');
        }
      } catch (error) {
        console.error('Erro ao fazer a requisição para clientes:', error);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Formatar a data e hora para o formato 'YYYY-MM-DD HH:mm:ss'
      const dataHora = `${data} ${hora}:00`; // Adicionando os segundos

      const agendamentoData = {
        servico_id: servico,
        colaborador_id: colaborador,
        data: dataHora, // Data e hora no formato adequado
        cliente_id: cliente, // Agora o cliente_id é enviado diretamente
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

    const horarios = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

    return (
      <div className="container d-flex justify-content-center">
        <div className="col-md-6 row">

          <h2 className="text-center mb-4">Agendar Sessão</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group col-md-3">
                <label>Data:</label>
                <input
                  type="date"
                  className="form-control form-control-sm" // Tamanho pequeno
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
                />
              </div>
              <div className="form-group col-md-3">
                <label>Hora:</label>
                <select
                  className="form-control form-control-sm" // Tamanho pequeno
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  required
                >
                  <option value="">Horário</option>
                  {horarios.map((horario, index) => (
                    <option key={index} value={horario}>
                      {horario}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Serviço:</label>
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

            <div className="form-group">
              <label>Colaborador:</label>
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

            <div className="form-group">
              <label>Cliente:</label>
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

            <div className="text-center">
              <button type="submit" className="btn btn-login w-auto mx-auto d-block">
                Agendar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  export default Agendamento;
