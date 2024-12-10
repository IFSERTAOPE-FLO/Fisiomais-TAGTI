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
  
    // Buscar serviços
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
  
    // Buscar usuários (colaboradores)
    const buscarUsuarios = async () => {
      try {
        const token = localStorage.getItem("token");
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
  
    // Adicionar ou editar serviço
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
  
    // Resetar o formulário
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
  
    const deletarServico = async (id) => {
      try {
        const response = await fetch(`http://localhost:5000/api/deletar_servico/${id}`, { method: "DELETE" });
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
  
    const editarServico = (servico) => {
      setNovoServico({
        ID_Servico: servico.ID_Servico,
        nome_servico: servico.Nome_servico,
        descricao: servico.Descricao,
        valor: servico.Valor,
        tipo_servico: servico.Tipo,
        planos: servico.Planos || [],
        colaboradores_ids: servico.Colaboradores.map((colaborador) => colaborador.ID_Colaborador),
      });
      setEditando(true); 
    };
  
    // Adicionar colaboradores ao serviço
    const adicionarColaboradoresAoServico = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/adicionar_colaboradores_servico/${novoServico.ID_Servico}`, {
          method: "POST", 
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            colaboradores_ids: novoServico.colaboradores_ids,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          buscarServicos(); 
        } else {
          throw new Error(data.error || "Erro ao adicionar colaboradores.");
        }
      } catch (err) {
        setErro(err.message);
      }
    };
  
    // Remover colaboradores do serviço
    const removerColaboradoresDoServico = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/remover_colaboradores_servico/${novoServico.ID_Servico}`, {
          method: "DELETE", 
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            colaboradores_ids: novoServico.colaboradores_ids,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          buscarServicos(); 
        } else {
          throw new Error(data.error || "Erro ao remover colaboradores.");
        }
      } catch (err) {
        setErro(err.message);
      }
    };
  
    // Remover plano do serviço
    const removerPlano = (index) => {
      const novosPlanos = novoServico.planos.filter((_, i) => i !== index);
      setNovoServico({ ...novoServico, planos: novosPlanos });
    };
  
    // Filtra os colaboradores que ainda não foram adicionados ao serviço
    const colaboradoresDisponiveis = colaboradores.filter(
      (colaborador) => !novoServico.colaboradores_ids.includes(colaborador.ID_Colaborador)
    );
  
    return (
      <div>
        <h2 className="mb-3">Gerenciar Serviços</h2>
        <button className="btn btn-outline-secondary mb-3" onClick={buscarServicos}>
          Atualizar Lista
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            salvarServico();
          }}
          className="mb-3"
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
  
          {novoServico.tipo_servico === "pilates" && (
            <>
              <h5>Planos de Pilates</h5>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Nome do plano"
                  value={novoServico.novoPlano || ""}
                  onChange={(e) => setNovoServico({
                    ...novoServico,
                    novoPlano: e.target.value
                  })}
                  className="form-control mb-2"
                />
                <input
                  type="number"
                  placeholder="Valor em R$"
                  value={novoServico.novoValor || ""}
                  onChange={(e) => setNovoServico({
                    ...novoServico,
                    novoValor: e.target.value
                  })}
                  className="form-control mb-2"
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (novoServico.novoPlano && novoServico.novoValor) {
                      setNovoServico({
                        ...novoServico,
                        planos: [
                          ...novoServico.planos,
                          { plano: novoServico.novoPlano, valor: novoServico.novoValor },
                        ],
                        novoPlano: "",
                        novoValor: "",
                      });
                    }
                  }}
                >
                  Adicionar Plano
                </button>
              </div>
  
              {/* Renderizando os planos já adicionados */}
              <div className="mb-3">
                {novoServico.planos.length > 0 ? (
                  novoServico.planos.map((plano, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center border p-2 mb-2 rounded">
                      <div>
                        <strong>{plano.plano}</strong> - <span className="text-muted">{plano.valor} R$</span>
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => removerPlano(index)}
                        title="Remover plano"
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">Sem planos disponíveis</p>
                )}
              </div>
            </>
          )}
  
          <div className="mb-2">
            <h4>Colaboradores</h4>
            <select
              multiple
              value={novoServico.colaboradores_ids}
              onChange={(e) => setNovoServico({
                ...novoServico,
                colaboradores_ids: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="form-control"
            >
              {colaboradoresDisponiveis.map((colaborador) => (
                <option key={colaborador.ID_Colaborador} value={colaborador.ID_Colaborador}>
                  {colaborador.Nome}
                </option>
              ))}
            </select>
          </div>
  
          <button type="submit" className="btn btn-primary">
            {editando ? "Editar Serviço" : "Adicionar Serviço"}
          </button>
        </form>
  
        <div>
          <h3>Lista de Serviços</h3>
          {erro && <div className="alert alert-danger">{erro}</div>}
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Tipo</th>
                <th>Colaboradores</th>
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
                  {servico.Colaboradores.map((colaborador) => {
                    const colaboradorEncontrado = colaboradores.find(
                      (usuario) => usuario.ID_Colaborador === colaborador.ID_Colaborador
                    );
                    return colaboradorEncontrado ? (
                      <span key={colaborador.ID_Colaborador}>{colaboradorEncontrado.Nome}, </span>
                    ) : null;
                  })}

                  </td>
                  <td>
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
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
export default AdminPage;
