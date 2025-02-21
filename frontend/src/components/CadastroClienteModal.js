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
  const [passwordVisible, setPasswordVisible] = useState({
    senha: false,
    confirmarSenha: false
  });

  // Função para alternar a visibilidade da senha
  const togglePasswordVisibility = (field) => {
    setPasswordVisible(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };


  return (
    <Modal show={show} onHide={onHide} centered >
      <Modal.Header closeButton className="border-bottom-0 pb-0">
        <Modal.Title >
          <div className="modal-header text-center justify-content-center">
            <h5 className="modal-title  d-flex align-items-center gap-2" >
              <i className="bi  bi-person-circle"></i>
              Inscrever-se
            </h5>
          </div>

        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-1">
        {errorMessage && <Alert variant="danger" className="d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorMessage}
        </Alert>}

        <Form onSubmit={handleSubmit} className="needs-validation" noValidate>
          <Row className="g-3">
            {/* Nome e Data Nascimento */}
            <Col md={7}>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">
                  <i className="bi bi-person me-2"></i>Nome completo
                </Form.Label>
                <Form.Control
                  type="text"
                  id="nome"
                  name="nome"
                  placeholder="Digite seu nome completo"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col xs="auto">
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">
                  <i className="bi bi-calendar3 me-2"></i>Data de Nascimento
                </Form.Label>
                <Form.Control
                  type="date"
                  id="nascimento"
                  name="dt_nasc"
                  value={formData.dt_nasc}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>

            {/* Sexo e CPF */}
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">
                  <i className="bi bi-gender-ambiguous me-2"></i>Sexo
                </Form.Label>
                <Form.Select
                  id="sexo"
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

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">
                  <i className="bi bi-file-earmark-person me-2"></i>CPF
                </Form.Label>
                <Form.Control
                  type="text"
                  id="cpf"
                  name="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={handleChange}
                  pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
                  required
                />
              </Form.Group>
            </Col>

            {/* Telefone */}
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">
                  <i className="bi bi-telephone me-2"></i>Telefone
                </Form.Label>
                <Form.Control
                  type="tel"
                  id="telefone"
                  name="telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={handleChange}
                  pattern="\([0-9]{2}\) [0-9]{5}-[0-9]{4}"
                />
              </Form.Group>
            </Col>

            {/* Email */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">
                  <i className="bi bi-envelope me-2"></i>Email
                </Form.Label>
                <Form.Control
                  type="email"
                  id="email"
                  name="email"
                  placeholder="exemplo@dominio.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>

            {/* Confirmação Email */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">
                  <i className="bi bi-envelope-check me-2"></i>Confirme o Email
                </Form.Label>
                <Form.Control
                  type="email"
                  id="confirmarEmail"
                  name="confirmarEmail"
                  placeholder="Confirme seu email"
                  value={formData.confirmarEmail}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>

            {/* Senha */}
            {/* Senha */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">
                  <i className="bi bi-lock me-2"></i>Senha
                </Form.Label>
                <div className="input-group">
                  <Form.Control
                    type={passwordVisible.senha ? "text" : "password"}
                    id="senha"
                    name="senha"
                    placeholder="Digite sua senha"
                    value={formData.senha}
                    onChange={handleChange}
                    required
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => togglePasswordVisibility('senha')}
                  >
                    <i className={`bi ${passwordVisible.senha ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                  </button>
                </div>
              </Form.Group>
            </Col>

            {/* Confirmação Senha */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">
                  <i className="bi bi-lock me-2"></i>Confirme a Senha
                </Form.Label>
                <div className="input-group">
                  <Form.Control
                    type={passwordVisible.confirmarSenha ? "text" : "password"}
                    id="confirmarSenha"
                    name="confirmarSenha"
                    placeholder="Confirme sua senha"
                    value={formData.confirmarSenha}
                    onChange={handleChange}
                    required
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmarSenha')}
                  >
                    <i className={`bi ${passwordVisible.confirmarSenha ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                  </button>
                </div>
              </Form.Group>
            </Col>

            <Col md={12}>
              <div className="d-flex ">
                <Form.Check
                  type="checkbox"
                  required
                  className='gap-2 me-2'
                  id="termos" // Adicionando id para associar com o label
                />
                <label htmlFor="termos" className="text-dark gap-2 me-2"> Aceito os Termos de Uso e Política de Privacidade</label>
              </div>
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
        <div className="social-icons">
          {/* Botão do Facebook */}
          <Button variant="outline-primary" className="btn-social bi-facebook">
            
          </Button>

          {/* Botão do Google */}
          <Button variant="outline-danger" className="btn-social bi-google">
           
          </Button>
        </div>
      </Modal.Footer>
    </Modal>

  );

};

export default CadastroClienteModal;