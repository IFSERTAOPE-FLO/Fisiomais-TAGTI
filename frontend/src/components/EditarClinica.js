import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const EditarClinica = ({ clinica, onClose, onSave }) => {
    const [nome, setNome] = useState(clinica.nome);
    const [cnpj, setCnpj] = useState(clinica.cnpj);
    const [telefone, setTelefone] = useState(clinica.telefone);
    const [rua, setRua] = useState(clinica.endereco?.rua || '');
    const [numero, setNumero] = useState(clinica.endereco?.numero || '');
    const [bairro, setBairro] = useState(clinica.endereco?.bairro || '');
    const [cidade, setCidade] = useState(clinica.endereco?.cidade || '');
    const [estado, setEstado] = useState(clinica.endereco?.estado || '');
    const [erro, setErro] = useState('');

    const [cidades, setCidades] = useState([]);

    const estados = [
        "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
    ];

    useEffect(() => {
        if (estado) {
            const buscarCidades = async () => {
                try {
                    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/distritos`);
                    if (response.ok) {
                        const cidades = await response.json();
                        const cidadesOrdenadas = cidades
                            .map((cidade) => cidade.nome)
                            .sort((a, b) => a.localeCompare(b));
                        setCidades(cidadesOrdenadas);
                    } else {
                        throw new Error("Erro ao carregar cidades.");
                    }
                } catch (err) {
                    setErro(err.message);
                }
            };
            buscarCidades();
        }
    }, [estado]);

    const handleSave = async () => {
        const dadosAtualizados = {
            nome,
            cnpj,
            telefone,
            endereco: {
                id_endereco: clinica.endereco?.id_endereco,
                rua,
                numero,
                bairro,
                cidade,
                estado
            }
        };

        const clinicaId = clinica.id;

        if (!clinicaId) {
            alert("ID da clínica inválido.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/clinicas/editar_clinica/${clinicaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(dadosAtualizados),
            });

            const data = await response.json();
            if (response.ok) {
                alert('Clínica atualizada com sucesso');
                onSave();
                onClose();
            } else {
                alert(`Erro: ${data.message}`);
            }
        } catch (error) {
            alert('Erro ao atualizar a clínica');
        }
    };

    return (
        <Modal show onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Editar Clínica</Modal.Title>
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
                            <Form.Group controlId="formCnpj">
                                <Form.Label>CNPJ</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={cnpj}
                                    onChange={(e) => setCnpj(e.target.value)}
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
                                    {cidades.map((cidade, index) => (
                                        <option key={index} value={cidade}>
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

export default EditarClinica;
