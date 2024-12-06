import React, { useState, useEffect } from "react";
import axios from "axios";

const PingPage = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/ping")
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((error) => {
        console.error("Erro ao fazer a chamada para o backend:", error);
        setMessage("Erro ao conectar ao servidor.");
      });
  }, []);

  return (
    <div className="container mt-5">
      <h1>Comunicação com o Backend</h1>
      <p>Resposta do backend: {message}</p>
    </div>
  );
};

export default PingPage;
    