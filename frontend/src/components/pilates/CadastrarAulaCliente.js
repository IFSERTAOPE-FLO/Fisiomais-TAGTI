import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form, ListGroup, Alert } from "react-bootstrap";
import Select from "react-select";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const CadastrarAulaCliente = () => {
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
    const userId = localStorage.getItem("userId");

    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/";

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
                } else {
                    setErro("Erro ao buscar serviços.");
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
                    } else {
                        setErro("Erro ao buscar aulas disponíveis.");
                    }
                } catch (err) {
                    setErro(err.message);
                }
            };
            fetchAulasDisponiveis();
        } else {
            setAulasDisponiveis([]);
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
            const response = await fetch(`${apiBaseUrl}pilates/cliente/cadastrar_aula`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cliente_id: userId,
                    plano_id: planoId,
                    aulas_selecionadas: aulasSelecionadas,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSucesso("Inscrição realizada com sucesso!");
                setClinica('');
                setServicoId("");
                setPlanoId("");
                setAulasSelecionadas([]);
            } else {
                setErro(data.message || "Erro ao realizar inscrição.");
            }
        } catch (err) {
            setErro(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Verifica se o cliente já está inscrito em uma aula
    const estaInscrito = (aulaId) => aulasInscritas.includes(aulaId);

    // Verifica se o cliente atingiu o limite de aulas do plano
    const atingiuLimiteAulas = () => {
        if (!planoCliente) return false;
        return aulasInscritas.length >= planoCliente.quantidade_aulas_por_semana;
    };

    return (
        <div className="container">
            <h2 className="mb-4 text-center">Inscrever-se em Aulas de Pilates</h2>

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

                <div className="mb-3">
                    <label className="form-label">Plano</label>
                    <select
                        className="form-select"
                        value={planoId}
                        onChange={(e) => setPlanoId(e.target.value)}
                        required
                    >
                        <option value="">Selecione seu plano</option>
                        {planos.map((plano) => (
                            <option key={plano.ID_Plano} value={plano.ID_Plano}>
                                {plano.Nome_plano} ({plano.Quantidade_Aulas_Por_Semana} aulas/semana)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label className="form-label">Aulas Disponíveis</label>
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                        {aulasDisponiveis.map((aula) => (
                            <div key={aula.id_aula} className="col">
                                <div 
                                    className={`card h-100 ${aulasSelecionadas.includes(aula.id_aula) ? 'border-primary shadow-lg' : ''}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSelecionarAula(aula.id_aula)}
                                >
                                    <div className="card-body">
                                        <h5 className="card-title text-primary">
                                            {aula.dia_semana}
                                        </h5>
                                        <div className="card-text">
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
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                    >
                        {loading ? "Processando..." : "Confirmar Inscrição"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CadastrarAulaCliente;