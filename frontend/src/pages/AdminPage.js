import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import EditarUsuario from "../components/EditarUsuario"; // Corrigido o caminho para o componente

const AdminPage = () => {
  const [opcaoSelecionada, setOpcaoSelecionada] = useState("");

  const handleOpcaoChange = (opcao) => {
    setOpcaoSelecionada(opcao);
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Painel do Administrador</h1>

      {/* Escolha de Opção */}
      <div className="row mb-4">
        <div className="col-12 text-center">
          <button
            className="btn btn-primary mx-2"
            onClick={() => handleOpcaoChange("usuarios")}
          >
            Gerenciar Usuários
          </button>
          <button
            className="btn btn-success mx-2"
            onClick={() => handleOpcaoChange("servicos")}
          >
            Gerenciar Serviços
          </button>
        </div>
      </div>

      {/* Conteúdo baseado na opção selecionada */}
      {opcaoSelecionada === "usuarios" && <GerenciarUsuarios />}
      {opcaoSelecionada === "servicos" && <GerenciarServicos />}
    </div>
  );
};

const GerenciarUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [erro, setErro] = useState("");
    const [usuarioEditando, setUsuarioEditando] = useState(null);
  
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
  console.log("Editando usuário:", usuario);  // Verifique se o ID é válido
  setUsuarioEditando(usuario);
};

  
    const handleCloseModal = () => {
      setUsuarioEditando(null); // Fechar o modal
    };
  
    const handleSave = () => {
      buscarUsuarios(); // Atualizar a lista de usuários
      setUsuarioEditando(null); // Fechar o modal
    };
    useEffect(() => { buscarUsuarios(); 
        }, []);
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

const GerenciarServicos = () => {
  const [servicos, setServicos] = useState([]);
  const [novoServico, setNovoServico] = useState({
    nome_servico: "",
    descricao: "",
    valor: "",
  });
  const [erro, setErro] = useState("");

  // Função para buscar serviços
  
  const buscarServicos = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/listar_servicos");
      const data = await response.json();
      setServicos(data);
    } catch (err) {
      setErro("Erro ao buscar serviços.");
    }
  };

  // Função para adicionar serviço
  const adicionarServico = async () => {
    try {
      const response = await fetch("http://localhost:5000/add_servico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoServico),
      });
      const data = await response.json();
      if (response.ok) {
        setServicos([...servicos, data.servico]);
        setNovoServico({ nome_servico: "", descricao: "", valor: "" });
        alert(data.message);
      } else {
        throw new Error(data.error || "Erro ao adicionar serviço.");
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  const token = localStorage.getItem("token");
  const deletarServico = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/deletar_servico/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
      });
      const data = await response.json();
      if (response.ok) {
        setServicos(servicos.filter((servico) => servico.ID_Servico !== id));
        alert(data.message);
      } else {
        throw new Error(data.message || "Erro ao deletar serviço.");
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <div>
      <h2 className="mb-3">Gerenciar Serviços</h2>
      <button className="btn btn-outline-secondary mb-3" onClick={buscarServicos}>
        Atualizar Lista
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          adicionarServico();
        }}
        className="mb-3"
      >
        <input
          type="text"
          placeholder="Nome do Serviço"
          value={novoServico.nome_servico}
          onChange={(e) =>
            setNovoServico({ ...novoServico, nome_servico: e.target.value })
          }
          required
          className="form-control mb-2"
        />
        <input
          type="text"
          placeholder="Descrição"
          value={novoServico.descricao}
          onChange={(e) =>
            setNovoServico({ ...novoServico, descricao: e.target.value })
          }
          required
          className="form-control mb-2"
        />
        <input
          type="number"
          placeholder="Valor"
          value={novoServico.valor}
          onChange={(e) =>
            setNovoServico({ ...novoServico, valor: e.target.value })
          }
          required
          className="form-control mb-2"
        />
        <button className="btn btn-success">Adicionar Serviço</button>
      </form>
      {erro && <p className="alert alert-danger">{erro}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
  {servicos && servicos.length > 0 ? (
    servicos.map((servico) => (
      <tr key={servico.ID_Servico}>
        <td>{servico.Nome_servico}</td>
        <td>{servico.Descricao}</td>
        <td>{servico.Valor}</td>
        <td>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => deletarServico(servico.ID_Servico)}
          >
            Excluir
          </button>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="4">Nenhum serviço encontrado.</td>
    </tr>
  )}
</tbody>

      </table>
    </div>
  );
};

export default AdminPage;
