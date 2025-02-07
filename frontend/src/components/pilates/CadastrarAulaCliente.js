import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form, ListGroup, Alert } from "react-bootstrap";
import Select from "react-select";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const CadastrarAulaCliente = ({ showModal, handleClose, clienteId }) => {
    const [aulas, setAulas] = useState([]);
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorSelecionado, setColaboradorSelecionado] = useState(null);
    const [aulasDisponiveis, setAulasDisponiveis] = useState([]);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [planoCliente, setPlanoCliente] = useState(null);
    const [aulasInscritas, setAulasInscritas] = useState([]);
    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/";

    // Buscar colaboradores e aulas disponíveis
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
                    Inscrever-se em Aulas de Pilates
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
                    <div>
                        <h5 className="text-secondary">Aulas Disponíveis:</h5>
                        <ListGroup>
                            {aulasDisponiveis.map((aula) => (
                                <ListGroup.Item
                                    key={aula.id_aula}
                                    className="d-flex justify-content-between align-items-center"
                                >
                                    <div>
                                        <strong>{aula.dia_semana}</strong> - {aula.hora_inicio} às{" "}
                                        {aula.hora_fim}
                                        <br />
                                        <small className="text-muted">
                                            Vagas disponíveis: {aula.limite_alunos - aula.num_alunos}
                                        </small>
                                    </div>
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
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
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

export default CadastrarAulaCliente;