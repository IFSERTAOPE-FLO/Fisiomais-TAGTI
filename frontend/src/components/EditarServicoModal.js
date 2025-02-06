import React, { useState, useEffect } from "react";

const EditarServicoModal = ({ servico, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    Nome_servico: servico?.Nome_servico || "",
    Descricao: servico?.Descricao || "",
    Valor: servico?.Valor || "",
    Tipo: servico?.Tipo || "", // Certifique-se de usar servico.Tipo corretamente
    Planos: servico?.Planos || [],
    Colaboradores: servico?.Colaboradores || [],
  });

  const [erro, setErro] = useState("");
  const [novoPlano, setNovoPlano] = useState({ nome: "", valor: "" });

  useEffect(() => {
    if (servico) {
      setFormData({
        Nome_servico: servico.Nome_servico,
        Descricao: servico.Descricao,
        Valor: servico.Valor,
        Tipo: servico.Tipo,
        Planos: servico.Planos || [],
        Colaboradores: servico.Colaboradores || [],
      });
    }
  }, [servico]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTipoServicoChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      Tipo: value,
      Planos: value === "pilates" ? prev.Planos : [], // Reset planos if Tipo is not "pilates"
    }));
  };

  const adicionarPlano = () => {
    const novoID = formData.Planos.length > 0 ? Math.max(...formData.Planos.map((plano) => plano.ID_Plano)) + 1 : 1;

    const novoPlanoComServico = {
      ID_Plano: novoID,
      Nome_plano: novoPlano.nome,
      Valor: parseFloat(novoPlano.valor),
      Servico_ID: servico.ID_Servico,
      quantidade_aulas_por_semana: novoPlano.quantidade_aulas_por_semana,
    };

    setFormData((prev) => ({
      ...prev,
      Planos: [...prev.Planos, novoPlanoComServico],
    }));

    setNovoPlano({ nome: "", valor: "" });
  };

  const handleSave = async () => {
    const valorValido =
      formData.Valor && !isNaN(parseFloat(formData.Valor))
        ? parseFloat(formData.Valor)
        : null;

    const dataToSend = {
      ...formData,
      Valor: valorValido,
      Tipo: formData.Tipo,
      Planos: formData.Tipo === "pilates" ? formData.Planos : undefined, // Include planos if Tipo is "pilates"
    };

    if (formData.Tipo === "fisioterapia") {
      delete dataToSend.Planos; // Remove Planos for "fisioterapia"
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/servicos/editar_servico/${servico.ID_Servico}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dataToSend),
        }
      );
      const data = await response.json();

      if (response.ok) {
        onSave(data);
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
                  value={formData.Tipo === "pilates" ? "" : formData.Valor}
                  onChange={(e) => {
                    if (formData.Tipo === "pilates") {
                      setFormData((prev) => ({ ...prev, Valor: null }));
                    } else {
                      const valor = e.target.value ? parseFloat(e.target.value) : "";
                      setFormData((prev) => ({ ...prev, Valor: valor }));
                    }
                  }}
                  disabled={formData.Tipo === "pilates"}
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
              <select
                name="Tipo"
                className="form-select"
                value={formData.Tipo}
                onChange={handleTipoServicoChange}
              >
                <option value="fisioterapia">Fisioterapia</option>
                <option value="pilates">Pilates</option>
              </select>
            </div>

            {formData.Tipo === "pilates" && (
              <>
                <div className="row mb-3">
                  <div className="col-4">
                    <label className="form-label">Nome do Plano:</label>
                    <input
                      type="text"
                      placeholder="Nome do Plano"
                      value={novoPlano.nome}
                      onChange={(e) =>
                        setNovoPlano({ ...novoPlano, nome: e.target.value })
                      }
                      className="form-control mb-2"
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label">Valor do Plano:</label>
                    <input
                      type="number"
                      placeholder="Valor do Plano"
                      value={novoPlano.valor}
                      onChange={(e) =>
                        setNovoPlano({ ...novoPlano, valor: e.target.value })
                      }
                      className="form-control mb-2"
                    />
                  </div>
                  
                  <div className="col-4">
                  <label className="form-label fs-6">Quantidade de Aulas por Semana:</label>
                    <input
                      type="number"
                      value={novoPlano.quantidade_aulas_por_semana}
                      onChange={(e) =>
                        setNovoPlano({
                          ...novoPlano,
                          quantidade_aulas_por_semana: e.target.value,
                        })
                      }
                      className="form-control mb-2"
                    />
                  
                </div>
                </div>
                <div className="d-flex justify-content-center">
                  <button
                    type="button"
                    onClick={adicionarPlano}
                    className="btn btn-signup mb-3"
                  >
                    Adicionar Plano
                  </button>
                </div>
                {formData.Planos.length > 0 && (
                  <div className="mb-3">
                    <h5>Planos Adicionados:</h5>
                    <div className="row">
                      {formData.Planos.map((plano, index) => (
                        <div key={index} className="col-md-4 mb-4">
                          <div className="d-flex justify-content-between align-items-center p-3 border btn-plano rounded">
                            <div className="flex-grow-1">
                              <strong>{plano.Nome_plano}</strong>
                            </div>
                            <div className="text-end">
                              <span className="fw-bold">R$ {plano.Valor}</span>
                              <span className="fw-bold">{plano.Quantidade_Aulas_Por_Semana}</span>
                            </div>
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
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
