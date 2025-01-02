import React, { useState } from 'react';
import { Modal,  Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const CadastroClienteModal = ({ show, onHide, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    cpf: '',
    nascimento: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.senha !== formData.confirmarSenha) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/clientes/register/public', {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        telefone: formData.telefone,
        cpf: formData.cpf,
        nascimento: formData.nascimento,
      });
    
      console.log(response); // Depuração para verificar a resposta

      onRegisterSuccess(response.data); // Retorna os dados de login
      onHide(); // Fecha o modal
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Ocorreu um erro ao cadastrar.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Cadastro de Cliente</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="nome">
            <Form.Label>Nome</Form.Label>
            <Form.Control
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group controlId="senha">
            <Form.Label>Senha</Form.Label>
            <Form.Control
              type="password"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group controlId="confirmarSenha">
            <Form.Label>Confirmar Senha</Form.Label>
            <Form.Control
              type="password"
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group controlId="telefone">
            <Form.Label>Telefone</Form.Label>
            <Form.Control
              type="text"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group controlId="cpf">
            <Form.Label>CPF</Form.Label>
            <Form.Control
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group controlId="nascimento">
            <Form.Label>Data de Nascimento</Form.Label>
            <Form.Control
              type="date"
              name="nascimento"
              value={formData.nascimento}
              onChange={handleChange}
            />
          </Form.Group>

          <button type="submit" disabled={isLoading} className="mt-3 btn btn-signup">
            {isLoading ? (
              <i className="bi bi-arrow-repeat spinner"></i>
            ) : (
              <i className="bi bi-calendar-check"></i>
            )}
            {' '}
            {isLoading ? 'Carregando...' : 'Cadastrar'}
          </button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CadastroClienteModal;
