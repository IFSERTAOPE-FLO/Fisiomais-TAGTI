import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form } from "react-bootstrap";
import Select from "react-select";

const VincularAlunoPlano = ({ showModal, handleClose }) => {
  const [alunos, setAlunos] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [alunoOptions, setAlunoOptions] = useState([]);
  const [planoOptions, setPlanoOptions] = useState([]);
  const [alunoIds, setAlunoIds] = useState([]);
  const [planoIds, setPlanoIds] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");
  const apiBaseUrl = "http://localhost:5000/";

  // Busca os alunos e popula as opções do select
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
          setAlunoOptions(data.map((aluno) => ({
            value: aluno.ID_Cliente, // ajuste conforme sua API
            label: aluno.Nome,       // ajuste conforme sua API
          })));
        } else {
          setError(data.message || "Erro ao carregar os alunos.");
        }
      } catch (err) {
        setError("Erro ao carregar os alunos.");
      }
    };

    fetchAlunos();
  }, [apiBaseUrl, token]);

  // Busca os planos (através dos serviços) e popula as opções do select
  useEffect(() => {
    const fetchPlanos = async () => {
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
          // Extrai os planos dos serviços retornados
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
          setPlanos(planosExtraidos);
          setPlanoOptions(planosExtraidos);
        } else {
          setError(data.message || "Erro ao carregar os planos.");
        }
      } catch (err) {
        setError("Erro ao carregar os planos.");
      }
    };

    fetchPlanos();
  }, [apiBaseUrl, token]);

  // Atualiza o array de alunos selecionados (multi-select)
  const handleAlunoChange = (selectedOptions) => {
    setAlunoIds(selectedOptions ? selectedOptions.map(option => option.value) : []);
  };

  // Atualiza o array de planos selecionados (multi-select)
  const handlePlanoChange = (selectedOptions) => {
    setPlanoIds(selectedOptions ? selectedOptions.map(option => option.value) : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (alunoIds.length === 0 || planoIds.length === 0) {
      setError("Selecione pelo menos um aluno e um plano.");
      return;
    }

    try {
      // Envia os dados com forcarVinculo = false inicialmente
      const bodyData = {
        aluno_id: alunoIds,
        plano_id: planoIds,
        forcarVinculo: false,
      };

      const response = await fetch(`${apiBaseUrl}pilates/colaborador/vincular_plano_aluno`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message);
        setAlunoIds([]);
        setPlanoIds([]);
      } else if (response.status === 409 && data.limitReached) {
        // Se algum aluno já tiver um plano vinculado, pergunta se deseja sobrescrever
        if (window.confirm(data.message + " Deseja continuar mesmo assim?")) {
          const forceResponse = await fetch(`${apiBaseUrl}pilates/colaborador/vincular_plano_aluno`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              aluno_id: alunoIds,
              plano_id: planoIds,
              forcarVinculo: true,
            }),
          });
          const forceData = await forceResponse.json();
          if (forceResponse.ok) {
            setSuccess(forceData.message);
            setAlunoIds([]);
            setPlanoIds([]);
          } else {
            setError(forceData.message || "Erro ao forçar o vínculo.");
          }
        }
      } else {
        setError(data.message || "Erro ao vincular o plano aos alunos.");
      }
    } catch (err) {
      setError("Erro na requisição.");
    }
  };

  return (
    <Modal show={showModal} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Vincular Plano aos Alunos</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Selecione os Alunos</Form.Label>
            <Select
              isMulti
              options={alunoOptions}
              onChange={handleAlunoChange}
              placeholder="Pesquise e selecione um ou mais alunos"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Selecione os Planos</Form.Label>
            <Select
              isMulti
              options={planoOptions}
              onChange={handlePlanoChange}
              placeholder="Selecione um ou mais planos (será usado o primeiro selecionado)"
            />
          </Form.Group>
          <Button className="btn btn-login" type="submit">
            Vincular
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default VincularAlunoPlano;
