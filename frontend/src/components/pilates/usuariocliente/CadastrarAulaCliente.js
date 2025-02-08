import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const CadastrarAulaCliente = ({ onAulaAdicionada }) => {
    const [clienteId, setClienteId] = useState("");
    const [servicoId, setServicoId] = useState("");
    const [planoId, setPlanoId] = useState("");
    const [aulasSelecionadas, setAulasSelecionadas] = useState([]);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [servicos, setServicos] = useState([]);
    const [planos, setPlanos] = useState([]);
    const [aulasDisponiveis, setAulasDisponiveis] = useState([]);
    const [loading, setLoading] = useState(false);
    const [clinica, setClinica] = useState('');
    const [clinicas, setClinicas] = useState([]);
    const [planoAtual, setPlanoAtual] = useState(null);
    const userId = localStorage.getItem("userId");

    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/";

    // Buscar dados do cliente e plano atual
    useEffect(() => {
        const fetchCliente = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}clientes?id_cliente=${userId}`, {

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

    // Buscar serviços ao carregar o componente
    useEffect(() => {
        const fetchServicos = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}servicos/listar_servicos`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    const servicosPilates = data.filter(servico =>
                        servico.Tipos.includes("pilates")
                    );
                    setServicos(servicosPilates);
                }
            } catch (err) {
                setErro(err.message);
            }
        };
        fetchServicos();
    }, [token, apiBaseUrl]);

    // Buscar planos quando um serviço é selecionado
    useEffect(() => {
        if (servicoId) {
            const servicoSelecionado = servicos.find((s) => s.ID_Servico === parseInt(servicoId));
            setPlanos(servicoSelecionado?.Planos || []);
        } else {
            setPlanos([]);
        }
    }, [servicoId, servicos]);

    // Buscar aulas disponíveis quando a clínica é selecionada
    useEffect(() => {
        if (clinica) {
            const fetchAulasDisponiveis = async () => {
                try {
                    const response = await fetch(
                        `${apiBaseUrl}pilates/listar_aulas/clinica/${clinica}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setAulasDisponiveis(data);
                    }
                } catch (err) {
                    setErro(err.message);
                }
            };
            fetchAulasDisponiveis();
        }
    }, [clinica, token, apiBaseUrl]);

    const handleSelecionarAula = (aulaId) => {
        setAulasSelecionadas(prev =>
            prev.includes(aulaId)
                ? prev.filter(id => id !== aulaId)
                : [...prev, aulaId]
        );
    };

    useEffect(() => {
        const fetchClinicas = async () => {
            try {
                const response = await fetch("http://localhost:5000/clinicas");
                if (response.ok) {
                    setClinicas(await response.json());
                }
            } catch (error) {
                console.error("Erro ao buscar clínicas:", error);
            }
        };
        fetchClinicas();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro("");
        setSucesso("");

        try {
            const body = {
                cliente_id: userId,
                aulas_selecionadas: aulasSelecionadas,
                ...(!planoAtual && { plano_id: planoId })
            };

            const response = await fetch(`${apiBaseUrl}pilates/cliente/cadastrar_aula`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                setSucesso("Inscrição realizada com sucesso!");
                setClinica('');
                setServicoId("");
                setPlanoId("");
                setAulasSelecionadas([]);
                onAulaAdicionada();

                if (data.plano) setPlanoAtual(data.plano);
            } else {
                setErro(data.message || "Erro ao realizar inscrição.");
            }
        } catch (err) {
            setErro(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container  ">
            <div className="row align-items-center ">
                <div className="col-md-12">
                    <div className="card shadow-lg border-0">
                        <div className="card-header text-center  rounded-top">
                            <h3 className=" text-secondary text-center">Inscrever-se em Aulas de Pilates</h3>
                        </div>
                        <div className="card-body p-4">
                            {erro && <div className="alert alert-danger">{erro}</div>}
                            {sucesso && <div className="alert alert-success">{sucesso}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Clínica</label>
                                    <select
                                        className="form-select"
                                        value={clinica}
                                        onChange={(e) => setClinica(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione uma clínica</option>
                                        {clinicas.map((clin) => (
                                            <option key={clin.ID_Clinica} value={clin.ID_Clinica}>
                                                {clin.Nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Serviço</label>
                                    <select
                                        className="form-select"
                                        value={servicoId}
                                        onChange={(e) => setServicoId(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione o serviço</option>
                                        {servicos.map((servico) => (
                                            <option key={servico.ID_Servico} value={servico.ID_Servico}>
                                                {servico.Nome_servico}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {!planoAtual && (
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Plano</label>

                                        {planos.length === 0 ? (
                                            <div className="alert alert-warning text-center d-flex align-items-center gap-2" role="alert">
                                                <i className="bi bi-exclamation-circle-fill text-warning"></i>
                                                Selecione uma clínica ou serviço para visualizar os planos disponíveis!
                                            </div>
                                        ) : (
                                            <div className="row">
                                                {planos.map((plano) => (
                                                    <div key={plano.ID_Plano} className="col-md-6 mb-3">

                                                        <div
                                                            className={`d-flex flex-column p-3 border rounded shadow-sm btn-plano 
                          ${planoId === plano.ID_Plano ? "border-primary bg-light" : "bg-white"}`}
                                                            onClick={() => setPlanoId(plano.ID_Plano)}
                                                            style={{ cursor: "pointer", transition: "all 0.3s ease-in-out" }}
                                                        >

                                                            {/* Nome do Plano */}
                                                            <h5 className="text-primary d-flex align-items-center gap-2">
                                                            <i className="bi bi-card-checklist me-1"></i> {plano.Nome_plano}
                                                            </h5>

                                                            {/* Informações */}
                                                            <div className="d-flex justify-content-between align-items-center text-secondary">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <i className="bi bi-calendar-check text-muted"></i>
                                                                    <span><strong>Aulas:</strong> {plano.Quantidade_Aulas_Por_Semana} por semana</span>
                                                                </div>

                                                                <div className="d-flex align-items-center gap-2">                                                                   
                                                                    <span className="fw-bold text-secondary">R$ {plano.Valor}</span>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}



                                {planoAtual && (
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center justify-content-between gap-4 p-3 ">

                                            {/* Card do Plano */}
                                            <div className="flex-grow-1 p-3 rounded bg-white border-0 shadow-sm">
                                                <h5 className="text-center text-primary mb-3">
                                                    <i className="bi bi-card-checklist me-1"></i> {planoAtual.Nome}
                                                </h5>

                                                <div className="d-flex justify-content-center gap-4 text-secondary">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <i className="bi bi-calendar-check text-muted"></i>
                                                        <span>Aulas por Semana: {planoAtual["Aulas por Semana"]}</span>
                                                    </div>

                                                    <div className="d-flex align-items-center gap-2">
                                                        <span><strong> R$ {planoAtual.Valor.toFixed(2)} </strong></span>
                                                    </div>

                                                </div>
                                            </div>

                                            {/* Botão de Troca */}
                                            <button className="btn btn-outline-danger d-flex align-items-center gap-2 px-3" onClick={() => setPlanoAtual(null)}>
                                                <i className="bi bi-arrow-repeat"></i>
                                                <span>Trocar Plano</span>
                                            </button>

                                        </div>
                                    </div>
                                )}





                                <div className="mb-4">
                                    {aulasDisponiveis.length > 0 ? (
                                        <label className="form-label text-secondary fw-bold">Aulas Disponíveis</label>
                                    ) : (
                                        <div className="alert alert-warning text-center d-flex align-items-center gap-2" role="alert">
                                            <i className="bi bi-exclamation-circle-fill text-warning"></i>
                                            Nenhuma aula disponível!
                                        </div>
                                    )}

                                    <div className="row row-cols-1 row-cols-md-2 g-3">
                                        {aulasDisponiveis.map((aula) => (
                                            <div key={aula.id_aula} className="col">
                                                <div
                                                    className={`card h-100 border-0 shadow-sm hover-shadow p-3 rounded ${aulasSelecionadas.includes(aula.id_aula) ? "active bg-primary-subtle" : ""}`}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => handleSelecionarAula(aula.id_aula)}
                                                >
                                                    {/* Cabeçalho com o Dia da Semana */}
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <h5 className="mb-0 text-primary">
                                                            {aula.dia_semana}
                                                        </h5>
                                                        <span className="badge bg-success-subtle text-secondary">
                                                            <i className="bi bi-clock me-1"></i>
                                                            {aula.hora_inicio} - {aula.hora_fim}
                                                        </span>
                                                    </div>

                                                    {/* Informações da Aula */}
                                                    <div className="d-flex flex-column gap-2">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <i className="bi bi-person-badge text-muted"></i>
                                                            <span>{aula.colaborador.nome}</span>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <i className="bi bi-geo-alt text-muted"></i>
                                                            <span> {aula.clinica || "Não informado"}</span>
                                                        </div>
                                                        {/* Progresso de Participação */}
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="progress flex-grow-1" style={{ height: '8px' }}>
                                                                <div
                                                                    className="progress-bar bg-primary"
                                                                    role="progressbar"
                                                                    style={{ width: `${(aula.num_alunos / aula.limite_alunos) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                            <small className="text-muted">
                                                                {aula.limite_alunos - aula.num_alunos} vagas restantes
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>


                                <div className="d-grid">
                                    <button type="submit" className="btn btn-signup" disabled={loading}>
                                        {loading ? "Processando..." : "Confirmar Inscrição"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default CadastrarAulaCliente;