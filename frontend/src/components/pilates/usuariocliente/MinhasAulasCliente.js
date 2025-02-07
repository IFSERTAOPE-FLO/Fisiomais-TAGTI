import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import CadastrarAulaCliente from "./CadastrarAulaCliente";
import './css/clientepilates.css'; // Adiciona o arquivo CSS personalizado


const MinhasAulasCliente = () => {
    const [aulas, setAulas] = useState([]);
    const [erro, setErro] = useState("");
    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/";
    const [adicionandoAula, setAdicionandoAula] = useState(false);
    const userId = localStorage.getItem("userId");
    const [clienteId, setClienteId] = useState("");
    const [planoAtual, setPlanoAtual] = useState(null);
    // Buscar dados do cliente e plano atual
        useEffect(() => {
          const fetchCliente = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}clientes?id_cliente=${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log(data);
                    setPlanoAtual(data.Plano);
                    setClienteId(userId);
                }
            } catch (err) {
                console.error("Erro ao buscar dados do cliente:", err);
            }
        };
        
    
            if (userId) fetchCliente();
        }, [userId, token, apiBaseUrl]);

    const fetchAulas = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}pilates/cliente/minhas_aulas`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setAulas(data);
            } else {
                setErro("Erro ao buscar aulas.");
            }
        } catch (err) {
            setErro("Erro ao buscar aulas.");
        }
    };

    useEffect(() => {
        fetchAulas();
    }, [token, apiBaseUrl]);

    const handleAulaAdicionada = () => {
        fetchAulas(); // Agora a função está definida no escopo correto
        setAdicionandoAula(false);
    };
    // Função para atualizar a lista de aulas após adicionar uma nova
    


  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">Minhas Aulas de Pilates</h2>
      {erro && <div className="alert alert-danger">{erro}</div>}
      
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {aulas.map((aula) => (
          <div key={aula.id_aula} className="col">
            <div className="card h-100 custom-card">
              <div className="card-body">
                <h5 className="card-title text-primary">{aula.dia_semana}</h5>
                <p className="mb-1"><strong>Horário:</strong> {aula.hora_inicio} - {aula.hora_fim}</p>
                <p className="mb-1"><strong>Professor:</strong> {aula.colaborador.nome}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!adicionandoAula ? (
        <div className="col-md-2 d-flex justify-content-md-end mt-2 mt-md-0">
          <button className="btn btn-custom-login" onClick={() => setAdicionandoAula(true)}>
            <i className="bi bi-plus-circle"></i> Adicionar nova aula
          </button>
        </div>
      ) : (
        <div className="col-md-2 d-flex mt-2 mt-md-0">
          <button className="btn btn-custom-signup" onClick={() => setAdicionandoAula(false)}>
            <i className="bi bi-arrow-left"></i> Voltar
          </button>
        </div>
      )}
      {adicionandoAula && (
        <CadastrarAulaCliente onAulaAdicionada={handleAulaAdicionada} />
      )}
    </div>
  );
};



export default MinhasAulasCliente;