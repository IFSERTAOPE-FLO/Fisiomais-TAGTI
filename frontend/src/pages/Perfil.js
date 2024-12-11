import React, { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Profile.css";

const Perfil = () => {
  const [dadosUsuario, setDadosUsuario] = useState({});
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [dadosEdicao, setDadosEdicao] = useState({});
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [papelUsuario, setPapelUsuario] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  

  const token = localStorage.getItem("token");
  const apiBaseUrl = "http://localhost:5000/api";

  const buscarDadosUsuario = useCallback(async () => {
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
  }, [token]); 

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

  const atualizarSenha = async () => {
    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
  
    try {
      const response = await fetch(`${apiBaseUrl}/alterar_senha/${papelUsuario}/${dadosUsuario.ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senhaAtual,  // Senha atual fornecida pelo usuário
          novaSenha,   // Nova senha fornecida pelo usuário
          role: papelUsuario,  // A role do usuário ('cliente' ou 'colaborador')
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setSucesso(data.message);
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmarSenha("");
      } else {
        throw new Error(data.message || "Erro ao alterar a senha.");
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
        setDadosUsuario((prev) => ({ ...prev, photo: data.photo })); // Atualiza a foto no perfil
        localStorage.setItem("userPhoto", data.photo); // Atualiza a foto no localStorage
        window.location.reload(); // Força o recarregamento da página
      } else {
        throw new Error(data.message || "Erro ao enviar foto.");
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  useEffect(() => {
    // Verificar se a foto está armazenada no localStorage
    const fotoNoLocalStorage = localStorage.getItem("userPhoto");
    if (fotoNoLocalStorage) {
      setDadosUsuario((prev) => ({ ...prev, photo: fotoNoLocalStorage }));
    }
    buscarDadosUsuario();
  }, [buscarDadosUsuario]); // Use the memoized function

  const handleChange = (e) => {
    setDadosEdicao({ ...dadosEdicao, [e.target.name]: e.target.value });
  };

  return (
    <div className="container col-md-8 my-5">
      <div className="card shadow ">
        <div className="card-header agendamento-header">
          <h1 className="text-center agendamento-titulo">Perfil do Usuário</h1>
        </div>
  
        <div className="card-body ">
          {erro && <p className="alert alert-danger">{erro}</p>}
          {sucesso && <p className="alert alert-success">{sucesso}</p>}
  
          <div className="row justify-content-center">
            <div className="col-md-12">
              <div className="row">
                <div className="col-12 col-md-4 text-center">
                  {arquivoSelecionado ? (
                    <img
                      src={URL.createObjectURL(arquivoSelecionado)} // Exibe a imagem selecionada localmente
                      alt="Foto Selecionada"
                      className="img-fluid rounded-circle mb-3"
                      style={{ width: "150px", height: "150px" }}
                    />
                  ) : dadosUsuario.photo ? (
                    <img
                      src={`http://localhost:5000/uploads/${dadosUsuario.photo}?t=${new Date().getTime()}`}
                      alt="Foto do Usuário"
                      className="img-fluid rounded-circle mb-3"
                      style={{ width: "200px", height: "160px" }}
                    />
                  ) : (
                    <i className="bi bi-person-circle" style={{ fontSize: "150px" }}></i>
                  )}
  
                  <input
                    type="file"
                    onChange={(e) => setArquivoSelecionado(e.target.files[0])}
                    className="form-control mb-2"
                  />
                  <button className="btn btn-outline-primary" onClick={fazerUploadFoto}>
                    Alterar Foto
                  </button>
                </div>
                <div className="col-12 col-md-8">
                  <form>
                    <div className="row mb-3">
                      <div className="col-12 col-md-6">
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
                      <div className="col-12 col-md-6">
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
                    </div>
  
                    <div className="row mb-3">
                      <div className="col-12 col-md-6">
                        <label htmlFor="cpf" className="form-label">CPF</label>
                        <input
                          type="text"
                          className="form-control"
                          id="cpf"
                          name="cpf"
                          value={dadosEdicao.cpf || ''}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
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
                    </div>
  
                    {/* Campos para alterar a senha */}
                    <div className="row mb-3">
                      <div className="col-12 col-md-6">
                        <label htmlFor="senhaAtual" className="form-label">Senha Atual</label>
                        <input
                          type="password"
                          className="form-control"
                          id="senhaAtual"
                          value={senhaAtual}
                          onChange={(e) => setSenhaAtual(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label htmlFor="novaSenha" className="form-label">Nova Senha</label>
                        <input
                          type="password"
                          className="form-control"
                          id="novaSenha"
                          value={novaSenha}
                          onChange={(e) => setNovaSenha(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-12 col-md-6">
                        <label htmlFor="confirmarSenha" className="form-label">Confirmar Nova Senha</label>
                        <input
                          type="password"
                          className="form-control"
                          id="confirmarSenha"
                          value={confirmarSenha}
                          onChange={(e) => setConfirmarSenha(e.target.value)}
                        />
                      </div>
                    </div>
  
                    <button
                      type="button"
                      className="btn btn btn-outline-warning mb-3"
                      onClick={atualizarSenha}
                    >
                      Alterar Senha
                    </button>
  
                    <div className="row mb-3">
                      <div className="col-12 col-md-4">
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
                      <div className="col-12 col-md-4">
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
                      <div className="col-12 col-md-4">
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
                    </div>
  
                    {papelUsuario === 'colaborador' && (
                      <div className="row mb-3">
                        <div className="col-12 col-md-6">
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
                      </div>
                    )}
  
                    <button
                      type="button"
                      className="btn btn-outline-success"
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
