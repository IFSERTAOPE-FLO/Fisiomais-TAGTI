import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';
import { Form, Button } from 'react-bootstrap';
import { FaClipboardList, FaClipboardCheck, FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const apiBaseUrl = "http://localhost:5000/";

const IniciarPlanoTratamento = ({ idCliente, onSelectPlano }) => {
  const [planos, setPlanos] = useState([]);
  const [selectedPlano, setSelectedPlano] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    // Buscar os planos de tratamento
    axios
      .get(`${apiBaseUrl}planos_de_tratamento/`, { headers })
      .then(response => setPlanos(response.data))
      .catch(error => console.error('Erro ao buscar planos', error));
  }, [headers]);

  // Mapeia os planos para o formato aceito pelo react-select
  const options = planos.map(plano => ({
    value: plano,
    label: plano.diagnostico
  }));

  const handleSelect = (option) => {
    const plano = option ? option.value : null;
    setSelectedPlano(plano);
    if (plano && onSelectPlano) {
      onSelectPlano(plano.id_plano_tratamento);
    }
  };

  return (
    <div className="border rounded shadow-sm bg-white p-3">
      {/* Cabeçalho com título e botão para adicionar diagnóstico */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="text-secondary d-flex align-items-center mb-0">
          <FaClipboardCheck className="me-2" /> Diagnóstico:
        </h6>
        <Link to="/adminPage">
          <Button variant="outline-primary" size="sm">
            <FaPlus className="me-1" /> Adicionar Diagnóstico
          </Button>
        </Link>
      </div>

      {/* Select pesquisável */}
      <Form.Group className="mb-3">
        <Select
          options={options}
          onChange={handleSelect}
          placeholder="Selecione ou pesquise um diagnóstico..."
          isClearable
        />
      </Form.Group>

      {/* Detalhes do plano selecionado */}
      {selectedPlano && (
        <div className="mt-3 p-2 border border-primary rounded bg-light">
          <h6 className="text-primary d-flex align-items-center mb-2">
            <FaClipboardList className="me-2" /> Protocolo Selecionado
          </h6>
          <div className="small">
            <p className="mb-1">
              <strong>Metodologia:</strong> {selectedPlano.metodologia}
            </p>
            <p className="mb-1">
              <strong>Valor Total:</strong> R$ {selectedPlano.valor?.toFixed(2)}
            </p>
            <p className="mb-1">
              <strong>Duração:</strong> {selectedPlano.duracao_prevista} semanas
            </p>
            {selectedPlano.servicos && selectedPlano.servicos.length > 0 && (
              <div>
                <strong>Serviços:</strong>
                <ul className="list-unstyled mb-0">
                  {selectedPlano.servicos.map(servico => (
                    <li key={servico.id_servico} className="small">
                      {servico.nome} (Sessões: {servico.quantidade_sessoes})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IniciarPlanoTratamento;
