import React, { useState, useEffect } from "react";
import { FaUserPlus, FaUserMinus } from "react-icons/fa";

const AddColaboradoresServicos = ({ servicoId, onSave, onClose }) => {
  const [colaboradoresDisponiveis, setColaboradoresDisponiveis] = useState([]);
  const [colaboradoresServico, setColaboradoresServico] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        const response = await fetch(`http://localhost:5000/colaboradores/colaboradoresdisponiveis?servico_id=${servicoId}`);
        const data = await response.json();

        if (response.ok) {
          setColaboradoresDisponiveis(data.disponiveis);
          setColaboradoresServico(data.alocados);
        } else {
          throw new Error(data.message || "Erro ao buscar colaboradores.");
        }
      } catch (err) {
        setErro(err.message);
      }
    };

    if (servicoId) fetchColaboradores();
  }, [servicoId]);

  const adicionarColaborador = (colaboradorId) => {
    setColaboradoresDisponiveis((prev) =>
      prev.filter((colaborador) => colaborador.id_colaborador !== colaboradorId)
    );
    setColaboradoresServico((prev) => [
      ...prev,
      colaboradoresDisponiveis.find((colaborador) => colaborador.id_colaborador === colaboradorId)
    ]);
  };

  const removerColaborador = (colaboradorId) => {
    setColaboradoresDisponiveis((prev) => [
      ...prev,
      colaboradoresServico.find((colaborador) => colaborador.id_colaborador === colaboradorId)
    ]);
    setColaboradoresServico((prev) =>
      prev.filter((colaborador) => colaborador.id_colaborador !== colaboradorId)
    );
  };

  const salvarAlteracoes = async () => {
    if (colaboradoresServico.length === 0) {
      setErro("Pelo menos um colaborador precisa ser adicionado.");
      return;
    }

    try {
      const adicionarIds = colaboradoresServico
        .filter((colaborador) => !colaboradoresDisponiveis.find((item) => item.id_colaborador === colaborador.id_colaborador))
        .map((colaborador) => colaborador.id_colaborador);

      const removerIds = colaboradoresDisponiveis
        .filter((colaborador) => !colaboradoresServico.find((item) => item.id_colaborador === colaborador.id_colaborador))
        .map((colaborador) => colaborador.id_colaborador);

      if (adicionarIds.length > 0) {
        const responseAdicionar = await fetch("http://localhost:5000/servicos/adicionar_colaboradores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ servico_id: servicoId, colaboradores_ids: adicionarIds }),
        });

        if (!responseAdicionar.ok) {
          const data = await responseAdicionar.json();
          setErro(data.error);
          return;
        }
      }

      if (removerIds.length > 0) {
        const responseRemover = await fetch("http://localhost:5000/servicos/remover_colaboradores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ servico_id: servicoId, colaboradores_ids: removerIds }),
        });

        if (!responseRemover.ok) {
          const data = await responseRemover.json();
          setErro(data.error);
          return;
        }
      }

      // Atualiza o estado principal com a lista final de colaboradores
      onSave(colaboradoresServico);

      // Fechar o modal após salvar as alterações
      onClose();
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0, 0, 0, 0.5)" }}>
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Adicionar ou Remover Colaboradores</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {erro && <div className="alert alert-danger">{erro}</div>}
            <div className="row">
              {/* Coluna para colaboradores disponíveis */}
              <div className="col-md-6">
                <h5>Colaboradores Disponíveis</h5>
                <ul className="list-group">
                  {colaboradoresDisponiveis.map((colaborador) => (
                    <li key={colaborador.id_colaborador} className="list-group-item d-flex justify-content-between align-items-center">
                      {colaborador.Nome}
                      <button className="btn btn-success" onClick={() => adicionarColaborador(colaborador.id_colaborador)}>
                        <FaUserPlus />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Coluna para colaboradores do serviço */}
              <div className="col-md-6">
                <h5>Colaboradores do Serviço</h5>
                <ul className="list-group">
                  {colaboradoresServico.map((colaborador) => (
                    <li key={colaborador.id_colaborador} className="list-group-item d-flex justify-content-between align-items-center">
                      {colaborador.Nome}
                      <button className="btn btn-danger" onClick={() => removerColaborador(colaborador.id_colaborador)}>
                        <FaUserMinus />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Fechar
            </button>
            <button type="button" className="btn btn-primary" onClick={salvarAlteracoes}>
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddColaboradoresServicos;
