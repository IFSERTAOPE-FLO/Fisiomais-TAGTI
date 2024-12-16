import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function SobreNos() {
  return (
    <div className="container  mt-5 text-center p-4 bg-light rounded shadow">
      <h2 className="text-center text-primary mb-4">
        Sobre a <strong className='cor-pink'>FISIOMAIS</strong>
      </h2>

      <div className="row align-items-center position-relative">
        <div className="col-md-5 ms-2" style={{ textAlign: 'justify' }}>
          <p>
            A <strong className='cor-pink'>FISIOMAIS</strong> é uma empresa especializada em <strong className='cor-pink'>fisioterapia</strong> e em aulas de
            <strong className='cor-pink'> pilates</strong>, com o objetivo de proporcionar a nossos clientes um cuidado completo com a saúde e o bem-estar.
          </p>
          <p>
            Nosso time de profissionais é altamente qualificado e utiliza as melhores técnicas para garantir que você tenha uma experiência única e eficaz.
            Se você precisa de recuperação de lesões, alívio de dores musculares, ou apenas quer melhorar sua flexibilidade e postura, nós temos a solução ideal para você.
          </p>
          <p>
            Na <strong className='cor-pink'>FISIOMAIS</strong>, acreditamos que o movimento é essencial para uma vida plena e saudável. Fundada com o propósito de oferecer tratamentos de alta qualidade, 
            unimos o cuidado humano com práticas modernas de Fisioterapia e Pilates, ajudando nossos pacientes a recuperarem sua mobilidade, aliviarem dores e 
            conquistarem qualidade de vida.
          </p>
        </div>

        <div className="col-md-3 mb-4 mb-md-0">
          <img
            src="/images/pilates1.jpg" // Coloque o caminho da sua imagem aqui
            alt="Imagem representativa da Fisiomais"
            className="img-fluid rounded shadow"
            style={{ position: 'relative', top: '-60px' }}
          />
        </div>

        <div className="col-md-3 mb-4 mb-md-0 ms-2 position-relative">
          <img
            src="/images/pilates2.png" // Coloque o caminho da sua imagem aqui
            alt="Imagem representativa da Fisiomais"
            className="img-fluid rounded shadow"
            style={{ position: 'relative', top: '0px' }}
          />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-5">
        <h3 className="text-center text-primary mb-4">Perguntas Frequentes (FAQ)</h3>

        <div className="accordion" id="faqAccordion">
          <div className="accordion-item">
            <h2 className="accordion-header" id="headingOne">
              <button
                className="accordion-button"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseOne"
                aria-expanded="true"
                aria-controls="collapseOne"
              >
                <i className="bi bi-question-circle me-2"></i>
                Quais serviços a FISIOMAIS oferece?
              </button>
            </h2>
            <div
              id="collapseOne"
              className="accordion-collapse collapse show"
              aria-labelledby="headingOne"
              data-bs-parent="#faqAccordion"
            >
              <div className="accordion-body">
                Oferecemos serviços de fisioterapia personalizada e aulas de pilates para atender às necessidades específicas de cada cliente.
              </div>
            </div>
          </div>
          <div className='card-shadow'>
          <div className="accordion-item">
            <h2 className="accordion-header" id="headingTwo">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseTwo"
                aria-expanded="false"
                aria-controls="collapseTwo"
              >
                <i className="bi bi-clock me-2"></i>
                Qual é o horário de funcionamento?
              </button>
            </h2>
            <div
              id="collapseTwo"
              className="accordion-collapse collapse"
              aria-labelledby="headingTwo"
              data-bs-parent="#faqAccordion"
            >
              <div className="accordion-body">
                Funcionamos de segunda a sexta, das 8h às 20h, e aos sábados, das 8h às 12h.
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <h2 className="accordion-header" id="headingThree">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseThree"
                aria-expanded="false"
                aria-controls="collapseThree"
              >
                <i className="bi bi-cash-coin me-2"></i>
                Como faço para saber os preços das aulas?
              </button>
            </h2>
            <div
              id="collapseThree"
              className="accordion-collapse collapse"
              aria-labelledby="headingThree"
              data-bs-parent="#faqAccordion"
            >
              <div className="accordion-body">
                Você pode entrar em contato conosco pelo telefone ou WhatsApp: <i className="bi bi-whatsapp text-success me-2"></i>
                <strong>(87) 9999-9999</strong> para receber todas as informações sobre preços e pacotes disponíveis.
                
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default SobreNos;
