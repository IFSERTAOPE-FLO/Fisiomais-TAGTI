import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Paginator from "../../Paginator"; // Importe o componente Paginator
import AdicionarClienteAulaColaborador from "./AdicionarClienteAulaColaborador"; // Importe o modal
import AdicionarAulaPilates from "./AdicionarAulaPilates";
import { Modal, Button } from "react-bootstrap"; // Importando Modal e Button do Bootstrap
import VincularAlunoPlano from "./VincularAlunoPlano";

const GerenciarAulasPilates = () => {
    const [aulas, setAulas] = useState([]); // Lista de todas as aulas de pilates
    const [pesquisaNome, setPesquisaNome] = useState(""); // Filtro de nome
    const [filtroDia, setFiltroDia] = useState(""); // Filtro de dia
    const [filtroColaborador, setFiltroColaborador] = useState(""); // Filtro de colaborador
    const [filtroClinica, setFiltroClinica] = useState(""); // Filtro de clínica
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [currentPage, setCurrentPage] = useState(1); // Página atual
    const [itemsPerPage] = useState(10); // Itens por página
    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/";
    const [showModal, setShowModal] = useState(false); // Controle de exibição do modal
    const [aulaSelecionada, setAulaSelecionada] = useState(null); // Aula selecionada
    const [showConfirmModal, setShowConfirmModal] = useState(false); // Modal de confirmação
    const [aulaParaExcluir, setAulaParaExcluir] = useState(null); // Aula para excluir
    const [adicionandoAula, setAdicionandoAula] = useState(false);
    const [adicionandoAgendamento, setAdicionandoAgendamento] = useState(false);

    const buscarAulas = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}pilates/listar_aulas`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const textResponse = await response.text(); // Obtém o conteúdo como texto

            if (response.ok) {
                const data = JSON.parse(textResponse); // Converte para JSON
                setAulas(data);
            } else {
                throw new Error("Erro ao buscar a lista de aulas: " + textResponse);
            }
        } catch (err) {
            setErro(err.message);
        }
    };

    useEffect(() => {
        buscarAulas();
    }, []); // Apenas no carregamento inicial

    // Filtragem das aulas
    const aulasFiltradas = aulas.filter((aula) => {
        return (
            (!pesquisaNome || aula.servico.toLowerCase().includes(pesquisaNome.toLowerCase())) &&
            (!filtroDia || aula.dia_semana.toLowerCase().includes(filtroDia.toLowerCase())) &&
            (!filtroColaborador || aula.colaborador?.nome.toLowerCase().includes(filtroColaborador.toLowerCase())) &&
            (!filtroClinica || aula.clinica?.toLowerCase().includes(filtroClinica.toLowerCase()))
        );
    });

    // Paginação das aulas filtradas
    const aulasPaginadas = aulasFiltradas.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Abre o modal e define a aula selecionada
    const handleOpenModal = (aulaId) => {
        console.log("Aula selecionada:", aulaId); // Verifique se o ID está correto
        setAulaSelecionada(aulaId);
        setShowModal(true);
        setErro(""); // Resetar mensagem de erro
        setSucesso(""); // Resetar mensagem de sucesso



    };


    // Abre o modal de confirmação de exclusão
    const handleOpenConfirmModal = (aulaId) => {
        setAulaParaExcluir(aulaId);
        setShowConfirmModal(true);
    };

    // Função para excluir a aula
    const excluirAula = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}pilates/excluir_aula/${aulaParaExcluir}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setSucesso("Aula excluída com sucesso!");
                setShowConfirmModal(false);
                buscarAulas(); // Atualiza a lista de aulas
            } else {
                const textResponse = await response.text();
                throw new Error("Erro ao excluir a aula: " + textResponse);
            }
        } catch (err) {
            setErro(err.message);
            setShowConfirmModal(false);
        }
    };
    // Função para atualizar a lista de aulas após adicionar uma nova
    const handleAulaAdicionada = () => {
        buscarAulas(); // Atualiza a lista de aulas
        setAdicionandoAula(false); // Fecha o formulário de adição
    };
    const handleAgendamentoAdicionado = () => {
        buscarAulas(); // Atualiza a lista de aulas
        setAdicionandoAgendamento(false); // Fecha o formulário de adição
    };

    const criarAgendamentos = async (aulaId) => {
        try {
            const response = await fetch(`${apiBaseUrl}pilates/criar_agendamentos_aula/${aulaId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const textResponse = await response.text();

            if (response.ok) {
                setSucesso("Agendamentos criados com sucesso!");
                buscarAulas(); // Atualiza a lista de aulas
            } else {
                throw new Error("Erro ao criar agendamentos: " + textResponse);
            }
        } catch (err) {
            setErro(err.message);
        }
    };

    return (
        <div className="container  ">


            <h2 className=" mb-4 text-center text-secondary ">Gerenciar Aulas de Pilates</h2>



            <div className="card-body">
                {erro && <p className="alert alert-danger">{erro}</p>}
                {sucesso && <p className="alert alert-success">{sucesso}</p>}

                <div className="row mb-3">
                    <div className="col-md-2 ">
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Pesquisar aula"
                                value={pesquisaNome}
                                onChange={(e) => setPesquisaNome(e.target.value)}
                            />
                            <button className="btn btn-secondary" type="button">
                                <i className="bi bi-search"></i>
                            </button>
                        </div>
                    </div>
                    <div className="col-md-2">
                        <select
                            className="form-select"
                            value={filtroDia}
                            onChange={(e) => setFiltroDia(e.target.value)}
                        >
                            <option value="">Dia da Semana</option>
                            <option value="Segunda-feira">Segunda-feira</option>
                            <option value="Terça-feira">Terça-feira</option>
                            <option value="Quarta-feira">Quarta-feira</option>
                            <option value="Quinta-feira">Quinta-feira</option>
                            <option value="Sexta-feira">Sexta-feira</option>
                            <option value="Sábado">Sábado</option>
                            <option value="Domingo">Domingo</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <select
                            className="form-select"
                            value={filtroColaborador}
                            onChange={(e) => setFiltroColaborador(e.target.value)}
                        >
                            <option value="">Colaborador</option>
                            {aulas
                                .map((aula) => aula.colaborador?.nome) // Extrai apenas os nomes dos colaboradores
                                .filter((value, index, self) => self.indexOf(value) === index) // Filtra duplicatas
                                .map((nomeColaborador) => (
                                    <option key={nomeColaborador} value={nomeColaborador}>
                                        {nomeColaborador}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <select
                            className="form-select"
                            value={filtroClinica}
                            onChange={(e) => setFiltroClinica(e.target.value)}
                        >
                            <option value="">Clínica</option>
                            {aulas
                                .map((aula) => aula.clinica) // Extrai apenas os nomes das clínicas
                                .filter((value, index, self) => self.indexOf(value) === index) // Filtra duplicatas
                                .map((clinica) => (
                                    <option key={clinica} value={clinica}>
                                        {clinica}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className="col-md-4 d-flex justify-content-md-end mt-2 mt-md-0">
                    {!adicionandoAula ? (
                        
                            <button className="btn btn-login" onClick={() => setAdicionandoAula(true)}>
                                <i className="bi bi-plus-circle"></i> Adicionar nova aula
                            </button>
                            
                        
                    ) : (
                        
                            <button className="btn btn-login" onClick={() => setAdicionandoAula(false)}>
                                <i className="bi bi-arrow-left"></i> Voltar
                            </button>
                        
                    )}
                    <button className="btn btn-signup" onClick={() => setAdicionandoAgendamento(true)}>
                            <i className="bi bi-plus-circle"></i> Vincular plano
                        </button>
</div>
                    



                </div>



                {adicionandoAula && (
                    <AdicionarAulaPilates onAulaAdicionada={handleAulaAdicionada} />
                )}

                {/* Renderiza o modal de vinculação de aluno a um plano */}
                {adicionandoAgendamento && (
                    <VincularAlunoPlano
                        showModal={adicionandoAgendamento}
                        handleClose={() => setAdicionandoAgendamento(false)}
                    />
                )}

                <div className="table-responsive">
                    <table className="table table-striped table-bordered mt-4">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Serviço</th>
                                <th>Dia</th>
                                <th>Hora Início</th>
                                <th>Hora Fim</th>
                                <th>Alunos Cadastrados / Limite</th>
                                <th>Colaborador</th>
                                <th>Clínica</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-center">
                            {aulasPaginadas.map((aula) => (
                                <tr key={aula.id_aula}>
                                    <td>{aula.id_aula}</td>
                                    <td>{aula.servico}</td>
                                    <td>{aula.dia_semana}</td>
                                    <td>{aula.hora_inicio}</td>
                                    <td>{aula.hora_fim}</td>
                                    <td>{`${aula.num_alunos} de ${aula.limite_alunos}`}</td>
                                    <td>{aula.colaborador?.nome || "Sem colaborador"}</td>
                                    <td>{aula.clinica || "Sem clínica"}</td>
                                    <td>

                                        <button
                                            className="btn btn-danger btn-sm me-1"
                                            onClick={() => handleOpenConfirmModal(aula.id_aula)}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                        <button
                                            className="btn btn-primary btn-sm me-1"
                                            onClick={() => handleOpenModal(aula.id_aula)}
                                        >
                                            <i className="bi bi-person-plus"></i>
                                        </button>
                                        <button
                                            className="btn btn-success btn-sm me-1"
                                            onClick={() => criarAgendamentos(aula.id_aula)}
                                        >
                                            <i className="bi bi-calendar-plus"></i> Criar Agendamentos
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para confirmação de exclusão */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmação de Exclusão</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Você tem certeza de que deseja excluir esta aula? Essa ação não pode ser desfeita.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={excluirAula}>
                        Excluir
                    </Button>
                </Modal.Footer>
            </Modal>

            <AdicionarClienteAulaColaborador
                aulaId={aulaSelecionada}
                showModal={showModal}
                handleClose={() => {
                    setShowModal(false); // Fecha o modal
                    setAulaSelecionada(null); // Resetar a aula selecionada
                    buscarAulas(); // Atualiza a lista de aulas
                }}
            />

            <Paginator
                totalItems={aulasFiltradas.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
        </div>

    );
};

export default GerenciarAulasPilates;
