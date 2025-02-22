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

  
  const [clinicas, setClinicas] = useState([]);
  const [clinicaSelecionada, setClinicaSelecionada] = useState(dadosEdicao.clinica?.id || '');

  useEffect(() => {
    // Função para obter as clínicas
    const fetchClinicas = async () => {
      try {
        const response = await fetch('http://localhost:5000/clinicas');
        const data = await response.json();
        setClinicas(data); // Armazenar as clínicas no estado
      } catch (error) {
        console.error("Erro ao buscar clínicas", error);
      }
    };
    fetchClinicas();
  }, []);


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


  const atualizarUsuarioComEndereco = async () => {
    const dadosAtualizados = {
      nome: dadosEdicao.nome,
      email: dadosEdicao.email,
      telefone: dadosEdicao.telefone,
      endereco: {
        id_endereco: dadosEdicao.endereco ? dadosEdicao.endereco.id_endereco : null,
        rua: dadosEdicao.endereco?.rua,
        numero: dadosEdicao.endereco?.numero,
        bairro: dadosEdicao.endereco?.bairro,
        cidade: dadosEdicao.endereco?.cidade,
        estado: dadosEdicao.endereco?.estado,
        complemento: dadosEdicao.endereco?.complemento,
      },
      cpf: dadosEdicao.cpf,
      cargo: papelUsuario === 'colaborador' ? dadosEdicao.cargo : undefined, // Se for colaborador, adiciona o cargo
    };

    const userId = localStorage.getItem("userId");

    if (!userId) {
      setErro("ID do usuário não encontrado.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/usuarios/editar_usuario_com_endereco/${papelUsuario}/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dadosAtualizados), // Envia os dados organizados
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSucesso(data.message); // Exibe mensagem de sucesso
        buscarDadosUsuario(); // Atualiza os dados do usuário após sucesso 
        setErro("");
      } else {
        throw new Error(data.message || "Erro ao atualizar usuário com endereço.");
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
      const userId = localStorage.getItem("userId");
      const response = await fetch(`${apiBaseUrl}/alterar_senha/${papelUsuario}/${userId}`, {
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
  const handleClinicaChange = (event) => {
    setClinicaSelecionada(event.target.value);
    // Atualizar o valor de clinicaSelecionada em dadosEdicao, se necessário
  };

  useEffect(() => {
    // Chama buscarDadosUsuario apenas uma vez, quando o componente for montado
    buscarDadosUsuario();
  }, [buscarDadosUsuario]);  // Esta dependência faz com que o efeito seja chamado apenas uma vez ao inicializar

  useEffect(() => {
    // Função para atualizar o estado com a foto do localStorage, se necessário
    const verificarFotoNoLocalStorage = () => {
      const fotoNoLocalStorage = localStorage.getItem("userPhoto");
      if (fotoNoLocalStorage && !dadosUsuario.photo) {
        setDadosUsuario((prev) => ({ ...prev, photo: fotoNoLocalStorage }));
      }
    };

    // Verifica e atualiza a foto sem causar re-renderizações constantes
    verificarFotoNoLocalStorage();
  }, [dadosUsuario.photo]);



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

  // Função de atualização para a clínica
  const atualizarClinica = async () => {
    const userId = localStorage.getItem("userId");
    const clinicaId = clinicaSelecionada;  // A clínica selecionada no select

    if (!userId) {
      setErro("ID do usuário não encontrado.");
      return;
    }

    if (!clinicaId) {
      setErro("Selecione uma clínica.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/colaboradores/alterar_clinica', {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          colaborador_id: userId,
          clinica_id: clinicaId,  // Passando o ID da clínica selecionada
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSucesso(data.message);
        buscarDadosUsuario();  // Função para buscar dados atualizados do usuário
      } else {
        throw new Error(data.message || "Erro ao atualizar clínica.");
      }
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <div className="container p-4">
      <div className="row">
        {/* Seção de Foto */}
        <div className="col-md-4 text-center mb-4 mb-md-0">
          <div className="d-flex flex-column align-items-center">
            <div className="position-relative mb-3">
              {arquivoSelecionado ? (
                <img
                  src={URL.createObjectURL(arquivoSelecionado)}
                  alt="Foto Selecionada"
                  className="img-thumbnail rounded-circle shadow"
                  style={{ width: "180px", height: "180px" }}
                />
              ) : dadosUsuario.photo && dadosUsuario.photo.trim() !== "" ? (
                <img
                  src={`http://localhost:5000/usuarios/uploads/${dadosUsuario.photo}`}
                  alt="Foto do Usuário"
                  className="img-thumbnail rounded-circle shadow"
                  style={{ width: "180px", height: "180px" }}
                />
              ) : (
                <div 
                  className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "180px", height: "180px" }}
                >
                  <i className="bi bi-person-fill text-secondary" style={{ fontSize: "4rem" }}></i>
                </div>
              )}
            </div>
  
            <div className="d-grid gap-2">
              <input
                type="file"
                onChange={(e) => setArquivoSelecionado(e.target.files[0])}
                className="form-control form-control-sm"
                accept="image/*"
              />
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={fazerUploadFoto}
              >
                <i className="bi bi-upload me-2"></i>Alterar Foto
              </button>
            </div>
          </div>
        </div>
  
        {/* Seção de Dados */}
        <div className="col-md-8">
          <form>
            {/* Alertas */}
            {erro && <div className="alert alert-danger mb-4">{erro}</div>}
            {sucesso && <div className="alert alert-success mb-4">{sucesso}</div>}
  
            {/* Dados Pessoais */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title mb-4 text-primary">
                  <i className="bi bi-person-lines-fill me-2"></i>Dados Pessoais
                </h5>
                
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="nome" className="form-label">Nome Completo</label>
                    <input
                      type="text"
                      className="form-control"
                      id="nome"
                      name="nome"
                      value={dadosEdicao.nome || ''}
                      onChange={handleChange}
                    />
                  </div>
  
                  <div className="col-md-6">
                    <label htmlFor="email" className="form-label">E-mail</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={dadosEdicao.email || ''}
                      onChange={handleChange}
                    />
                  </div>
  
                  <div className="col-md-6">
                    <label htmlFor="cpf" className="form-label">CPF</label>
                    <input
                      type="text"
                      className="form-control"
                      id="cpf"
                      name="cpf"
                      value={dadosEdicao.cpf || ''}
                      onChange={handleChange}
                    />
                  </div>
  
                  <div className="col-md-6">
                    <label htmlFor="telefone" className="form-label">Telefone</label>
                    <input
                      type="tel"
                      className="form-control"
                      id="telefone"
                      name="telefone"
                      value={dadosEdicao.telefone || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
  
            {/* Endereço */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title mb-4 text-primary">
                  <i className="bi bi-geo-alt-fill me-2"></i>Endereço
                </h5>
  
                <div className="row g-3">
                  <div className="col-md-8">
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
  
                  <div className="col-md-2">
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
  
                  <div className="col-md-2">
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
  
                  <div className="col-md-4">
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
  
                  <div className="col-md-4">
                    <label htmlFor="endereco.estado" className="form-label">Estado</label>
                    <select
                      className="form-select"
                      id="endereco.estado"
                      name="endereco.estado"
                      value={dadosEdicao.endereco?.estado || ""}
                      onChange={handleEstadoChange}
                    >
                      <option value="">Selecione...</option>
                      {estados.map((estado) => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>
  
                  <div className="col-md-4">
                    <label htmlFor="endereco.cidade" className="form-label">Cidade</label>
                    <select
                      className="form-select"
                      id="endereco.cidade"
                      name="endereco.cidade"
                      value={dadosEdicao.endereco?.cidade || ""}
                      onChange={handleChange}
                    >
                      <option value="">Selecione...</option>
                      {cidades.map((cidade, index) => (
                        <option key={index} value={cidade}>{cidade}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Seção Colaborador */}
            {papelUsuario === 'colaborador' && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <h5 className="card-title mb-4 text-primary">
                    <i className="bi bi-briefcase-fill me-2"></i>Dados Profissionais
                  </h5>
  
                  <div className="row g-3 align-items-end">
                    <div className="col-md-6">
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
  
                    <div className="col-md-4">
                      <label htmlFor="clinica" className="form-label">Clínica</label>
                      <select
                        className="form-select"
                        id="clinica"
                        name="clinica.id"
                        value={clinicaSelecionada}
                        onChange={handleClinicaChange}
                      >
                        <option value="">Selecione...</option>
                        {clinicas.map((clinica) => (
                          <option key={clinica.ID_Clinica} value={clinica.ID_Clinica}>
                            {clinica.Nome}
                          </option>
                        ))}
                      </select>
                    </div>
  
                    <div className="col-md-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary w-100"
                        onClick={atualizarClinica}
                      >
                        Atualizar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
  
            {/* Alteração de Senha */}
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-4 text-primary">
                  <i className="bi bi-shield-lock-fill me-2"></i>Alterar Senha
                </h5>
  
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label htmlFor="senhaAtual" className="form-label">Senha Atual</label>
                    <input
                      type="password"
                      className="form-control"
                      id="senhaAtual"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                    />
                  </div>
  
                  <div className="col-md-3">
                    <label htmlFor="novaSenha" className="form-label">Nova Senha</label>
                    <input
                      type="password"
                      className="form-control"
                      id="novaSenha"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                    />
                  </div>
  
                  <div className="col-md-3">
                    <label htmlFor="confirmarSenha" className="form-label">Confirmar Senha</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmarSenha"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                    />
                  </div>
  
                  <div className="col-md-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      onClick={atualizarSenha}
                    >
                      Alterar Senha
                    </button>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Botão de Salvar */}
            <div className="d-grid gap-2 mt-4">
              <button
                type="button"
                className="btn btn-signup btn-lg"
                onClick={atualizarUsuarioComEndereco}
              >
                <i className="bi bi-save-fill me-2"></i>Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
