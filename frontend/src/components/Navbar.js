import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../css/Navbar.css";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Usuário");
  const [role, setRole] = useState(""); 
  const [email, setEmail] = useState("");
  const [senha, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false); 
  const [userId, setUserId] = useState(null);
  const [userPhoto, setUserPhoto] = useState(""); 
  const [mostrarSenha, setMostrarSenha] = useState(false); 
  
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
        const response = await axios.post("http://localhost:5000/login", {
            email,
            senha,
        });

        const { access_token, name, role, userId, photo } = response.data;

        setIsLoggedIn(true);
        setUserName(name);
        setRole(role);
        setUserId(userId);
        setUserPhoto(photo);
        localStorage.setItem("token", access_token);
        localStorage.setItem("userName", name);
        localStorage.setItem("role", role);
        localStorage.setItem("userId", userId); // Salva o ID
        localStorage.setItem("userPhoto", photo);

        // Fechar o modal
        const modalElement = document.getElementById("loginModal");
        const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }

        document.querySelectorAll(".modal-backdrop").forEach((backdrop) => backdrop.remove());

        console.log("Usuário logado:", name);

        // Redirecionar com base no papel do usuário
        setTimeout(() => {
            if (role === "admin") {
                navigate("/adminpage");
            } else {
                navigate("/");
            }
            window.location.reload();
        }, 300); // Reduzido o tempo para 300ms
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
        setUserPhoto(""); // Limpa a foto do usuário
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        localStorage.removeItem("userPhoto"); // Limpa a foto do localStorage

        navigate("/");
        window.location.reload();
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
    const savedUserPhoto = localStorage.getItem("userPhoto"); // Recupera a foto salva no localStorage
  
    console.log(savedUserPhoto); // Verifique se o valor de userPhoto é o esperado
  
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
        setUserPhoto(savedUserPhoto || ""); // Usa uma string vazia caso a foto não exista
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        localStorage.removeItem("userPhoto"); // Limpa a foto do localStorage
        setIsLoggedIn(false);
        setUserName("Usuário");
        setRole("");
        console.error("Erro ao verificar o token:", error);
      }
    }
  }, []);
 

  return (
    <>
    
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
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
                <Link className="nav-link" to="/sobrenos">Sobre Nós</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/especialidades">Especialidades</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/contato">Fale conosco</Link>
              </li>
            </ul>
            <ul className="navbar-nav ms-auto">
              {!isLoggedIn ? (
                <>
                  <li className="nav-item">
                    <button
                      className="btn btn-login d-flex align-items-center gap-2"
                      data-bs-toggle="modal"
                      data-bs-target="#loginModal"
                    >
                      <i className="bi bi-box-arrow-in-right"> </i> Entrar
                    </button>
                  </li>
                  <li className="nav-item">
                    <Link to="/cadastro" className="btn btn-signup  align-items-center gap-2">
                    <i className="bi bi-person-plus"></i> Inscrever-se
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
                  <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                    <li>
                      <Link className="dropdown-item" to="/perfil">Meu Perfil</Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/criaragendamento">Agendar Atendimento</Link>
                    </li>
                   
                        {role === "admin" && (
                          <>
                            <li>
                              <Link className="dropdown-item" to="/adminPage">Pagina Administrador</Link>
                            </li>
                          </>
                        )}
                        {role === "colaborador" &&  (
                           <li>
                           <Link className="dropdown-item" to="/adminPage">Controle de usários</Link>
                         </li>
                        )
                        }
                      
                    
                    <li>
                      <Link className="dropdown-item" to="/visualizaragendamentos">Meus Agendamentos</Link>
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
    <div className="modal-header justify-content-center">
      <h5 className="modal-title d-flex align-items-center gap-2" id="loginModalLabel">
        <i className="bi bi-person-circle"></i>
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
          Não tem uma conta? <a href="/cadastro">Inscreva-se</a>
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