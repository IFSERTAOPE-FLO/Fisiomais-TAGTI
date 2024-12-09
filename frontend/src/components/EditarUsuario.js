import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const EditarUsuario = ({ usuario, role, onClose, onSave }) => {
    const [nome, setNome] = useState(usuario.nome);
    const [email, setEmail] = useState(usuario.email);
    const [telefone, setTelefone] = useState(usuario.telefone);
    const [endereco, setEndereco] = useState(usuario.endereco);
    const [bairro, setBairro] = useState(usuario.bairro);
    const [cidade, setCidade] = useState(usuario.cidade);
    const [cpf, setCpf] = useState(usuario.cpf);
    const [cargo, setCargo] = useState(usuario.cargo || '');
  
    const handleSave = async () => {
        console.log("Usuário Editando:", usuario);  // Verifique se o ID é válido
        
        const dadosAtualizados = {
            nome,
            email,
            telefone,
            endereco,
            bairro,
            cidade,
            cpf,
            cargo: role === 'colaborador' ? cargo : undefined,
        };
        
        const idUsuario = role === 'cliente' ? usuario.ID_Cliente : usuario.ID_Colaborador;
        console.log("ID do Usuário:", idUsuario);  // Verifique se o ID é passado corretamente
        
        // Verifique se o ID do usuário está correto e não é undefined
        if (!idUsuario) {
            alert("ID do usuário inválido.");
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/editar_usuario/${role}/${idUsuario}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(dadosAtualizados),
            });
    
            const data = await response.json();
            if (response.ok) {
                alert('Usuário atualizado com sucesso');
                onSave();
                onClose();
            } else {
                alert(`Erro: ${data.message}`);
            }
        } catch (error) {
            alert('Erro ao atualizar o usuário');
        }
    };

    return (
      <Modal show onHide={onClose}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formNome">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </Form.Group>
  
            <Form.Group controlId="formEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
  
            <Form.Group controlId="formTelefone">
              <Form.Label>Telefone</Form.Label>
              <Form.Control
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </Form.Group>
  
            <Form.Group controlId="formEndereco">
              <Form.Label>Endereço</Form.Label>
              <Form.Control
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
              />
            </Form.Group>
  
            <Form.Group controlId="formBairro">
              <Form.Label>Bairro</Form.Label>
              <Form.Control
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
            </Form.Group>
  
            <Form.Group controlId="formCidade">
              <Form.Label>Cidade</Form.Label>
              <Form.Control
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </Form.Group>
  
            <Form.Group controlId="formCpf">
              <Form.Label>CPF</Form.Label>
              <Form.Control
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
              />
            </Form.Group>
  
            {role === 'colaborador' && (
              <Form.Group controlId="formCargo">
                <Form.Label>Cargo</Form.Label>
                <Form.Control
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Salvar alterações
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };
  

export default EditarUsuario;
