import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import CadastrarAulaCliente from "./CadastrarAulaCliente";
import "./css/clientepilates.css"; // Adiciona o arquivo CSS personalizado
import { BsTrash } from "react-icons/bs"; // Ícone de lixeira

const MinhasAulasCliente = () => {
  const [aulas, setAulas] = useState([]);
  const [erro, setErro] = useState("");
  const token = localStorage.getItem("token");
  const apiBaseUrl = "http://localhost:5000/";
  const [adicionandoAula, setAdicionandoAula] = useState(false);
  const userId = localStorage.getItem("userId");
  const [clienteId, setClienteId] = useState("");
  const [planoAtual, setPlanoAtual] = useState(null);

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}clientes?id_cliente=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
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
        headers: { Authorization: `Bearer ${token}` },
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
    fetchAulas();
    setAdicionandoAula(false);
  };

  const removerAula = async (aulaId) => {
    if (!window.confirm("Tem certeza que deseja sair desta aula?")) return;

    try {
      console.log("Iniciando remoção da aula...", { aulaId });

      const response = await fetch(`${apiBaseUrl}pilates/cliente/remover_aula`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Token de autenticação obrigatório
        },
        body: JSON.stringify({ aula_id: aulaId }), // Apenas o ID da aula é necessário
      });

      console.log("Resposta do servidor:", response);

      if (response.ok) {
        console.log("Aula removida com sucesso!");
        fetchAulas(); // Atualiza a lista após a remoção
      } else {
        const data = await response.json();
        console.error("Erro ao sair da aula:", data);
        alert(data.message || "Erro ao sair da aula.");
      }
    } catch (err) {
      console.error("Erro ao sair da aula:", err);
      alert("Erro ao sair da aula.");
    }
  };



  return (
    <div className="container mt-4">
      {/* Linha para título e botões */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 text-secondary">Minhas Aulas de Pilates</h2>
        <div>
          {!adicionandoAula ? (
            <button className="btn btn-primary" onClick={() => setAdicionandoAula(true)}>
              <i className="bi bi-plus-circle"></i> Adicionar nova aula
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={() => setAdicionandoAula(false)}>
              <i className="bi bi-arrow-left"></i> Voltar
            </button>
          )}
        </div>
      </div>
  
      <div className="row">
        {/* Lista de Aulas - Lado Esquerdo */}
        <div className="col-md-6">
          <div className="row row-cols-1 g-3">
            {aulas.map((aula) => (
              <div key={aula.id_aula} className="col">
                <div className="card h-100 shadow-sm">
                  <div className="card-body d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title text-primary">{aula.dia_semana}</h5>
                      <p className="mb-1">
                        <strong>Horário:</strong> {aula.hora_inicio} - {aula.hora_fim}
                      </p>
                      <p className="mb-1">
                        <strong>Professor:</strong> {aula.colaborador.nome}
                      </p>
                    </div>
                    <button className="btn btn-danger" onClick={() => removerAula(aula.id_aula)}>
                      <BsTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
  
        {/* Componente para adicionar novas aulas - Lado Direito */}
        <div className="col-md-6">
          {adicionandoAula && (
            <>
              <CadastrarAulaCliente onAulaAdicionada={handleAulaAdicionada} />
              </>
          )}
        </div>
      </div>
    </div>
  );
  
  
};

export default MinhasAulasCliente;
