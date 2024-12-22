import React, { useState, useEffect } from "react";
import EditarUsuario from "./EditarUsuario";
import EditarHorarios from "./EditarHorarios";
import { Link, } from "react-router-dom";

const GerenciarUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [erro, setErro] = useState("");
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [tipoAlternado, setTipoAlternado] = useState(true);
    const [pesquisaNome, setPesquisaNome] = useState(""); // Estado para armazenar o filtro de nome
    const [horariosEditando, setHorariosEditando] = useState(null);  // Adicionar estado para editar horários

    // Função para buscar usuários
    const buscarUsuarios = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:5000/usuarios/listar_usuarios", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                setErro("Erro na requisição: " + response.statusText);
                return;
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                setUsuarios(data);
            } else {
                setErro("A resposta da API não é um array.");
            }
        } catch (err) {
            setErro("Erro ao buscar usuários.");
        }
    };
    const toggleTipo = () => {
        setTipoAlternado(!tipoAlternado);  // Alterna o valor do estado tipoAlternado
    };

    // Função para deletar usuário
    const deletarUsuario = async (tipo, id) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:5000/usuarios/deletar_usuario/${tipo}/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            if (response.ok) {
                setUsuarios(usuarios.filter((usuario) => usuario.id !== id));
                alert(data.message);
            } else {
                throw new Error(data.message || "Erro ao deletar usuário.");
            }
        } catch (err) {
            setErro(err.message);
        }
    };

    const handleEditarUsuario = (usuario) => {
        setUsuarioEditando(usuario);
    };

    const handleEditarHorarios = (usuario) => {
        setHorariosEditando(usuario);  // Passando o ID correto do colaborador
    };


    const handleCloseModal = () => {
        setUsuarioEditando(null);
        setHorariosEditando(null);  // Fechar modal de horários
    };

    const handleSave = () => {
        buscarUsuarios(); // Atualizar a lista de usuários/horários
        setUsuarioEditando(null);
        setHorariosEditando(null);  // Fechar modal
    };

    useEffect(() => {
        buscarUsuarios(); // Carregar usuários inicialmente
    }, []);



    // Função para ordenar os usuários
    const handleSort = (key) => {
        let direction = "ascending";
        if (sortConfig.key === key && sortConfig.direction === "ascending") {
            direction = "descending";
        }
        setSortConfig({ key, direction });
    };

    // Ordenação dos usuários com base no nome ou no email
    const sortedUsuarios = React.useMemo(() => {
        let sorted = [...usuarios];
        if (sortConfig.key && sortConfig.direction) {
            sorted.sort((a, b) => {
                const aValue = a[sortConfig.key].toLowerCase();
                const bValue = b[sortConfig.key].toLowerCase();
                if (aValue < bValue) {
                    return sortConfig.direction === "ascending" ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === "ascending" ? 1 : -1;
                }
                return 0;
            });
        }
        return sorted;
    }, [usuarios, sortConfig]);

    useEffect(() => {
        buscarUsuarios(); // Carregar usuários inicialmente
    }, []);

    // Filtragem dos usuários com base no nome
    const usuariosFiltrados = sortedUsuarios.filter(usuario => {
        return (
            usuario.nome.toLowerCase().includes(pesquisaNome.toLowerCase()) &&
            (tipoAlternado ? usuario.role === "colaborador" : usuario.role === "cliente")
        );
    });

    return (
        <div>
            <h2 className="mb-3 text-secondary">Gerenciar Usuários</h2>

            {erro && <p className="alert alert-danger">{erro}</p>}
            <div className="container mb-3">
                <div className="row align-items-center g-2">
                    {/* Coluna para o campo de pesquisa */}
                    <div className="col-md-6 col-lg-8">
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Pesquisar por nome"
                                value={pesquisaNome}
                                onChange={(e) => setPesquisaNome(e.target.value)}
                            />
                            <button className="btn btn-secondary" type="button" id="button-addon2">
                                <i className="bi bi-search"></i>
                            </button>
                        </div>
                    </div>


                    <div className="col-auto">
                        <Link className="btn btn-login " to="/addcliente">
                            <i className="bi bi-person-plus"></i> Cliente
                        </Link>
                    </div>


                    <div className="col-auto">
                        <Link className="btn btn-login " to="/addcolaborador">
                            <i className="bi bi-person-workspace"></i> Colaborador
                        </Link>
                    </div>
                </div>
            </div>

            <table className="table table-striped table-bordered mt-4">
                <thead>
                    <tr>
                        <th
                            onClick={() => handleSort("nome")}
                            style={{ cursor: "pointer" }}
                        >
                            Nome
                            {sortConfig.key === "nome" && (sortConfig.direction === "ascending" ? " ↑" : " ↓")}
                        </th>
                        <th
                            onClick={() => handleSort("email")}
                            style={{ cursor: "pointer" }}
                        >
                            Email
                            {sortConfig.key === "email" && (sortConfig.direction === "ascending" ? " ↑" : " ↓")}
                        </th>
                        <th onClick={toggleTipo} style={{ cursor: "pointer" }}>
                            Tipo ({tipoAlternado ? "Colaborador" : "Cliente"})
                        </th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {usuariosFiltrados.map((usuario) => (
                        <tr key={usuario.ID}>
                            <td>{usuario.nome}</td>
                            <td>{usuario.email}</td>
                            <td>{usuario.role}</td>
                            <td>

                                <button
                                    className="btn btn-warning btn-sm me-2"
                                    onClick={() => handleEditarUsuario(usuario)}
                                >
                                    <i className="bi bi-pencil"></i> Editar
                                </button>


                                <button
                                    className="btn btn-danger btn-sm me-2"
                                    onClick={() => deletarUsuario(usuario.role, usuario.ID)}
                                >
                                    <i className="bi bi-trash"></i> Excluir
                                </button>
                                {usuario.role === "colaborador" && (
                                    <button
                                        className="btn btn-info btn-sm me-2"
                                        onClick={() => handleEditarHorarios(usuario.ID)}  // Chamar a edição de horários
                                    >
                                        <i className="bi bi-clock"></i> Editar Horários
                                    </button>
                                )}




                            </td>

                        </tr>
                    ))}
                </tbody>
            </table>

            {usuarioEditando && (
                <EditarUsuario
                    usuario={usuarioEditando}
                    role={usuarioEditando.role}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                />
            )}
            {horariosEditando && (
                <EditarHorarios
                    colaboradorId={horariosEditando}  // Passando o ID para o modal

                    onClose={handleCloseModal}
                    onSave={handleSave}
                />
            )}


        </div>
    );
};

export default GerenciarUsuarios;
