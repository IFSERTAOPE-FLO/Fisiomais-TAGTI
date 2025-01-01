import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/Profile.css";
import AddClinica from "./AddClinica";
import EditarClinica from "./EditarClinica"; // Modal de edição de clínica
import Paginator from "./Paginator"; // Importe o componente Paginator

const GerenciarClinicas = () => {
    const [clinicas, setClinicas] = useState([]); // Lista de todas as clínicas disponíveis
    const [editarClinica, setEditarClinica] = useState(null); // Modal para editar clínica
    const [pesquisaNome, setPesquisaNome] = useState(""); // Estado para armazenar o filtro de nome
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [currentPage, setCurrentPage] = useState(1); // Página atual
    const [itemsPerPage] = useState(10); // Itens por página
    const savedRole = localStorage.getItem("role"); // Recupera o role do localStorage

    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/";

    const buscarClinicas = async () => {
        if (savedRole !== "admin" && savedRole !== "colaborador") {
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
                const data = JSON.parse(textResponse); // Converte para JSON
                setClinicas(data);
            } else {
                throw new Error("Erro ao buscar a lista de clínicas: " + textResponse);
            }
        } catch (err) {
            setErro(err.message);
        }
    };

    // Função para remover clínica
    const removerClinica = async (clinicaId) => {
        if (savedRole !== "admin") {
            alert("Apenas administradores podem remover clínicas.");
            return;
        }

        try {
            const response = await fetch(
                `${apiBaseUrl}clinicas/remover_clinica/${clinicaId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Role: savedRole,
                    },
                }
            );

            if (response.ok) {
                setClinicas((prev) => prev.filter((c) => c.ID_Clinica !== clinicaId));
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
    }, []); // Apenas no carregamento inicial, pois buscarClinicas não depende de outras variáveis

    // Função para ordenação das clínicas
    const handleSort = (key) => {
        let sorted = [...clinicas];
        sorted.sort((a, b) => {
            const aValue = a[key].toLowerCase();
            const bValue = b[key].toLowerCase();
            return aValue.localeCompare(bValue);
        });
        setClinicas(sorted);
    };

    // Filtragem das clínicas pelo nome
    const clinicasFiltradas = pesquisaNome
        ? clinicas.filter((clinica) =>
            clinica.Nome.toLowerCase().includes(pesquisaNome.toLowerCase())
        )
        : clinicas;

    // Paginação das clínicas filtradas
    const clinicasPaginadas = clinicasFiltradas.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const handleSave = () => {
        buscarClinicas();
        setEditarClinica(null);

    };

    return (
        <div className="container">
            <h2 className="mb-4 text-secondary text-center">Gerenciar Clínicas</h2>

            <div className="card-body">
                {erro && <p className="alert alert-danger">{erro}</p>}
                {sucesso && <p className="alert alert-success">{sucesso}</p>}

                <AddClinica
                    onClinicaCriada={(novaClinica) =>
                        setClinicas((prev) => [...prev, novaClinica])
                    }
                />
                <br />
                <div className="input-group mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Pesquisar clinica"
                        value={pesquisaNome}
                        onChange={(e) => setPesquisaNome(e.target.value)}
                    />
                    <button className="btn btn-secondary" type="button" id="button-addon2">
                        <i className="bi bi-search"></i>
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-striped table-bordered mt-4">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th onClick={() => handleSort("Nome")} style={{ cursor: "pointer" }}>
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
                                    <td >{clinica.ID_Clinica}</td>
                                    <td>{clinica.Nome}</td>
                                    <td>{clinica.CNPJ}</td>
                                    <td>{clinica.Telefone}</td>
                                    <td>
                                        {clinica.Endereço
                                            ? [
                                                clinica.Endereço.Rua,
                                                clinica.Endereço.Número,
                                                clinica.Endereço.Complemento,
                                                clinica.Endereço.Bairro,
                                                clinica.Endereço.Cidade,
                                                clinica.Endereço.Estado
                                            ]
                                                .filter(Boolean) // Remove valores null ou undefined
                                                .join(', ') || "Endereço não disponível"
                                            : "Endereço não disponível"}
                                    </td>


                                    <td>
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

            {editarClinica && (
                <EditarClinica
                    clinica={editarClinica}
                    onClose={() => setEditarClinica(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default GerenciarClinicas;
