import React, { useState } from 'react';
import { Modal, Form, Alert, Row, Col, Button, Spinner } from 'react-bootstrap'; // Corrigido para importar Row e Col separadamente
import axios from 'axios';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const CadastroClienteModal = ({ show, onHide, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    confirmarEmail: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    cpf: '',
    dt_nasc: '',
    sexo: '',
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

    if (formData.email !== formData.confirmarEmail) {
      setErrorMessage('Os e-mails não coincidem.');
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
        dt_nasc: formData.dt_nasc,
        sexo: formData.sexo,
      });

      console.log('Resposta do backend:', response); // Verifique o que está sendo retornado
      if (response.status === 201) {
        onRegisterSuccess(response.data); // Retorna os dados de login
        onHide(); // Fecha o modal
      } else {
        setErrorMessage('Erro inesperado. Tente novamente.');
      }
    } catch (error) {
      console.log('Erro no cadastro:', error);
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
        <Modal.Title className="w-100 text-center">Cadastro de Cliente</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <Form onSubmit={handleSubmit}>
          {/* Linha 1: Nome e Data de Nascimento (data menor) */}
          <Row className="mb-3 align-items-end">
            <Col>
              <Form.Group controlId="nome">
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Digite seu nome"
                  required
                />
              </Form.Group>
            </Col>
            <Col xs="auto">
              <Form.Group controlId="nascimento" className="mb-0">
                <Form.Label>Data de Nascimento</Form.Label>
                <Form.Control
                  type="date"
                  name="dt_nasc"
                  value={formData.dt_nasc}
                  onChange={handleChange}
                  className="w-auto"
                />
              </Form.Group>
            </Col>
          </Row>


          {/* Linha 2: Sexo e CPF */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="sexo">
                <Form.Label>Sexo</Form.Label>
                <Form.Select
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="cpf">
                <Form.Label>CPF</Form.Label>
                <Form.Control
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="xxx.xxx.xxx-xx"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Linha 3: Telefone */}
          <Row className="mb-3">
            <Col>
              <Form.Group controlId="telefone">
                <Form.Label>Telefone</Form.Label>
                <Form.Control
                  type="text"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(xx) xxxxx-xxxx"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Linha 4: Email e Confirmar Email */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="email">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="exemplo@dominio.com"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="confirmarEmail">
                <Form.Label>Confirmar Email</Form.Label>
                <Form.Control
                  type="email"
                  name="confirmarEmail"
                  value={formData.confirmarEmail}
                  onChange={handleChange}
                  placeholder="Confirme seu email"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Linha 5: Senha e Confirmar Senha */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="senha">
                <Form.Label>Senha</Form.Label>
                <Form.Control
                  type="password"
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  placeholder="Digite sua senha"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="confirmarSenha">
                <Form.Label>Confirmar Senha</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  placeholder="Confirme sua senha"
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between align-items-center">
        <Button className='btn btn-signup' type="submit" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Carregando...
            </>
          ) : (
            <>
              <i className="bi bi-person-plus"></i> Cadastrar
            </>
          )}
        </Button>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" className="btn-social">
            <i className="bi bi-facebook"></i>
          </Button>
          <Button variant="outline-danger" className="btn-social">
            <i className="bi bi-google"></i>
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );

};

export default CadastroClienteModal;