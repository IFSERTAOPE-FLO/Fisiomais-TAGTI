import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./Navbar.css";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Usuário");
  const [role, setRole] = useState(""); // Armazena a função do usuário (admin, colaborador ou cliente)
  const [email, setEmail] = useState("");
  const [senha, setPassword] = useState("");
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/login", {
        email,
        senha,
      });

      const { access_token, name, role, userId } = response.data;

      setIsLoggedIn(true);
      setUserName(name);
      setRole(role);
      setUserId(userId); // Atualiza o ID do usuário no estado
      localStorage.setItem("token", access_token);
      localStorage.setItem("userName", name);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", userId);

      // Fechar o modal
      const modalElement = document.getElementById("loginModal");
      const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }

      document.querySelectorAll(".modal-backdrop").forEach((backdrop) => backdrop.remove());

      console.log("Usuário logado:", name);

      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Erro ao fazer login. Verifique suas credenciais.");
    }
  };

  const handleLogout = async () => {
    try {
      const savedToken = localStorage.getItem("token");
      if (!savedToken) {
        alert("Token de autenticação não encontrado.");
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/logout",
        {}, // Corpo vazio
        {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        }
      );

      if (response.status === 200) {
        setIsLoggedIn(false);
        setUserName("Usuário");
        setRole("");
        setUserId(null);
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");

        navigate("/");
      } else {
        alert("Erro ao fazer logout. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro no logout:", error);
      alert("Erro ao fazer logout.");
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUserName = localStorage.getItem("userName");
    const savedRole = localStorage.getItem("role");
    const savedUserId = localStorage.getItem("userId");

    if (savedToken && savedUserName && savedRole) {
      try {
        const decodedToken = JSON.parse(atob(savedToken.split(".")[1]));
        const isTokenExpired = decodedToken.exp * 1000 < Date.now();

        if (isTokenExpired) {
          throw new Error("Token expirado");
        }

        setIsLoggedIn(true);
        setUserName(savedUserName);
        setRole(savedRole);
        setUserId(savedUserId); // Usa o setUserId correto
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        setIsLoggedIn(false);
        setUserName("Usuário");
        setRole("");
        console.error("Erro ao verificar o token:", error);
      }
    }
  }, []);

  return (
    <>
      <nav className="navbar navbar-expand-lg custom-navbar">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
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
                <Link className="nav-link" to="/contato">Contato</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/sobrenos">Sobre Nós</Link>
              </li>
            </ul>
            <ul className="navbar-nav ms-auto">
              {!isLoggedIn ? (
                <>
                  <li className="nav-item">
                    <button
                      className="btn btn-login"
                      data-bs-toggle="modal"
                      data-bs-target="#loginModal"
                    >
                      Entrar
                    </button>
                  </li>
                  <li className="nav-item">
                    <Link to="/cadastro" className="btn btn-signup">
                      Inscrever-se
                    </Link>
                  </li>
                </>
              ) : (
                <li className="nav-item dropdown btn-user">
                  <a
                    className="nav-link dropdown-toggle btn-user"
                    href="#"
                    id="navbarDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i id="iconeuser" className="bi bi-person-circle"></i>
                    <span>{userName}</span>
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                    <li>
                      <Link className="dropdown-item" to="/profile">Meu Perfil</Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/criaragendamento">Agendar Sessão</Link>
                    </li>
                    {role === "admin" && (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/addcolaborador">Adicionar Colaborador</Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/addcliente">Adicionar Cliente</Link>
                        </li>
                      </>
                    )}
                    <li>
                      <Link className="dropdown-item" to="/VisualizarDados">Visualizar Agendamentos</Link>
                    </li>
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
            <div className="modal-header">
              <h5 className="modal-title" id="loginModalLabel">Login</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="emailInput" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="emailInput"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="passwordInput" className="form-label">Senha</label>
                  <input
                    type="password"
                    className="form-control"
                    id="passwordInput"
                    value={senha}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-signup"
                data-bs-dismiss="modal"
              >
                Fechar
              </button>
              <button type="button" className="btn btn-login" onClick={handleLogin}>
                Entrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
