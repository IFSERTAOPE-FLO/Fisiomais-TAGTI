import React, { useState, useEffect } from 'react';
import { Form, Button, Modal, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { FaClipboardList, FaCalendarCheck, } from "react-icons/fa";


import { FaFileUpload, FaClipboardCheck, FaNotesMedical, FaMoneyBillWave } from 'react-icons/fa';

const apiBaseUrl = "http://localhost:5000/";

const IniciarPlanoTratamento = ({ idCliente }) => {
    const [planos, setPlanos] = useState([]);
    const [selectedCliente, setSelectedCliente] = useState('');
    const [selectedPlano, setSelectedPlano] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState(null);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        setSelectedCliente(idCliente);
    }, [idCliente]);
    useEffect(() => {


        axios.get(`${apiBaseUrl}planos_de_tratamento/`, { headers })
            .then(response => setPlanos(response.data))
            .catch(error => console.error('Erro ao buscar planos', error));
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async () => {
        if (!selectedCliente || !selectedPlano || !file) {
            setMessage("Preencha todos os campos e envie a ficha de anamnese.");
            return;
        }

        const formData = new FormData();
        formData.append('id_cliente', selectedCliente);
        formData.append('id_plano_tratamento', selectedPlano.id_plano_tratamento);
        formData.append('ficha_anamnese', file);

        try {
            const response = await axios.post(`${apiBaseUrl}iniciar_plano_tratamento`, formData, {
                headers: { ...headers, 'Content-Type': 'multipart/form-data' }
            });
            setMessage(response.data.message);
            setShowModal(false);
        } catch (error) {
            console.error('Erro ao iniciar plano de tratamento', error);
        }
    };

    return (
        <div className="mt-4 p-3 border rounded shadow-sm bg-white">
            <h5 className="text-primary text-center align-items-center">
                <FaNotesMedical className="me-2" />
                Iniciar Novo Plano de Tratamento
            </h5>

            {message && <Alert variant="success">{message}</Alert>}

            <Row className="g-4">
                <Col md={12}>
                    <h6 className="text-secondary mb-3 d-flex align-items-center">
                        <FaClipboardCheck className="me-2" />
                        Selecione o Protocolo
                    </h6>
                    <Row className="g-3">
                        {planos.map(plano => (
                            <Col key={plano.id_plano_tratamento} md={6} lg={4}>
                                <div
                                    className={`p-3 rounded border ${selectedPlano?.id_plano_tratamento === plano.id_plano_tratamento ? 'border-primary' : 'border-secondary'} cursor-pointer`}
                                    onClick={() => setSelectedPlano(plano)}
                                >
                                    <h6 className="text-primary">{plano.diagnostico}</h6>
                                    <p className="text-muted small mb-2"><strong>Objetivos:</strong> {plano.objetivos}</p>
                                    <p className="text-muted small mb-2"><strong>Duração:</strong> {plano.duracao_prevista} semanas</p>
                                    <p className="text-muted small mb-0">

                                        <strong>Valor: R$ {plano.valor?.toFixed(2)}</strong>
                                    </p>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Col>

                {selectedPlano && (
                    <Col md={6}>
                        <div className="p-3 border border-primary rounded mt-3 shadow-sm bg-light">
                            <h6 className="text-primary d-flex align-items-center mb-2">
                                <FaClipboardList className="me-2" /> Protocolo Selecionado
                            </h6>
                            <Row className="g-2">
                                <Col md={6}>
                                    <div className="p-2 border rounded bg-white">
                                        <h6 className="text-primary mb-1">Metodologia</h6>
                                        <p className="text-muted small mb-0">{selectedPlano.metodologia}</p>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="p-2 border rounded bg-white">
                                        <h6 className="text-primary mb-1">Detalhes</h6>
                                        <ul className="list-unstyled text-muted small mb-0">
                                            <li> Valor Total: R$ {selectedPlano.valor?.toFixed(2)}</li>
                                            <li> Previsão de duração: {selectedPlano.duracao_prevista} semanas</li>
                                        </ul>
                                    </div>
                                </Col>
                            </Row>
                            <div className="mt-3">
                                <h6 className="text-primary d-flex align-items-center mb-2">
                                     Serviços Incluídos
                                </h6>
                                <Row className="g-2">
                                    {selectedPlano.servicos.map(servico => (
                                        <Col key={servico.id_servico} md={6} lg={4}>
                                            <div className="p-2 border rounded bg-white">
                                                <h6 className="text-primary mb-1">{servico.nome}</h6>
                                                <p className="text-muted small mb-0">
                                                     Sessões: {servico.quantidade_sessoes}
                                                </p>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        </div>
                    </Col>
                )}



                <Col md={12} className="text-center mt-4">
                    <button
                        className='btn btn-signup'
                        size="lg"
                        onClick={() => setShowModal(true)}
                        disabled={!selectedPlano}
                    >
                        <FaFileUpload className="me-2" />
                        Iniciar Plano de Tratamento
                        </button>
                </Col>
            </Row>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton >
                    <Modal.Title><FaFileUpload className="me-2" />Documentação Necessária</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Envio da Ficha de Anamnese</Form.Label>
                        <div className="border rounded p-4 text-center">
                            <Form.Control
                                type="file"
                                onChange={handleFileChange}
                                className="d-none"
                                id="fileUpload"
                            />
                            <label htmlFor="fileUpload" className="btn btn-outline-primary">
                                <FaFileUpload className="me-2" />
                                Selecione o arquivo PDF
                            </label>
                            {file && <p className="mt-3 text-muted mb-0">{file.name}</p>}
                        </div>
                        <Form.Text className="text-muted">
                            Anexe a ficha de anamnese assinada digitalmente (PDF, máximo 5MB)
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit}>Confirmar Início do Tratamento</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );

};

export default IniciarPlanoTratamento;