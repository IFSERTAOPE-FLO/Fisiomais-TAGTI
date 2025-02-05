import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, Link } from "react-router-dom";
import { FaPlusCircle, FaTimesCircle } from "react-icons/fa";


const AdicionarAulaPilates = () => {
    const [servicoId, setServicoId] = useState("");
    const [diaSemana, setDiaSemana] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFim, setHoraFim] = useState("");
    const [limiteAlunos, setLimiteAlunos] = useState("");
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradoresSelecionados, setColaboradoresSelecionados] = useState([]);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const navigate = useNavigate();
    const [servicos, setServicos] = useState([]);
    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/pilates/";

    // Função para buscar os serviços de pilates
    const fetchServicos = async () => {
        try {
            const response = await fetch(`http://localhost:5000/servicos/listar_servicos`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            if (response.ok) {
                setServicos(data.filter(servico => servico.Tipos.includes("pilates")));
            } else {
                setErro(data.message || "Erro ao carregar os serviços.");
            }
        } catch (err) {
            setErro(err.message);
        }
    };

    const fetchColaboradores = async (servicoId) => {
        try {
            const response = await fetch(
                `http://localhost:5000/colaboradores/colaboradoresdisponiveis?servico_id=${servicoId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            const data = await response.json();
            if (response.ok) {
                setColaboradores(data.disponiveis);
            } else {
                setErro(data.message || "Erro ao carregar colaboradores.");
            }
        } catch (err) {
            setErro(err.message);
        }
    };

    useEffect(() => {
        fetchServicos();
    }, []);

    useEffect(() => {
        if (servicoId) {
            fetchColaboradores(servicoId);
        }
    }, [servicoId]);

    const handleAddColaborador = (id, nome) => {
        if (!colaboradoresSelecionados.find(colab => colab.id === id)) {
            setColaboradoresSelecionados([
                ...colaboradoresSelecionados,
                { id, nome }
            ]);
        }
    };

    const handleRemoveColaborador = (id) => {
        setColaboradoresSelecionados(
            colaboradoresSelecionados.filter(colab => colab.id !== id)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${apiBaseUrl}adicionar_aula_pilates`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    servico_id: servicoId,
                    dia_semana: diaSemana,
                    hora_inicio: horaInicio,
                    hora_fim: horaFim,
                    colaboradores: colaboradoresSelecionados.map(colab => colab.id),
                    limite_alunos: limiteAlunos,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSucesso("Aula criada com sucesso!");
                setServicoId("");
                setDiaSemana("");
                setHoraInicio("");
                setHoraFim("");
                setColaboradoresSelecionados([]);                
            } else {
                setErro(data.message || "Erro ao criar aula.");
            }
        } catch (err) {
            setErro(err.message);
        }
    };

    return (
        <div className="container">
            <h2 className="mb-4 text-center">Adicionar Aula de Pilates</h2>

            {erro && <p className="alert alert-danger">{erro}</p>}
            {sucesso && <p className="alert alert-success">{sucesso}</p>}

            <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                    <div className="col-md-6">
                        <div className="form-group mb-3">
                            <label>Serviço de Pilates</label>
                            <select
                                className="form-control"
                                value={servicoId}
                                onChange={(e) => setServicoId(e.target.value)}
                                required
                            >
                                <option value="">Selecione um serviço</option>
                                {servicos.map((servico) => (
                                    <option key={servico.ID_Servico} value={servico.ID_Servico}>
                                        {servico.Nome_servico}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="col-md-6">
                            <div className="form-group">
                                <label>Dia da Semana</label>
                                <select
                                    className="form-control"
                                    value={diaSemana}
                                    onChange={(e) => setDiaSemana(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione um dia</option>
                                    <option value="Segunda-feira">Segunda-feira</option>
                                    <option value="Terça-feira">Terça-feira</option>
                                    <option value="Quarta-feira">Quarta-feira</option>
                                    <option value="Quinta-feira">Quinta-feira</option>
                                    <option value="Sexta-feira">Sexta-feira</option>
                                    <option value="Sabado">Sábado</option>
                                    <option value="Domingo">Domingo</option>
                                </select>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-md-6">
                        <div className="form-group">
                            <label>Hora de Início</label>
                            <input
                                type="time"
                                className="form-control"
                                value={horaInicio}
                                onChange={(e) => setHoraInicio(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="form-group">
                            <label>Hora de Fim</label>
                            <input
                                type="time"
                                className="form-control"
                                value={horaFim}
                                onChange={(e) => setHoraFim(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="form-group">
                            <label>limite_alunos</label>
                            <input
                                type="number"
                                className="form-control"
                                value={limiteAlunos}
                                onChange={(e) => setLimiteAlunos(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group mb-3">
                    <label>Colaboradores Associados</label>
                    <div className="d-flex flex-wrap">
                        {colaboradores.map((colab) => (
                            <button
                                key={colab.id_colaborador}
                                type="button"
                                className="btn btn-info m-1"
                                onClick={() => handleAddColaborador(colab.id_colaborador, colab.nome)}
                            >
                                {colab.nome}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h5>Colaboradores Selecionados</h5>
                    <ul>
                        {colaboradoresSelecionados.map((colab) => (
                            <li key={colab.id}>
                                {colab.nome}
                                <FaTimesCircle
                                    className="ml-2"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleRemoveColaborador(colab.id)}
                                />
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="d-flex justify-content-between mt-3">
                    <button type="submit" className="btn btn-primary">
                        Criar Aula <FaPlusCircle className="ml-2" />
                    </button>
                    <Link to="/adicionar-cliente-aula-colaborador" className="btn btn-login">
                    Cadastrar Cliente na aula
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default AdicionarAulaPilates;
