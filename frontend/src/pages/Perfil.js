import React, { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/Profile.css";
const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];
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
  const [cidades, setCidades] = useState([]); // Move a declaração aqui


  const token = localStorage.getItem("token");
  const apiBaseUrl = "http://localhost:5000/usuarios";
  

  const buscarCidades = async (estado) => {
    try {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/distritos`);
      if (response.ok) {
        const cidades = await response.json();
        const cidadesOrdenadas = cidades
          .map((cidade) => cidade.nome)
          .sort((a, b) => a.localeCompare(b));  // Ordenação alfabética
        setCidades(cidadesOrdenadas);
      } else {
        throw new Error("Erro ao carregar cidades.");
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  const handleEstadoChange = (e) => {
    const estadoSelecionado = e.target.value;
    setDadosEdicao((prev) => {
      return { ...prev, endereco: { ...prev.endereco, estado: estadoSelecionado, cidade: "" } };
    });
    if (estadoSelecionado) {
      buscarCidades(estadoSelecionado);
    } else {
      setCidades([]);
    }
  };



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

        // Verificar se o ID foi retornado e armazená-lo no estado
        if (data.ID) {
          setDadosUsuario((prev) => ({ ...prev, ID: data.ID }));
          setDadosEdicao((prev) => ({ ...prev, ID: data.ID }));
        }
      } else {
        throw new Error("Erro ao buscar dados do usuário.");
      }
    } catch (err) {
      setErro(err.message);
    }
  }, [token]);


  const atualizarUsuario = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setErro("ID do usuário não encontrado.");
      return;
    }

    try {
      const response = await fetch(
        `${apiBaseUrl}/editar_usuario/${papelUsuario}/${userId}`,
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
        throw new Error(data.message || "Erro ao atualizar dados do usuário.");
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  const atualizarEndereco = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setErro("ID do usuário não encontrado.");
      return;
    }

    try {
      const response = await fetch(
        `${apiBaseUrl}/editar_endereco/${papelUsuario}/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endereco: dadosEdicao.endereco }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSucesso(data.message);
        buscarDadosUsuario();
      } else {
        throw new Error(data.message || "Erro ao atualizar endereço.");
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
          senhaAtual,
          novaSenha,
          role: papelUsuario,
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
        setDadosUsuario((prev) => ({ ...prev, photo: data.photo }));
        localStorage.setItem("userPhoto", data.photo);
        window.location.reload();
      } else {
        throw new Error(data.message || "Erro ao enviar foto.");
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  useEffect(() => {
    // Verifica se a foto já foi carregada no localStorage antes de sobrescrever
    const fotoNoLocalStorage = localStorage.getItem("userPhoto");
    if (fotoNoLocalStorage && !dadosUsuario.photo) {  // Evitar sobrescrever foto se já estiver definida
      setDadosUsuario((prev) => ({ ...prev, photo: fotoNoLocalStorage }));
    }
    buscarDadosUsuario();
  }, [buscarDadosUsuario]);

  useEffect(() => {
    // Verificar se existe um estado já definido para buscar as cidades correspondentes
    if (dadosEdicao.endereco?.estado) {
      buscarCidades(dadosEdicao.endereco.estado);
    }
  }, [dadosEdicao.endereco?.estado]);  // Executa sempre que o estado do endereço mudar

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDadosEdicao((prev) => {
      if (name.includes("endereco")) {
        const endereco = { ...prev.endereco, [name.split(".")[1]]: value };
        return { ...prev, endereco };
      }
      return { ...prev, [name]: value };
    });
  };

  return (
    <div className="container col-md-8 my-5">
      <div className="card shadow ">
        <div className="card-header ">
          <h1 className="text-center text-primary ">Perfil do Usuário</h1>
        </div>

        <div className="card-body ">
          {erro && <p className="alert alert-danger">{erro}</p>}
          {sucesso && <p className="alert alert-success">{sucesso}</p>}

          <div className="row justify-content-center">
            <div className="col-md-12">
              <div className="row">
                <div className="col-12 col-md-4 text-center">
                  {
                    arquivoSelecionado ? (
                      <img
                        src={URL.createObjectURL(arquivoSelecionado)}
                        alt="Foto Selecionada"
                        className="img-fluid rounded-circle mb-3"
                        style={{ width: "150px", height: "150px" }}
                      />
                    ) : dadosUsuario.photo && dadosUsuario.photo.trim() !== "" ? (
                      <img
                        src={`http://localhost:5000/usuarios/uploads/${dadosUsuario.photo}`}
                        alt="Foto do Usuário"
                        className="img-fluid rounded-circle mb-3"
                        style={{ width: "200px", height: "160px" }}
                      />
                    ) : (
                      <i className="bi bi-person-circle" style={{ fontSize: "150px" }}></i> // Exibe o ícone se não houver foto
                    )
                  }



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
                    </div>

                    <div className="row mb-3">
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
                      <div className="col-md-12">
                        <form>
                          <div className="row mb-3">
                            <div className="col-12 col-md-4">
                              <label htmlFor="endereco.rua" className="form-label">Logradouro</label>
                              <input
                                type="text"
                                className="form-control"
                                id="endereco.rua"
                                name="endereco.rua"
                                value={dadosEdicao.endereco?.rua || ""}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="col-12 col-md-4">
                              <label htmlFor="endereco.numero" className="form-label">Número</label>
                              <input
                                type="text"
                                className="form-control"
                                id="endereco.numero"
                                name="endereco.numero"
                                value={dadosEdicao.endereco?.numero || ""}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="col-12 col-md-4">
                              <label htmlFor="endereco.complemento" className="form-label">Complemento</label>
                              <input
                                type="text"
                                className="form-control"
                                id="endereco.complemento"
                                name="endereco.complemento"
                                value={dadosEdicao.endereco?.complemento || ""}
                                onChange={handleChange}
                              />
                            </div>
                          </div>

                          <div className="row mb-3">
                            <div className="col-12 col-md-4">
                              <label htmlFor="endereco.bairro" className="form-label">Bairro</label>
                              <input
                                type="text"
                                className="form-control"
                                id="endereco.bairro"
                                name="endereco.bairro"
                                value={dadosEdicao.endereco?.bairro || ""}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="col-12 col-md-4">
                              <label htmlFor="endereco.estado" className="form-label">Estado</label>
                              <select
                                className="form-control"
                                id="endereco.estado"
                                name="endereco.estado"
                                value={dadosEdicao.endereco?.estado || ""}
                                onChange={handleEstadoChange}
                              >
                                <option value="">Selecione o Estado</option>
                                {estados.map((estado) => (
                                  <option key={estado} value={estado}>
                                    {estado}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-12 col-md-4">
                              <label htmlFor="endereco.cidade" className="form-label">Cidade</label>
                              <select
                                className="form-control"
                                id="endereco.cidade"
                                name="endereco.cidade"
                                value={dadosEdicao.endereco?.cidade || ""}
                                onChange={handleChange}
                              >
                                <option value="">Selecione a Cidade</option>
                                {cidades.map((cidade, index) => (
                                  <option key={index} value={cidade}>
                                    {cidade}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                        </form>
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
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      onClick={atualizarUsuario}
                    >
                      Salvar Dados Gerais
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-success"
                      onClick={atualizarEndereco}
                    >
                      Salvar Endereço
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
