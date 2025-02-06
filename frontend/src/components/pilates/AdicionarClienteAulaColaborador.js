import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, } from "react-bootstrap";
import { FaUserMinus } from 'react-icons/fa'; // Ícones de adicionar e remover
import Select from 'react-select';

const AdicionarClienteAulaColaborador = ({ aulaId, showModal, handleClose }) => {
    const [colaboradorId, setColaboradorId] = useState("");
    const [clienteId, setClienteId] = useState("");
    const [clientes, setClientes] = useState([]);
    const [clienteOptions, setClienteOptions] = useState([]);
    const [aulas, setAulas] = useState([]);
    const [clientesNaAula, setClientesNaAula] = useState([]); // Clientes já associados à aula
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [aulaSelecionada, setAulaSelecionada] = useState('');  // Estado para a aula selecionada
    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/";

    useEffect(() => {
        if (aulaId) {
            setAulaSelecionada(aulaId);
            buscarClientesDaAula(aulaId);
        }
    }, [aulaId]);

    useEffect(() => {
        const fetchAulas = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}pilates/listar_aulas`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                const data = await response.json();
                if (response.ok) setAulas(data);
                else setErro(data.message || "Erro ao carregar as aulas.");
            } catch (err) {
                setErro("Erro ao carregar as aulas.");
            }
        };

        const fetchClientes = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}clientes/`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                const data = await response.json();

                if (response.ok) {
                    setClientes(data); // Supondo que a resposta seja um array de clientes
                    setClienteOptions(
                        data.map(cliente => ({ value: cliente.ID_Cliente, label: cliente.Nome }))
                    );
                }
                else setErro(data.message || "Erro ao carregar os clientes.");
            } catch (err) {
                setErro("Erro ao carregar os clientes.");
            }
        };
        setErro("");
        setSucesso("");
        fetchAulas();
        fetchClientes();
    }, [token]);

    useEffect(() => {
        if (aulaSelecionada) {
            buscarClientesDaAula(aulaSelecionada);
        }
    }, [aulaSelecionada]);

    const buscarClientesDaAula = async (aulaId) => {
        try {
            const response = await fetch(`${apiBaseUrl}pilates/aula/${aulaId}/clientes`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            if (response.ok) setClientesNaAula(data.clientes || []);
            else setErro(data.message || "Erro ao buscar clientes da aula.");
        } catch (err) {
            setErro("Erro ao carregar clientes da aula.");
        }
    };
    const handleClienteChange = selectedOption => {
        setClienteId(selectedOption ? selectedOption.value : "");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${apiBaseUrl}pilates/colaborador/adicionar_cliente_aula`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    colaborador_id: colaboradorId,
                    cliente_id: clienteId,
                    aula_id: aulaSelecionada,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSucesso("Cliente adicionado à aula com sucesso!");
                setClienteId("");
                buscarClientesDaAula(aulaSelecionada); // Atualiza a lista de clientes
            } else {
                setErro(data.message || "Erro ao adicionar cliente à aula.");
            }
        } catch (err) {
            setErro("Erro na requisição.");
        }
    };

    const handleRemoveCliente = async (clienteId) => {
        try {
            const response = await fetch(`${apiBaseUrl}pilates/colaborador/remover_cliente_aula`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cliente_id: clienteId,
                    aula_id: aulaSelecionada,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSucesso("Cliente removido com sucesso da aula!");
                buscarClientesDaAula(aulaSelecionada); // Atualiza a lista de clientes
            } else {
                setErro(data.message || "Erro ao remover cliente da aula.");
            }
        } catch (err) {
            setErro("Erro na requisição.");
        }
    };

    return (
        <Modal show={showModal} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Adicionar Cliente à Aula</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {erro && <p className="alert alert-danger ">{erro}</p>}
                {sucesso && <p className="alert alert-success">{sucesso}</p>}
                <form onSubmit={handleSubmit}>
                    {/* Campo de seleção da aula (somente leitura) */}
                    <select
                        className="form-control"
                        value={aulaSelecionada.id_aula || ""}
                        disabled  // Tornando o campo somente leitura
                        required
                        hidden
                    >
                    </select>

                    {/* Campo de seleção de cliente */}
                    <div className="form-group mb-3">
                        <div className="d-flex justify-content-between">
                            <Select
                                className="form-control me-3" // Ajusta o tamanho
                                value={clienteOptions.find(option => option.value === clienteId)}
                                onChange={handleClienteChange}
                                options={clienteOptions}
                                placeholder="Pesquise e selecione um cliente"
                                required
                            />
                            <button
                                type="submit"
                                className="btn btn-login btn-sm ml-1" // Adiciona margem à esquerda do botão
                            >
                                <i className="bi bi-person-plus "></i>
                            </button>
                        </div>
                    </div>
                </form>

                <div className="container mt-4">
                    <h5 className="text-secondary">Clientes na Aula</h5>
                    <ul className="list-group">
                        {clientesNaAula.length > 0 ? (
                            <div className="row">
                                {clientesNaAula.map((cliente) => (
                                    <div key={cliente.id_cliente} className="col-md-6 mb-3">
                                        <li className="list-group-item d-flex justify-content-between align-items-center">
                                            <span>{cliente.nome}</span>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleRemoveCliente(cliente.id_cliente)}
                                            >
                                                <FaUserMinus size={14} /> {/* Ícone menor */}
                                            </button>
                                        </li>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted">Nenhum cliente cadastrado nesta aula.</p>
                        )}
                    </ul>
                </div>
            </Modal.Body>

        </Modal>
    );
};

export default AdicionarClienteAulaColaborador;
