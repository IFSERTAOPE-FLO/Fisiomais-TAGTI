import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form } from "react-bootstrap";
import Select from "react-select";

const VincularAlunoPlano = ({ showModal, handleClose }) => {
  const [alunos, setAlunos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [alunoOptions, setAlunoOptions] = useState([]);
  const [planoOptions, setPlanoOptions] = useState([]);
  const [alunoId, setAlunoId] = useState(null);
  const [planoId, setPlanoId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");
  const apiBaseUrl = "http://localhost:5000/";

  // Busca a lista de alunos e popula o select
  useEffect(() => {
    const fetchAlunos = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}clientes/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok) {
          setAlunos(data);
          setAlunoOptions(
            data.map((aluno) => ({
              value: aluno.ID_Cliente, // ajuste conforme o nome do campo da sua API
              label: aluno.Nome,
            }))
          );
        } else {
          setError(data.message || "Erro ao carregar os alunos.");
        }
      } catch (err) {
        setError("Erro ao carregar os alunos.");
      }
    };

    fetchAlunos();
  }, [apiBaseUrl, token]);

  useEffect(() => {
    const fetchServicosEPlanos = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}servicos/listar_todos_servicos`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok) {
          setServicos(data);
          const planosExtraidos = [];

          data.forEach((servico) => {
            if (servico.Planos) {
              servico.Planos.forEach((plano) => {
                planosExtraidos.push({
                  value: plano.ID_Plano,
                  label: `${plano.Nome_plano} - ${plano.Quantidade_Aulas_Por_Semana} aulas semanais - R$ ${plano.Valor}`,
                });
              });
            }
          });

          setPlanoOptions(planosExtraidos);
        } else {
          setError(data.message || "Erro ao carregar serviços e planos.");
        }
      } catch (err) {
        setError("Erro ao carregar serviços e planos.");
      }
    };

    fetchServicosEPlanos();
  }, [apiBaseUrl, token]);



  // Atualiza o estado quando um aluno é selecionado
  const handleAlunoChange = (selectedOption) => {
    setAlunoId(selectedOption ? selectedOption.value : null);
  };

  // Atualiza o estado quando um plano é selecionado
  const handlePlanoChange = (selectedOption) => {
    setPlanoId(selectedOption ? selectedOption.value : null);
  };

  // Envio do formulário para vincular o aluno ao plano
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!alunoId || !planoId) {
      setError("Selecione um aluno e um plano.");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}pilates/colaborador/vincular_plano_aluno`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aluno_id: alunoId,
          plano_id: planoId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Plano vinculado ao aluno com sucesso!");
      } else {
        setError(data.message || "Erro ao vincular o plano ao aluno.");
      }
    } catch (err) {
      setError("Erro na requisição.");
    }
  };

  return (
    <Modal show={showModal} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Vincular Plano ao Aluno</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Selecione o Aluno</Form.Label>
            <Select
              options={alunoOptions}
              onChange={handleAlunoChange}
              placeholder="Pesquise e selecione um aluno"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Selecione o Plano</Form.Label>
            <Select
              options={planoOptions}
              onChange={handlePlanoChange}
              placeholder="Pesquise e selecione um plano"
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-end">
        <Button className="btn btn-signup" type="submit" onClick={handleSubmit}>
          Vincular
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VincularAlunoPlano;
