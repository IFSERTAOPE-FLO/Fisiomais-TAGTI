import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from "react-router-dom";
import '../css/Estilos.css';

function Especialidades() {
  return (
    <div className="container my-5">
      {/* Título da Página */}
      <h2 className="text-center text-primary mb-4">
        Nossas <strong className='cor-pink'>Especialidades</strong>
      </h2>

      {/* Carrossel de Especialidades */}
      <div id="carouselEspecialidades" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-inner">
          {/* Slide 1 */}
          <div className="carousel-item active">
            <div className="row">
              <div className="col-4">
                <img
                  src="https://via.placeholder.com/150x100?text=Pilates"
                  className="d-block w-100"
                  alt="Pilates"
                />
                <h5 className="text-center fw-bold text-secondary">Pilates</h5>
                <p className="text-center text-secondary">Melhore sua postura e flexibilidade com técnicas de Pilates personalizadas.</p>
              </div>
              <div className="col-4">
                <img
                  src="https://via.placeholder.com/150x100?text=Reabilitação+Física"
                  className="d-block w-100"
                  alt="Reabilitação Física"
                />
                <h5 className="text-center fw-bold text-secondary">Reabilitação Física</h5>
                <p className="text-center text-secondary">Programas especializados para recuperação de lesões e cirurgias.</p>
              </div>
              <div className="col-4">
                <img
                  src="https://via.placeholder.com/150x100?text=Massoterapia"
                  className="d-block w-100"
                  alt="Massoterapia"
                />
                <h5 className="text-center fw-bold text-secondary">Massoterapia</h5>
                <p className="text-center text-secondary">Tratamentos de alívio para dores musculares e estresse.</p>
              </div>
            </div>
          </div>
          {/* Slide 2 */}
          <div className="carousel-item">
            <div className="row">
              <div className="col-4">
                <img
                  src="https://via.placeholder.com/150x100?text=Acupuntura"
                  className="d-block w-100"
                  alt="Acupuntura"
                />
                <h5 className="text-center fw-bold text-secondary">Acupuntura</h5>
                <p className="text-center text-secondary">Tratamento terapêutico para equilíbrio energético e bem-estar.</p>
              </div>
              <div className="col-4">
                <img
                  src="https://via.placeholder.com/150x100?text=RPG"
                  className="d-block w-100"
                  alt="RPG"
                />
                <h5 className="text-center fw-bold text-secondary">Reeducação Postural Global</h5>
                <p className="text-center text-secondary">Correção postural e alívio de dores crônicas.</p>
              </div>
              <div className="col-4">
                <img
                  src="https://via.placeholder.com/150x100?text=Hidroterapia"
                  className="d-block w-100"
                  alt="Hidroterapia"
                />
                <h5 className="text-center fw-bold text-secondary">Hidroterapia</h5>
                <p className="text-center text-secondary">Exercícios terapêuticos realizados em piscina para melhor recuperação.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de navegação */}
        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#carouselEspecialidades"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Anterior</span>
        </button>
        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#carouselEspecialidades"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Próximo</span>
        </button>
      </div>

      {/* Convite para agendamento */}
      <div className="mt-5 text-center p-4 bg-light rounded shadow">
        <h3 className="fw-bold text-primary mb-3">Agende Sua Sessão!</h3>
        <p className="fs-5 text-secondary">
          Não perca tempo! Agende uma consulta e aproveite os benefícios dos nossos tratamentos.
        </p>
        <Link to="/agendamento" className="btn btn-signup gap-2">
          <i className="bi bi-calendar-check"></i> Agendar Sessão
        </Link>
      </div>
    </div>
  );
}

export default Especialidades;
