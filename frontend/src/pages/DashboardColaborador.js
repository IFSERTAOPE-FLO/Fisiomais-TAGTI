import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, ListGroup, Table, Badge, Alert, Modal, Button } from 'react-bootstrap';
import axios from "axios";
import Perfil from "./Perfil";
import EditarHorarios from "../components/EditarHorarios";

const DashboardColaborador = () => {
    const [agendamentos, setAgendamentos] = useState([]);
    const [aulas, setAulas] = useState([]);
    const [erro, setErro] = useState(null);
    const [showPerfil, setShowPerfil] = useState(false);
    const [servicos, setServicos] = useState([]);
    const [pagamentos, setPagamentos] = useState([]);
    const [horariosEditando, setHorariosEditando] = useState(null);
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/";

    // Estado para controle de expansão (inline) para exibir alunos de uma aula
    const [expandedAulaId, setExpandedAulaId] = useState(null);
    // Mapeia cada aula para a lista de alunos já carregada
    const [alunosPorAula, setAlunosPorAula] = useState({});

    // Funções para abrir/fechar os modais de edição (perfil, horários)
    const handleOpenPerfil = () => setShowPerfil(true);
    const handleClosePerfil = () => setShowPerfil(false);
    const handleEditarHorarios = () => setHorariosEditando(true);
    const handleFecharEditarHorarios = () => setHorariosEditando(false);
    // Função para alternar a exibição dos alunos via Accordion
    const toggleAlunosAccordion = async (aulaId) => {
        // Se ainda não foram carregados, busca-os
        if (!alunosPorAula[aulaId]) {
            await fetchAlunosDaAula(aulaId);
        }
        // O Accordion do Bootstrap é controlado via atributos data-bs-target e classes,
        // portanto, não precisamos de um estado extra para "expanded" aqui.
        // Basta garantir que os alunos estejam carregados e deixar o Bootstrap controlar a exibição.
    };
    // Defina a ordem dos dias da semana em português
    const diaOrder = [
        "Segunda-feira",
        "Terça-feira",
        "Quarta-feira",
        "Quinta-feira",
        "Sexta-feira",
        "Sábado",
        "Domingo"
    ];

    // No seu componente, antes de mapear as aulas, faça:
    const sortedAulas = aulas
        .slice() // Cria uma cópia para não mutar o state
        .sort((a, b) => {
            // Compara o índice dos dias na ordem definida
            const diaA = diaOrder.indexOf(a.dia_semana);
            const diaB = diaOrder.indexOf(b.dia_semana);
            if (diaA !== diaB) return diaA - diaB;
            // Se for o mesmo dia, compara os horários de início (supondo formato "HH:MM")
            return a.hora_inicio.localeCompare(b.hora_inicio);
        });


    // Função para buscar os dados (aulas, pagamentos, serviços, agendamentos)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };

                // Executa todas as requisições em paralelo
                const [
                    aulasRes,
                    pagamentosRes,
                    servicosRes,
                    agendamentosRes
                ] = await Promise.all([
                    axios.get(`${apiBaseUrl}pilates/listar_aulas`, { headers }),
                    axios.get(`${apiBaseUrl}pagamentos/listar`, { headers }),
                    axios.get(`${apiBaseUrl}servicos/listar_servicos`, { headers }),
                    axios.get(`${apiBaseUrl}agendamentos/listar_agendamentos`, { headers })
                ]);

                setAulas(aulasRes.data || []);
                setPagamentos(pagamentosRes.data.pagamentos || []);
                setServicos(servicosRes.data || []);

                const agora = new Date();
                const proximosAgendamentos = agendamentosRes.data
                    .filter(agendamento => new Date(agendamento.data) >= agora)
                    .sort((a, b) => new Date(a.data) - new Date(b.data))
                    .slice(0, 5);
                setAgendamentos(proximosAgendamentos);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
                setErro("Erro ao carregar dados. Tente recarregar a página.");
            }
        };

        fetchData();
    }, [token]);

    // Função para buscar os alunos de uma aula específica (usando a rota /aula/<aula_id>/clientes)
    const fetchAlunosDaAula = async (aulaId) => {
        try {
            const response = await fetch(`${apiBaseUrl}pilates/aula/${aulaId}/clientes`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            if (response.ok) {
                setAlunosPorAula((prev) => ({ ...prev, [aulaId]: data.clientes }));
            } else {
                setAlunosPorAula((prev) => ({ ...prev, [aulaId]: [] }));
            }
        } catch (err) {
            setAlunosPorAula((prev) => ({ ...prev, [aulaId]: [] }));
        }
    };

    // Alterna a exibição inline dos alunos para uma aula
    const toggleAlunos = async (aulaId) => {
        if (expandedAulaId === aulaId) {
            setExpandedAulaId(null);
        } else {
            if (!alunosPorAula[aulaId]) {
                await fetchAlunosDaAula(aulaId);
            }
            setExpandedAulaId(aulaId);
        }
    };

    return (
        <Container className="mt-4">
            {/* Cabeçalho */}
            <div className="row align-items-center mb-3">
                <div className="col-2"></div>
                <div className="col-6 text-center text-secondary">
                    <h2 className="mb-0">
                        <i className="bi bi-speedometer2 me-2"></i>
                        Dashboard do Colaborador
                    </h2>
                </div>
                <div className="col-4 text-end">
                    <button className="btn btn-login" onClick={handleOpenPerfil}>
                        <i className="bi bi-person-circle me-2"></i> Editar Perfil
                    </button>
                    {role === "colaborador" && (
                        <button
                            className="btn-login btn-sm me-2"
                            onClick={() => handleEditarHorarios(userId)}
                        >
                            <i className="bi bi-clock"></i> Editar seus horários
                        </button>
                    )}
                </div>
            </div>

            {horariosEditando && (
                <EditarHorarios
                    colaboradorId={userId}
                    onClose={handleFecharEditarHorarios}
                />
            )}

            {erro && <Alert variant="danger">{erro}</Alert>}

            <Row className="g-4">
                {/* Agendamentos Futuros */}
                <Col md={6} lg={5}>
                    <Card>
                        <Card.Header className="d-flex align-items-center">
                            <i className="bi bi-calendar-event me-2"></i>
                            <span>Agendamentos Futuros</span>
                        </Card.Header>
                        <ListGroup variant="flush" style={{ maxHeight: "500px", overflowY: "auto" }}>
                            {agendamentos.length ? (
                                agendamentos.map((agendamento) => (
                                    <ListGroup.Item key={agendamento.id} className="d-flex justify-content-between">
                                        <div >
                                            <strong>{agendamento.servico}</strong>
                                            <div className="text-muted small">
                                                {new Date(agendamento.data).toLocaleDateString("pt-BR", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </div>
                                        </div>
                                        <Badge bg={agendamento.status.toLowerCase() === "confirmado" ? "success" : "info"} className="d-flex align-items-center justify-content-center">
                                            {agendamento.status.charAt(0).toUpperCase() + agendamento.status.slice(1)}
                                        </Badge>
                                    </ListGroup.Item>
                                ))
                            ) : (
                                <ListGroup.Item className="text-muted">Nenhum agendamento</ListGroup.Item>
                            )}
                        </ListGroup>
                    </Card>
                </Col>

                {/* Serviços Disponíveis */}
                <Col md={4} lg={7}>
                    <Card>
                        <Card.Header className="d-flex align-items-center">
                            <i className="bi bi-person-workspace me-2"></i>
                            <span>Serviços Disponíveis</span>
                        </Card.Header>
                        {/* Container único para o accordion de serviços */}
                        <div className="accordion" id="servicosAccordionServico" style={{ maxHeight: "500px", overflowY: "auto" }}>
                            {servicos.map((servico) => (
                                <div className="accordion-item" key={servico.ID_Servico}>
                                    <h2 className="accordion-header" id={`heading-servico-${servico.ID_Servico}`}>
                                        <button
                                            className="accordion-button collapsed small d-flex align-items-center"
                                            type="button"
                                            data-bs-toggle="collapse"
                                            data-bs-target={`#collapse-servico-${servico.ID_Servico}`}
                                            aria-expanded="false"
                                            aria-controls={`collapse-servico-${servico.ID_Servico}`}
                                            style={{ fontSize: "0.775rem", fontWeight: "bold", padding: "8px 12px" }}
                                        >
                                            <span>{servico.Nome_servico}</span>
                                            <Badge bg="secondary" className="ms-auto" style={{ fontSize: "0.75rem" }}>
                                                {servico.Tipos}
                                            </Badge>
                                        </button>
                                    </h2>
                                    <div
                                        id={`collapse-servico-${servico.ID_Servico}`}
                                        className="accordion-collapse collapse"
                                        aria-labelledby={`heading-servico-${servico.ID_Servico}`}
                                        data-bs-parent="#servicosAccordionServico"
                                    >
                                        <div className="accordion-body text-muted small" style={{ fontSize: "0.75rem" }}>
                                            {servico.Descricao}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>


            {/* Histórico de Pagamentos */}
            <Col md={5} lg={5}>
                <Card>
                    <Card.Header className="d-flex align-items-center">
                        <i className="bi bi-cash-coin me-2"></i>
                        <span>Histórico de Pagamentos</span>
                    </Card.Header>
                    <ListGroup variant="flush" style={{ maxHeight: "400px", overflowY: "auto" }}>
                        {pagamentos.length ? (
                            pagamentos.map((pagamento) => (
                                <ListGroup.Item key={pagamento.id_pagamento} className="d-flex justify-content-between">
                                    <div>
                                        <strong>{pagamento.servico.nome}</strong>
                                        <div className="text-muted small">
                                            {pagamento.data_pagamento
                                                ? new Date(pagamento.data_pagamento).toLocaleDateString("pt-BR")
                                                : "Pagamento Pendente"}
                                        </div>
                                    </div>
                                    <div>
                                        <Badge bg={pagamento.status === "pago" ? "success" : "warning"}>
                                            R$ {pagamento.valor}
                                        </Badge>
                                    </div>
                                </ListGroup.Item>
                            ))
                        ) : (
                            <ListGroup.Item className="text-muted">Nenhum pagamento</ListGroup.Item>
                        )}
                    </ListGroup>
                </Card>
            </Col>

            {/* Minhas Aulas de Pilates */}
            <Col md={7} lg={7}>
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Minhas Aulas de Pilates</h5>
                    </Card.Header>
                    <Card.Body style={{ maxHeight: "400px", overflowY: "auto" }} >
                        {aulas.length > 0 ? (
                            <div className="accordion" id="aulasAccordion">
                                {sortedAulas.map((aula) => (
                                    <div className="accordion-item" key={aula.id_aula}>
                                        <h2 className="accordion-header" id={`heading-${aula.id_aula}`}>
                                            <button
                                                className="accordion-button collapsed"
                                                type="button"
                                                data-bs-toggle="collapse"
                                                data-bs-target={`#collapse-${aula.id_aula}`}
                                                aria-expanded="false"
                                                aria-controls={`collapse-${aula.id_aula}`}
                                                onClick={() => toggleAlunosAccordion(aula.id_aula)}
                                            >
                                                <div className="d-flex flex-column gap-2 w-100">
                                                    {/* Informações da Aula */}
                                                    <div>
                                                        <strong>{aula.dia_semana}</strong>
                                                        <br />
                                                        {aula.hora_inicio} - {aula.hora_fim}
                                                    </div>
                                                    {/* Instrutor */}
                                                    <div className="d-flex align-items-center gap-2">
                                                        <i className="bi bi-person-badge text-muted"></i>
                                                        <span>{aula.colaborador ? aula.colaborador.nome : "N/A"}</span>
                                                    </div>
                                                    {/* Clínica */}
                                                    <div className="d-flex align-items-center gap-2">
                                                        <i className="bi bi-geo-alt text-muted"></i>
                                                        <span>{aula.clinica || "N/A"}</span>
                                                    </div>
                                                    {/* Progresso de Participação */}
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="progress flex-grow-1" style={{ height: "8px" }}>
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
                                            </button>
                                        </h2>
                                        <div
                                            id={`collapse-${aula.id_aula}`}
                                            className="accordion-collapse collapse"
                                            aria-labelledby={`heading-${aula.id_aula}`}
                                            data-bs-parent="#aulasAccordion"
                                        >
                                            <div className="accordion-body">
                                                {alunosPorAula[aula.id_aula] && alunosPorAula[aula.id_aula].length > 0 ? (
                                                    <p className="mb-0">
                                                        <strong>Alunos:</strong>{" "}
                                                        {alunosPorAula[aula.id_aula].map((cliente) => cliente.nome).join(", ")}
                                                    </p>
                                                ) : (
                                                    <div className="text-muted">Nenhum aluno inscrito nesta aula.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        ) : (
                            <div className="text-center text-muted py-4">Nenhuma aula agendada</div>
                        )}
                    </Card.Body>

                </Card>
            </Col>
        </Row>
        {/* Modal para edição do Perfil */}
        <Modal show={showPerfil} onHide={handleClosePerfil} size="xl" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Editar Perfil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Perfil />
                </Modal.Body>
            </Modal>
        </Container >
    );
};

export default DashboardColaborador;
