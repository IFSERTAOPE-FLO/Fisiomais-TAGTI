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


  const GerenciarServicos = () => {
    const [servicos, setServicos] = useState([]);
    const [colaboradores, setColaboradores] = useState([]);
    const [novoServico, setNovoServico] = useState({
      nome_servico: "",
      descricao: "",
      valor: "",
      tipo_servico: "",
      planos: [],
      colaboradores_ids: [],
    });
    const [erro, setErro] = useState("");
    const [editando, setEditando] = useState(false);
  
    // Função para buscar serviços
    const buscarServicos = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/listar_servicos");
        const data = await response.json();
        if (Array.isArray(data)) {
          setServicos(data);
        } else {
          setErro("A resposta da API não é um array.");
        }
      } catch (err) {
        setErro("Erro ao buscar serviços.");
      }
    };
  
    // Função para buscar colaboradores
    const buscarUsuarios = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/listar_usuarios", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          setErro("Erro ao buscar usuários: " + response.statusText);
          return;
        }
  
        const data = await response.json();
        if (Array.isArray(data)) {
          const colaboradores = data.filter((usuario) => usuario.role === "colaborador");
          setColaboradores(colaboradores);
        } else {
          setErro("A resposta da API não é um array.");
        }
      } catch (err) {
        setErro("Erro ao buscar usuários.");
      }
    };
  
    useEffect(() => {
      buscarServicos();
      buscarUsuarios();
    }, []);
  
    // Salvar ou editar serviço
    const salvarServico = async () => {
      const metodo = editando ? "PUT" : "POST";
      const url = editando
        ? `http://localhost:5000/api/editar_servico/${novoServico.ID_Servico}`
        : "http://localhost:5000/add_servico";
  
      try {
        const response = await fetch(url, {
          method: metodo,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novoServico),
        });
        const data = await response.json();
        if (response.ok) {
          setServicos((prev) =>
            editando
              ? prev.map((serv) =>
                  serv.ID_Servico === novoServico.ID_Servico ? data.servico : serv
                )
              : [...prev, data.servico]
          );
          resetForm();
          alert(data.message);
        } else {
          throw new Error(data.error || "Erro ao salvar serviço.");
        }
      } catch (err) {
        setErro(err.message);
      }
    };
  
    // Resetar formulário
    const resetForm = () => {
      setNovoServico({
        nome_servico: "",
        descricao: "",
        valor: "",
        tipo_servico: "",
        planos: [],
        colaboradores_ids: [],
      });
      setEditando(false);
    };
  
    // Editar serviço
    const editarServico = (servico) => {
      setNovoServico({
        ID_Servico: servico.ID_Servico,
        nome_servico: servico.Nome_servico,
        descricao: servico.Descricao,
        valor: servico.Valor,
        tipo_servico: servico.Tipo,
        planos: servico.Planos || [],
        colaboradores_ids: servico.Colaboradores.map((c) => c.ID_Colaborador),
      });
      setEditando(true);
    };
  
    // Deletar serviço
    const deletarServico = async (idServico) => {
      try {
        const response = await fetch(`http://localhost:5000/api/deletar_servico/${idServico}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (response.ok) {
          setServicos((prev) => prev.filter((servico) => servico.ID_Servico !== idServico));
          alert(data.message);
        } else {
          throw new Error(data.error || "Erro ao deletar serviço.");
        }
      } catch (err) {
        setErro(err.message);
      }
    };
  
    // Remover colaborador
    const removerColaborador = (id) => {
      setNovoServico((prev) => ({
        ...prev,
        colaboradores_ids: prev.colaboradores_ids.filter((cid) => cid !== id),
      }));
    };
  
    // Adicionar colaborador
    const adicionarColaborador = async (id) => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/adicionar_colaboradores_servico/${novoServico.ID_Servico}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ colaboradores_ids: [id] }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setNovoServico((prev) => ({
            ...prev,
            colaboradores_ids: [...prev.colaboradores_ids, id],
          }));
          alert(data.message);
        } else {
          throw new Error(data.error || "Erro ao adicionar colaborador.");
        }
      } catch (err) {
        setErro(err.message);
      }
    };
  
    // Renderizar colaboradores relacionados e disponíveis
    const colaboradoresDisponiveis = colaboradores.filter(
      (colaborador) => !novoServico.colaboradores_ids.includes(colaborador.ID_Colaborador)
    );
  
    return (
      <div className="container">
        <h2 className="mb-4">Gerenciar Serviços</h2>
        {erro && <div className="alert alert-danger">{erro}</div>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            salvarServico();
          }}
          className="mb-4"
        >
          <input
            type="text"
            placeholder="Nome do Serviço"
            value={novoServico.nome_servico}
            onChange={(e) => setNovoServico({ ...novoServico, nome_servico: e.target.value })}
            required
            className="form-control mb-2"
          />
          <input
            type="text"
            placeholder="Descrição"
            value={novoServico.descricao}
            onChange={(e) => setNovoServico({ ...novoServico, descricao: e.target.value })}
            required
            className="form-control mb-2"
          />
          <input
            type="number"
            placeholder="Valor"
            value={novoServico.valor}
            onChange={(e) => setNovoServico({ ...novoServico, valor: e.target.value })}
            className="form-control mb-2"
          />
          <select
            value={novoServico.tipo_servico}
            onChange={(e) => setNovoServico({ ...novoServico, tipo_servico: e.target.value })}
            className="form-control mb-2"
          >
            <option value="">Selecione o Tipo de Serviço</option>
            <option value="fisioterapia">Fisioterapia</option>
            <option value="pilates">Pilates</option>
          </select>
  
          <div className="mb-3">
            <h5>Colaboradores Adicionados</h5>
            {novoServico.colaboradores_ids.map((id) => {
              const colaborador = colaboradores.find((col) => col.ID_Colaborador === id);
              return (
                <div
                  key={id}
                  className="d-flex justify-content-between align-items-center border p-2 mb-2 rounded"
                >
                  <span>{colaborador?.nome || "Desconhecido"}</span>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removerColaborador(id)}
                  >
                    Remover
                  </button>
                </div>
              );
            })}
          </div>
  
          <div className="mb-3">
            <h5>Adicionar Colaboradores</h5>
            <div className="row">
              {colaboradoresDisponiveis.map((colaborador) => (
                <div className="col-md-4 mb-2" key={colaborador.ID_Colaborador}>
                  <div className="card p-2">
                    <span>{colaborador.nome}</span>
                    <button
                      className="btn btn-success btn-sm mt-2"
                      onClick={() => adicionarColaborador(colaborador.ID_Colaborador)}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
  
          <button type="submit" className="btn btn-primary">
            {editando ? "Editar Serviço" : "Adicionar Serviço"}
          </button>
        </form>
  
        <h3>Lista de Serviços</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Tipo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {servicos.map((servico) => (
              <tr key={servico.ID_Servico}>
                <td>{servico.Nome_servico}</td>
                <td>{servico.Descricao}</td>
                <td>{servico.Valor}</td>
                <td>{servico.Tipo}</td>
                <td>
                  <div className="btn-group">
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => editarServico(servico)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deletarServico(servico.ID_Servico)}
                    >
                      Remover
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
 
  
  
};


  
export default AdminPage;
