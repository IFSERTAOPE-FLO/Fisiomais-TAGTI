import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Col, Row } from 'react-bootstrap';

const AddCliente = ({ onClose, onSucesso }) => {
  const initialFormState = {
    nome: '',
    email: '',
    cpf: '',
    senha: '',
    telefone: '',
    referencias: '',
    dt_nasc: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    sexo: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const response = await axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
        setEstados(response.data.map((estado) => ({ sigla: estado.sigla, nome: estado.nome })));
      } catch (error) {
        console.error('Erro ao buscar estados:', error);
      }
    };

    fetchEstados();
  }, []);

  useEffect(() => {
    if (formData.estado) {
      const fetchCidades = async () => {
        try {
          const response = await axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.estado}/municipios`);
          setCidades(response.data.map((cidade) => cidade.nome).sort());
        } catch (error) {
          console.error('Erro ao buscar cidades:', error);
        }
      };

      fetchCidades();
    }
  }, [formData.estado]);



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setModalMessage('');


    try {
      const token = localStorage.getItem("token");
      const response = await axios.post('http://localhost:5000/clientes/register', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFormData(initialFormState);
      // Chama onSuccess para atualizar a lista
      if (onSucesso) {
        onSucesso();
      }
      setLoading(false);
      setModalMessage(response.data.message);

    } catch (error) {
      setLoading(false);
      setModalMessage(error.response?.data?.message || 'Erro ao cadastrar cliente.');

    }
  };

  return (
    <div className="container mt-4">
      {modalMessage && <div className="alert alert-info">{modalMessage}</div>}
      <div className="card shadow-lg">
        <div className="card-header bg-light text-primary">
          <h2 className="mb-0">Adicionar Cliente</h2>
          <small className="text-secondary-50">Campos marcados com * são obrigatórios</small>
        </div>
        <div className="card-body">
          <Form onSubmit={handleSubmit}>
            {/* Seção: Informações Pessoais */}
            <fieldset className="border p-3 mb-4">
              <legend className="w-auto fs-6 text-primary">Informações Pessoais</legend>
              <Row className="g-3 mb-3">
                <Col md={3}>
                  <Form.Group controlId="nome">
                    <Form.Label>Nome *</Form.Label>
                    <Form.Control
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group controlId="email">
                    <Form.Label>Email *</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group controlId="dt_nasc">
                    <Form.Label>Data de Nascimento</Form.Label>
                    <Form.Control
                      type="date"
                      name="dt_nasc"
                      value={formData.dt_nasc}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group controlId="sexo">
                    <Form.Label>Sexo *</Form.Label>
                    <Form.Control
                      as="select"
                      name="sexo"
                      value={formData.sexo}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="O">Outro</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="g-3 mb-3">
                <Col md={4}>
                  <Form.Group controlId="cpf">
                    <Form.Label>CPF *</Form.Label>
                    <Form.Control
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="senha">
                    <Form.Label>Senha *</Form.Label>
                    <Form.Control
                      type="password"
                      name="senha"
                      value={formData.senha}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
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
              </Row>

            </fieldset>

            {/* Seção: Endereço */}
            <fieldset className="border p-3 mb-4">
              <legend className="w-auto fs-6 text-primary">Endereço</legend>
              <Row className="g-3 mb-3">
                <Col md={5}>
                  <Form.Group controlId="rua">
                    <Form.Label>Rua</Form.Label>
                    <Form.Control
                      type="text"
                      name="rua"
                      value={formData.rua}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group controlId="numero">
                    <Form.Label>Número</Form.Label>
                    <Form.Control
                      type="text"
                      name="numero"
                      value={formData.numero}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="complemento">
                    <Form.Label>Complemento</Form.Label>
                    <Form.Control
                      type="text"
                      name="complemento"
                      value={formData.complemento}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="g-3">
                <Col md={2}>
                  <Form.Group controlId="bairro">
                    <Form.Label>Bairro</Form.Label>
                    <Form.Control
                      type="text"
                      name="bairro"
                      value={formData.bairro}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group controlId="cidade">
                    <Form.Label>Cidade</Form.Label>
                    <Form.Control
                      as="select"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                      disabled={!formData.estado}
                    >
                      <option value="">Selecione</option>
                      {cidades.map((cidade, index) => (
                        <option key={index} value={cidade}>
                          {cidade}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group controlId="estado">
                    <Form.Label>Estado *</Form.Label>
                    <Form.Control
                      as="select"
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecione</option>
                      {estados.map((estado) => (
                        <option key={estado.sigla} value={estado.sigla}>
                          {estado.nome}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group controlId="rua">
                    <Form.Label>Rua</Form.Label>
                    <Form.Control
                      type="text"
                      name="rua"
                      value={formData.rua}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group controlId="referencias">
                    <Form.Label>Referências</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="referencias"
                      value={formData.referencias}
                      onChange={handleChange}
                      rows={3}
                    />
                  </Form.Group>
                </Col>

              </Row>
            </fieldset>

            {/* Botões de Ação */}
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button className="btn btn-login" type="submit" disabled={loading}>
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
              <button className="btn btn-signup" onClick={onClose}>
                Fechar
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );


};

export default AddCliente;
