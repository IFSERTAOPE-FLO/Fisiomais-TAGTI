import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import '../css/Estilos.css';
import '../css/Home.css';

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const role = localStorage.getItem('role');

  // Verifica se o usuário está logado
  useEffect(() => {
    const loggedIn = localStorage.getItem("token");
    setIsLoggedIn(!!loggedIn);
  }, []);



  return (

    <div className="container mt-4 ">


      <h1 className="text-center fw-bold text-primary mb-3">Bem-vindo à nossa clínica de Fisioterapia e Pilates!</h1>
      <p className="text-center  fs-5 text-primary mb-3">Na <strong className="cor-pink"> FISIOMAIS</strong>, cuidamos de você com profissionalismo e dedicação.
        < br />Nossa missão é promover a sua saúde, reabilitação e qualidade de vida por meio de tratamentos personalizados, unindo as melhores prátcias de  <strong className="cor-pink">Fisioterapia</strong> e os benefícios do <strong className="cor-pink">Pilates</strong>.</p>

      <div className="mt-5 text-center p-4 bg-light rounded shadow">
        <h3 className="fw-bold text-primary mb-3">
          Não perca tempo!
        </h3>
        <p className="fs-5 text-secondary">
          Agende uma sessão conosco para melhorar sua saúde e bem-estar.
          Nossos profissionais estão prontos para ajudar você a alcançar seus objetivos!
        </p>
        {isLoggedIn ? (
          role === "cliente" ? (
            <Link
              to="/clientepage?opcaoSelecionada=criarAgendamento"
              className="btn btn-signup gap-2"
            >
              <i className="bi bi-calendar-check"></i> Agendar Sessão
            </Link>
          ) : (
            <Link className="btn btn-signup" to="/adminPage">
              <i className="bi bi-gear-fill me-2"></i> Central de Controle
            </Link>
          )
        ) : (
          <div className="inscrever-texto">
            <p className="fs-5 text-secondary">
              Clique em <strong className="cor-pink">"Inscrever-se"</strong> no menu acima para começar!{" "}
              <i className="bi bi-arrow-up"></i>
            </p>
          </div>
        )}


      </div>
      {/* Carrossel de Colaboradores */}
      <div className="mt-5">
        <h2 className="text-center text-primary mb-3">Nossos Colaboradores</h2>
        <p className="text-center text-primary mb-3">Junte-se à nossa equipe e ajude nossos pacientes a alcançar uma vida com mais <strong className="cor-pink">flexibilidade</strong>, <strong className="cor-pink">mobilidade</strong> e <strong className="cor-pink">saúde integral</strong>. Na nossa clínica, seu trabalho faz a diferença para um futuro mais <strong className="cor-pink">ativo</strong> e <strong className="cor-pink">revitalizado</strong>.</p>

        <div id="carouselColaboradores" className="carousel slide" data-bs-ride="carousel">
          <div className="carousel-inner">
            <div className="carousel-item active">
              <div className="row">
                <div className="col-4">
                  <img
                    src="/images/pilates1.jpg"
                    className="d-block w-100"
                    alt="Colaborador 1"
                  />
                  <h5 className="text-center fw-bold text-secondary mb-3">Colaborador 1</h5>
                  <p className="text-center text-secondary mb-3">Fisioterapeuta especializado</p>
                </div>
                <div className="col-4">
                  <img
                    src="/images/pilates1.jpg"
                    className="d-block w-100"
                    alt="Colaborador 2"
                  />
                  <h5 className="text-center fw-bold text-secondary mb-3">Colaborador 2</h5>
                  <p className="text-center  text-secondary mb-3">Especialista em recuperação muscular</p>
                </div>
                <div className="col-4">
                  <img
                    src="/images/pilates1.jpg"
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
                    src="/images/pilates1.jpg"
                    className="d-block w-100"
                    alt="Colaborador 4"
                  />
                  <h5 className="text-center fw-bold text-secondary mb-3">Colaborador 4</h5>
                  <p className="text-center  text-secondary mb-3">Especialista em RPG</p>
                </div>
                <div className="col-4">
                  <img
                    src="/images/pilates1.jpg"
                    className="d-block w-100"
                    alt="Colaborador 5"
                  />
                  <h5 className="text-center fw-bold text-secondary mb-3">Colaborador 5</h5>
                  <p className="text-center  text-seconday mb-3">Instrutor de Alongamento</p>
                </div>
                <div className="col-4">
                  <img
                    src="/images/pilates1.jpg"
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
        <p className="text-center  text-primary mb-3">Sinta-se em casa e descubra como podemos ajudar
          você a se movimentar com mais <strong className="cor-pink">força</strong>, <strong className="cor-pink">equilíbrio</strong> e <strong className="cor-pink">bem-estar</strong>.  </p>

        <div id="carouselServicos" className="carousel slide" data-bs-ride="carousel">
          <div className="carousel-inner">
            <div className="carousel-item active">
              <div className="row">
                <div className="col-4">
                  <img
                    src="/images/pilates1.jpg"
                    className="d-block w-100 custom-image"
                    alt="Pilates"
                  />
                  <h5 className="text-center fw-bold text-secondary">Pilates</h5>
                  <p className="text-center text-secondary">Melhore sua postura e flexibilidade.</p>
                </div>
                <div className="col-4">
                  <img
                    src="/images/pilates2.png"
                    className="d-block w-100 custom-image"
                    alt="Reabilitação Física"
                  />
                  <h5 className="text-center fw-bold text-secondary">Reabilitação Física</h5>
                  <p className="text-center text-secondary">Recuperação após lesões ou cirurgias.</p>
                </div>
                <div className="col-4">
                  <img
                    src="https://policonsultas.com.br/wp-content/uploads/2023/01/massoterapia-1.jpg"
                    className="d-block w-100 custom-image"
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
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4VWSjnFu2LvpsnTrGAnSUtkpFgeYXaTeSVw&s"
                    className="d-block w-100 custom-image"
                    alt="Acupuntura"
                  />
                  <h5 className="text-center fw-bold text-secondary">Acupuntura</h5>
                  <p className="text-center text-secondary">Equilíbrio energético e bem-estar.</p>
                </div>
                <div className="col-4">
                  <img
                    src="https://static.wixstatic.com/media/0dac19_cb0b9eec411e458aa7a46e65c364402b~mv2.jpg/v1/fill/w_849,h_429,al_c,q_85/RPG_CHIBAFISIOMED.jpg"
                    className="d-block w-100 custom-image"
                    alt="RPG"
                  />
                  <h5 className="text-center fw-bold text-secondary">Reeducação Postural Global</h5>
                  <p className="text-center text-secondary">Correção postural e alívio de dores.</p>
                </div>
                <div className="col-4">
                  <img
                    src="https://www.institutoreaction.com.br/wp-content/uploads/2020/06/beneficios-hidroterapia-miniatura.jpg"
                    className="d-block w-100 custom-image"
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


    </div>

  );
}

export default Home;
