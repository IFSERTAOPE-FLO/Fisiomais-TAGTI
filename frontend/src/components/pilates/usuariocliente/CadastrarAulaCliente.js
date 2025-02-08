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
                            <h3 className="fw-bold text-primary text-center">Inscrever-se em Aulas de Pilates</h3>
                        </div>
                        <div className="card-body p-4">
                            {erro && <div className="alert alert-danger">{erro}</div>}
                            {sucesso && <div className="alert alert-success">{sucesso}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Clínica</label>
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
                                    <label className="form-label">Serviço</label>
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
                                        <label className="form-label">Plano</label>
                                        {planos.length === 0 ? (
                                            <div className="alert alert-warning text-center" role="alert">
                                                Selecione uma clínica ou serviço para visualizar os planos disponíveis!
                                            </div>
                                        ) : (
                                            <div className="row">
                                                {planos.map((plano) => (
                                                    <div key={plano.ID_Plano} className="col-md-6 mb-3">
                                                        <div
                                                            className={`d-flex justify-content-between align-items-center p-3 border btn-plano rounded ${planoId === plano.ID_Plano ? "active" : ""
                                                                }`}
                                                            onClick={() => setPlanoId(plano.ID_Plano)}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            <div className="flex-grow-1">
                                                                <strong>{plano.Nome_plano}</strong> -{" "}
                                                                {plano.Quantidade_Aulas_Por_Semana} aulas por semana
                                                            </div>
                                                            <div className="text-end">
                                                                <span className="fw-bold">R$ {plano.Valor}</span>
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
                                        <div className="d-flex align-items-center justify-content-between gap-4 p-3 border rounded shadow-sm">
                                            {/* Card do Plano (mantém o background do btn-plano) */}
                                            <div className="flex-grow-1 p-3 rounded btn-plano">
                                                <strong className="d-block text-center mb-2">{planoAtual.Nome}</strong>
                                                <div className="d-flex justify-content-center gap-4">
                                                    <span><strong>Aulas por Semana:</strong> {planoAtual["Aulas por Semana"]}</span>
                                                    <span><strong>Valor:</strong> R$ {planoAtual.Valor}</span>
                                                </div>
                                            </div>

                                            {/* Botão fora do background do plano */}
                                            <button className="btn btn-login" onClick={() => setPlanoAtual(null)}>
                                                Trocar Plano
                                            </button>
                                        </div>
                                    </div>
                                )}




                                <div className="mb-4 py-1">
                                    <label className="form-label py-1">Aulas Disponíveis</label>
                                    <div className="row ">
                                        {aulasDisponiveis.map((aula) => (
                                            <div key={aula.id_aula} className="col-md-6 mb-3 ">
                                                <div
                                                    className={` py-1  d-flex justify-content-between align-items-center  border btn-plano rounded ${aulasSelecionadas.includes(aula.id_aula) ? "active" : ""
                                                        }`}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => handleSelecionarAula(aula.id_aula)}
                                                >
                                                    <div className="flex-grow-1 py-0">
                                                        <div className="card-header text-center  rounded-top">
                                                            <strong className="d-block text-center">{aula.dia_semana}</strong>
                                                        </div>
                                                        <div className="card-body">
                                                            <p className="mb-1">
                                                                <strong>Horário:</strong> {aula.hora_inicio} - {aula.hora_fim}
                                                            </p>
                                                            <p className="mb-1">
                                                                <strong>Professor:</strong> {aula.colaborador.nome}
                                                            </p>
                                                            <p className="mb-1">
                                                                <strong>Vagas:</strong> {aula.limite_alunos - aula.num_alunos}
                                                            </p>
                                                            <p className="mb-0">
                                                                <strong>Local:</strong> {aula.clinica}
                                                            </p>
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