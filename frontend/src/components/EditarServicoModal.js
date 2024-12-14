import React, { useState, useEffect } from "react";

const EditarServicoModal = ({ servico, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    Nome_servico: "",
    Descricao: "",
    Valor: "",
    Tipo: "",
    Planos: [],
    Colaboradores: [],
  });
  const [colaboradoresDisponiveis, setColaboradoresDisponiveis] = useState([]);
  const [colaboradoresServico, setColaboradoresServico] = useState([]);
  const [erro, setErro] = useState("");
  const [novoPlano, setNovoPlano] = useState({ nome: "", valor: "" });

  useEffect(() => {
    if (servico) {
      setFormData({
        Nome_servico: servico.Nome_servico || "",
        Descricao: servico.Descricao || "",
        Valor: servico.Valor || "",
        Tipo: servico.Tipo || "",
        Planos: servico.Planos || [],
        Colaboradores: servico.Colaboradores || [],
      });

      const fetchColaboradores = async () => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/colaboradoresdisponiveis?servico_id=${servico.ID_Servico}`
          );
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

      fetchColaboradores();
    }
  }, [servico]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleColaborador = (colaborador) => {
    setFormData((prev) => {
      const isSelected = prev.Colaboradores.includes(colaborador.ID_Colaborador);
      const updatedColaboradores = isSelected
        ? prev.Colaboradores.filter((id) => id !== colaborador.ID_Colaborador)
        : [...prev.Colaboradores, colaborador.ID_Colaborador];
      return { ...prev, Colaboradores: updatedColaboradores };
    });
  };

  const handleTipoServicoChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      Tipo: value,
      Planos: value === "pilates" ? prev.Planos : [], // Limpa os planos somente se necessário
    }));
  };

  const adicionarPlano = () => {
    setFormData((prev) => ({
      ...prev,
      Planos: [...prev.Planos, { Nome_plano: novoPlano.nome, Valor: parseFloat(novoPlano.valor) }],
    }));
    setNovoPlano({ nome: "", valor: "" }); // Reset the new plan input fields
  };

  const handleSave = async () => {
    if (formData.Tipo === "pilates" && (!formData.Planos || formData.Planos.length === 0)) {
      setErro("É necessário adicionar pelo menos um plano para o tipo Pilates.");
      return;
    }

    try {
      const token = localStorage.getItem("token"); // Or however you're storing the token
        const response = await fetch(
          `http://localhost:5000/api/editar_servico/${formData.Tipo}/${servico.ID_Servico}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`, // Ensure this header is included
            },
            body: JSON.stringify(formData),
          }
        );

      const data = await response.json();
      if (response.ok) {
        onSave(data); // Atualiza a lista de serviços após salvar
      } else {
        setErro(data.message || "Erro ao atualizar o serviço.");
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Editar Serviço</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {erro && <div className="alert alert-danger">{erro}</div>}

            <div className="row mb-3">
              <div className="col-6">
                <label className="form-label">Nome do Serviço:</label>
                <input
                  type="text"
                  name="Nome_servico"
                  className="form-control"
                  value={formData.Nome_servico}
                  onChange={handleChange}
                />
              </div>
              <div className="col-6">
                <label className="form-label">Valor:</label>
                <input
                  type="number"
                  name="Valor"
                  className="form-control"
                  value={formData.Valor}
                  onChange={handleChange}
                  disabled={formData.Tipo !== "fisioterapia"}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Descrição:</label>
              <textarea
                name="Descricao"
                className="form-control"
                value={formData.Descricao}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Tipo de Serviço:</label>
              <select name="Tipo" className="form-select" value={formData.Tipo} onChange={handleTipoServicoChange}>
                <option value="fisioterapia">Fisioterapia</option>
                <option value="pilates">Pilates</option>
              </select>
            </div>

            {formData.Tipo === "pilates" && (
              <>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">Nome do Plano:</label>
                    <input
                      type="text"
                      placeholder="Nome do Plano"
                      value={novoPlano.nome}
                      onChange={(e) => setNovoPlano({ ...novoPlano, nome: e.target.value })}
                      className="form-control mb-2"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Valor do Plano:</label>
                    <input
                      type="number"
                      placeholder="Valor do Plano"
                      value={novoPlano.valor}
                      onChange={(e) => setNovoPlano({ ...novoPlano, valor: e.target.value })}
                      className="form-control mb-2"
                    />
                  </div>
                </div>
                <button type="button" onClick={adicionarPlano} className="btn btn-primary mb-3">
                  Adicionar Plano
                </button>
                {formData.Planos.length > 0 && (
                  <div>
                    <h5>Planos Adicionados:</h5>
                    <ul className="list-unstyled">
                      {formData.Planos.map((plano, index) => (
                        <li key={index}>
                          {plano.Nome_plano} - R${plano.Valor.toFixed(2)}{" "}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                Planos: prev.Planos.filter((_, i) => i !== index),
                              }))
                            }
                            className="btn btn-danger btn-sm ms-2"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <div className="mb-3">
              <label className="form-label">Colaboradores:</label>
              <ul className="list-group">
                {colaboradoresDisponiveis.map((colaborador) => (
                  <li
                    key={colaborador.ID_Colaborador}
                    className={`list-group-item ${
                      formData.Colaboradores.includes(colaborador.ID_Colaborador)
                        ? "list-group-item-success"
                        : ""
                    }`}
                    onClick={() => toggleColaborador(colaborador)}
                    style={{ cursor: "pointer" }}
                  >
                    {colaborador.Nome}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Fechar
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarServicoModal;
