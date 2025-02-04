import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Form, Alert, Spinner, ListGroup } from "react-bootstrap";
import { format, parseISO } from "date-fns";

const EditarHorarios = ({
  colaboradorId,
  colaboradorNome,
  onClose,
  onSave,
}) => {
  const [horarios, setHorarios] = useState([]);
  const [novoHorario, setNovoHorario] = useState({
    dia_semana: "",
    hora_inicio: "",
    hora_fim: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHorario, setSelectedHorario] = useState(null);
  const [loading, setLoading] = useState({ save: false, delete: false, list: true });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const listarHorarios = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/colaboradores/horarios/listar/${colaboradorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setHorarios(data.horarios || []);
      } else {
        setError(data.message || "Erro ao carregar horários");
      }
    } catch (error) {
      setError("Falha na conexão com o servidor");
    } finally {
      setLoading(prev => ({ ...prev, list: false }));
    }
  }, [colaboradorId]);

  useEffect(() => { listarHorarios(); }, [listarHorarios]);

  const handleNovoHorarioChange = (e) => {
    const { name, value } = e.target;
    setNovoHorario(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validarHorario = () => {
    const { dia_semana, hora_inicio, hora_fim } = novoHorario;
    if (!dia_semana || !hora_inicio || !hora_fim) {
      setError("Todos os campos são obrigatórios");
      return false;
    }

    if (hora_inicio >= hora_fim) {
      setError("Hora final deve ser após a hora inicial");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarHorario()) return;

    setLoading(prev => ({ ...prev, save: true }));
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/colaboradores/horarios/configurar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            colaborador_id: colaboradorId,
            horarios: [novoHorario],
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSuccess("Horário configurado com sucesso!");
        listarHorarios();
        setNovoHorario({ dia_semana: "", hora_inicio: "", hora_fim: "" });
        onSave?.();
      } else {
        setError(data.message || "Erro ao salvar horário");
      }
    } catch (error) {
      setError("Erro na comunicação com o servidor");
    } finally {
      setLoading(prev => ({ ...prev, save: false }));
    }
  };

  const confirmDelete = async () => {
    setLoading(prev => ({ ...prev, delete: true }));
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/colaboradores/horarios/remover`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ colaboradorId, horario: selectedHorario }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSuccess("Horário removido com sucesso!");
        listarHorarios();
        setShowDeleteModal(false);
      } else {
        setError(data.message || "Erro ao excluir horário");
      }
    } catch (error) {
      setError("Erro na comunicação com o servidor");
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };


  return (
    <>
      <Modal show onHide={onClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Horários de {colaboradorNome}
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

          <Form onSubmit={handleSubmit} className="mb-4">
            <div className="row g-3">
              <Form.Group className="col-md-4" controlId="diaSemana">
                <Form.Label>Dia da Semana</Form.Label>
                <Form.Control
                  as="select"
                  name="dia_semana"
                  value={novoHorario.dia_semana}
                  onChange={handleNovoHorarioChange}
                  required
                >
                  <option value="">Selecione...</option>
                  {['segunda-feira', 'terca-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sabado', 'domingo']
                    .map(dia => (
                      <option key={dia} value={dia}>
                        {dia.charAt(0).toUpperCase() + dia.slice(1)}
                      </option>
                    ))}
                </Form.Control>
              </Form.Group>

              <Form.Group className="col-md-4" controlId="horaInicio">
                <Form.Label>Hora Inicial</Form.Label>
                <Form.Control
                  type="time"
                  name="hora_inicio"
                  value={novoHorario.hora_inicio}
                  onChange={handleNovoHorarioChange}
                  required
                />
              </Form.Group>

              <Form.Group className="col-md-4" controlId="horaFim">
                <Form.Label>Hora Final</Form.Label>
                <Form.Control
                  type="time"
                  name="hora_fim"
                  value={novoHorario.hora_fim}
                  onChange={handleNovoHorarioChange}
                  required
                />
              </Form.Group>
            </div>

            <div className="d-grid gap-2 d-md-flex justify-content-end mt-4">
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading.save}
              >
                {loading.save ? (
                  <>
                    <Spinner animation="border" size="sm" /> Salvando...
                  </>
                ) : (
                  'Adicionar Horário'
                )}
              </Button>
            </div>
          </Form>

          <h5 className="mb-3">Horários Cadastrados</h5>
          
          {loading.list ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <ListGroup className="mb-4">
              {[...horarios].reverse().map((horario, index) => (
                <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-capitalize">{horario.dia_semana}</span>
                    {': '}
                    {format(parseISO(`1970-01-01T${horario.hora_inicio}`), 'HH:mm')} 
                    {' - '}
                    {format(parseISO(`1970-01-01T${horario.hora_fim}`), 'HH:mm')}
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      setSelectedHorario(horario);
                      setShowDeleteModal(true);
                    }}
                    aria-label={`Excluir horário de ${horario.dia_semana}`}
                  >
                    Excluir
                  </Button>
                </ListGroup.Item>
              ))}
              {horarios.length === 0 && (
                <Alert variant="info" className="mb-0">
                  Nenhum horário cadastrado
                </Alert>
              )}
            </ListGroup>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditarHorarios;