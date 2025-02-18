import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Modal, Alert, Card, Row, Col } from 'react-bootstrap';
import { FaCalendarAlt, FaUser, FaEdit, FaTrash, FaPlus, FaFileMedical, FaFilePdf } from 'react-icons/fa';
import axios from 'axios';
import IniciarPlanoTratamento from './IniciarPlanoTratamento';
import "./css/Planosdetratamento.css";

import Paginator from '../Paginator'; // Certifique-se de que o caminho está correto
import CriarAgendamento from "../../pages/CriarAgendamento";
import Select from 'react-select';

const apiBaseUrl = "http://localhost:5000/";

const HistoricoSessoes = () => {
    const [clientes, setClientes] = useState([]);
    const [sessoes, setSessoes] = useState([]);
    const [selectedCliente, setSelectedCliente] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        id_cliente: '', id_colaborador: '', id_agendamento: '', data_sessao: '', detalhes: '', observacoes: ''
    });
    const [message, setMessage] = useState(null);
    // Adicione este estado no componente
    const [file, setFile] = useState(null);

    // Handler para o campo de arquivo
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };
    const [showCriarAgendamento, setShowCriarAgendamento] = useState(false);
    // Estados para paginação
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };



    useEffect(() => {
        axios.get(`${apiBaseUrl}clientes/`, { headers })
            .then(response => setClientes(response.data))
            .catch(error => console.error('Erro ao buscar clientes', error));
    }, []);

    const fetchSessoes = (id_cliente) => {
        axios.get(`${apiBaseUrl}/historico_sessoes?id_cliente=${id_cliente}`, { headers })
            .then(response => setSessoes(response.data))
            .catch(error => console.error('Erro ao buscar histórico', error));
    };

    const handleSelectCliente = (e) => {
        const id_cliente = e.target.value;
        setSelectedCliente(id_cliente);
        fetchSessoes(id_cliente);
    };

    const handleShowModal = (sessao = null) => {
        if (sessao) setFormData(sessao);
        else setFormData({ id_cliente: selectedCliente, id_colaborador: '', id_agendamento: '', data_sessao: '', detalhes: '', observacoes: '' });
        setShowModal(true);
    };



    const handleCloseModal = () => setShowModal(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        const method = formData.id_sessao ? 'put' : 'post';
        const url = formData.id_sessao ? `${apiBaseUrl}historico_sessoes/${formData.id_sessao}` : `${apiBaseUrl}historico_sessoes`;

        const formDataToSend = new FormData();


        // Anexa todos os campos do formulário
        Object.keys(formData).forEach(key => {
            formDataToSend.append(key, formData[key]);
        });

        // Anexa o arquivo se existir
        if (file) {
            formDataToSend.append('ficha_anamnese', file);
        }

        // Configura headers para multipart/form-data
        const config = {
            headers: {
                ...headers,
                'Content-Type': 'multipart/form-data'
            }
        };

        axios[method](url, formDataToSend, config)
            .then(response => {
                setMessage(response.data.message);
                handleCloseModal();
                fetchSessoes(selectedCliente);
                setFile(null);
            })
            .catch(error => console.error('Erro ao salvar sessão', error));
    };

    const handleDelete = (id_sessao) => {
        axios.delete(`${apiBaseUrl}historico_sessoes/${id_sessao}`, { headers })
            .then(() => fetchSessoes(selectedCliente))
            .catch(error => console.error('Erro ao excluir sessão', error));
    };
    // Lógica de paginação: calcular os itens para a página atual
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSessoes = sessoes.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container mt-4">
            <Card className="shadow  mb-4">
                <Card.Header className="text-center d-flex justify-content-center align-items-center">
                    <FaFileMedical className="me-1 text-primary" size={20} />

                    <h3 className="mb-0 text-primary d-inline-block"><strong>Histórico de Sessões Terapêuticas</strong></h3>
                </Card.Header>


                <Card.Body>
                    {message && <Alert variant="success">{message}</Alert>}

                    <Row className="mb-4">
                        <Col md={6}>
                            <Form.Group controlId="clienteSelect">
                                <div className="d-flex align-items-center">
                                    <Form.Label className="mb-2 me-3">
                                        <FaUser className="me-2" />
                                        Selecione o Paciente
                                    </Form.Label>
                                    <Select
                                        options={clientes.map(cliente => ({
                                            value: cliente.ID_Cliente,
                                            label: cliente.Nome,
                                        }))}
                                        value={
                                            clientes
                                                .map(cliente => ({
                                                    value: cliente.ID_Cliente,
                                                    label: cliente.Nome,
                                                }))
                                                .find(option => option.value === selectedCliente) || null
                                        }
                                        onChange={(selectedOption) =>
                                            handleSelectCliente({ target: { value: selectedOption ? selectedOption.value : '' } })
                                        }
                                        placeholder="Escolha um paciente..."
                                        isClearable
                                        className="w-auto"
                                    />
                                </div>

                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            {selectedCliente && (
                                <div className="d-flex justify-content-end mb-3">
                                    <Button className="btn btn-login" onClick={() => handleShowModal()}>
                                        <FaPlus className="me-2" />
                                        Iniciar Novo Tratamento
                                    </Button>
                                    {sessoes.length > 0 && (
                                        !showCriarAgendamento ? (
                                            <button className="btn btn-signup ms-2" onClick={() => setShowCriarAgendamento(true)}>
                                                <FaPlus className="me-2" />Criar Agendamento
                                            </button>
                                        ) : (
                                            <button className="btn btn-signup ms-2" onClick={() => setShowCriarAgendamento(false)}>
                                                Voltar
                                            </button>
                                        )
                                    )}
                                </div>
                            )}


                        </Col>
                    </Row>

                    {selectedCliente && (
                        <>
                            {showCriarAgendamento && (
                                <CriarAgendamento
                                    historicoAgendamento={true}
                                    idCliente={selectedCliente}
                                    // Aqui, após o agendamento, atualiza as sessões (passando o id do cliente)
                                    onAgendamentoSuccess={() => fetchSessoes(selectedCliente)}
                                />
                            )}




                            <div className="table-responsive">
                                {currentSessoes.length === 0 ? (
                                    <div className="alert alert-info text-center my-4" role="alert">
                                        <h5 className="alert-heading">Não existe registros de sessões para o paciente!</h5>
                                        <p>
                                            Ainda não há registros de sessões. Por favor, verifique mais tarde ou registre uma nova sessão.
                                        </p>
                                    </div>
                                ) : (
                                    <table className="table table-hover table-bordered mt-4 agendamento-header shadow-sm">
                                        <thead className="table-dark">
                                            <tr>
                                                <th>
                                                    <FaCalendarAlt className="me-2" />Data
                                                </th>
                                                <th>Detalhes da Sessão</th>
                                                <th>Plano de Tratamento</th>
                                                <th>Ficha de Anamnese</th>
                                                <th>Observações</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentSessoes.map((sessao) => (
                                                <tr key={sessao.id_sessao}>
                                                    <td className="fw-bold text-primary">
                                                        {new Date(sessao.data_sessao).toLocaleDateString("pt-BR", {
                                                            day: "2-digit",
                                                            month: "long",
                                                            year: "numeric",
                                                        })}
                                                    </td>
                                                    <td className="text-muted">{sessao.detalhes || "Sem detalhes"}</td>
                                                    <td>
                                                        {sessao.plano_tratamento ? (
                                                            <div className="bg-light p-2 rounded">
                                                                <p className="mb-1">
                                                                    <strong>Diagnóstico:</strong> {sessao.plano_tratamento.diagnostico}
                                                                </p>
                                                                <p className="mb-1">
                                                                    <strong>Objetivos:</strong> {sessao.plano_tratamento.objetivos}
                                                                </p>
                                                                <p className="mb-1">
                                                                    <strong>Metodologia:</strong> {sessao.plano_tratamento.metodologia}
                                                                </p>
                                                                <p className="mb-1">
                                                                    <strong>Duração:</strong> {sessao.plano_tratamento.duracao_prevista} semanas
                                                                </p>
                                                                <p className="mb-1">
                                                                    <strong>Valor:</strong>{" "}
                                                                    {sessao.plano_tratamento.valor
                                                                        ? `R$ ${sessao.plano_tratamento.valor.toFixed(2)}`
                                                                        : "N/A"}
                                                                </p>
                                                                {sessao.plano_tratamento.servicos &&
                                                                    sessao.plano_tratamento.servicos.length > 0 && (
                                                                        <div>
                                                                            <strong>Serviços:</strong>
                                                                            <ul className="list-unstyled mb-0">
                                                                                {sessao.plano_tratamento.servicos.map((servico) => (
                                                                                    <li key={servico.id_servico} className="small text-secondary">
                                                                                        {servico.nome} (Sessões: {servico.quantidade_sessoes})
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-danger">N/A</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {sessao.ficha_anamnese ? (
                                                            <a
                                                                href={`${apiBaseUrl}${sessao.ficha_anamnese}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary fw-bold"
                                                            >
                                                                <FaFilePdf className="me-1" />
                                                                Visualizar
                                                            </a>
                                                        ) : (
                                                            <span className="text-secondary">Sem ficha</span>
                                                        )}
                                                    </td>
                                                    <td className="text-muted">
                                                        {sessao.observacoes || <span className="text-secondary">Sem observações</span>}
                                                    </td>
                                                    <td>
                                                        <td>
                                                            <div className="d-flex justify-content-end">
                                                                <Button
                                                                    className="btn btn-warning btn-sm me-2"
                                                                    size="sm"
                                                                    onClick={() => handleShowModal(sessao)}
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </Button>
                                                                <Button
                                                                    className='btn btn-danger btn-sm'
                                                                    size="sm"
                                                                    onClick={() => handleDelete(sessao.id_sessao)}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                            </div>

                        </>
                    )}


                </Card.Body>
            </Card>
            <Paginator
                totalItems={sessoes.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />

            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton >
                    <Modal.Title>
                        {formData.id_sessao ? 'Editar Registro de Sessão' : 'Nova Sessão Terapêutica'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label><FaCalendarAlt className="me-2" />Data/Horário</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="data_sessao"
                                        value={formData.data_sessao}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="formFicha" className="mt-0">
                                    <Form.Label>Ficha de Anamnese (PDF)</Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                    />
                                    {formData.ficha_anamnese && (
                                        <div className="mt-2">
                                            <a
                                                href={`${apiBaseUrl}${formData.ficha_anamnese}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Ver ficha atual
                                            </a>
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Detalhes da Sessão</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="detalhes"
                                        value={formData.detalhes}
                                        onChange={handleChange}
                                        placeholder="Descreva os procedimentos realizados..."
                                    />
                                </Form.Group>

                            </Col>


                            <IniciarPlanoTratamento
                                idCliente={selectedCliente}
                                onSelectPlano={(idPlano) =>
                                    setFormData({ ...formData, id_plano_tratamento: idPlano })
                                }
                            />

                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Observações Clínicas</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        name="observacoes"
                                        value={formData.observacoes}
                                        onChange={handleChange}
                                        placeholder="Registre observações importantes..."
                                    />
                                </Form.Group>
                            </Col>

                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                    <Button className="btn btn2-custom" onClick={handleSubmit}>Salvar Registro</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default HistoricoSessoes;
