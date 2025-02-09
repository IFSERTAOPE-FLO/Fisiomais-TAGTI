import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Modal, Alert, Card, Row, Col } from 'react-bootstrap';
import { FaCalendarAlt, FaUser, FaEdit, FaTrash, FaPlus, FaFileMedical } from 'react-icons/fa';
import axios from 'axios';
import IniciarPlanoTratamento from './IniciarPlanoTratamento';

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

        axios[method](url, formData, { headers })
            .then(response => {
                setMessage(response.data.message);
                handleCloseModal();
                fetchSessoes(selectedCliente);
            })
            .catch(error => console.error('Erro ao salvar sessão', error));
    };

    const handleDelete = (id_sessao) => {
        axios.delete(`${apiBaseUrl}historico_sessoes/${id_sessao}`, { headers })
            .then(() => fetchSessoes(selectedCliente))
            .catch(error => console.error('Erro ao excluir sessão', error));
    };

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
                                <Form.Label><FaUser className="me-2" />Selecione o Paciente</Form.Label>
                                <Form.Control as="select" onChange={handleSelectCliente} value={selectedCliente}>
                                    <option value="">Escolha um paciente...</option>
                                    {clientes.map(cliente => (
                                        <option key={cliente.ID_Cliente} value={cliente.ID_Cliente}>
                                            {cliente.Nome}
                                        </option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>

                    {selectedCliente && (
                        <>
                            {sessoes.length === 0 ? (
                                <IniciarPlanoTratamento idCliente={selectedCliente} />
                            ) : (
                                <>
                                    <div className="d-flex justify-content-end mb-3">
                                        <Button className='btn btn-login' onClick={() => handleShowModal()}>
                                            <FaPlus className="me-2" />Nova Sessão
                                        </Button>
                                    </div>

                                    <Table striped hover responsive className="align-middle">
                                        <thead className="table-dark">
                                            <tr>
                                                <th><FaCalendarAlt className="me-2" />Data</th>
                                                <th>Detalhes da Sessão</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sessoes.map(sessao => (
                                                <tr key={sessao.id_sessao}>
                                                    <td>
                                                        {new Date(sessao.data_sessao).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="text-muted">{sessao.detalhes}</td>
                                                    <td>
                                                        <Button
                                                            variant="outline-warning"
                                                            size="sm"
                                                            className="me-2"
                                                            onClick={() => handleShowModal(sessao)}
                                                        >
                                                            <FaEdit />
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(sessao.id_sessao)}
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </>
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>

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
                    <Button variant="primary" onClick={handleSubmit}>Salvar Registro</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default HistoricoSessoes;
