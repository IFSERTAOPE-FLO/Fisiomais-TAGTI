import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const AgendamentosCalendario = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [filteredAgendamentos, setFilteredAgendamentos] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Função para buscar os agendamentos no backend
  const fetchAgendamentos = async () => {
    try {
      if (startDate && endDate) {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:5000/agendamentos/listar_agendamentos_calendario?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setFilteredAgendamentos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    }
  };

  // Manipulador de início do clique
  const handleMouseDown = (date) => {
    setIsDragging(true);
    setStartDate(date.toISOString().split('T')[0]);
    setEndDate(null); // Limpa a data final anterior
  };

  // Manipulador de arrastar o mouse
  const handleMouseEnter = (date) => {
    if (isDragging) {
      setEndDate(date.toISOString().split('T')[0]);
    }
  };

  // Manipulador de término do clique
  const handleMouseUp = () => {
    setIsDragging(false);
    fetchAgendamentos();
  };

  // Adiciona e remove eventos globais para o mouse
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [startDate, endDate]);

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-secondary text-center">Agendamentos</h2>

      {/* Calendário */}
      <div className="row">
        <div className="col-12 col-md-6">
          <Calendar
            tileClassName={({ date }) => {
              const tileDate = date.toISOString().split('T')[0];
              return startDate && endDate && tileDate >= startDate && tileDate <= endDate
                ? 'selected-day'
                : null;
            }}
            onMouseDown={(value) => handleMouseDown(value)}
            onMouseEnter={(value) => handleMouseEnter(value)}
          />
        </div>

        {/* Exibição dos Agendamentos */}
        <div className="col-12 col-md-6">
          <div className="card mt-3">
            <div className="card-body">
              <p><strong>Período selecionado:</strong> {startDate} - {endDate || 'Selecionando...'}</p>
              {filteredAgendamentos.length > 0 ? (
                filteredAgendamentos.map((agendamento) => (
                  <div key={agendamento.id} className="mb-3">
                    <h5 className="card-title">Agendamento de {agendamento.cliente}</h5>
                    <p><strong>Serviço:</strong> {agendamento.servico}</p>
                    <p><strong>Data:</strong> {agendamento.data}</p>
                    <p><strong>Hora:</strong> {agendamento.hora}</p>
                  </div>
                ))
              ) : (
                <p className="alert alert-info">Nenhum agendamento para o período selecionado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendamentosCalendario;
