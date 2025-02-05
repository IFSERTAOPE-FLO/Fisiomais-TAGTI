import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const AdicionarClienteAulaColaborador = () => {
    const [colaboradorId, setColaboradorId] = useState(""); 
    const [clienteId, setClienteId] = useState("");
    const [aulaId, setAulaId] = useState(null); // Alterado para tipo número
    const [aulas, setAulas] = useState([]);
    const [clientes, setClientes] = useState([]); // Lista de clientes para exibir
    const [clientesNaAula, setClientesNaAula] = useState([]);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    
    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/";

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

                if (response.ok) {
                    setAulas(data);
                } else {
                    setErro(data.message || "Erro ao carregar as aulas.");
                }
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
                    setClientes(data);
                } else {
                    setErro(data.message || "Erro ao carregar os clientes.");
                }
            } catch (err) {
                setErro("Erro ao carregar os clientes.");
            }
        };

        fetchAulas();
        fetchClientes();
    }, [token]);

    useEffect(() => {
        if (aulaId) {
            buscarClientesDaAula(aulaId);
        }
    }, [aulaId]);

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

            if (response.ok) {
                setClientesNaAula(data.clientes || []);
            } else {
                setErro(data.message || "Erro ao buscar clientes da aula.");
            }
        } catch (err) {
            setErro("Erro ao carregar clientes da aula.");
        }
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
                    aula_id: aulaId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSucesso("Cliente adicionado à aula com sucesso!");
                setClienteId(""); 
                buscarClientesDaAula(aulaId); // Atualiza a lista de clientes
            } else {
                setErro(data.message || "Erro ao adicionar cliente à aula.");
            }
        } catch (err) {
            setErro("Erro na requisição.");
        }
    };

    return (
        <div className="container">
            <h2 className="mb-4 text-center">Adicionar Cliente à Aula de Pilates</h2>

            {erro && <p className="alert alert-danger">{erro}</p>}
            {sucesso && <p className="alert alert-success">{sucesso}</p>}

            <form onSubmit={handleSubmit}>
                {/* Campo de seleção da aula */}
                <div className="form-group mb-3">
                    <label>Aula</label>
                    <select
                        className="form-control"
                        value={aulaId || ""}
                        onChange={(e) => setAulaId(Number(e.target.value))} 
                        required
                    >
                        <option value="">Selecione uma Aula</option>
                        {aulas.map((aula) => (
                            <option key={aula.id_aula} value={aula.id_aula}>
                                {aula.dia_semana} - {aula.hora_inicio} até {aula.hora_fim} (Colaborador: {aula.colaborador.nome})
                            </option>
                        ))}
                    </select>
                    
                </div>

                {/* Campo de seleção de cliente */}
                <div className="form-group mb-3">
                    <label>Cliente</label>
                    <select
                        className="form-control"
                        value={clienteId || ""}
                        onChange={(e) => setClienteId(e.target.value)}
                        required
                    >
                        <option value="">Selecione um Cliente</option>
                        {clientes.map((cliente) => (
                            <option key={cliente.ID_Cliente} value={cliente.ID_Cliente}>
                                {cliente.Nome}
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit" className="btn btn-primary">Adicionar Cliente</button>
            </form>

            <hr />

            <h4 className="mt-4">Clientes na Aula</h4>
            {clientesNaAula.length > 0 ? (
                <ul className="list-group">
                    {clientesNaAula.map((cliente) => (
                        <li key={cliente.id_cliente} className="list-group-item">
                            {cliente.nome} (Telefone: {cliente.telefone})
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-muted">Nenhum cliente cadastrado nesta aula.</p>
            )}
        </div>
    );
};

export default AdicionarClienteAulaColaborador;


