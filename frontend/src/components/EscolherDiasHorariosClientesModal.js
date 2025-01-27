import React, { useState } from 'react';
import { Modal, Button, FormCheck, InputGroup, FormControl } from 'react-bootstrap';

const EscolherDiasHorariosClientesModal = ({ show, onHide, onSubmit }) => {
  const diasSemana = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo',
  ];

  const [diasSelecionados, setDiasSelecionados] = useState({});

  const handleDiaChange = (dia) => {
    setDiasSelecionados((prevState) => {
      const isDiaSelecionado = prevState[dia];
      if (isDiaSelecionado) {
        const { [dia]: _, ...rest } = prevState; // Remove o dia do estado
        return rest;
      }
      return { ...prevState, [dia]: { periodos: [], inicio: '', fim: '' } };
    });
  };

  const handlePeriodoChange = (dia, periodo) => {
    setDiasSelecionados((prevState) => {
      const diaAtual = prevState[dia] || { periodos: [], inicio: '', fim: '' };

      // Adicionar ou remover o período selecionado
      const novosPeriodos = diaAtual.periodos.includes(periodo)
        ? diaAtual.periodos.filter((p) => p !== periodo)
        : [...diaAtual.periodos, periodo];

      return {
        ...prevState,
        [dia]: { ...diaAtual, periodos: novosPeriodos },
      };
    });
  };

  const handleHorarioChange = (dia, tipo, valor) => {
    setDiasSelecionados((prevState) => ({
      ...prevState,
      [dia]: { ...prevState[dia], [tipo]: valor },
    }));
  };

  const handleSubmit = () => {
    const diasHorariosTexto = Object.entries(diasSelecionados)
      .map(([dia, { periodos, inicio, fim }]) => {
        if (periodos.length === 3) {
          return `${dia}: qualquer horário`;
        } else if (periodos.length > 0) {
          const horarios =
            (inicio && fim)
              ? ` (${inicio} às ${fim})`
              : (inicio ? ` (a partir das ${inicio})` : fim ? ` (até ${fim})` : '');
          return `${dia}: ${periodos.join(', ')}${horarios}`;
        }
        return `${dia}: a partir das ${inicio || '00:00'} até ${fim || '00:00'}`;
      })
      .join(', ');
  
    onSubmit(diasHorariosTexto);
    setDiasSelecionados({});
    onHide();
  };
  

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Escolha conforme sua disponibilidade</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>
          <h5 className="mb-3">Selecione os dias e horários ou períodos:</h5>
          <div className="d-flex flex-column gap-2">
            {diasSemana.map((dia) => (
              <div key={dia} className="d-flex flex-column border rounded p-2">
                <div className="d-flex justify-content-between align-items-center">
                  <FormCheck
                    type="checkbox"
                    id={dia}
                    label={<strong className="text-primary">{dia}</strong>}
                    checked={!!diasSelecionados[dia]}
                    onChange={() => handleDiaChange(dia)}
                    className="mb-2"
                  />
                  {diasSelecionados[dia] && (
                    <div className="d-flex gap-2">
                      {/* Botões para períodos */}
                      {['manhã', 'tarde', 'noite'].map((periodo) => (
                        <Button
                          key={periodo}
                          variant={
                            diasSelecionados[dia]?.periodos?.includes(periodo)
                              ? 'primary'
                              : 'outline-primary'
                          }
                          size="sm"
                          onClick={() => handlePeriodoChange(dia, periodo)}
                        >
                          {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                {diasSelecionados[dia] && (
                  <>
                    {/* Campo de horário de início */}
                    <div className="d-flex align-items-center gap-2 mt-2 relogioclientes">
                      <InputGroup size="sm" className="w-auto ms-auto">
                        <InputGroup.Text>Início</InputGroup.Text>
                        <FormControl
                          type="time"
                          value={diasSelecionados[dia]?.inicio || ''}
                          onChange={(e) => handleHorarioChange(dia, 'inicio', e.target.value)}
                          disabled={diasSelecionados[dia]?.periodos.length === 3}
                        />
                      </InputGroup>
                      <InputGroup size="sm" className="w-auto ms-auto">
                        <InputGroup.Text>Fim</InputGroup.Text>
                        <FormControl
                          type="time"
                          value={diasSelecionados[dia]?.fim || ''}
                          onChange={(e) => handleHorarioChange(dia, 'fim', e.target.value)}
                          disabled={diasSelecionados[dia]?.periodos.length === 3}
                        />
                      </InputGroup> 
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onHide}
          className="py-1 px-3"
          style={{ fontSize: '0.9rem' }}
        >
          Fechar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          className="py-1 px-3"
          style={{ fontSize: '0.9rem' }}
        >
          Confirmar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EscolherDiasHorariosClientesModal;
