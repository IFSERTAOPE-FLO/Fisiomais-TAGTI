import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Button,
  Form,
  Alert,
  Spinner,
  ListGroup,
  Dropdown,
} from "react-bootstrap";
import { format, parseISO } from "date-fns";

const EditarHorarios = ({
  colaboradorId,
  colaboradorNome,
  onClose,
  onSave,
}) => {
  const [horarios, setHorarios] = useState([]);
  const [novoHorarios, setNovoHorarios] = useState([]);
  const [selectedHorarios, setSelectedHorarios] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState({
    save: false,
    delete: false,
    list: true,
    bulkDelete: false,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados para o modal de preenchimento de horários
  const [fillHoraInicio, setFillHoraInicio] = useState("");
  const [fillHoraFim, setFillHoraFim] = useState("");
  const [showFillModal, setShowFillModal] = useState(false);

  // Lista de dias com a formatação exibida no front-end
  const diasSemana = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
  ];

  // Função para normalizar o nome do dia (removendo acentos e forçando minúsculo)
  const normalizeDay = (dia) => {
    return dia.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

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
      setLoading((prev) => ({ ...prev, list: false }));
    }
  }, [colaboradorId]);

  useEffect(() => {
    listarHorarios();
  }, [listarHorarios]);

  const handleNovoHorarioChange = (index, field, value) => {
    const updated = [...novoHorarios];
    updated[index] = { ...updated[index], [field]: value };
    setNovoHorarios(updated);
    setError(null);
  };

  const validarHorarios = () => {
    for (const horario of novoHorarios) {
      if (!horario.dia_semana || !horario.hora_inicio || !horario.hora_fim) {
        setError("Todos os campos são obrigatórios");
        return false;
      }
      if (horario.hora_inicio >= horario.hora_fim) {
        setError("Hora final deve ser após a hora inicial");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarHorarios()) return;

    setLoading((prev) => ({ ...prev, save: true }));

    try {
      const token = localStorage.getItem("token");

      // Mapeia os horários para normalizar o nome do dia antes de enviar para o backend
      const horariosEnvio = novoHorarios.map((horario) => ({
        ...horario,
        dia_semana: normalizeDay(horario.dia_semana),
      }));

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
            horarios: horariosEnvio,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSuccess("Horários configurados com sucesso!");
        listarHorarios();
        setNovoHorarios([]);
        onSave?.();
      } else {
        setError(data.message || "Erro ao salvar horários");
      }
    } catch (error) {
      setError("Erro na comunicação com o servidor");
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const handleBulkDelete = async () => {
    setLoading((prev) => ({ ...prev, bulkDelete: true }));

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/colaboradores/horarios/remover",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            colaboradorId,
            horarios: selectedHorarios,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSuccess("Horários removidos com sucesso!");
        listarHorarios();
        setSelectedHorarios([]);
        setShowDeleteModal(false);
      } else {
        setError(data.message || "Erro ao excluir horários");
      }
    } catch (error) {
      setError("Erro na comunicação com o servidor");
    } finally {
      setLoading((prev) => ({ ...prev, bulkDelete: false }));
    }
  };

  const adicionarHorariosParaTodosOsDias = () => {
    const novos = diasSemana.map((dia) => ({
      dia_semana: dia,
      hora_inicio: "",
      hora_fim: "",
    }));
    setNovoHorarios((prev) => [...prev, ...novos]);
  };

  const preencherTodosHorarios = (hora_inicio, hora_fim) => {
    const updated = novoHorarios.map((horario) => ({
      ...horario,
      hora_inicio,
      hora_fim,
    }));
    setNovoHorarios(updated);
  };

  const toggleSelectAll = () => {
    if (selectedHorarios.length === horarios.length) {
      setSelectedHorarios([]);
    } else {
      setSelectedHorarios([...horarios]);
    }
  };

  return (
    <>
      <Modal show onHide={onClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Horários de {colaboradorNome}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              variant="success"
              dismissible
              onClose={() => setSuccess(null)}
            >
              {success}
            </Alert>
          )}

          <div className="d-flex gap-2 mb-3">
            <Dropdown>
              <Dropdown.Toggle variant="primary">
                Adicionar Horário
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item
                  onClick={() =>
                    setNovoHorarios([
                      ...novoHorarios,
                      { dia_semana: "", hora_inicio: "", hora_fim: "" },
                    ])
                  }
                >
                  Novo horário único
                </Dropdown.Item>
                <Dropdown.Item onClick={adicionarHorariosParaTodosOsDias}>
                  Novo horário semanal
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {novoHorarios.map((horario, index) => (
            <div key={index} className="d-flex gap-2 mb-3">
              <Form.Select
                value={horario.dia_semana}
                onChange={(e) =>
                  handleNovoHorarioChange(index, "dia_semana", e.target.value)
                }
                className="flex-grow-1"
              >
                <option value="">Selecione o dia</option>
                {diasSemana.map((dia) => (
                  <option key={dia} value={dia}>
                    {dia}
                  </option>
                ))}
              </Form.Select>
              <Form.Control
                type="time"
                value={horario.hora_inicio}
                onChange={(e) =>
                  handleNovoHorarioChange(index, "hora_inicio", e.target.value)
                }
              />
              <Form.Control
                type="time"
                value={horario.hora_fim}
                onChange={(e) =>
                  handleNovoHorarioChange(index, "hora_fim", e.target.value)
                }
              />
              <Button
                variant="outline-danger"
                onClick={() =>
                  setNovoHorarios(novoHorarios.filter((_, i) => i !== index))
                }
              >
                ×
              </Button>
            </div>
          ))}

          {novoHorarios.length > 0 && (
            <div className="d-flex justify-content-between mt-3">
              <div>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setFillHoraInicio("");
                    setFillHoraFim("");
                    setShowFillModal(true);
                  }}
                >
                  Preencher horários (Todos)
                </Button>
              </div>
              <div className="d-flex gap-2">
                <Button
                  variant="success"
                  onClick={handleSubmit}
                  disabled={loading.save}
                >
                  {loading.save ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "Salvar Todos"
                  )}
                </Button>
                <Button variant="danger" onClick={() => setNovoHorarios([])}>
                  Cancelar Todos
                </Button>
              </div>
            </div>
          )}

          <h5 className="mt-4 mb-3">Horários Cadastrados</h5>

          {loading.list ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <ListGroup className="mb-4">
              {horarios.length > 0 && (
                <ListGroup.Item className="d-flex align-items-center">
                  <Form.Check
                    className="me-3"
                    checked={selectedHorarios.length === horarios.length}
                    onChange={toggleSelectAll}
                  />
                  <strong>Marcar Todos</strong>
                </ListGroup.Item>
              )}

              {diasSemana.map((dia) => {
                const horariosDoDia = horarios.filter(
                  (h) => h.dia_semana === dia
                );
                if (horariosDoDia.length === 0) return null;

                return (
                  <React.Fragment key={dia}>
                    <ListGroup.Item className="fw-bold bg-light">
                      {dia}
                    </ListGroup.Item>

                    {horariosDoDia.map((horario, index) => (
                      <ListGroup.Item
                        key={`${dia}-${index}`}
                        className="d-flex align-items-center"
                      >
                        <Form.Check
                          className="me-3"
                          checked={selectedHorarios.some(
                            (h) => JSON.stringify(h) === JSON.stringify(horario)
                          )}
                          onChange={() =>
                            setSelectedHorarios((prev) =>
                              prev.some(
                                (h) =>
                                  JSON.stringify(h) === JSON.stringify(horario)
                              )
                                ? prev.filter(
                                    (h) =>
                                      JSON.stringify(h) !==
                                      JSON.stringify(horario)
                                  )
                                : [...prev, horario]
                            )
                          }
                        />
                        <div className="flex-grow-1">
                          {format(
                            parseISO(`1970-01-01T${horario.hora_inicio}`),
                            "HH:mm"
                          )}
                          {" às "}
                          {format(
                            parseISO(`1970-01-01T${horario.hora_fim}`),
                            "HH:mm"
                          )}
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setSelectedHorarios([horario]);
                            setShowDeleteModal(true);
                          }}
                        >
                          Excluir
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </React.Fragment>
                );
              })}

              {horarios.length === 0 && (
                <Alert variant="info" className="mb-0">
                  Nenhum horário cadastrado
                </Alert>
              )}
            </ListGroup>
          )}
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between">
          <div>
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              disabled={selectedHorarios.length === 0 || loading.bulkDelete}
            >
              {loading.bulkDelete ? (
                <Spinner animation="border" size="sm" />
              ) : (
                `Excluir Seleção (${selectedHorarios.length})`
              )}
            </Button>
          </div>
          <div>
            <Button variant="secondary" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmação para exclusão única */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja excluir este horário?
          {selectedHorarios[0] && (
            <div className="mt-2">
              <strong>{selectedHorarios[0].dia_semana}</strong>
              <br />
              {format(
                parseISO(`1970-01-01T${selectedHorarios[0].hora_inicio}`),
                "HH:mm"
              )}{" "}
              -{" "}
              {format(
                parseISO(`1970-01-01T${selectedHorarios[0].hora_fim}`),
                "HH:mm"
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleBulkDelete}>
            Confirmar Exclusão
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para escolha de horário antes de preencher todos */}
      <Modal
        show={showFillModal}
        onHide={() => setShowFillModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Escolha o Horário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="fillHoraInicio" className="mb-3">
              <Form.Label>Hora Início</Form.Label>
              <Form.Control
                type="time"
                value={fillHoraInicio}
                onChange={(e) => setFillHoraInicio(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="fillHoraFim">
              <Form.Label>Hora Fim</Form.Label>
              <Form.Control
                type="time"
                value={fillHoraFim}
                onChange={(e) => setFillHoraFim(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFillModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => {
              preencherTodosHorarios(fillHoraInicio, fillHoraFim);
              setShowFillModal(false);
            }}
          >
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditarHorarios;
