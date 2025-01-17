import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const AgendamentosCalendario = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [filteredAgendamentos, setFilteredAgendamentos] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Função para buscar os agendamentos no backend
  const fetchAgendamentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/agendamentos/listar_agendamentos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setAgendamentos(data);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    }
  };

  // Função para filtrar agendamentos pelo intervalo selecionado
  const filterAgendamentos = () => {
    if (selectedDates.length === 2) {
      const [startDate, endDate] = selectedDates.map((date) => new Date(date).getTime());
      const filtered = agendamentos.filter((agendamento) => {
        const agendamentoDate = new Date(agendamento.data).getTime();
        return agendamentoDate >= startDate && agendamentoDate <= endDate;
      });
      setFilteredAgendamentos(filtered);
    }
  };

  // Manipulador de início do clique
  const handleMouseDown = (date) => {
    setIsDragging(true);
    setSelectedDates([date]);
  };

  // Manipulador de arrastar o mouse
  const handleMouseEnter = (date) => {
    if (isDragging) {
      setSelectedDates((prevDates) => {
        const startDate = prevDates[0];
        return [startDate, date].sort((a, b) => a - b);
      });
    }
  };

  // Manipulador de término do clique
  const handleMouseUp = () => {
    setIsDragging(false);
    filterAgendamentos();
  };

  // Busca inicial dos agendamentos
  useEffect(() => {
    fetchAgendamentos();
  }, []);

  // Adiciona e remove eventos globais para o mouse
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedDates]);

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-secondary text-center">Agendamentos</h2>

      {/* Calendário */}
      <div className="row">
        <div className="col-12 col-md-6">
          <Calendar
            tileClassName={({ date }) => {
              const isSelected =
                selectedDates.length === 2 &&
                date >= selectedDates[0] &&
                date <= selectedDates[1];
              return isSelected ? 'selected-day' : null;
            }}
            onMouseDown={(value) => handleMouseDown(value)}
            onMouseEnter={(value) => handleMouseEnter(value)}
          />
        </div>

        {/* Exibição dos Agendamentos */}
        <div className="col-12 col-md-6">
          <div className="card mt-3">
            <div className="card-body">
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
