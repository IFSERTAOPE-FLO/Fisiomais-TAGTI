import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

const estados = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const AddClinica = ({ onClinicaCriada, savedRole }) => {
    const [dadosClinica, setDadosClinica] = useState({
        nome: "",
        cnpj: "",
        telefone: "",
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
    });
    const [cidades, setCidades] = useState([]);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    // Fetch cities based on the selected state
    useEffect(() => {
        const fetchCidades = async () => {
            if (dadosClinica.estado) {
                try {
                    const response = await fetch(
                        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${dadosClinica.estado}/distritos`
                    );
                    if (response.ok) {
                        const cidadesIBGE = await response.json();
                        const cidadesOrdenadas = cidadesIBGE
                            .map((cidade) => cidade.nome)
                            .sort((a, b) => a.localeCompare(b));
                        setCidades(cidadesOrdenadas);
                    } else {
                        throw new Error("Erro ao buscar cidades.");
                    }
                } catch (err) {
                    setErro(err.message);
                }
            } else {
                setCidades([]);
            }
        };

        fetchCidades();
    }, [dadosClinica.estado]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDadosClinica((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const savedRole = localStorage.getItem("role"); // Recupera o role do localStorage
            const response = await fetch("http://localhost:5000/clinicas/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Role": savedRole,  // Envia o role no cabeçalho
                    "Authorization": `Bearer ${localStorage.getItem("token")}`  // Também envia o token JWT
                },
                body: JSON.stringify(dadosClinica),
            });

            if (response.ok) {
                const data = await response.json();
                setSucesso("Clínica criada com sucesso!");
                setErro("");
                onClinicaCriada(data);
            } else {
                const errorData = await response.json();
                setErro(errorData.message || "Erro ao criar clínica.");
            }
        } catch (err) {
            setErro(err.message);
        }
    };

    return (
        <div className="container mt-5">
            {erro && <div className="alert alert-danger">{erro}</div>}
            {sucesso && <div className="alert alert-success">{sucesso}</div>}
            <form onSubmit={handleSubmit} className="">

                {/* Inputs para dados da clínica */}
                <div className="row mb-2">
                    <div className="col-md-3">
                        <input
                            type="text"
                            name="nome"
                            id="nome"
                            className="form-control py-1 px-2"
                            placeholder="Nome da Clínica"
                            value={dadosClinica.nome}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="col-md-3">
                        <input
                            type="text"
                            name="cnpj"
                            id="cnpj"
                            className="form-control py-1 px-2"
                            placeholder="CNPJ"
                            value={dadosClinica.cnpj}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="col-md-3">
                        <input
                            type="text"
                            name="telefone"
                            id="telefone"
                            className="form-control py-1 px-2"
                            placeholder="Telefone"
                            value={dadosClinica.telefone}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="col-md-3">
                        <input
                            type="text"
                            name="rua"
                            id="rua"
                            className="form-control py-1 px-2"
                            placeholder="Rua"
                            value={dadosClinica.rua}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-md-2">
                        <input
                            type="text"
                            name="numero"
                            id="numero"
                            className="form-control py-1 px-2"
                            placeholder="Número"
                            value={dadosClinica.numero}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="col-md-3">
                        <input
                            type="text"
                            name="complemento"
                            id="complemento"
                            className="form-control py-1 px-2"
                            placeholder="Complemento"
                            value={dadosClinica.complemento}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="text"
                            name="bairro"
                            id="bairro"
                            className="form-control py-1 px-2"
                            placeholder="Bairro"
                            value={dadosClinica.bairro}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="col-md-3">
                        <select
                            name="cidade"
                            id="cidade"
                            className="form-select py-1 px-2"
                            value={dadosClinica.cidade}
                            onChange={handleInputChange}
                            disabled={!cidades.length}
                        >
                            <option value="">Selecione a cidade</option>
                            {cidades.map((cidade, index) => (
                                <option key={index} value={cidade}>
                                    {cidade}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <select
                            name="estado"
                            id="estado"
                            className="form-select py-1 px-2"
                            value={dadosClinica.estado}
                            onChange={handleInputChange}
                        >
                            <option value="">Selecione o estado</option>
                            {estados.map((estado) => (
                                <option key={estado} value={estado}>
                                    {estado}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="d-flex justify-content-center">
                    <button type="submit" className="btn btn-login mt-3">Adicionar Clínica</button>
                </div>
            </form>
        </div>
    );
};

export default AddClinica;
