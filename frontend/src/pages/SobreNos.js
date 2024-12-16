import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function SobreNos() {
  return (
    <div className="container my-5">
      <img
        src="/images/linhas.png"
        alt="Logo 3"
        style={{
          position: 'absolute',
          top: 0,
          left: -100,
          width: '19%',
          height: 'auto',
          zIndex: -1 // Coloca a imagem atrás do texto
        }}
      />
      <img
        src="/images/linhas.png"
        alt="Logo 3"
        style={{
          position: 'absolute',
          top: 0,
          right: -100,
          width: '19%',
          height: 'auto',
          transform: 'scaleX(-1)',
          zIndex: -1 // Coloca a imagem atrás do texto
        }}
      />
      <h2 className="text-center text-primary mb-4">
        Sobre a <strong className='cor-pink'>FISIOMAIS</strong>
      </h2>
      <div className="row align-items-center position-relative">
        
        <div className="col-md-5  ms-2 " style={{ textAlign: 'justify' }}>
          <p >
            A <strong className='cor-pink'>FISIOMAIS</strong> é uma empresa especializada em <strong className='cor-pink'>fisioterapia</strong> e em aulas de
            <strong className='cor-pink'> pilates</strong>, com o objetivo de proporcionar a nossos clientes um cuidado completo com a saúde e o bem-estar.
          </p>
          <p>
            Nosso time de profissionais é altamente qualificado e utiliza as melhores técnicas para garantir que você tenha uma experiência única e eficaz.
            Se você precisa de recuperação de lesões, alívio de dores musculares, ou apenas quer melhorar sua flexibilidade e postura, nós temos a solução ideal para você.
          </p>
          <p > 
            Na <strong className='cor-pink'>FISIOMAIS</strong>, acreditamos que o movimento é essencial para uma vida plena e saudável. Fundada com o propósito de oferecer tratamentos de alta qualidade, 
            unimos o cuidado humano com práticas modernas de Fisioterapia e Pilates, ajudando nossos pacientes a recuperarem sua mobilidade, aliviarem dores e 
            conquistarem qualidade de vida.
          </p>
        </div>

        <div className="col-md-3 mb-4 mb-md-0 ">
          <img
            src="/images/pilates1.jpg" // Coloque o caminho da sua imagem aqui
            alt="Imagem representativa da Fisiomais"
            className="img-fluid rounded shadow"
            style={{ position: 'relative', top: '-60px'}} // Movendo para cima
          />
        </div>
        <div className="col-md-3 mb-4 mb-md-0 ms-2 position-relative">
          <img
            src="/images/pilates2.png" // Coloque o caminho da sua imagem aqui
            alt="Imagem representativa da Fisiomais"
            className="img-fluid rounded shadow"
            style={{ position: 'relative', top: '0px'  }} // Movendo para cima
          />
        </div>
      </div>
    </div>
  );
}

export default SobreNos;
