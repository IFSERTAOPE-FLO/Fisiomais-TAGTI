import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const EditarUsuario = ({ usuario, role, onClose, onSave }) => {
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [telefone, setTelefone] = useState(usuario.telefone);
  const [rua, setRua] = useState(usuario.endereco?.rua || '');
  const [numero, setNumero] = useState(usuario.endereco?.numero || '');
  const [bairro, setBairro] = useState(usuario.endereco?.bairro || '');
  const [cidade, setCidade] = useState(usuario.endereco?.cidade || '');
  const [estado, setEstado] = useState(usuario.endereco?.estado || '');
  const [cpf, setCpf] = useState(usuario.cpf);
  const [cargo, setCargo] = useState(usuario.cargo || '');
  const [clinica, setClinica] = useState('');
  const [clinicas, setClinicas] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [erro, setErro] = useState('');
  

  useEffect(() => {
    const buscarClinicas = async () => {
      try {
        const response = await fetch('http://localhost:5000/clinicas');
        if (response.ok) {
          const data = await response.json();
          setClinicas(data);
        } else {
          throw new Error("Erro ao carregar clínicas.");
        }
      } catch (err) {
        setErro(err.message);
      }
    };
    buscarClinicas();
  }, []);

  // Função para alterar a clínica do colaborador
  const alterarClinica = async () => {
    const dadosClinica = {
      colaborador_id: usuario.id,
      clinica_id: clinica,
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/colaboradores/alterar_clinica', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dadosClinica),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Clínica alterada com sucesso');
        onSave();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      alert('Erro ao alterar clínica');
    }
  };

  const handleSave = async () => {
    const dadosAtualizados = {
      nome,
      email,
      telefone,
      endereco: {
        id_endereco: usuario.endereco ? usuario.endereco.id_endereco : null,
        rua,
        numero,
        bairro,
        cidade,
        estado,
      },
      cpf,
      cargo: role === 'colaborador' ? cargo : undefined,
    };

    const idUsuario = usuario.id;

    if (!idUsuario) {
      alert("ID do usuário inválido.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/usuarios/editar_usuario_com_endereco/${role}/${idUsuario}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dadosAtualizados),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Usuário e endereço atualizados com sucesso');
        onSave();
        onClose();
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      alert('Erro ao atualizar o usuário');
    }
  };

  const buscarCidades = async (estado) => {
    try {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/distritos`);
      if (response.ok) {
        const cidades = await response.json();
        const cidadesOrdenadas = cidades
          .map((cidade) => cidade.nome)
          .sort((a, b) => a.localeCompare(b));  // Ordenação alfabética
        setCidades(cidadesOrdenadas);
      } else {
        throw new Error("Erro ao carregar cidades.");
      }
    } catch (err) {
      setErro(err.message);
    }
  };
  useEffect(() => {
    if (estado) {
      buscarCidades(estado);
    }
  }, [estado]);

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Editar Usuário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="formNome">
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group controlId="formEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="formTelefone">
                <Form.Label>Telefone</Form.Label>
                <Form.Control
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group controlId="formCpf">
                <Form.Label>CPF</Form.Label>
                <Form.Control
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                />
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="formRua">
                <Form.Label>Rua</Form.Label>
                <Form.Control
                  type="text"
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group controlId="formNumero">
                <Form.Label>Número</Form.Label>
                <Form.Control
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                />
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="formBairro">
                <Form.Label>Bairro</Form.Label>
                <Form.Control
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group controlId="formCidade">
                <Form.Label>Cidade</Form.Label>
                <Form.Control
                  as="select"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                >
                  <option value="">Selecione a cidade</option>
                  {cidades.map((cidade) => (
                    <option key={cidade} value={cidade}>
                      {cidade}
                    </option>
                  ))}
                </Form.Control>

              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="formEstado">
                <Form.Label>Estado</Form.Label>
                <Form.Control
                  as="select"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                >
                  <option value="">Selecione o estado</option>
                  {estados.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </div>
          </div>

          {role === 'colaborador' && (
            <div className="row">
              <div className="col-md-6">
                <Form.Group controlId="formClinica">
                  <Form.Label>Clínica</Form.Label>
                  <Form.Control
                    as="select"
                    value={clinica}
                    onChange={(e) => setClinica(e.target.value)}
                  >
                    <option value="">Selecione a clínica</option>
                    {clinicas.map((clinica) => (
                      <option key={clinica.ID_Clinica} value={clinica.ID_Clinica}>
                        {clinica.Nome}
                      </option>
                    ))}
                  </Form.Control>
                  
                </Form.Group>
              </div>
              <div className="col-md-6">
                    <Form.Group controlId="formCargo">
                      <Form.Label>Cargo</Form.Label>
                      <Form.Control
                        type="text"
                        value={cargo}
                        onChange={(e) => setCargo(e.target.value)}
                      />
                    </Form.Group>
                  </div>
            </div>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Fechar</Button>
        <Button variant="primary" onClick={handleSave}>Salvar alterações</Button>
        <Button
          type="button"

          onClick={alterarClinica} // Função para atualizar a clínica
        >
          Alterar Clinica
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditarUsuario;