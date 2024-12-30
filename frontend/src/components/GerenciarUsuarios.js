import React, { useState, useEffect } from "react";
import EditarUsuario from "./EditarUsuario";
import EditarHorarios from "./EditarHorarios";
import { Link, } from "react-router-dom";
import Paginator from "./Paginator"; // Importe o componente Paginator

const GerenciarUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [erro, setErro] = useState("");
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [tipoAlternado, setTipoAlternado] = useState("todos"); // "todos", "cliente", "colaborador"
    const [pesquisaNome, setPesquisaNome] = useState(""); // Estado para armazenar o filtro de nome
    const [horariosEditando, setHorariosEditando] = useState(null);  // Adicionar estado para editar horários
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Defina o número de itens por página
    const savedRole = localStorage.getItem("role"); // Recupera o role do localStorage
    const [usuarioLogado, setUsuarioLogado] = useState(null);

    const isRoleValid = savedRole === "admin" || savedRole === "colaborador";



    const buscarUsuarios = async () => {
        if (!isRoleValid) {
            setErro("Você não tem permissão para acessar esses dados.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:5000/usuarios/listar_usuarios", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                setErro("Erro na requisição: " + response.statusText);
                return;
            }

            const data = await response.json();
            if (Array.isArray(data)) {
                setUsuarios(data);
                setUsuarioLogado(data[0])
            } else {
                setErro("A resposta da API não é um array.");
            }
        } catch (err) {
            setErro("Erro ao buscar usuários.");
        }
    };

    useEffect(() => {
        if (isRoleValid) {
            buscarUsuarios();
        }
    }, [isRoleValid]);





    const toggleTipo = () => {
        // Alterna entre os três tipos: "todos", "cliente", "colaborador"
        if (tipoAlternado === "todos") {
            setTipoAlternado("cliente");
        } else if (tipoAlternado === "cliente") {
            setTipoAlternado("colaborador");
        } else {
            setTipoAlternado("todos");
        }
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
        setHorariosEditando(null); // Garantir que o modal de horários seja fechado ao editar o usuário
    };


    // Função para editar horários
    const handleEditarHorarios = (usuariohorario) => {
        setHorariosEditando({ id: usuariohorario.id, nome: usuariohorario.nome });
        setUsuarioEditando(null); // Garantir que o modal de edição de usuário seja fechado ao editar horários
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



    const usuariosFiltrados = sortedUsuarios.filter(usuario => {
        // Exibe todos os usuários se "todos" for selecionado
        if (tipoAlternado === "todos") {
            return usuario.nome.toLowerCase().includes(pesquisaNome.toLowerCase());
        }
    
        // Filtra por tipo (cliente ou colaborador) se "cliente" ou "colaborador" for selecionado
        return (
            usuario.nome.toLowerCase().includes(pesquisaNome.toLowerCase()) &&
            usuario.role === tipoAlternado
        );
    });






    // Paginação
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const usuariosPaginados = usuariosFiltrados.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container">
            <h2 className="mb-3 text-secondary text-center">Gerenciar Usuários</h2>

            {erro && <p className="alert alert-danger">{erro}</p>}
            <div className="container mb-3">
                <div className="row align-items-center g-2">
                    {/* Coluna para o campo de pesquisa */}
                    <div className="col-md-6 col-lg-5">
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
                        <Link className="btn-login btn-sm me-2 text-decoration-none" to="/addcliente">
                            <i className="bi bi-person-plus"></i> Cliente
                        </Link>
                    </div>


                    <div className="col-auto">
                        <Link className="btn-login btn-sm me-2 text-decoration-none" to="/addcolaborador">
                            <i className="bi bi-person-workspace"></i> Colaborador
                        </Link>
                    </div>
                    {savedRole === "colaborador" && (
                        <>
                            <div className="col-auto">
                                <button
                                    className="btn-login btn-sm me-2"
                                    onClick={() => handleEditarUsuario(usuarioLogado)}
                                >
                                    <i className="bi bi-pencil"></i> Editar Perfil e Clinica
                                </button>
                            </div>
                            <div className="col-auto">
                                <button
                                    className="btn-login btn-sm me-2"
                                    onClick={() => handleEditarHorarios(usuarioLogado)}
                                >
                                    <i className="bi bi-clock"></i> Editar seus horários
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="table-responsive">
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
                                Tipo ({tipoAlternado === "todos" ? "Todos" : tipoAlternado === "cliente" ? "Cliente" : "Colaborador"})
                            </th>
                            <th>telefone</th>
                            {savedRole === 'admin' && (
                                <th>Ações</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosPaginados.map((usuario) => (
                            <tr key={usuario.id}>
                                <td>{usuario.nome}</td>
                                <td>{usuario.email}</td>
                                <td>{usuario.role}</td>
                                <td>{usuario.telefone}</td>
                                {savedRole === 'admin' && (
                                    <>
                                        <td>


                                            <button
                                                className="btn btn-warning btn-sm me-2"
                                                onClick={() => handleEditarUsuario(usuario)}
                                            >
                                                <i className="bi bi-pencil"></i> Editar
                                            </button>


                                            <button
                                                className="btn btn-danger btn-sm me-2"
                                                onClick={() => deletarUsuario(usuario.role, usuario.id)}
                                            >
                                                <i className="bi bi-trash"></i> Excluir
                                            </button>
                                            <button
                                                className="btn btn-info btn-sm me-2"
                                                onClick={() => handleEditarHorarios(usuario)}
                                            >
                                                <i className="bi bi-clock"></i> Editar Horários
                                            </button>
                                        </td>
                                    </>
                                )}





                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Paginator
                totalItems={usuariosFiltrados.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage} // Correctly pass the setCurrentPage function
            />


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
                    colaboradorId={horariosEditando.id}  // Passando o ID para o modal
                    colaboradorNome={horariosEditando.nome} // Passando o nome para o modal
                    onClose={handleCloseModal}
                    onSave={handleSave}
                />
            )}


        </div>
    );
};

export default GerenciarUsuarios;
