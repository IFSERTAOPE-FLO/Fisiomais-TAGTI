import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Alert } from "react-bootstrap";
import Select from "react-select";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const AulasDisponiveisColaborador = ({ showModal, handleClose, clienteId }) => {
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorSelecionado, setColaboradorSelecionado] = useState(null);
    const [aulasDisponiveis, setAulasDisponiveis] = useState([]);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [planoCliente, setPlanoCliente] = useState(null);
    const [aulasInscritas, setAulasInscritas] = useState([]);
    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/";

    // Buscar colaboradores e plano do cliente
    useEffect(() => {
        const fetchColaboradores = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}colaboradores/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (response.ok) setColaboradores(data);
                else setErro("Erro ao carregar colaboradores.");
            } catch (err) {
                setErro("Erro ao carregar colaboradores.");
            }
        };

        const fetchPlanoCliente = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}clientes/${clienteId}/plano`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (response.ok) setPlanoCliente(data.plano);
                else setErro("Erro ao carregar o plano do cliente.");
            } catch (err) {
                setErro("Erro ao carregar o plano do cliente.");
            }
        };

        const fetchAulasInscritas = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}clientes/${clienteId}/aulas`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (response.ok) setAulasInscritas(data.aulas || []);
                else setErro("Erro ao carregar aulas inscritas.");
            } catch (err) {
                setErro("Erro ao carregar aulas inscritas.");
            }
        };

        fetchColaboradores();
        fetchPlanoCliente();
        fetchAulasInscritas();
    }, [clienteId, token]);

    // Buscar aulas disponíveis quando um colaborador é selecionado
    useEffect(() => {
        if (colaboradorSelecionado) {
            const fetchAulasDisponiveis = async () => {
                try {
                    const response = await fetch(
                        `${apiBaseUrl}pilates/listar_aulas?colaborador_id=${colaboradorSelecionado.value}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    const data = await response.json();
                    if (response.ok) setAulasDisponiveis(data);
                    else setErro("Erro ao carregar aulas disponíveis.");
                } catch (err) {
                    setErro("Erro ao carregar aulas disponíveis.");
                }
            };
            fetchAulasDisponiveis();
        }
    }, [colaboradorSelecionado, token]);

    // Função para inscrever o cliente em uma aula
    const inscreverNaAula = async (aulaId) => {
        try {
            const response = await fetch(`${apiBaseUrl}pilates/cliente/cadastrar_aula`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cliente_id: clienteId,
                    aula_id: aulaId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSucesso("Inscrição realizada com sucesso!");
                setAulasInscritas((prev) => [...prev, aulaId]);
            } else {
                setErro(data.message || "Erro ao realizar inscrição.");
            }
        } catch (err) {
            setErro("Erro ao realizar inscrição.");
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
        <Modal show={showModal} onHide={handleClose} size="lg">
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>
                    <FaCheckCircle className="me-2" />
                    Aulas Disponíveis do Colaborador
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {erro && <Alert variant="danger">{erro}</Alert>}
                {sucesso && <Alert variant="success">{sucesso}</Alert>}

                {/* Seleção de Colaborador */}
                <div className="mb-4">
                    <label className="form-label">Selecione um Colaborador:</label>
                    <Select
                        options={colaboradores.map((colab) => ({
                            value: colab.id_colaborador,
                            label: colab.nome,
                        }))}
                        value={colaboradorSelecionado}
                        onChange={setColaboradorSelecionado}
                        placeholder="Pesquise e selecione um colaborador"
                    />
                </div>

                {/* Lista de Aulas Disponíveis */}
                {colaboradorSelecionado && (
                    <div className="row">
                        {aulasDisponiveis.map((aula) => (
                            <div key={aula.id_aula} className="col-md-6 mb-3">
                                <div className="card h-100 shadow-sm">
                                    <div className="card-body">
                                        <h5 className="card-title">{aula.dia_semana}</h5>
                                        <p className="card-text">
                                            <strong>Horário:</strong> {aula.hora_inicio} às {aula.hora_fim}
                                        </p>
                                        <p className="card-text">
                                            <strong>Vagas:</strong> {aula.limite_alunos - aula.num_alunos} de {aula.limite_alunos}
                                        </p>
                                        <p className="card-text">
                                            <strong>Colaborador:</strong> {aula.colaborador?.nome}
                                        </p>
                                        <div className="d-grid gap-2">
                                            {estaInscrito(aula.id_aula) ? (
                                                <Button variant="success" disabled>
                                                    <FaCheckCircle /> Inscrito
                                                </Button>
                                            ) : atingiuLimiteAulas() ? (
                                                <Button variant="warning" disabled>
                                                    Limite de aulas atingido
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="primary"
                                                    onClick={() => inscreverNaAula(aula.id_aula)}
                                                >
                                                    Inscrever-se
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Fechar
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AulasDisponiveisColaborador;