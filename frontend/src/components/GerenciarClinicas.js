import React, { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/Profile.css";
import AddClinica from "./AddClinica";
import EditarClinica from "./EditarClinica";  // Modal de edição de clínica
import Paginator from "./Paginator"; // Importe o componente Paginator



const GerenciarClinicas = () => {
    const [clinicas, setClinicas] = useState([]); // Lista de todas as clínicas disponíveis
    const [clinicasAssociadas, setClinicasAssociadas] = useState([]); // Clínicas associadas ao usuário
    const [novaClinica, setNovaClinica] = useState(""); // ID da clínica selecionada para associar
    const [editarClinica, setEditarClinica] = useState(null);  // Modal para editar clínica
    const [pesquisaNome, setPesquisaNome] = useState(""); // Estado para armazenar o filtro de nome
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [currentPage, setCurrentPage] = useState(1);  // State for current page
    const [itemsPerPage] = useState(10);  // Number of items per page
    const savedRole = localStorage.getItem("role"); // Recupera o role do localStorage



    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/";

    const buscarClinicas = async () => {


        if (savedRole !== 'admin' && savedRole !== 'colaborador') {
            
            return; // Encerra a execução se o usuário não for admin ou colaborador
        }

        try {
            const response = await fetch(`${apiBaseUrl}clinicas/`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const textResponse = await response.text(); // Obtém o conteúdo como texto

            if (response.ok) {
                try {
                    const data = JSON.parse(textResponse);  // Tenta converter para JSON
                    setClinicas(data);
                } catch (error) {
                    throw new Error("A resposta não é um JSON válido.");
                }
            } else {
                throw new Error("Erro ao buscar a lista de clínicas: " + textResponse);
            }
        } catch (err) {
            setErro(err.message);
        }
    };

    // Função para remover clínica
    const removerClinica = async (clinicaId) => {
        if (savedRole !== 'admin') {
            alert('Apenas administradores podem remover clinicas')
            return;
        }
        try {
            const savedRole = localStorage.getItem("role"); // Recupera o role do localStorage
            const response = await fetch(`${apiBaseUrl}clinicas/remover_clinica/${clinicaId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    Role: savedRole,  // Envia o role no cabeçalho da requisição
                },
            });

            if (response.ok) {
                setClinicasAssociadas((prev) => prev.filter((c) => c.id !== clinicaId));
                setSucesso("Clínica removida com sucesso.");
                buscarClinicas();
            } else {
                throw new Error("Erro ao remover clínica.");
            }
        } catch (err) {
            setErro(err.message);
        }
    };

    useEffect(() => {
        buscarClinicas();

    }, []);

    // Função para ordenação das clínicas
    const handleSort = (key) => {
        let sorted = [...clinicas];
        sorted.sort((a, b) => {
            const aValue = a[key].toLowerCase();
            const bValue = b[key].toLowerCase();
            if (aValue < bValue) return -1;
            if (aValue > bValue) return 1;
            return 0;
        });
        setClinicas(sorted);
    };

    // Filtragem das clínicas pelo nome
    const clinicasFiltradas = pesquisaNome
        ? clinicas.filter((clinica) =>
            clinica.Nome.toLowerCase().includes(pesquisaNome.toLowerCase()) // Verifica se o nome existe
        )
        : clinicas; // Se pesquisaNome estiver vazio, retorna todas as clínicas
    // Function to handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    // Paginação dos usuários filtrados
    const clinicasPaginadas = clinicasFiltradas.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="container">
            <h2 className="mb-4 text-secondary text-center">Gerenciar Clinicas</h2>

            <div className="card-body">
                {erro && <p className="alert alert-danger">{erro}</p>}
                {sucesso && <p className="alert alert-success">{sucesso}</p>}

                <AddClinica onClinicaCriada={(novaClinica) => setClinicas((prev) => [...prev, novaClinica])} />
                < br />
                {/* Filtro de pesquisa */}
                <div className="input-group mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Pesquisar por nome do serviço"
                        value={pesquisaNome}
                        onChange={(e) => setPesquisaNome(e.target.value)}
                    />
                    <button className="btn btn-secondary" type="button" id="button-addon2">
                        <i className="bi bi-search"></i>
                    </button>
                </div>
                <div className="table-responsive">
                    {/* Tabela de Clínicas */}
                    <table className="table table-striped  table-bordered mt-4">
                        <thead>
                            <tr>
                                <th
                                    onClick={() => handleSort("nome")}
                                    style={{ cursor: "pointer" }}
                                >
                                    Nome
                                </th>
                                <th>CNPJ</th>
                                <th>Telefone</th>
                                <th>Endereço</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clinicasPaginadas.map((clinica) => (
                                <tr key={clinica.ID_Clinica}>
                                    <td>
                                        <span className="fw-bold">{clinica.Nome}</span>
                                    </td>
                                    <td>{clinica.CNPJ}</td>
                                    <td>{clinica.Telefone}</td>
                                    <td>
                                        {clinica.Endereço ? (
                                            <div className="text-justify">
                                                <p className="mb-1"><strong>Rua:</strong> {clinica.Endereço.Rua}, {clinica.Endereço.Número}</p>
                                                <p className="mb-1"><strong>Complemento:</strong> {clinica.Endereço.Complemento}</p>
                                                <p className="mb-1"><strong>Bairro:</strong> {clinica.Endereço.Bairro}, {clinica.Endereço.Cidade} - {clinica.Endereço.Estado}</p>
                                            </div>
                                        ) : (
                                            <p>Endereço não disponível</p>
                                        )}
                                    </td>
                                    <td>
                                        <div className="d-flex">
                                            <button
                                                className="btn btn-warning btn-sm me-2"
                                                onClick={() => setEditarClinica(clinica)}
                                            >
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => removerClinica(clinica.ID_Clinica)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>

                                        </div>
                                    </td>

                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
            </div>
            <Paginator
                totalItems={clinicasFiltradas.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />

            {/* Modal para adicionar colaborador */}



            {/* Modal para editar clínica */}
            {editarClinica && (
                <EditarClinica
                    clinica={editarClinica}
                    onClose={() => setEditarClinica(null)}
                    onSave={(updatedClinica) => {
                        setClinicas((prev) =>
                            prev.map((clinica) =>
                                clinica.id === updatedClinica.id ? updatedClinica : clinica
                            )
                        );
                        setEditarClinica(null);
                    }}
                />
            )}
        </div>
    );
};

export default GerenciarClinicas;
