import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal } from "react-bootstrap";
import { FaUserMinus } from "react-icons/fa";
import Select from "react-select";

const AdicionarClienteAulaColaborador = ({ showModal, handleClose }) => {
  // Estado para clientes selecionados (multi-select)
  const [clienteIds, setClienteIds] = useState([]);
  // Estado para aulas selecionadas (multi-select)
  const [aulaIds, setAulaIds] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteOptions, setClienteOptions] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [aulaOptions, setAulaOptions] = useState([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const token = localStorage.getItem("token");
  const apiBaseUrl = "http://localhost:5000/";

  useEffect(() => {
    // Função para buscar as aulas
    const fetchAulas = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}pilates/listar_aulas`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok) {
          setAulas(data);
          // Cada aula deve exibir o dia, horário e o nome do instrutor (colaborador)
          const options = data.map((aula) => ({
            value: aula.id_aula,
            label: `${aula.dia_semana} (${aula.hora_inicio} - ${aula.hora_fim}) | Instrutor: ${aula.colaborador && aula.colaborador.nome ? aula.colaborador.nome : "N/D"}`,
          }));
          setAulaOptions(options);
        } else {
          setErro(data.message || "Erro ao carregar as aulas.");
        }
      } catch (err) {
        setErro("Erro ao carregar as aulas.");
      }
    };

    // Função para buscar os clientes
    const fetchClientes = async () => {
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
          setClientes(data);
          const options = data.map((cliente) => ({
            value: cliente.ID_Cliente, // Certifique-se de que o backend retorna 'id_cliente'
            label: cliente.Nome,         // e 'nome'
          }));
          setErro('');
          setSucesso('');
          setClienteOptions(options);
        } else {
          setErro(data.message || "Erro ao carregar os clientes.");          
          setSucesso('');
        }
      } catch (err) {
        setErro("Erro ao carregar os clientes.");
      }
    };

    setErro("");
    setSucesso("");
    fetchAulas();
    fetchClientes();
  }, [token, apiBaseUrl]);

  // Atualiza o array de clientes selecionados (multi-select)
  const handleClienteChange = (selectedOptions) => {
    setClienteIds(selectedOptions ? selectedOptions.map((option) => option.value) : []);
  };

  // Atualiza o array de aulas selecionadas (multi-select)
  const handleAulasChange = (selectedOptions) => {
    setAulaIds(selectedOptions ? selectedOptions.map((option) => option.value) : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Envia os dados com forcarCadastro = false inicialmente
      const bodyData = {
        cliente_id: clienteIds,
        aula_id: aulaIds,
        forcarCadastro: false,
      };

      const response = await fetch(`${apiBaseUrl}pilates/colaborador/adicionar_cliente_aula`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();
      if (response.ok) {
        setSucesso(data.message);
        setClienteIds([]);
        setAulaIds([]);
      } else if (response.status === 409 && data.limitReached) {
        // Se o limite do plano foi atingido, pergunta se deseja continuar mesmo assim
        if (window.confirm(data.message + " Deseja continuar mesmo assim?")) {
          const forceResponse = await fetch(`${apiBaseUrl}pilates/colaborador/adicionar_cliente_aula`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cliente_id: clienteIds,
              aula_id: aulaIds,
              forcarCadastro: true,
            }),
          });
          const forceData = await forceResponse.json();
          if (forceResponse.ok) {
            setSucesso(forceData.message);
            setClienteIds([]);
            setAulaIds([]);
          } else {
            setErro(forceData.message || "Erro ao forçar o cadastro.");
          }
        }
      } else {
        setErro(data.message || "Erro ao adicionar cliente à(s) aula(s).");
      }
    } catch (err) {
      setErro("Erro na requisição.");
    }
  };

  return (
    <Modal show={showModal} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Adicionar Cliente à Aula(s)</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {erro && <p className="alert alert-danger">{erro}</p>}
        {sucesso && <p className="alert alert-success">{sucesso}</p>}
        <form onSubmit={handleSubmit}>
          {/* Seleção de Clientes */}
          <div className="form-group mb-3">
            <label>Selecione o(s) Cliente(s):</label>
            <Select
              isMulti
              value={clienteOptions.filter((option) => clienteIds.includes(option.value))}
              onChange={handleClienteChange}
              options={clienteOptions}
              placeholder="Pesquise e selecione um ou mais clientes"
              isClearable
              required
            />
          </div>
          {/* Seleção de Aulas (permite múltipla seleção) */}
          <div className="form-group mb-3">
            <label>Selecione a(s) Aula(s):</label>
            <Select
              isMulti
              value={aulaOptions.filter((option) => aulaIds.includes(option.value))}
              onChange={handleAulasChange}
              options={aulaOptions}
              placeholder="Selecione uma ou mais aulas"
              required
            />
          </div>
          <button type="submit" className="btn btn-login btn-sm">
            <i className="bi bi-person-plus"></i> Adicionar Cliente à(s) Aula(s)
          </button>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default AdicionarClienteAulaColaborador;
