import React, { useState, useEffect } from "react";
import EditarUsuario from "./EditarUsuario";
import EditarHorarios from "./EditarHorarios";
import { Link, } from "react-router-dom";
import Paginator from "./Paginator"; // Importe o componente Paginator
import { Modal } from "react-bootstrap";
import AulasDoCliente from "./pilates/usuariocolaborador/AulasDoCliente";

const GerenciarUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [erro, setErro] = useState("");
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [tipoAlternado, setTipoAlternado] = useState("cliente");
    const [pesquisaNome, setPesquisaNome] = useState(""); // Estado para armazenar o filtro de nome
    const [horariosEditando, setHorariosEditando] = useState(null);  // Adicionar estado para editar horários
    const [currentPage, setCurrentPage] = useState(1);
    const savedRole = localStorage.getItem("role"); // Recupera o role do localStorage
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [usuariosFiltrados, setUsuariosFiltrados] = useState([]); // Estado para armazenar usuários filtrados

    const itemsPerPage = 10; // Defina o número de itens por página

    const isRoleValid = savedRole === "admin" || savedRole === "colaborador";
    // Estados para modal de aulas do cliente
    const [showAulasModal, setShowAulasModal] = useState(false);
    const [clienteAulasId, setClienteAulasId] = useState(null);

    // Função para abrir modal que lista as aulas de um cliente (usuário com role "cliente")
    const handleVerAulasCliente = (clienteId) => {
        setClienteAulasId(clienteId);
        setShowAulasModal(true);
    };

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
            if (data.usuarios && Array.isArray(data.usuarios)) {
                setUsuarios(data.usuarios);
                const usuarioLogado = data.usuario_logado_index !== null ? data.usuarios[data.usuario_logado_index] : null;
                setUsuarioLogado(usuarioLogado);
            } else {
                setErro("A resposta da API não é válida.");
            }
        } catch (err) {
            setErro("Erro ao buscar usuários.");
        }
    };


    const toggleTipo = () => {
        // Alterna apenas entre "cliente" e "colaborador"
        setTipoAlternado((prevTipo) => (prevTipo === "cliente" ? "colaborador" : "cliente"));
    };


    // Função para deletar usuário
    const deletarUsuario = async (tipo, id) => {
        // Exibe uma confirmação antes de prosseguir
        if (!window.confirm("ATENÇÃO: Esta ação é irreversível. Tem certeza de que deseja deletar este usuário?")) {
            return; // Se o usuário cancelar, a função é encerrada
        }
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:5000/usuarios/deletar_usuario/${tipo}/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
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
    const handleSaveHorarios = () => {
        buscarUsuarios(); // Atualiza a lista de usuários/horários
        // Não feche o modal automaticamente
    };
    const handleCloseHorariosModal = () => {
        setHorariosEditando(null); // Fecha o modal de horários
    };

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
                const aValue = a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase() : "";
                const bValue = b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase() : "";
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

    useEffect(() => {
        const filtered = sortedUsuarios.filter(usuario => {
            const nomeMatches = usuario.nome.toLowerCase().includes(pesquisaNome.toLowerCase());
            if (tipoAlternado === "todos") {
                return nomeMatches;
            }
            return nomeMatches && usuario.role === tipoAlternado;
        });

        setUsuariosFiltrados(filtered);
        setCurrentPage(1); // Resetar para a primeira página
    }, [tipoAlternado, pesquisaNome, sortedUsuarios]);

    const usuariosPaginados = React.useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return usuariosFiltrados.slice(startIndex, endIndex);
    }, [usuariosFiltrados, currentPage, itemsPerPage]);



    return (
        <div className="container">
            <h2 className="mb-3 text-secondary text-center">Gerenciar Usuários</h2>

            {erro && <p className="alert alert-danger">{erro}</p>}
            <div className="container mb-3">
                <div className="row align-items-center g-2">
                    {/* Campo de pesquisa - Ocupa mais espaço quando não há botões extras */}
                    <div className={`${savedRole === "admin" ? "col-md-8 col-lg-9" : "col-md-6 col-lg-5"}`}>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Pesquisar por nome"
                                value={pesquisaNome}
                                onChange={(e) => setPesquisaNome(e.target.value)}
                            />
                            <button className="btn btn-secondary z-bot" type="button">
                                <i className="bi bi-search z-bot"></i>
                            </button>
                        </div>
                    </div>

                    {/* Grupo de botões - Layout adaptável */}
                    <div className={`${savedRole === "admin" ? "col-md-4 col-lg-3" : "col-md-6 col-lg-7"}`}>
                        <div className="d-flex flex-wrap gap-2 justify-content-end">
                            {/* Botões comuns a todos os perfis */}
                            <Link className="btn-login btn-sm text-decoration-none" to="/addcliente">
                                <i className="bi bi-person-plus"></i> Cliente
                            </Link>

                            {/* Ocultar botão Colaborador para admin */}
                            {savedRole !== "admin" && (
                                <Link className="btn-login btn-sm text-decoration-none" to="/addcolaborador">
                                    <i className="bi bi-person-workspace"></i> Colaborador
                                </Link>
                            )}

                            {/* Botões específicos para colaborador */}
                            {savedRole === "colaborador" && (
                                <>
                                    <button className="btn-login btn-sm" onClick={() => handleEditarUsuario(usuarioLogado)}>
                                        <i className="bi bi-pencil"></i> Perfil
                                    </button>
                                    <button className="btn-login btn-sm" onClick={() => handleEditarHorarios(usuarioLogado)}>
                                        <i className="bi bi-clock"></i> Horários
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="table-responsive">
                <table className="table table-striped table-bordered mt-4">
                    <thead>
                        <tr>
                            <th>#</th>
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
                            <th onClick={toggleTipo} style={{ cursor: "pointer" }} title="Clique para mudar o tipo de usuário">
                                Tipo ({tipoAlternado === "cliente" ? "Cliente" : "Colaborador"})
                                <span className="ms-2">
                                    <i
                                        className={`bi ${tipoAlternado ? 'bi-arrow-repeat' : 'bi-arrow-repeat'
                                            }`}
                                        style={{
                                            fontSize: "1rem",
                                            transform: tipoAlternado ? "rotate(0deg)" : "rotate(180deg)",
                                            transition: "transform 0.2s ease-in-out",
                                        }}
                                    ></i>
                                </span>
                            </th>
                            <th>telefone</th>
                            {tipoAlternado === 'colaborador' && (<><th>Cargo</th>
                                <th>Clínica</th>
                            </>

                            )}
                            {savedRole === 'admin' && (
                                <th>Ações</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosPaginados.map((usuario) => (
                            <tr key={usuario.id}>
                                <td>{usuario.id}</td>
                                <td>{usuario.nome}</td>
                                <td>{usuario.email}</td>
                                <td>{usuario.role}</td>
                                <td>{usuario.telefone}</td>
                                {tipoAlternado === 'colaborador' && (
                                    <>
                                        <td>{usuario.cargo ? usuario.cargo : 'Sem Cargo'}</td>
                                        <td>{usuario.clinica ? usuario.clinica.nome : "Nenhuma"}</td>
                                        {usuario.role === "cliente" && (
                                            <button
                                                className="btn btn-info btn-sm me-1"
                                                onClick={() => handleVerAulasCliente(usuario.id)}
                                            >
                                                <i className="bi bi-book"></i> Ver Aulas
                                            </button>
                                        )}

                                    </>
                                )}

                                {savedRole === 'admin' && (
                                    <>
                                        <td>
                                            <button
                                                className="btn btn-warning btn-sm me-1"
                                                onClick={() => handleEditarUsuario(usuario)}
                                                title="Editar usuario selecionado"
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </button>


                                            <button
                                                className="btn btn-danger btn-sm me-1"
                                                onClick={() => deletarUsuario(usuario.role, usuario.id)}
                                                title="Excluir usuário selecionado"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                            {tipoAlternado === 'colaborador' && (
                                                <button
                                                    className="btn btn-info btn-sm me-1"
                                                    onClick={() => handleEditarHorarios(usuario)}
                                                >
                                                    <i className="bi bi-clock"></i>
                                                </button>
                                            )}
                                            {usuario.role === "cliente" && (
                                                <button
                                                    className="btn btn-info btn-sm me-1"
                                                    onClick={() => handleVerAulasCliente(usuario.id)}
                                                    title="Ver as aulas de pilates do cliente selecionado"
                                                >
                                                    <i className="bi bi-calendar-plus"></i>

                                                </button>
                                            )}

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
                setCurrentPage={setCurrentPage}  // Passando a função para atualizar a página
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
                    onClose={handleCloseHorariosModal}
                    onSave={handleSaveHorarios} // Salvar sem fecha
                />
            )}


            {/* Modal para exibir as aulas do cliente */}
            <Modal
                show={showAulasModal}
                onHide={() => setShowAulasModal(false)}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Aulas do Cliente</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {clienteAulasId && <AulasDoCliente clienteId={clienteAulasId} />}
                </Modal.Body>
            </Modal>


        </div>
    );
};

export default GerenciarUsuarios;