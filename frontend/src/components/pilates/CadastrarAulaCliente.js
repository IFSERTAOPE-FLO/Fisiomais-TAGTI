import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const CadastrarAulaCliente = () => {
    const [clienteId, setClienteId] = useState("");
    const [aulaId, setAulaId] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    const token = localStorage.getItem("token");
    const apiBaseUrl = "http://localhost:5000/pilates/";

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${apiBaseUrl}cliente/cadastrar_aula`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cliente_id: clienteId,
                    aula_id: aulaId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSucesso("Cliente inscrito com sucesso na aula!");
                setClienteId("");
                setAulaId("");
            } else {
                setErro(data.message || "Erro ao inscrever cliente.");
            }
        } catch (err) {
            setErro(err.message);
        }
    };

    return (
        <div className="container">
            <h2 className="mb-4 text-center">Cadastrar Cliente na Aula</h2>

            {erro && <p className="alert alert-danger">{erro}</p>}
            {sucesso && <p className="alert alert-success">{sucesso}</p>}

            <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                    <label>ID do Cliente</label>
                    <input
                        type="text"
                        className="form-control"
                        value={clienteId}
                        onChange={(e) => setClienteId(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group mb-3">
                    <label>ID da Aula</label>
                    <input
                        type="text"
                        className="form-control"
                        value={aulaId}
                        onChange={(e) => setAulaId(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Inscrever Cliente</button>
            </form>
        </div>
    );
};

export default CadastrarAulaCliente;
