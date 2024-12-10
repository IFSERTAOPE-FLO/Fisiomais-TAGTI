import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Contato.css';

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
      <div className="row align-items-center">
        {/* Bloco de Informações de Contato */}
        <div className="col-md-5">
          <h3 className="mb-4 text-primary fw-bold">Informações de Contato</h3>
          <div className="info-box mb-3">
            <i className="bi bi-geo-alt-fill text-primary"></i>
            <div>
              <p className="mb-1"><strong>Floresta</strong></p>
              <p>Rua 123, 372 - Centro, Floresta - PE</p>
              <p>Segunda a Sexta: 07:00–19:00<br />Sábado e Domingo: Fechado</p>
            </div>
          </div>
          <div className="info-box mb-3">
            <i className="bi bi-geo-alt-fill text-primary"></i>
            <div>
              <p className="mb-1"><strong>Serra Talhada</strong></p>
              <p>Rua 123, 372 - Centro, Serra Talhada - PE</p>
              <p>Segunda a Sexta: 07:00–19:00<br />Sábado e Domingo: Fechado</p>
            </div>
          </div>
        </div>

        {/* Formulário de Contato */}
        <div className="col-md-7">
          <div className="card shadow agendamento">
            <div className="card-header agendamento-header">
              <h2 className="text-center agendamento-titulo">Fale Conosco</h2>
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
                <button type="submit" className="btn btn-pink w-100">Enviar</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contato;
