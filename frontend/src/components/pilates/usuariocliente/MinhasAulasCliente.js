import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import CadastrarAulaCliente from "./CadastrarAulaCliente";
import "./css/clientepilates.css"; // Adiciona o arquivo CSS personalizado

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
      const response = await fetch(`${apiBaseUrl}pilates/cliente/remover_aula`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ aula_id: aulaId }),
      });

      if (response.ok) {
        fetchAulas();
      } else {
        const data = await response.json();
        alert(data.message || "Erro ao sair da aula.");
      }
    } catch (err) {
      alert("Erro ao sair da aula.");
    }
  };

  // Função para confirmar presença na próxima semana para uma aula específica
  const confirmarPresenca = async (aulaId) => {
    if (!window.confirm("Deseja confirmar presença para esta aula na próxima semana?")) return;

    try {
      const response = await fetch(`${apiBaseUrl}pilates/criar_agendamentos_semana_atual/${clienteId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ aula_id: aulaId }), // Enviando o ID da aula selecionada
      });

      if (response.ok) {
        alert("Presença confirmada para esta aula na próxima semana!");
      } else {
        const data = await response.json();
        alert(data.message || "Erro ao confirmar presença.");
      }
    } catch (err) {
      alert("Erro ao confirmar presença.");
    }
  };


  return (
    <div className="container mt-4">
  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
    <div>
      <h2 className="mb-0 text-secondary">
        <i className="bi bi-calendar2-week me-2"></i>
        Minhas Aulas de Pilates
      </h2>
      <p className="text-muted mt-2">Gerencie suas atividades e participação</p>
    </div>
    
    <div className="d-flex gap-2">
      {!adicionandoAula ? (
        <button 
          className="btn btn-login d-flex align-items-center gap-2"
          onClick={() => setAdicionandoAula(true)}
        >
          <i className="bi bi-plus-circle fs-5"></i>
          <span>Nova Aula</span>
        </button>
      ) : (
        <button 
          className="btn btn-signup d-flex align-items-center gap-2"
          onClick={() => setAdicionandoAula(false)}
        >
          <i className="bi bi-arrow-left fs-5"></i>
          <span>Voltar</span>
        </button>
      )}
    </div>
  </div>

  <div className="row g-4">
    {/* Lista de Aulas */}
    <div className="col-lg-6">
      {aulas.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-calendar-x fs-1 text-muted mb-3"></i>
            <h5 className="text-muted">Nenhuma aula agendada</h5>
            <p className="text-muted">Clique em "Nova Aula" para começar</p>
          </div>
        </div>
      ) : (
        <div className="row row-cols-1 g-3">
          {aulas.map((aula) => (
            <div key={aula.id_aula} className="col">
              <div className="card h-100 border-0 shadow-sm hover-shadow">
                <div className="card-body">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                    {/* Informações da Aula */}
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h5 className="mb-0 text-primary">
                          {aula.dia_semana}
                        </h5>
                        <span className="badge bg-primary-subtle text-primary">
                          <i className="bi bi-clock me-1"></i>
                          {aula.hora_inicio} - {aula.hora_fim}
                        </span>
                      </div>
                      
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <div className="d-flex align-items-center gap-1">
                          <i className="bi bi-person-badge text-muted"></i>
                          <span>{aula.colaborador.nome}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <i className="bi bi-geo-alt text-muted"></i>
                          <span>{aula.clinica || 'Local não informado'}</span>
                        </div>
                      </div>

                      {/* Progresso de Participação */}
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{height: '8px'}}>
                          <div 
                            className="progress-bar bg-primary" 
                            role="progressbar" 
                            style={{width: `${(aula.num_alunos / aula.limite_alunos) * 100}%`}}
                          ></div>
                        </div>
                        <small className="text-muted">
                          {aula.limite_alunos - aula.num_alunos} vagas restantes
                        </small>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="d-flex flex-column gap-2">
                      <button 
                        className="btn btn-outline-danger d-flex align-items-center gap-2"
                        onClick={() => removerAula(aula.id_aula)}
                      >
                        <i className="bi bi-x-circle"></i>
                        <span className="d-none d-md-block">Cancelar</span>
                      </button>
                      
                      <button 
                        className="btn btn-success d-flex align-items-center gap-2"
                        onClick={() => confirmarPresenca(aula.id_aula)}
                      >
                        <i className="bi bi-check2-circle"></i>
                        <span className="d-none d-md-block">Confirmar</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Footer da Card */}
                <div className="card-footer bg-transparent border-top">
                  <small className="text-muted">
                    <i className="bi bi-calendar2-check me-1"></i>
                    Inscrito em: {new Date(aula.data_inscricao).toLocaleDateString()}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Formulário de Nova Aula */}
    <div className="col-lg-6">
      {adicionandoAula && (
        
            <CadastrarAulaCliente onAulaAdicionada={handleAulaAdicionada} />
          
      )}
    </div>
  </div>
</div>
  );
};

export default MinhasAulasCliente;
