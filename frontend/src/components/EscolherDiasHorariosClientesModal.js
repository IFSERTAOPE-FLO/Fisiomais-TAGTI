import React, { useState, useEffect } from 'react';
import { Modal, Button, InputGroup, FormControl } from 'react-bootstrap';

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

  const [diasUteis, setDiasUteis] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [diasConfig, setDiasConfig] = useState({});

  // Sincroniza diasConfig com selectedDays
  useEffect(() => {
    const newConfig = { ...diasConfig };
    
    // Remove dias não selecionados
    Object.keys(newConfig).forEach(dia => {
      if (!selectedDays.includes(dia)) {
        delete newConfig[dia];
      }
    });

    // Adiciona novos dias com configuração padrão
    selectedDays.forEach(dia => {
      if (!newConfig[dia]) {
        newConfig[dia] = { periodos: [], inicio: '', fim: '' };
      }
    });

    setDiasConfig(newConfig);
  }, [selectedDays]);

  const handlePeriodoChange = (dia, periodo) => {
    setDiasConfig(prev => {
      const diaAtual = prev[dia] || { periodos: [], inicio: '', fim: '' };
      const novosPeriodos = diaAtual.periodos.includes(periodo)
        ? diaAtual.periodos.filter(p => p !== periodo)
        : [...diaAtual.periodos, periodo];

      return {
        ...prev,
        [dia]: { ...diaAtual, periodos: novosPeriodos }
      };
    });
  };

  const handleHorarioChange = (dia, tipo, valor) => {
    setDiasConfig(prev => ({
      ...prev,
      [dia]: { ...prev[dia], [tipo]: valor }
    }));
  };

  const handleSubmit = () => {
    const diasHorariosTexto = Object.entries(diasConfig)
      .map(([dia, { periodos, inicio, fim }]) => {
        if (periodos.length === 3) {
          return `${dia}: qualquer horário`;
        } else if (periodos.length > 0) {
          const horarios = 
            (inicio && fim) ? ` (${inicio} às ${fim})` :
            inicio ? ` (a partir das ${inicio})` :
            fim ? ` (até ${fim})` : '';
          return `${dia}: ${periodos.join(', ')}${horarios}`;
        }
        return `${dia}: a partir das ${inicio || '00:00'} até ${fim || '00:00'}`;
      })
      .join(', ');
  
    // Passa o texto para o componente pai
    onSubmit(diasHorariosTexto);     
    // Limpa a configuração do modal e fecha ele
    setDiasConfig({});
    setSelectedDays([]);
    onHide(); // Fecha o modal
  };
  

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Sugestão de horários (Não obrigatório)</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              checked={diasUteis}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setDiasUteis(isChecked);
                setSelectedDays(isChecked ? [
                  'Segunda-feira',
                  'Terça-feira',
                  'Quarta-feira',
                  'Quinta-feira',
                  'Sexta-feira'
                ] : []);
              }}
              id="diasUteisCheckbox"
            />
            <label className="form-check-label text-primary" htmlFor="diasUteisCheckbox">
              Dias Úteis (Segunda a Sexta)
            </label>
          </div>

          {!diasUteis && (
            <div className="mb-4">
              <label className="form-label">Selecione os dias:</label>
              <select
                className="form-select"
                multiple
                value={selectedDays}
                onChange={(e) => setSelectedDays(Array.from(e.target.selectedOptions).map(opt => opt.value))}
                style={{ minHeight: '150px' }}
              >
                {diasSemana.map((dia, index) => (
                  <option key={index} value={dia}>{dia}</option>
                ))}
              </select>
            </div>
          )}

          <h5 className="mb-3">Configurar horários:</h5>
          <div className="d-flex flex-column gap-2">
            {selectedDays.map(dia => (
              <div key={dia} className="d-flex flex-column border rounded p-2">
                <div className="d-flex justify-content-between align-items-center">
                  <strong className="text-primary">{dia}</strong>
                  <div className="d-flex gap-2">
                    {['manhã', 'tarde', 'noite'].map(periodo => (
                      <Button
                        key={periodo}
                        variant={diasConfig[dia]?.periodos?.includes(periodo) ? 'primary' : 'outline-primary'}
                        size="sm"
                        onClick={() => handlePeriodoChange(dia, periodo)}
                      >
                        {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2 mt-2">
                  <InputGroup size="sm" className="w-auto">
                    <InputGroup.Text>Início</InputGroup.Text>
                    <FormControl
                      type="time"
                      value={diasConfig[dia]?.inicio || ''}
                      onChange={(e) => handleHorarioChange(dia, 'inicio', e.target.value)}
                      disabled={diasConfig[dia]?.periodos.length === 3}
                    />
                  </InputGroup>
                  
                  <InputGroup size="sm" className="w-auto">
                    <InputGroup.Text>Fim</InputGroup.Text>
                    <FormControl
                      type="time"
                      value={diasConfig[dia]?.fim || ''}
                      onChange={(e) => handleHorarioChange(dia, 'fim', e.target.value)}
                      disabled={diasConfig[dia]?.periodos.length === 3}
                    />
                  </InputGroup>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fechar
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Confirmar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EscolherDiasHorariosClientesModal;