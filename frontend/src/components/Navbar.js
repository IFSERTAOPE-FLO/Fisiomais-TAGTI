import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";

import "../css/Navbar.css";
import CadastroClienteModal from './CadastroClienteModal'; // Atualize o caminho conforme necessário

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Usuário");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setPassword] = useState("");
  const [userId, setUserId] = useState(null);
  const [userPhoto, setUserPhoto] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false); // Inicialmente assumimos que não está confirmado
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const [agendamentosOpen, setAgendamentosOpen] = useState(false);
  const [planosOpen, setPlanosOpen] = useState(false);
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const currentOption = query.get("opcaoSelecionada") || "dashboard";
  window.bootstrap = bootstrap;


  const navigate = useNavigate();


  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/login", { email, senha });
      const { access_token, name, role, userId, photo, email_confirmado, admin_nivel } = response.data;

      // Armazenar os dados no estado e no localStorage
      setIsLoggedIn(true);
      setUserName(name);
      setRole(role);
      setUserId(userId);
      setUserPhoto(photo || "");
      setEmailConfirmed(email_confirmado);

      // Armazenar as informações no localStorage
      localStorage.setItem("token", access_token);
      localStorage.setItem("userName", name);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userPhoto", photo || "");
      localStorage.setItem("email_confirmado", email_confirmado.toString());
      localStorage.setItem("isLoggedIn", "true"); // Armazenar isLoggedIn

      // Armazenar o nível de admin se o usuário for admin
      if (role === "admin" && admin_nivel) {
        localStorage.setItem("admin_nivel", admin_nivel);
      }

      // Fecha o modal de login
      const modalElement = document.getElementById("loginModal");
      const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) modalInstance.hide();
      document.querySelectorAll(".modal-backdrop").forEach((backdrop) => backdrop.remove());

      // Redireciona com base no papel do usuário
      setTimeout(() => {
        navigate(role === "admin" ? "/adminpage" : "/clientepage");
        window.location.reload();
      }, 300);

      // Inicia a renovação automática do token
      autoRefreshToken();
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Erro ao fazer login. Verifique suas credenciais.");
    }
  };


  const handleCadastroSuccess = (data) => {
    console.log('Dados recebidos no cadastro:', data);

    if (data && data.userId && data.name && data.role && data.email) {
      // Atualizando o estado de forma individual
      setIsLoggedIn(true);
      setUserName(data.name);
      setRole(data.role);
      setUserId(data.userId);
      setUserPhoto(data.photo || "");
      setEmailConfirmed(data.email_confirmado);

      // Persistindo as informações no localStorage
      localStorage.setItem('token', data.access_token); // Correção aqui
      localStorage.setItem('userName', data.name);
      localStorage.setItem('role', data.role);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('userPhoto', data.photo || "");
      localStorage.setItem('email_confirmado', data.email_confirmado ? "true" : "false");
      localStorage.setItem('isLoggedIn', 'true');

      setShowCadastroModal(false);

      navigate("/criarAgendamento");
    } else {
      console.error('Erro: Dados incompletos ou ausentes', data);
      alert("Erro ao cadastrar o usuário. Tente novamente.");
    }
  };


  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedIsLoggedIn = localStorage.getItem("isLoggedIn");
    const storedIsEmailConfirmed = localStorage.getItem("email_confirmado");

    if (storedToken && storedIsLoggedIn === "true") {
      setIsLoggedIn(true);
    }

    if (storedIsEmailConfirmed) {
      setIsEmailConfirmed(storedIsEmailConfirmed === "true");
    }
  }, []);







  // Função para renovar o token automaticamente
  const autoRefreshToken = () => {
    const refreshInterval = 1 * 60 * 1000; // 10 minutos
    const sessionEndTime = 60 * 60 * 1000; // 1 hora


    const refreshToken = async () => {
      try {
        const storedRefreshToken = localStorage.getItem("refresh_token");
        if (!storedRefreshToken) return;

        const response = await axios.post(
          "http://localhost:5000/refresh-token",
          {},
          { headers: { Authorization: `Bearer ${storedRefreshToken}` } }
        );

        if (response.data.access_token) {
          localStorage.setItem("token", response.data.access_token);
        }
      } catch (error) {
        console.error("Erro ao renovar o token:", error.response?.data?.message || "Erro desconhecido");
        alert("Sua sessão expirou. Faça login novamente.");
        handleLogout();
      }
    };

    const intervalId = setInterval(refreshToken, refreshInterval);
    const logoutTimeout = setTimeout(handleLogout, sessionEndTime);

    return () => {
      clearInterval(intervalId);
      clearTimeout(logoutTimeout);
    };
  };



  const handleLogout = async () => {
    try {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        await axios.post("http://localhost:5000/logout", {}, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
      }
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      // Fechar o modal de login, se estiver aberto
      const modalElement = document.getElementById("loginModal");
      if (modalElement) {
        const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
      }

      // Limpar o localStorage e estados
      localStorage.clear();
      setAgendamentosOpen(false);
      setSidebarVisible(false);
      setIsLoggedIn(false);
      setUserName("Usuário");
      setRole("");
      setUserId(null);
      setUserPhoto("");
      navigate("/");
    }
  };
  useEffect(() => {
    const handleCliqueFora = (event) => {
      const sidebar = document.getElementById("sidebar");

      if (sidebar && !sidebar.contains(event.target)) {
        setSidebarVisible(false);
      }
    };

    document.addEventListener("mousedown", handleCliqueFora);

    return () => {
      document.removeEventListener("mousedown", handleCliqueFora);
    };
    }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUserName = localStorage.getItem("userName");
    const savedRole = localStorage.getItem("role");
    const savedUserId = localStorage.getItem("userId");
    const savedUserPhoto = localStorage.getItem("userPhoto");

    if (savedToken && savedUserName && savedRole) {
      try {
        const decodedToken = JSON.parse(atob(savedToken.split(".")[1]));
        const isTokenExpired = decodedToken.exp * 1000 < Date.now();
        if (isTokenExpired) throw new Error("Token expirado");

        setIsLoggedIn(true);
        setUserName(savedUserName);
        setRole(savedRole);
        setUserId(savedUserId);
        setUserPhoto(savedUserPhoto || "");
      } catch (error) {
        console.error("Erro ao verificar o token:", error);
        handleLogout();
      }
    }
  }, []);

  useEffect(() => {
    const cleanup = autoRefreshToken();
    return cleanup; // Limpa os temporizadores ao desmontar
  }, []);


  return (
    <>

      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <Link
            className="navbar-brand"
            to="/"
            style={{ visibility: sidebarVisible ? 'hidden' : 'visible' }}
          >
            <img src="/fisiomais.png" alt="Logo" className="navbar-logo" />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mx-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">Início</Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/sobrenos">Sobre Nós</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/especialidades">Especialidades</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/contato">Fale conosco</Link>
              </li>
              {isLoggedIn && role !== "cliente" && (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/adminPage">Central de Controle</Link>
                  </li>

                </>
              )}



            </ul>


            <ul className={`navbar-nav ms-auto ${isLoggedIn ? 'z-top  ' : ''}`}>
              {!isLoggedIn ? (
                <>
                  <li className="nav-item  ">
                    <button
                      className="btn btn-login d-flex align-items-center gap-2"
                      data-bs-toggle="modal"
                      data-bs-target="#loginModal"
                    >
                      <i className="bi bi-box-arrow-in-right"> </i> Entrar
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className="btn btn-signup align-items-center gap-2"
                      onClick={() => setShowCadastroModal(true)} // Abre o modal ao clicar no botão
                    >
                      <i className="bi bi-person-plus"></i> Inscrever-se
                    </button>
                  </li>
                </>
              ) : (

                <li className="nav-item dropdown btn-user" >
                  <a
                    className="nav-link dropdown-toggle  btn-user"
                    href="#"

                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {userPhoto && userPhoto.trim() !== "" ? (
                      <img
                        src={`http://localhost:5000/usuarios/uploads/${userPhoto}?t=${new Date().getTime()}`}
                        alt="Foto de perfil"
                        className="user-photo"
                      />
                    ) : (
                      <i id="iconeuser" className="bi bi-person-circle"></i> // Exibe o ícone se não houver foto
                    )}
                    <span>{userName}</span>
                  </a>
                  <ul className="dropdown-menu dropdownLogado" aria-labelledby="navbarDropdownUser">
                    <li>
                      <Link className="dropdown-item" to="/perfil">Meu Perfil</Link>
                    </li>
                    {(role === "admin" || role === "colaborador") && (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/adminPage">Central de Controle</Link>
                        </li>
                      </>
                    )}

                    {(role === "cliente") && (
                      <Link className="dropdown-item" to="/clientepage">Área do cliente</Link>


                    )}
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={handleLogout}
                        type="button"
                      >
                        Sair
                      </button>
                    </li>
                  </ul>

                </li>

              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Remove a logo do navbar */}
      {isLoggedIn && (
        <div className="sidebar-container d-none d-md-block" id="sidebar">
          <button
            className={`sidebar-toggle ${sidebarVisible ? "toggle-open" : ""}`}
            onClick={() => setSidebarVisible(!sidebarVisible)}
          >
            <i className="bi bi-list"></i> {/* Ícone de menu */}
          </button>
          <div className={`sidebar ${sidebarVisible ? "show bg-light" : "bg-light"}`}>
            <img src="/fisiomais.png" alt="Logo" className="sidebar-logo" />
            <div className="sidebar-header">
              {sidebarVisible && <h4>Bem-vindo, {userName.split(" ")[0]}</h4>}
              {!sidebarVisible && <br />}
            </div>
            <ul className="sidebar-menu bg-light">
              {(role === "admin" || role === "colaborador") && (
                <>
                  {/* Dashboard */}
                  <li className="mt-3">
                    <Link
                      to="/adminPage?opcaoSelecionada=dashboardColaborador"
                      className={`sidebar-item ${currentOption === "dashboardColaborador" ? "active" : ""}`}
                    >
                      <i className="bi bi-speedometer2"></i>
                      {sidebarVisible && " Dashboard"}
                    </Link>
                  </li>

                  {/* Gerenciar Usuários */}
                  <li className="mt-3">
                    <Link
                      to="/adminPage?opcaoSelecionada=usuarios"
                      className={`sidebar-item ${currentOption === "usuarios" ? "active" : ""}`}
                    >
                      <i className="bi bi-people"></i>
                      {sidebarVisible && " Gerenciar Usuários"}
                    </Link>
                  </li>

                  {/* Gerenciar Serviços */}
                  <li className="mt-3">
                    <Link
                      to="/adminPage?opcaoSelecionada=servicos"
                      className={`sidebar-item ${currentOption === "servicos" ? "active" : ""}`}
                    >
                      <i className="bi bi-tools"></i>
                      {sidebarVisible && " Gerenciar Serviços"}
                    </Link>
                  </li>

                  {/* Gerenciar Clínicas */}
                  <li className="mt-3">
                    <Link
                      to="/adminPage?opcaoSelecionada=clinicas"
                      className={`sidebar-item ${currentOption === "clinicas" ? "active" : ""}`}
                    >
                      <i className="bi bi-building"></i>
                      {sidebarVisible && " Gerenciar Clínicas"}
                    </Link>
                  </li>

                  {/* Agendamentos (submenu) */}
                  <li className="mt-3">
                    <button
                      className={`sidebar-item d-flex align-items-center w-100 ${["criarAgendamento", "visualizarAgendamentos", "CalendarioInterativo"].includes(currentOption) ? "active" : ""}`}
                      onClick={() => setAgendamentosOpen(!agendamentosOpen)}
                    >
                      <i className="bi bi-calendar-check"></i>
                      {sidebarVisible && " Agendamentos"}
                      <i className={`ms-auto bi ${agendamentosOpen || ["criarAgendamento", "visualizarAgendamentos", "CalendarioInterativo"].includes(currentOption) ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                    </button>
                    {agendamentosOpen && (
                      <ul className="submenu">
                        <li>
                          <Link
                            to="/adminPage?opcaoSelecionada=criarAgendamento"
                            className={`sidebar-item ${currentOption === "criarAgendamento" ? "active" : ""}`}
                          >
                            <i className="bi bi-calendar-plus"></i>
                            {sidebarVisible && " Criar Agendamento"}
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/adminPage?opcaoSelecionada=visualizarAgendamentos"
                            className={`sidebar-item ${currentOption === "visualizarAgendamentos" ? "active" : ""}`}
                          >
                            <i className="bi bi-calendar-check"></i>
                            {sidebarVisible && " Visualizar Agendamentos"}
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/adminPage?opcaoSelecionada=CalendarioInterativo"
                            className={`sidebar-item ${currentOption === "CalendarioInterativo" ? "active" : ""}`}
                          >
                            <i className="bi bi-calendar-event"></i>
                            {sidebarVisible && " Calendário"}
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>

                  {/* Gerenciar Pagamentos */}
                  <li className="mt-3">
                    <Link
                      to="/adminPage?opcaoSelecionada=gerenciarPagamentos"
                      className={`sidebar-item ${currentOption === "gerenciarPagamentos" ? "active" : ""}`}
                    >
                      <i className="bi bi-cash-coin"></i>
                      {sidebarVisible && " Gerenciar Pagamentos"}
                    </Link>
                  </li>

                  {/* Aulas de Pilates */}
                  <li className="mt-3">
                    <Link
                      to="/adminPage?opcaoSelecionada=aulasPilates"
                      className={`sidebar-item ${currentOption === "aulasPilates" ? "active" : ""}`}
                    >
                      <i className="bi bi-person-arms-up"></i>
                      {sidebarVisible && " Aulas de Pilates"}
                    </Link>
                  </li>

                  {/* Planos de Tratamento (submenu) */}
                  <li className="mt-3">
                    <button
                      className={`sidebar-item d-flex align-items-center w-100 ${["planosTratamento", "criarPlanoTratamento", "historicoPlano"].includes(currentOption) ? "active" : ""}`}
                      onClick={() => setPlanosOpen(!planosOpen)}
                    >
                      <i className="bi bi-file-earmark-text"></i>
                      {sidebarVisible && " Planos de Tratamento"}
                      <i className={`ms-auto bi ${planosOpen || ["planosTratamento", "criarPlanoTratamento", "historicoPlano"].includes(currentOption) ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                    </button>
                    {planosOpen && (
                      <ul className="submenu">
                        <li>
                          <Link
                            to="/adminPage?opcaoSelecionada=planosTratamento"
                            className={`sidebar-item ${currentOption === "planosTratamento" ? "active" : ""}`}
                          >
                            <i className="bi bi-card-checklist"></i>
                            {sidebarVisible && " Visualizar Planos"}
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/adminPage?opcaoSelecionada=criarPlanoTratamento"
                            className={`sidebar-item ${currentOption === "criarPlanoTratamento" ? "active" : ""}`}
                          >
                            <i className="bi bi-plus-circle"></i>
                            {sidebarVisible && " Criar Plano"}
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/adminPage?opcaoSelecionada=historicoPlano"
                            className={`sidebar-item ${currentOption === "historicoPlano" ? "active" : ""}`}
                          >
                            <i className="bi bi-clock-history"></i>
                            {sidebarVisible && " Histórico de Planos"}
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>

                  {/* Histórico de Sessões */}
                  <li className="mt-3">
                    <Link
                      to="/adminPage?opcaoSelecionada=historicoSessoes"
                      className={`sidebar-item ${currentOption === "historicoSessoes" ? "active" : ""}`}
                    >
                      <i className="bi bi-journal-text"></i>
                      {sidebarVisible && " Histórico de Sessões"}
                    </Link>
                  </li>
                </>
              )}
              {role === "cliente" && (
                <>
                  <li className="mt-3">
                    <Link
                      to="/clientepage?opcaoSelecionada=dashboard"
                      className={`sidebar-item ${currentOption === "dashboard" ? "active" : ""}`}
                    >
                      <i className="bi bi-house-door"></i>
                      {sidebarVisible && " Central do Cliente"}
                    </Link>
                  </li>
                  <li className="mt-3">
                    <Link
                      to="/clientepage?opcaoSelecionada=pagamentos"
                      className={`sidebar-item ${currentOption === "pagamentos" ? "active" : ""}`}
                    >
                      <i className="bi bi-wallet2"></i>
                      {sidebarVisible && " Pagamentos"}
                    </Link>
                  </li>
                  <li className="mt-3">
                    <button
                      className={`sidebar-item d-flex align-items-center w-100 ${["criarAgendamento", "visualizarAgendamentos", "CalendarioInterativo"].includes(currentOption)
                          ? "active"
                          : ""
                        }`}
                      onClick={() => setAgendamentosOpen(!agendamentosOpen)}
                    >
                      <i className="bi bi-calendar-check"></i>
                      {sidebarVisible && " Agendamentos"}
                      <i className={`ms-auto bi ${agendamentosOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                    </button>
                    {agendamentosOpen && (
                      <ul className="submenu">
                        <li>
                          <Link
                            to="/clientepage?opcaoSelecionada=criarAgendamento"
                            className={`sidebar-item ${currentOption === "criarAgendamento" ? "active" : ""}`}
                          >
                            <i className="bi bi-calendar-plus"></i>
                            {sidebarVisible && " Agendar"}
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/clientepage?opcaoSelecionada=visualizarAgendamentos"
                            className={`sidebar-item ${currentOption === "visualizarAgendamentos" ? "active" : ""}`}
                          >
                            <i className="bi bi-calendar-check"></i>
                            {sidebarVisible && " Lista"}
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/clientepage?opcaoSelecionada=CalendarioInterativo"
                            className={`sidebar-item ${currentOption === "CalendarioInterativo" ? "active" : ""}`}
                          >
                            <i className="bi bi-calendar-event"></i>
                            {sidebarVisible && " Calendário"}
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                  <li className="mt-3">
                    <Link
                      to="/clientepage?opcaoSelecionada=minhasAulas"
                      className={`sidebar-item ${currentOption === "minhasAulas" ? "active" : ""}`}
                    >
                      <i className="bi bi-person-arms-up"></i>
                      {sidebarVisible && " Aulas de Pilates"}
                    </Link>
                  </li>
                </>
              )}

              <li className="mt-3">
                <button onClick={handleLogout} className="logout-btn">
                  <i className="bi bi-box-arrow-right"></i>
                  {sidebarVisible && " Sair"}
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {isLoggedIn && !isEmailConfirmed && (
        <>
          <div className="alert alert-warning alert-dismissible fade show text-center z-bot fixed-top w-100" role="alert">
            <strong>Atenção!</strong> E-mail não confirmado. Por favor, verifique seu e-mail.
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="alert"
              aria-label="Close"
            ></button>
          </div>
        </>
      )}


      {/* Modal de Cadastro */}
      <CadastroClienteModal
        show={showCadastroModal}
        onHide={() => setShowCadastroModal(false)} // Fecha o modal
        onRegisterSuccess={handleCadastroSuccess} // Lida com o sucesso do cadastro
      />
      {/* Modal de Login */}
      <div
        className="modal fade"
        id="loginModal"
        tabIndex="-1"
        aria-labelledby="loginModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header text-center justify-content-center">
              <h5 className="modal-title  d-flex align-items-center gap-2" id="loginModalLabel">
                <i className="bi  bi-person-circle"></i>
                Login
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="mb-2">
                  <label htmlFor="email" className="form-label ">
                    <i className="bi bi-envelope"></i> Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label htmlFor="senha" className="form-label">
                    <i className="bi bi-lock"></i> Senha
                  </label>
                  <div className="input-group">
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      className="form-control"
                      id="senha"
                      value={senha}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                    >
                      {mostrarSenha ? (
                        <i className="bi bi-eye-slash"></i>
                      ) : (
                        <i className="bi bi-eye"></i>
                      )}
                    </button>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                    />
                    <label htmlFor="rememberMe"> Lembre-me</label>
                  </div>
                  <a href="#" className="">
                    <i className="bi bi-arrow-clockwise"></i> Esqueceu a senha?
                  </a>
                </div>
                <button
                  type="submit"
                  className="btn btn btn-signup w-100"
                  onClick={handleLogin}
                >
                  <i className="bi bi-box-arrow-in-right"></i> Entrar
                </button>
              </form>
            </div>
            <div className="modal-footer">
              <p>
                Não tem uma conta?{" "}
                <button
                  className="btn text-white"
                  onClick={() => {
                    // Fecha o modal de login, se estiver aberto
                    const modalElement = document.getElementById("loginModal");
                    const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) modalInstance.hide();
                    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => backdrop.remove());

                    // Abre o modal de cadastro
                    setShowCadastroModal(true);
                  }}
                >
                  Inscreva-se
                </button>
              </p>
              <div className="social-icons">
                <button className="btn btn-outline-primary btn-social">
                  <i className="bi bi-facebook"></i>
                </button>
                <button className="btn btn-outline-danger btn-social">
                  <i className="bi bi-google"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}

export default Navbar;