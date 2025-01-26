import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Form } from "react-bootstrap";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Controle do modal de exclusão
  const [selectedHorario, setSelectedHorario] = useState(null); // Horário selecionado para exclusão

  // Função para listar os horários existentes do colaborador (novo)
  const listarHorarios = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/colaboradores/horarios/listar/${colaboradorId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setHorarios(data.horarios || []);
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      alert("Erro ao listar os horários");
    }
  }, [colaboradorId]); // Depende apenas de colaboradorId

  useEffect(() => {
    listarHorarios();
  }, [listarHorarios]);

  /* FUNÇÃO ANTERIOR

  const listarHorarios = async () => {
    try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `http://localhost:5000/colaboradores/horarios/listar/${colaboradorId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    const data = await response.json();
    if (response.ok) {
      setHorarios(data.horarios || []);
    } else {
      alert(`Erro: ${data.message}`);
    }
  } catch (error) {
    alert("Erro ao listar os horários");
  }
};

useEffect(() => {
  listarHorarios();
}, [colaboradorId]);

*/

  // Função para lidar com a alteração dos dados de um horário
  const handleNovoHorarioChange = (e) => {
    const { name, value } = e.target;
    setNovoHorario((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    const { dia_semana, hora_inicio, hora_fim } = novoHorario;

    if (!dia_semana || !hora_inicio || !hora_fim) {
      alert("Todos os campos devem ser preenchidos.");
      return;
    }

    const horarioExistente = horarios.find(
      (horario) =>
        horario.dia_semana === dia_semana &&
        horario.hora_inicio === hora_inicio &&
        horario.hora_fim === hora_fim
    );

    if (horarioExistente) {
      alert("Este horário já está configurado.");
      return;
    }

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
        alert("Horário configurado com sucesso!");
        listarHorarios(); // Atualiza a lista de horários
        setNovoHorario({ dia_semana: "", hora_inicio: "", hora_fim: "" }); // Limpa os campos

        if (onSave) {
          onSave();
        }
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      alert("Erro ao configurar o horário");
    }
  };

  // Função para abrir o modal de exclusão
  const handleDeleteClick = (horario) => {
    setSelectedHorario(horario); // Define o horário selecionado
    setShowDeleteModal(true); // Mostra o modal de exclusão
  };

  // Função para confirmar a exclusão
  const confirmDelete = async () => {
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
          body: JSON.stringify({
            colaboradorId,
            horario: selectedHorario,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("Horário excluído com sucesso!");
        listarHorarios(); // Atualiza a lista de horários
        setShowDeleteModal(false); // Fecha o modal de exclusão
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.log(error);
      alert("Erro ao excluir o horário");
    }
  };

  return (
    <>
      <Modal show onHide={onClose}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Horários de {colaboradorNome}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Horários Atuais:</h5>
          {horarios.length > 0 ? (
            <ul className="list-group">
              {horarios.map((horario, index) => (
                <li
                  key={index}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>{`${horario.dia_semana
                    .charAt(0)
                    .toUpperCase()}${horario.dia_semana.slice(1)} - ${
                    horario.hora_inicio
                  } às ${horario.hora_fim}`}</span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      handleDeleteClick({
                        dia_semana: horario.dia_semana,
                        hora_inicio: horario.hora_inicio,
                        hora_fim: horario.hora_fim,
                      })
                    }
                  >
                    Excluir
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">Nenhum horário configurado.</p>
          )}

          <Form>
            <Form.Group controlId="formDiaSemana">
              <Form.Label>Dia da Semana</Form.Label>
              <Form.Control
                as="select"
                name="dia_semana"
                value={novoHorario.dia_semana}
                onChange={handleNovoHorarioChange}
              >
                <option value="">Selecione o dia</option>
                <option value="segunda-feira">Segunda-feira</option>
                <option value="terca-feira">Terça-feira</option>
                <option value="quarta-feira">Quarta-feira</option>
                <option value="quinta-feira">Quinta-feira</option>
                <option value="sexta-feira">Sexta-feira</option>
                <option value="sabado">Sábado</option>
                <option value="domingo">Domingo</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formHoraInicio">
              <Form.Label>Hora Início</Form.Label>
              <Form.Control
                type="time"
                name="hora_inicio"
                value={novoHorario.hora_inicio}
                onChange={handleNovoHorarioChange}
              />
            </Form.Group>

            <Form.Group controlId="formHoraFim">
              <Form.Label>Hora Fim</Form.Label>
              <Form.Control
                type="time"
                name="hora_fim"
                value={novoHorario.hora_fim}
                onChange={handleNovoHorarioChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Salvar horário
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de exclusão */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Você realmente deseja excluir esse horário?</p>
          {selectedHorario && (
            <p>
              <strong>{selectedHorario.dia_semana}</strong>, das{" "}
              <strong>{selectedHorario.hora_inicio}</strong> às{" "}
              <strong>{selectedHorario.hora_fim}</strong>
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditarHorarios;
