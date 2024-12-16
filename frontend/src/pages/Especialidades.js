import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from "react-router-dom";
import '../css/Estilos.css';

function Especialidades() {
  return (
    <div className="container my-5 mt-5 text-center p-4 bg-light rounded shadow">
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
                  src="/images/pilates1.jpg"
                  className="d-block w-100 custom-image" 
                  alt="Pilates"
                />
                <h5 className="text-center fw-bold text-secondary">Pilates</h5>
                <p className="text-center text-secondary">Melhore sua postura e flexibilidade com técnicas de Pilates personalizadas.</p>
              </div>
              <div className="col-4">
                <img
                  src="/images/pilates2.png"
                  className="d-block w-100 custom-image"
                  alt="Reabilitação Física"
                />
                <h5 className="text-center fw-bold text-secondary">Reabilitação Física</h5>
                <p className="text-center text-secondary">Programas especializados para recuperação de lesões e cirurgias.</p>
              </div>
              <div className="col-4">
                <img
                  src="https://policonsultas.com.br/wp-content/uploads/2023/01/massoterapia-1.jpg"
                  className="d-block w-100 custom-image"
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
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4VWSjnFu2LvpsnTrGAnSUtkpFgeYXaTeSVw&s"
                  className="d-block w-100 custom-image"
                  alt="Acupuntura"
                />
                <h5 className="text-center fw-bold text-secondary">Acupuntura</h5>
                <p className="text-center text-secondary">Tratamento terapêutico para equilíbrio energético e bem-estar.</p>
              </div>
              <div className="col-4">
                <img
                  src="https://static.wixstatic.com/media/0dac19_cb0b9eec411e458aa7a46e65c364402b~mv2.jpg/v1/fill/w_849,h_429,al_c,q_85/RPG_CHIBAFISIOMED.jpg"
                  className="d-block w-100 custom-image"
                  alt="RPG"
                />
                <h5 className="text-center fw-bold text-secondary">Reeducação Postural Global</h5>
                <p className="text-center text-secondary">Correção postural e alívio de dores crônicas.</p>
              </div>
              <div className="col-4">
                <img
                  src="https://www.institutoreaction.com.br/wp-content/uploads/2020/06/beneficios-hidroterapia-miniatura.jpg"
                  className="d-block w-100 custom-image"
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

      {/* Detalhes das Especialidades */}
<div className="row mt-5 g-4 text-justify">
  {[
    {
      title: "Pilates",
      description:
        "O Pilates é uma prática que promove a consciência corporal, melhora a postura e fortalece os músculos através de exercícios personalizados que combinam respiração e movimentos precisos.",
    },
    {
      title: "Reabilitação Física",
      description:
        "Programas focados na recuperação funcional pós-lesões, cirurgias e problemas ortopédicos. Trabalhamos para restaurar a mobilidade, reduzir dores e melhorar sua qualidade de vida.",
    },
    {
      title: "Massoterapia",
      description:
        "Massagens terapêuticas que aliviam dores musculares, reduzem o estresse e proporcionam relaxamento profundo para um melhor bem-estar físico e mental.",
    },
    {
      title: "Acupuntura",
      description:
        "Terapia milenar que utiliza estímulos em pontos específicos do corpo para aliviar dores, equilibrar o fluxo energético e promover o bem-estar geral.",
    },
    {
      title: "Reeducação Postural Global",
      description:
        "Método focado na correção postural através de técnicas globais para aliviar dores crônicas, melhorar a mobilidade e prevenir lesões.",
    },
    {
      title: "Hidroterapia",
      description:
        "Terapias aquáticas realizadas em piscina, ideais para recuperação de mobilidade, fortalecimento muscular e alívio de dores.",
    },
  ].map((item, index) => (
    <div key={index} className="col-12 col-md-6 col-lg-4">
      <div className="card shadow-sm rounded p-3">
        <h4 className="text-primary fw-bold">{item.title}</h4>
        <p>{item.description}</p>
      </div>
    </div>
  ))}
</div>

      

      <div className="mt-5">
        <h3 className="text-center text-primary mb-4">O que nossos colaboradores dizem</h3>
        <div className="card shadow-lg bg-light p-3  mb-3 bg-light border-0">
          <blockquote className="blockquote text-center">
            <p className="mb-0"><strong className='cor-pink fw-bold fs-1'>&#8220;</strong>Nossa missão é ver cada paciente retornar às suas atividades com saúde e alegria.<strong className='cor-pink fw-bold fs-1'>&#8220;</strong></p>
            <footer className="blockquote-footer mt-2">João Silva, <cite title="Source Title">Fisioterapeuta</cite></footer>
          </blockquote>
        </div>
        <div className="card shadow-lg p-3 bg-light  border-0">
          <blockquote className="blockquote text-center">
            <p className="mb-0"><strong className='cor-pink fw-bold fs-1'>&#8220;</strong>A qualidade do nosso atendimento e dos nossos programas nos diferencia e gera resultados.<strong className='cor-pink fw-bold fs-1'>&#8220;</strong></p>
            <footer className="blockquote-footer mt-2">Ana Oliveira, <cite title="Source Title">Especialista em RPG</cite></footer>
          </blockquote>
        </div>
      </div>
      


      {/* Convite para agendamento */}
      <div className="mt-5 text-center p-4 bg-light rounded shadow">
        <h3 className="fw-bold text-primary mb-3">Agende Sua Sessão!</h3>
        <p className="fs-5 text-secondary">
          Não perca tempo! Agende uma consulta e aproveite os benefícios dos nossos tratamentos.
        </p>
        <Link to="/criaragendamento" className="btn btn-signup gap-2">
          <i className="bi bi-calendar-check"></i> Agendar Sessão
        </Link>
      </div>
    </div>
  );
}

export default Especialidades;
