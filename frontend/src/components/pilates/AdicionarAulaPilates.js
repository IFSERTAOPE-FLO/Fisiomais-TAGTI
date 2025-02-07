import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { FaPlusCircle } from "react-icons/fa";

const AdicionarAulaPilates = ({ onAulaAdicionada }) => {
    const [servicoId, setServicoId] = useState("");
    const [servicos, setServicos] = useState([]);
    const [diaSemana, setDiaSemana] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFim, setHoraFim] = useState("");
    const [limiteAlunos, setLimiteAlunos] = useState("");
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorSelecionado, setColaboradorSelecionado] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/pilates/";
    const [diasSemana, setDiasSemana] = useState([]);
    const [diasUteis, setDiasUteis] = useState(false);

    useEffect(() => {
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
                setErro("Falha ao buscar serviços. Verifique sua conexão.");
            }
        };
        fetchServicos();
    }, [token]);

    useEffect(() => {
        if (servicoId) {
            const fetchColaboradores = async () => {
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
                        setColaboradores(data.alocados);
                    } else {
                        setErro(data.message || "Erro ao carregar colaboradores.");
                    }
                } catch (err) {
                    setErro("Falha ao buscar colaboradores.");
                }
            };
            fetchColaboradores();
        }
    }, [servicoId, token]);

    const handleSubmitAula = async (e) => {
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
                    dias_semana: diasSemana, // Agora envia um array
                    hora_inicio: horaInicio,
                    hora_fim: horaFim,
                    id_colaborador: colaboradorSelecionado,
                    limite_alunos: limiteAlunos,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSucesso("Aula criada com sucesso!");
                setErro("");
                setServicoId("");
                setDiaSemana("");
                setHoraInicio("");
                setHoraFim("");
                setLimiteAlunos("");
                setColaboradorSelecionado("");
                if (onAulaAdicionada) {
                    onAulaAdicionada();
                }
            } else {
                setErro(data.message || "Erro ao criar aula.");
                setSucesso("");
            }
        } catch (err) {
            setErro("Falha ao criar aula. Tente novamente.");
            setSucesso("");
        }
    };

    return (
        <div className="container mt-4">
            
            <h4 className="mb-4 text-secondary text-center">Adicionar Aula de Pilates</h4>
            {erro && <div className="alert alert-danger">{erro}</div>}
            {sucesso && <div className="alert alert-success">{sucesso}</div>}

            <form onSubmit={handleSubmitAula} className="card p-4 shadow-sm">
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label">Serviço de Pilates</label>
                        <select className="form-select" value={servicoId} onChange={(e) => setServicoId(e.target.value)} required>
                            <option value="">Selecione um serviço</option>
                            {servicos.map((servico) => (
                                <option key={servico.ID_Servico} value={servico.ID_Servico}>{servico.Nome_servico}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Dias da Semana</label>
                        <div className="form-check mb-2">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={diasUteis}
                                onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setDiasUteis(isChecked);
                                    setDiasSemana(
                                        isChecked
                                            ? [
                                                "Segunda-feira",
                                                "Terça-feira",
                                                "Quarta-feira",
                                                "Quinta-feira",
                                                "Sexta-feira",
                                            ]
                                            : []
                                    );
                                }}
                                id="diasUteisCheckbox"
                            />
                            <label className="form-check-label text-primary" htmlFor="diasUteisCheckbox">
                                Dias Úteis (Segunda a Sexta)
                            </label>
                        </div>
                        {!diasUteis && (
                            <select
                                className="form-select"
                                multiple
                                value={diasSemana}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions).map(
                                        (opt) => opt.value
                                    );
                                    setDiasSemana(selected);
                                }}
                                required={!diasUteis}
                            >
                                {["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"].map(
                                    (dia, index) => (
                                        <option key={index} value={dia}>
                                            {dia}
                                        </option>
                                    )
                                )}
                            </select>
                        )}
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Hora de Início</label>
                        <input type="time" className="form-control" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Hora de Fim</label>
                        <input type="time" className="form-control" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} required />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">Limite de Alunos</label>
                        <input type="number" className="form-control" value={limiteAlunos} onChange={(e) => setLimiteAlunos(e.target.value)} required />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Selecione o Colaborador</label>
                        <select
                            className="form-control"
                            value={colaboradorSelecionado}
                            onChange={(e) => setColaboradorSelecionado(e.target.value)}
                            required
                        >
                            <option value="">Selecione um colaborador</option>
                            {colaboradores.map((colaborador) => (
                                <option key={colaborador.id_colaborador} value={colaborador.id_colaborador}>
                                    {colaborador.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button type="submit" className="btn btn-login mt-3 "> <i className="bi bi-plus-circle me-2"></i>Adicionar Aula</button>
            </form>
        </div>
    );
};

export default AdicionarAulaPilates;
