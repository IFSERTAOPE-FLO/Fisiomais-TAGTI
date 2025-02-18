import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Paginator from "../Paginator";
import "./css/Planosdetratamento.css";
import { Row, Col } from "react-bootstrap";

const CrudPlanosTratamento = () => {
    const [planos, setPlanos] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPlano, setEditingPlano] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Estado do formulário
    const [formData, setFormData] = useState({
        diagnostico: "",
        objetivos: "",
        metodologia: "",
        duracao_prevista: "",
        valor: "",
        servicos: []
    });

    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/";

    useEffect(() => {
        fetchPlanos();
        fetchServicos();
    }, []);

    const fetchPlanos = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}planos_de_tratamento/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setPlanos(data);
        } catch (err) {
            setError("Erro ao carregar planos de tratamento");
        }
    };

    // Ao buscar os serviços, mapeie os dados corretamente
    const fetchServicos = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}servicos/listar_todos_servicos`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();

            // Mapeie os dados para o formato esperado pelo frontend
            const servicosFormatados = data.map(servico => ({
                id_servico: servico.ID_Servico,
                nome: servico.Nome_servico,
                descricao: servico.Descricao,
                valor: servico.Valor,
                tipos: servico.Tipos,
                planos: servico.Planos,
                colaboradores: servico.Colaboradores
            }));

            setServicos(servicosFormatados);
        } catch (err) {
            setError("Erro ao carregar serviços");
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleServicoChange = (servicoId, quantidade) => {
        const newServicos = formData.servicos.filter(s => s.id_servico !== servicoId);
        if (quantidade > 0) {
            newServicos.push({ id_servico: servicoId, quantidade_sessoes: quantidade });
        }
        setFormData({ ...formData, servicos: newServicos });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingPlano
            ? `${apiBaseUrl}planos_de_tratamento/editar/${editingPlano.id_plano_tratamento}`
            : `${apiBaseUrl}planos_de_tratamento/criar`;

        try {
            const response = await fetch(url, {
                method: editingPlano ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setSuccess(editingPlano ? "Plano atualizado!" : "Plano criado!");
                fetchPlanos();
                handleClose();
            } else {
                setError("Erro ao salvar plano");
            }
        } catch (err) {
            setError("Erro de conexão");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Confirmar exclusão?")) {
            try {
                const response = await fetch(`${apiBaseUrl}planos_de_tratamento/excluir/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    setSuccess("Plano excluído!");
                    fetchPlanos();
                }
            } catch (err) {
                setError("Erro ao excluir plano");
            }
        }
    };

    const handleEdit = (plano) => {
        setEditingPlano(plano);
        setFormData({
            diagnostico: plano.diagnostico,
            objetivos: plano.objetivos,
            metodologia: plano.metodologia,
            duracao_prevista: plano.duracao_prevista,
            valor: plano.valor,
            servicos: plano.servicos
        });
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setEditingPlano(null);
        setFormData({
            diagnostico: "",
            objetivos: "",
            metodologia: "",
            duracao_prevista: "",
            valor: "",
            servicos: []
        });
    };

    const filteredPlanos = planos.filter(plano =>
        plano.diagnostico.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentPlanos = filteredPlanos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="container mt-4">
            <h2 className="mb-4 text-center text-secondary">Gerenciar Planos de Tratamento</h2>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <div className="mb-3">
                <Button className="btn btn-custom" onClick={() => setShowModal(true)}>
                    Novo Plano
                </Button>
                <Form.Control
                    type="text"
                    placeholder="Filtrar por diagnóstico"
                    className="mt-3"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Diagnóstico</th>
                        <th>Objetivos</th>
                        <th>Duração (semanas)</th>
                        <th>Valor</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {currentPlanos.map(plano => (
                        <tr key={plano.id_plano_tratamento}>
                            <td>{plano.diagnostico}</td>
                            <td>{plano.objetivos}</td>
                            <td>{plano.duracao_prevista}</td>
                            <td>R$ {plano.valor?.toFixed(2)}</td>
                            <td>
                                <div className="d-flex justify-content-center gap-2">
                                <Button className="btn btn-warning"  onClick={() => handleEdit(plano)}>
                                <i className="bi bi-pencil"></i>
                                
                                </Button>
                                <Button className="btn btn-danger" onClick={() => handleDelete(plano.id_plano_tratamento)}>
                                <i className="bi bi-trash"></i>
                                </Button>
                                </div>  
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Paginator
                totalItems={filteredPlanos.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />

            <Modal show={showModal} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingPlano ? "Editar Plano" : "Novo Plano"}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form>
                            {/* Linha 1: Diagnóstico e Duração Prevista */}
                            <Row className="mb-3">
                                <Col md={8}>
                                    <Form.Group>
                                        <Form.Label>Diagnóstico</Form.Label>
                                        <Form.Control
                                            name="diagnostico"
                                            value={formData.diagnostico}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Duração Prevista (semanas)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="duracao_prevista"
                                            value={formData.duracao_prevista}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* Linha 2: Objetivos */}
                            <Row className="mb-3">
                                <Col>
                                    <Form.Group>
                                        <Form.Label>Objetivos</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            name="objetivos"
                                            value={formData.objetivos}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* Linha 3: Metodologia e Valor */}
                            <Row className="mb-3">
                                <Col md={8}>
                                    <Form.Group>
                                        <Form.Label>Metodologia</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            name="metodologia"
                                            value={formData.metodologia}
                                            onChange={handleInputChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Valor</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            name="valor"
                                            value={formData.valor}
                                            onChange={handleInputChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* Linha 4: Serviços Associados */}
                            <Row className="mb-3">
                                <Col>
                                    <h5>Serviços Associados</h5>
                                    <Row>
                                        {servicos.map(servico => (
                                            <Col key={servico.id_servico} md={3} className="mb-3"> {/* Exibe 2 serviços por linha em telas médias ou maiores */}
                                                {/* Checkbox HTML com Bootstrap */}
                                                <div className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id={`servico-${servico.id_servico}`}
                                                        checked={formData.servicos.some(s => s.id_servico === servico.id_servico)}
                                                        onChange={(e) => handleServicoChange(
                                                            servico.id_servico,
                                                            e.target.checked ? 1 : 0
                                                        )}
                                                    />
                                                    <label
                                                        htmlFor={`servico-${servico.id_servico}`}
                                                        className="form-check-label text-dark" // Classe para garantir texto escuro
                                                    >
                                                        {servico.nome}< br/> <small>Número de sessões</small>
                                                    </label>
                                                </div>

                                                {/* Campo de quantidade de sessões */}
                                                {formData.servicos.some(s => s.id_servico === servico.id_servico) && (
                                                    <input
                                                        type="number"
                                                        placeholder="Quantidade de sessões"
                                                        value={formData.servicos.find(s => s.id_servico === servico.id_servico)?.quantidade_sessoes || ""}
                                                        onChange={(e) => handleServicoChange(
                                                            servico.id_servico,
                                                            parseInt(e.target.value)
                                                        )}
                                                        className="form-control mt-2 w-50" // Reduz o tamanho do campo para 50% da largura
                                                        min="1"
                                                    />
                                                )}
                                            </Col>
                                        ))}
                                    </Row>
                                </Col>
                            </Row>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button className="btn btn2-custom" type="submit">
                            Salvar
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default CrudPlanosTratamento;