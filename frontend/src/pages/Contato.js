import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../css/Contato.css';

function Contato() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    mensagem: ''
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://localhost:5000/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
  
      if (response.ok) {
        setSuccessMessage('Mensagem enviada com sucesso!');
        setErrorMessage('');
        setFormData({ nome: '', email: '', telefone: '', mensagem: '' });
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Erro ao enviar mensagem.');
      }
    } catch (error) {
      setErrorMessage('Erro de conexão com o servidor.');
      console.error('Erro ao enviar formulário:', error);
    }
  };

  return (
    <div className="container my-5">
      
      <div className="row align-items-center ">
        {/* Bloco de Informações de Contato */}
        
        <div className="col-md-4">
        <div className="card shadow  ">
        <div className="card-header agendamento info ">
          <h3 className="mb-4 agendamento-titulo fw-bold  text-center ">Nossas clinicas</h3>
          
          <div className="info-box border-bottom border-top mb-3 ">
            
            <i className="bi bi-geo-alt-fill  cor-pink "></i>
            <div>
            <br></br>
              <p className="mb-1 fw-bold agendamento-titulo ">Floresta</p>
              <p>Rua 123, 372 - Centro, Floresta - PE</p>
              <p>Segunda a Sexta: 07:00–19:00 </p>
                <p>Sábado e Domingo: Fechado</p>
              <br />
            </div>
          </div>
          <div className="info-box mb-3 border-bottom ">
            <i className="bi bi-geo-alt-fill   cor-pink "></i>
            <div>
              <p className="mb-1 fw-bold">Serra Talhada</p>
              <p>Rua 123, 372 - Centro, Serra Talhada - PE</p>
              <p>Segunda a Sexta: 07:00–19:00</p>
              <p>Sábado e Domingo: Fechado</p>
              <br />
            </div>
          </div>
        </div>
        </div>
        </div>

        {/* Formulário de Contato */}
        <div className="col-md-7">
          <div className="card shadow ">
            <div className="card-header ">
              <h2 className="text-center text-primary">Fale Conosco</h2>
            </div>
            <div className="card-body">
              {successMessage && <div className="alert alert-success">{successMessage}</div>}
              {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="nome" className="form-label">Nome Completo</label>
                  <input
                    type="text"
                    className="form-control"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="telefone" className="form-label">Telefone/WhatsApp</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="mensagem" className="form-label">Mensagem</label>
                  <textarea
                    className="form-control"
                    id="mensagem"
                    name="mensagem"
                    value={formData.mensagem}
                    onChange={handleChange}
                    rows="4"
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-signup w-100">Enviar</button>
              </form>
            </div>
          </div>
          <div className="container" style={{ position: 'relative' }}>
          {/* Imagem Logo 0 */}
    <img 
        src="/images/0.ico" 
        alt="Logo 0" 
        className="animate-subir-descer1 pulsar"
        style={{ width: '100px', height: 'auto', position: 'absolute', top: '-545px', left: '-580px', zIndex: -2  }}
    />

    {/* Imagem Logo 1 */}
    <img 
        src="/images/1.ico" 
        alt="Logo 1" 
        className="animate-subir-descer1 pulsar"
        style={{ width: '100px', height: 'auto', position: 'absolute', top: '-130px', left: '-150px', zIndex: -2  }}
    />

    {/* Imagem Logo 2 */}
    <img 
        src="/images/2.png" 
        alt="Logo 2" 
        className="animate-subir-descer4"
        style={{ width: '300px', height: 'auto', position: 'absolute', top: '-110px', left: '-680px', zIndex: -2  }}
    />

    {/* Imagem logo 3 */}
    <img 
        src="/images/3.png" 
        alt="3"
        className="animate-subir-descer4"
        style={{ width: '300px', height: 'auto', position: 'absolute', top: '-545px', left: '-250px', zIndex: -2  }}
    />
     <img 
        src="/images/contat.png" 
        alt="5"
        style={{ width: '1320px', height: 'auto', position: 'absolute', top: '-630px', left: '-130px', zIndex: -2 }}
        
    />
        {/* Imagem logo 4 */}
        <img 
        src="/images/4.png" 
        alt="4"
        className="girar"
        style={{ width: '350px', height: 'auto', position: 'absolute', top: '-100px', left: '860px', zIndex: -2  }}
        
    />
     <img 
        src="/images/5.png" 
        alt="5"
        className="girar"
        style={{ width: '350px', height: 'auto', position: 'absolute', top: '-280px', left: '700px',zIndex: -2  }}
        
    />
      </div>
      </div>
      </div>
    </div>
  );
}

export default Contato;
