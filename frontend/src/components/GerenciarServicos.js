import React, { useState, useEffect } from "react";

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
  const [mensagem, setMensagem] = useState(""); 

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

  const salvarServico = async () => {
    const metodo = "POST";  // Certifique-se de que está criando um novo serviço
    const url = "http://localhost:5000/add_servico";  // URL para adicionar o serviço

    try {
      const response = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoServico),
      });
      const data = await response.json();
      if (response.ok) {
        setServicos((prev) => [...prev, data.servico]);
        resetForm();
        setMensagem(data.message);
      } else {
        throw new Error(data.error || "Erro ao salvar serviço.");
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  const resetForm = () => {
    setNovoServico({
      nome_servico: "",
      descricao: "",
      valor: "",
      tipo_servico: "",
      planos: [],
      colaboradores_ids: [],
    });
  };

  const deletarServico = async (idServico) => {
    try {
      const token = localStorage.getItem("token");  // Verifique se o token está no localStorage
      if (!token) {
        setErro("Token não encontrado.");
        return;
      }
  
      const response = await fetch(`http://localhost:5000/api/deletar_servico/${idServico}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,  // Enviar o token no cabeçalho
        },
      });
  
      const data = await response.json();
      if (response.ok) {
        setServicos((prev) => prev.filter((servico) => servico.ID_Servico !== idServico));
        setMensagem(data.message);
      } else {
        throw new Error(data.message || "Erro ao deletar serviço.");
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  const removerColaborador = (id) => {
    setNovoServico((prev) => ({
      ...prev,
      colaboradores_ids: prev.colaboradores_ids.filter((cid) => cid !== id),
    }));
  };

  const adicionarColaborador = (id) => {
    setNovoServico((prev) => ({
      ...prev,
      colaboradores_ids: [...prev.colaboradores_ids, id],
    }));
  };

  const colaboradoresDisponiveis = colaboradores.filter(
    (colaborador) => !novoServico.colaboradores_ids.includes(colaborador.ID_Colaborador)
  );

  const handleTipoServicoChange = (e) => {
    const tipo = e.target.value;
    setNovoServico((prev) => ({
      ...prev,
      tipo_servico: tipo,
      planos: tipo === "pilates" ? [] : prev.planos, // Limpar planos se não for Pilates
    }));
  };

  return (
    <div className="container">
      <h2 className="mb-4">Gerenciar Serviços</h2>
      {erro && <div className="alert alert-danger">{erro}</div>}
      {mensagem && <div className="alert alert-success">{mensagem}</div>}
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
          onChange={handleTipoServicoChange}
          className="form-control mb-2"
        >
          <option value="">Selecione o Tipo de Serviço</option>
          <option value="fisioterapia">Fisioterapia</option>
          <option value="pilates">Pilates</option>
        </select>

        {novoServico.tipo_servico === "pilates" && (
          <>
            <input
              type="text"
              placeholder="Nome do Plano"
              value={novoServico.plano_nome}
              onChange={(e) => setNovoServico({ ...novoServico, plano_nome: e.target.value })}
              className="form-control mb-2"
            />
            <input
              type="number"
              placeholder="Valor do Plano"
              value={novoServico.plano_valor}
              onChange={(e) => setNovoServico({ ...novoServico, plano_valor: e.target.value })}
              className="form-control mb-2"
            />
          </>
        )}

        <div className="mb-3">
          <h5>Colaboradores Adicionados</h5>
          {novoServico.colaboradores_ids.map((id) => {
            const colaborador = colaboradores.find((col) => col.ID_Colaborador === id);
            return (
              <div key={id} className="d-flex justify-content-between align-items-center border p-2 mb-2 rounded">
                <span>{colaborador?.nome || "Desconhecido"}</span>
                <button className="btn btn-danger btn-sm" onClick={() => removerColaborador(id)}>
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

        <button type="submit" className="btn btn-primary">Adicionar Serviço</button>
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
                <button className="btn btn-danger btn-sm" onClick={() => deletarServico(servico.ID_Servico)}>
                  Deletar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GerenciarServicos;
