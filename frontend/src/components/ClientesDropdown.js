import React, { useState, useEffect } from "react";

const ClientesDropdown = ({ onSelect, value }) => {
  const [alunos, setAlunos] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const buscarAlunos = async () => { 
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/usuarios/listar_usuarios?role=cliente", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar alunos");
        }

        const data = await response.json();
        console.log('API Response:', data);  

        if (data.usuarios && Array.isArray(data.usuarios)) {
          setAlunos(data.usuarios || []);  
        } else {
          setErro("Nenhum aluno encontrado ou resposta inválida.");
        }
      } catch (err) {
        setErro(err.message);
      }
    };

    buscarAlunos();
  }, []);

  const handleSelect = (event) => {
    onSelect(event.target.value);
  };

  return (
    <>
      {erro && <p className="text-danger">{erro}</p>}
      <select 
        onChange={handleSelect} 
        className="form-select"
        value={value}  
      >
        <option value="">Selecione um aluno</option>
        {alunos.map((aluno) => (  
          <option key={aluno.id} value={aluno.name}> 
            {aluno.nome} 
          </option>
        ))}
      </select>
    </>
  );
};

export default ClientesDropdown;
