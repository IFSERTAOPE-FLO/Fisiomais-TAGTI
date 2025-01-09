import React, { useState } from 'react';
import { Modal, Form, Alert, Row, Col } from 'react-bootstrap'; // Corrigido para importar Row e Col separadamente
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
    <div className="modal-dialog">
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
          <Modal.Title className='text-center'>Cadastro de Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col>
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
              </Col>

              <Col>
                <Form.Group controlId="sexo">
                  <Form.Label>Sexo</Form.Label>
                  <Form.Control
                    as="select"
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col>
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
              </Col>

              <Col>
                <Form.Group controlId="confirmarEmail">
                  <Form.Label>Confirmar Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="confirmarEmail"
                    value={formData.confirmarEmail}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col>
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
              </Col>

              <Col>
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
              </Col>
            </Row>

            <Row>
              <Col>
                <Form.Group controlId="telefone">
                  <Form.Label>Telefone</Form.Label>
                  <Form.Control
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>

              <Col>
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
              </Col>
            </Row>

            <Row>
              <Col >
                <Form.Group controlId="nascimento">
                  <Form.Label>Data de Nascimento</Form.Label>
                  <Form.Control
                    type="date"
                    name="dt_nasc"
                    value={formData.dt_nasc}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col>




              </Col>
            </Row>

          </Form>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between align-items-center">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn btn-signup"
          >
            {isLoading ? (
              <i className="bi bi-arrow-repeat spinner"></i>
            ) : (
              <i className="bi bi-person-plus"></i>
            )}
            {' '}
            {isLoading ? 'Carregando...' : 'Cadastrar'}
          </button>


          <div className="d-flex gap-3 social-icons">
            <button className="btn btn-outline-primary btn-social">
              <i className="bi bi-facebook"></i>
            </button>
            <button className="btn btn-outline-danger btn-social">
              <i className="bi bi-google"></i>
            </button>
          </div>
        </Modal.Footer>

      </Modal>
    </div>
  );
};

export default CadastroClienteModal;