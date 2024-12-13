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
  const [novoPlano, setNovoPlano] = useState({ nome: "", valor: "" });
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
      const colaboradores = data.filter((usuario) => usuario.role === "colaborador");
      setColaboradores(colaboradores);
    } catch (err) {
      setErro("Erro ao buscar usuários.");
    }
  };

  useEffect(() => {
    buscarServicos();
    buscarUsuarios();
  }, []);

  const salvarServico = async () => {
    if (!novoServico.nome_servico || !novoServico.descricao || !novoServico.valor || !novoServico.tipo_servico) {
      setErro("Preencha todos os campos obrigatórios do serviço.");
      return;
    }

    if (novoServico.tipo_servico === "pilates" && novoServico.planos.length === 0) {
      setErro("Serviços de Pilates precisam ter ao menos um plano.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/add_servico", {
        method: "POST",
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
    setNovoPlano({ nome: "", valor: "" });
  };

  const adicionarPlano = () => {
    if (!novoPlano.nome || !novoPlano.valor) {
      setErro("Preencha os campos Nome e Valor do plano.");
      return;
    }

    setNovoServico((prev) => ({
      ...prev,
      planos: [...prev.planos, { Nome_plano: novoPlano.nome, Valor: parseFloat(novoPlano.valor) }],
    }));

    setNovoPlano({ nome: "", valor: "" });
    setErro("");
  };

  const deletarServico = async (idServico) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErro("Token não encontrado.");
        return;
      }

      const response = await fetch(`http://localhost:5000/api/deletar_servico/${idServico}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  const handleTipoServicoChange = (e) => {
    const tipo = e.target.value;
    setNovoServico((prev) => ({
      ...prev,
      tipo_servico: tipo,
      planos: tipo === "pilates" ? [] : prev.planos,
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
              value={novoPlano.nome}
              onChange={(e) => setNovoPlano({ ...novoPlano, nome: e.target.value })}
              className="form-control mb-2"
            />
            <input
              type="number"
              placeholder="Valor do Plano"
              value={novoPlano.valor}
              onChange={(e) => setNovoPlano({ ...novoPlano, valor: e.target.value })}
              className="form-control mb-2"
            />
            <button type="button" onClick={adicionarPlano} className="btn btn-primary mb-2">
              Adicionar Plano
            </button>

            {novoServico.planos.length > 0 && (
              <div>
                <h5>Planos Adicionados:</h5>
                <ul>
                  {novoServico.planos.map((plano, index) => (
                    <li key={index}>
                      {plano.Nome_plano} - R${plano.Valor.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <button type="submit" className="btn btn-success">
          Adicionar Serviço
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
      <th>Planos</th>
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
        <td className="text-center">
          {servico.Tipo === "pilates" && servico.Planos && servico.Planos.length > 0 ? (
            <ul className="list-unstyled">
              {servico.Planos.map((plano, index) => (
                <li key={index}>
                  {plano.Nome_plano} - R${plano.Valor.toFixed(2)}
                </li>
              ))}
            </ul>
          ) : (
            servico.Tipo === "pilates" ? "Nenhum plano adicionado" : <span className="d-block">-</span>
          )}
        </td>
        <td>
          {servico.Colaboradores && servico.Colaboradores.length > 0
            ? servico.Colaboradores.join(", ")
            : "Nenhum colaborador"}
        </td>
        <td>
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
  );
};

export default GerenciarServicos;

