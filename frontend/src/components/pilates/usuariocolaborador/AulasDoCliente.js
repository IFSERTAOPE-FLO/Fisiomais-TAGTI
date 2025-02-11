// AulasDoCliente.js
import React, { useState, useEffect } from "react";

const AulasDoCliente = ({ clienteId }) => {
  const [aulas, setAulas] = useState([]);
  const [erro, setErro] = useState("");
  const token = localStorage.getItem("token");
  const apiBaseUrl = "http://localhost:5000/";

  const buscarAulasDoCliente = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}pilates/cliente/${clienteId}/aulas`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAulas(data.aulas);
      } else {
        setErro(data.message || "Erro ao buscar aulas do cliente.");
      }
    } catch (err) {
      setErro("Erro na requisição.");
    }
  };

  useEffect(() => {
    if (clienteId) {
      buscarAulasDoCliente();
    }
  }, [clienteId]);

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Aulas do Cliente</h3>
      {erro && <div className="alert alert-danger">{erro}</div>}
      {aulas.length === 0 ? (
        <p>Não há aulas para este cliente.</p>
      ) : (
        <ul className="list-group">
          {aulas.map((aula) => (
            <li key={aula.idAula} className="list-group-item">
              <strong>ID Aula:</strong> {aula.idAula} &nbsp;|&nbsp; 
              <strong>Serviço:</strong> {aula.servico || "N/D"} &nbsp;|&nbsp; 
              <strong>Dia:</strong> {aula.diaSemana} &nbsp;|&nbsp; 
              <strong>Horário:</strong> {aula.horaInicio} às {aula.horaFim}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AulasDoCliente;
