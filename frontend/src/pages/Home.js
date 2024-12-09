import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import "./Estilos.css";

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Verifica se o usuário está logado
  useEffect(() => {
    const loggedIn = localStorage.getItem("token");
    setIsLoggedIn(!!loggedIn);
  }, []);

  

  return (
    <div className="container mt-4">
      <h1 className="text-center fw-bold text-primary mb-3">Bem-vindo à nossa clínica de Fisioterapia e Pilates!</h1>
      <p className="text-center fw-bold text-secondary mb-3">Veja mais sobre nossos colaboradores e serviços abaixo.</p>

      {/* Carrossel de Colaboradores */}
<div className="mt-5">
  <h2 className="text-center text-primary mb-3">Nossos Colaboradores</h2>
  <div id="carouselColaboradores" className="carousel slide" data-bs-ride="carousel">
    <div className="carousel-inner">
      <div className="carousel-item active">
        <div className="row">
          <div className="col-4">
            <img
              src="https://via.placeholder.com/150x100?text=Colaborador+1"
              className="d-block w-100"
              alt="Colaborador 1"
            />
            <h5 className="text-center fw-bold text-secondary mb-3">Colaborador 1</h5>
            <p className="text-center text-secondary mb-3">Fisioterapeuta especializado</p>
          </div>
          <div className="col-4">
            <img
              src="https://via.placeholder.com/150x100?text=Colaborador+2"
              className="d-block w-100"
              alt="Colaborador 2"
            />
            <h5 className="text-center fw-bold text-secondary mb-3">Colaborador 2</h5>
            <p className="text-center  text-secondary mb-3">Especialista em recuperação muscular</p>
          </div>
          <div className="col-4">
            <img
              src="https://via.placeholder.com/150x100?text=Colaborador+3"
              className="d-block w-100"
              alt="Colaborador 3"
            />
            <h5 className="text-center fw-bold text-secondary mb-3">Colaborador 3</h5>
            <p className="text-center  text-secondary mb-3">Instrutor de Pilates</p>
          </div>
        </div>
      </div>
      <div className="carousel-item">
        <div className="row">
          <div className="col-4">
            <img
              src="https://via.placeholder.com/150x100?text=Colaborador+4"
              className="d-block w-100"
              alt="Colaborador 4"
            />
            <h5 className="text-center fw-bold text-secondary mb-3">Colaborador 4</h5>
            <p className="text-center  text-secondary mb-3">Especialista em RPG</p>
          </div>
          <div className="col-4">
            <img
              src="https://via.placeholder.com/150x100?text=Colaborador+5"
              className="d-block w-100"
              alt="Colaborador 5"
            />
            <h5 className="text-center fw-bold text-secondary mb-3">Colaborador 5</h5>
            <p className="text-center  text-seconday mb-3">Instrutor de Alongamento</p>
          </div>
          <div className="col-4">
            <img
              src="https://via.placeholder.com/150x100?text=Colaborador+6"
              className="d-block w-100"
              alt="Colaborador 6"
            />
            <h5 className="text-center">Colaborador 6</h5>
            <p className="text-center">Terapeuta ocupacional</p>
          </div>
        </div>
      </div>
    </div>

    {/* Botões de navegação */}
    <button
      className="carousel-control-prev"
      type="button"
      data-bs-target="#carouselColaboradores"
      data-bs-slide="prev"
    >
      <span className="carousel-control-prev-icon" aria-hidden="true"></span>
      <span className="visually-hidden">Anterior</span>
    </button>
    <button
      className="carousel-control-next"
      type="button"
      data-bs-target="#carouselColaboradores"
      data-bs-slide="next"
    >
      <span className="carousel-control-next-icon" aria-hidden="true"></span>
      <span className="visually-hidden">Próximo</span>
    </button>
  </div>
</div>

{/* Carrossel de Serviços */}
<div className="mt-5">
  <h2 className="text-center  text-primary mb-3">Nossos Serviços</h2>
  <div id="carouselServicos" className="carousel slide" data-bs-ride="carousel">
    <div className="carousel-inner">
      <div className="carousel-item active">
        <div className="row">
          <div className="col-4">
            <img
              src="https://via.placeholder.com/150x100?text=Pilates"
              className="d-block w-100"
              alt="Pilates"
            />
            <h5 className="text-center fw-bold text-secondary">Pilates</h5>
            <p className="text-center text-secondary">Melhore sua postura e flexibilidade.</p>
          </div>
          <div className="col-4">
            <img
              src="https://via.placeholder.com/150x100?text=Reabilitação+Física"
              className="d-block w-100"
              alt="Reabilitação Física"
            />
            <h5 className="text-center fw-bold text-secondary">Reabilitação Física</h5>
            <p className="text-center text-secondary">Recuperação após lesões ou cirurgias.</p>
          </div>
          <div className="col-4">
            <img
              src="https://via.placeholder.com/150x100?text=Massoterapia"
              className="d-block w-100"
              alt="Massoterapia"
            />
            <h5 className="text-center fw-bold text-secondary">Massoterapia</h5>
            <p className="text-center text-secondary">Alívio do estresse e dores musculares.</p>
          </div>
        </div>
      </div>
      <div className="carousel-item">
        <div className="row">
          <div className="col-4">
            <img
              src="https://via.placeholder.com/150x100?text=Acupuntura"
              className="d-block w-100"
              alt="Acupuntura"
            />
            <h5 className="text-center fw-bold text-secondary">Acupuntura</h5>
            <p className="text-center text-secondary">Equilíbrio energético e bem-estar.</p>
          </div>
          <div className="col-4">
            <img
              src="https://via.placeholder.com/150x100?text=RPG"
              className="d-block w-100"
              alt="RPG"
            />
            <h5 className="text-center fw-bold text-secondary">Reeducação Postural Global</h5>
            <p className="text-center text-secondary">Correção postural e alívio de dores.</p>
          </div>
          <div className="col-4">
            <img
              src="https://via.placeholder.com/150x100?text=Hidroterapia"
              className="d-block w-100"
              alt="Hidroterapia"
            />
            <h5 className="text-center fw-bold text-secondary">Hidroterapia</h5>
            <p className="text-center text-secondary">Terapia com exercícios na água.</p>
          </div>
        </div>
      </div>
    </div>

    {/* Botões de navegação */}
    <button
      className="carousel-control-prev"
      type="button"
      data-bs-target="#carouselServicos"
      data-bs-slide="prev"
    >
      <span className="carousel-control-prev-icon" aria-hidden="true"></span>
      <span className="visually-hidden">Anterior</span>
    </button>
    <button
      className="carousel-control-next"
      type="button"
      data-bs-target="#carouselServicos"
      data-bs-slide="next"
    >
      <span className="carousel-control-next-icon" aria-hidden="true"></span>
      <span className="visually-hidden">Próximo</span>
    </button>
  </div>
</div>

<div className="mt-5 text-center p-4 bg-light rounded shadow">
  <h3 className="fw-bold text-primary mb-3">
    Não perca tempo!
  </h3>
  <p className="fs-5 text-secondary">
    Agende uma sessão conosco para melhorar sua saúde e bem-estar. 
    Nossos profissionais estão prontos para ajudar você a alcançar seus objetivos!
  </p>
  <div className="mt-4 text-center">
  <Link
    to={isLoggedIn ? "/criaragendamento" : "/cadastro"}
    className="btn btn-signup gap-2"
  >
    {isLoggedIn ? (
      <>
        <i className="bi bi-calendar-check"></i> Agendar Sessão
      </>
    ) : (
      <>
        <i className="bi bi-person-plus"></i> Inscrever-se
      </>
    )}
  </Link>
</div>
    </div>
</div>

      
  );
}

export default Home;
