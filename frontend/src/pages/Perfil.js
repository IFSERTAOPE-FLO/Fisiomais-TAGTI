import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Profile.css";

const Perfil = () => {
  const [dadosUsuario, setDadosUsuario] = useState({});
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [dadosEdicao, setDadosEdicao] = useState({});
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [papelUsuario, setPapelUsuario] = useState("");

  const token = localStorage.getItem("token");
  const apiBaseUrl = "http://localhost:5000/api";

  const buscarDadosUsuario = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/perfil`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDadosUsuario(data);
        setDadosEdicao(data);
        setPapelUsuario(data.role);
      } else {
        throw new Error("Erro ao buscar dados do usuário.");
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  const atualizarUsuario = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/editar_usuario/${papelUsuario}/${dadosUsuario.ID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dadosEdicao),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSucesso(data.message);
        buscarDadosUsuario();
      } else {
        throw new Error(data.message || "Erro ao atualizar usuário.");
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  const fazerUploadFoto = async () => {
    if (!arquivoSelecionado) {
      setErro("Selecione uma foto para fazer o upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", arquivoSelecionado);

    try {
      const response = await fetch(`${apiBaseUrl}/upload_photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSucesso(data.message);
        setDadosUsuario((prev) => ({ ...prev, photo: data.photo }));
      } else {
        throw new Error(data.message || "Erro ao enviar foto.");
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  useEffect(() => {
    buscarDadosUsuario();
  }, []);

  const handleChange = (e) => {
    setDadosEdicao({ ...dadosEdicao, [e.target.name]: e.target.value });
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Perfil do Usuário</h1>

      {erro && <p className="alert alert-danger">{erro}</p>}
      {sucesso && <p className="alert alert-success">{sucesso}</p>}

      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 text-center">
                  <img
                    src={`http://localhost:5000${dadosUsuario.photo || "/uploads/default.jpg"}`}
                    alt="Foto do Usuário"
                    className="img-fluid rounded-circle mb-3"
                    style={{ width: "150px", height: "150px" }}
                  />
                  <input
                    type="file"
                    onChange={(e) => setArquivoSelecionado(e.target.files[0])}
                    className="form-control mb-2"
                  />
                  <button className="btn btn-primary" onClick={fazerUploadFoto}>
                    Alterar Foto
                  </button>
                </div>
                <div className="col-md-8">
                  <form>
                    <div className="mb-3">
                      <label htmlFor="nome" className="form-label">Nome</label>
                      <input
                        type="text"
                        className="form-control"
                        id="nome"
                        name="nome"
                        value={dadosEdicao.nome || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={dadosEdicao.email || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="telefone" className="form-label">Telefone</label>
                      <input
                        type="tel"
                        className="form-control"
                        id="telefone"
                        name="telefone"
                        value={dadosEdicao.telefone || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="endereco" className="form-label">Endereço</label>
                      <input
                        type="text"
                        className="form-control"
                        id="endereco"
                        name="endereco"
                        value={dadosEdicao.endereco || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="bairro" className="form-label">Bairro</label>
                      <input
                        type="text"
                        className="form-control"
                        id="bairro"
                        name="bairro"
                        value={dadosEdicao.bairro || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="cidade" className="form-label">Cidade</label>
                      <input
                        type="text"
                        className="form-control"
                        id="cidade"
                        name="cidade"
                        value={dadosEdicao.cidade || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    {papelUsuario === 'colaborador' && (
                      <div className="mb-3">
                        <label htmlFor="cargo" className="form-label">Cargo</label>
                        <input
                          type="text"
                          className="form-control"
                          id="cargo"
                          name="cargo"
                          value={dadosEdicao.cargo || ''}
                          onChange={handleChange}
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={atualizarUsuario}
                    >
                      Salvar Alterações
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
