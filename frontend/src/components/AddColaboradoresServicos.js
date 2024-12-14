import React, { useState, useEffect } from "react";
import { FaUserPlus, FaTrashAlt } from "react-icons/fa";

const AddColaboradoresServicos = ({ servicoId, onSave, onClose }) => {
  const [colaboradoresDisponiveis, setColaboradoresDisponiveis] = useState([]);
  const [colaboradoresServico, setColaboradoresServico] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/colaboradoresdisponiveis?servico_id=${servicoId}`);
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

  const adicionarColaborador = async (colaboradorId) => {
    try {
      const response = await fetch("http://localhost:5000/api/adicionar_colaboradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servico_id: servicoId, colaboradores_ids: [colaboradorId] }),
      });

      const data = await response.json();
      if (response.ok) {
        setColaboradoresServico((prev) => [...prev, data.colaborador]);
        onSave([...colaboradoresServico, data.colaborador]);
      } else {
        setErro(data.error);
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  const removerColaborador = async (colaboradorId) => {
    try {
      const response = await fetch("http://localhost:5000/api/remover_colaboradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servico_id: servicoId, colaboradores_ids: [colaboradorId] }),
      });

      const data = await response.json();
      if (response.ok) {
        setColaboradoresServico((prev) => prev.filter((c) => c.ID_Colaborador !== colaboradorId));
        onSave(colaboradoresServico.filter((c) => c.ID_Colaborador !== colaboradorId));
      } else {
        setErro(data.error);
      }
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
                    <li key={colaborador.ID_Colaborador} className="list-group-item d-flex justify-content-between align-items-center">
                      {colaborador.Nome}
                      <button className="btn btn-success" onClick={() => adicionarColaborador(colaborador.ID_Colaborador)}>
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
                    <li key={colaborador.ID_Colaborador} className="list-group-item d-flex justify-content-between align-items-center">
                      {colaborador.Nome}
                      <button className="btn btn-danger" onClick={() => removerColaborador(colaborador.ID_Colaborador)}>
                        <FaTrashAlt />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddColaboradoresServicos;
