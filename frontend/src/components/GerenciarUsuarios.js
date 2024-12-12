import React, { useState, useEffect } from "react";
import EditarUsuario from "./EditarUsuario"; // Componente de edição de usuário

const GerenciarUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [erro, setErro] = useState("");
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [atualizarLista, setAtualizarLista] = useState(false);
  
    // Função para buscar usuários
    const buscarUsuarios = async () => {
      try {
        const token = localStorage.getItem("token"); // Assumindo que o token está armazenado no localStorage
        const response = await fetch("http://localhost:5000/api/listar_usuarios", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          setErro("Erro na requisição: " + response.statusText);
          return;
        }
  
        const data = await response.json();
  
        if (Array.isArray(data)) {
          setUsuarios(data);
          setAtualizarLista(prevState => !prevState);
        } else {
          setErro("A resposta da API não é um array.");
        }
      } catch (err) {
        setErro("Erro ao buscar usuários.");
      }
    };
  
    // Função para deletar usuário
    const deletarUsuario = async (tipo, id) => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:5000/api/deletar_usuario/${tipo}/${id}`,
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
  console.log("Editando usuário:", usuario); 
  setUsuarioEditando(usuario);
};

  
    const handleCloseModal = () => {
      setUsuarioEditando(null); // Fechar o modal
    };
  
    const handleSave = () => {
      buscarUsuarios(); // Atualizar a lista de usuários
      setUsuarioEditando(null); // Fechar o modal
    };
    useEffect(() => {
      if (usuarios.length > 0) {
        document.documentElement.style.height = 'auto'; // Ajusta o layout para ativar rolagem
      }
    }, [atualizarLista, usuarios]); // O efeito depende do estado de atualizarLista e usuarios
    return (
      <div>
        <h2 className="mb-3">Gerenciar Usuários</h2>
        <button className="btn btn-outline-secondary mb-3" onClick={buscarUsuarios}>
          Atualizar Lista
        </button>
        {erro && <p className="alert alert-danger">{erro}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Tipo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.ID}>
                <td>{usuario.nome}</td>
                <td>{usuario.email}</td>
                <td>{usuario.role}</td>
                <td>
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => handleEditarUsuario(usuario)} // Agora chama corretamente
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deletarUsuario(usuario.role, usuario.ID)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
  
        {usuarioEditando && ( 
        <EditarUsuario usuario={usuarioEditando}        
        role={usuarioEditando.role}        
        onClose={handleCloseModal} 
        onSave={handleSave} />
    
        )}
      </div>
    );
  };


export default GerenciarUsuarios;