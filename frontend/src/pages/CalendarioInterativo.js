import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import "../css/fullcalendar.css";
import ptLocale from "@fullcalendar/core/locales/pt-br";
import { Modal, Button, Form } from "react-bootstrap"; // Importando os componentes do react-bootstrap

const CalendarioInterativo = () => {
  const [eventos, setEventos] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [showModal, setShowModal] = useState(false); // Controla a exibição do modal
  const [novoHorario, setNovoHorario] = useState(""); // Armazena o novo horário selecionado
  const [loading, setLoading] = useState(false);

  const formatarDataBrasileira = (dataHora) => {
    const data = new Date(dataHora); // Converte a string para um objeto Date

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Meses começam do 0
    const ano = data.getFullYear();

    const hora = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${ano} ${hora}:${minutos}`; // Retorna a data e o horário no formato DD/MM/AAAA HH:mm
  };



  // Função para buscar agendamentos do backend
  const fetchAgendamentos = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/agendamentos/listar_agendamentos",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const agendamentos = response.data.map((agendamento) => ({
        id: agendamento.id,
        title: agendamento.servico,
        start: `${agendamento.data}T${agendamento.hora}`,
        backgroundColor:
          agendamento.status === "Confirmado"
            ? "#2d9184"
            : agendamento.status === "Pendente"
              ? "#6c757d"
              : agendamento.status === "Pedido de Remarcação"
                ? "#17a2b8"
                : "#dc3545",
        textColor: "#ffffff",
        description: `Agendamento: ${agendamento.id_agendamento}\nServiço: ${agendamento.servico}\nCliente: ${agendamento.cliente || "Não informado"}
Colaborador: ${agendamento.colaborador || "Não informado"}\nStatus: ${agendamento.status}
Horário: ${agendamento.hora}${agendamento.dias_e_horarios ? `\n \nNovo dia e horário pretendido: ${formatarDataBrasileira(agendamento.dias_e_horarios)}` : ''}`,

      }));

      setEventos(agendamentos);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
    }
  };

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  // Função para manipular o arraste de eventos
  const handleEventDrop = async (info) => {
    const { id, start } = info.event;

    // Ajusta o horário para o fuso horário BR (UTC -3)
    const startBR = new Date(start);
    startBR.setHours(startBR.getHours() - 3); // Subtrai 3 horas para converter para o horário BR

    const novaData = startBR.toISOString().split("T")[0];
    const novoHorario = startBR.toISOString().split("T")[1].slice(0, 8);

    // Abre o modal para o usuário escolher o novo horário
    setNovoHorario(novoHorario); // Define o horário inicial
    setShowModal(true); // Exibe o modal

    // Atualiza o evento selecionado
    setEventoSelecionado({
      id,
      novaData,
      novoHorario,
    });
  };
  

  const handleSalvarHorario = async () => {
    setLoading(true); // Ativa o carregamento
    try {
      const token = localStorage.getItem("token");
      const novaDataHorario = `${eventoSelecionado.novaData} ${novoHorario}:00`; // Adiciona segundos como ":00"

      const response = await axios.put(
        "http://localhost:5000/agendamentos/editar_dia_horario",
        {
          id_agendamento: eventoSelecionado.id,
          data: eventoSelecionado.novaData, // Continua enviando a data separada
          horario: `${novoHorario}:00`, // Garante que o horário esteja no formato correto
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        const successMessage =
          response.data?.message || "Agendamento atualizado com sucesso!";
        alert(successMessage);
        fetchAgendamentos(); // Atualiza a lista de agendamentos
        setShowModal(false); // Fecha o modal
      }
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Erro ao atualizar agendamento. Verifique os dados.";
      alert(errorMessage); // Mostra a mensagem de erro retornada pelo backend
    } finally {
      setLoading(false); // Desativa o carregamento após o processo
    }
  };




  // Função para exibir os detalhes ao clicar no evento
  const handleEventClick = (info) => {
    const evento = info.event.extendedProps;

    // Ajusta o horário para o fuso horário BR (UTC -3)
    const startBR = new Date(evento.start);
    startBR.setHours(startBR.getHours() - 3); // Subtrai 3 horas para converter para o horário BR

    // Atualiza o evento com a hora ajustada
    setEventoSelecionado({
      ...evento,
      hora: startBR.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    });
  };


  return (
    <div className="container  my-2">
      <div className="card shadow">
        <div className="card-header">
          <h1 className="text-center text-primary fw-bold">
            Calendário de Agendamentos
          </h1>
        </div>

        <div className="card-body">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              start: "prev,next today",
              center: "title",
              end: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia",
            }}
            locale={ptLocale}
            events={eventos}
            editable={true}
            eventDrop={handleEventDrop}
            height="auto"
            eventContent={(eventInfo) => {
              return (
                <div
                  title={eventInfo.event.extendedProps.description}
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    backgroundColor: eventInfo.event.backgroundColor,
                    color: eventInfo.event.textColor,
                    padding: "5px",
                    borderRadius: "5px",
                    fontSize: "clamp(0.8rem, 2vw, 1rem)", // Responsivo com a função clamp
                    lineHeight: "1.2",
                    textOverflow: "ellipsis", // Impede texto longo de ultrapassar o limite
                    overflow: "hidden", // Esconde o texto extra
                    whiteSpace: "nowrap", // Impede quebras de linha
                  }}
                >
                  <strong>{eventInfo.event.title}</strong>
                  <br />
                  <span>
                    {new Date(eventInfo.event.start).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            }}

            eventClick={handleEventClick}
            
          />
        </div>
      </div>



      {/* Modal de edição de horário */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Escolher Novo Horário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="novoHorario">
              <Form.Label>Novo Horário</Form.Label>
              <Form.Control
                type="time"
                value={novoHorario}
                onChange={(e) => setNovoHorario(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fechar
          </Button>
          <Button
            variant="primary"
            onClick={handleSalvarHorario}
            disabled={loading} // Desabilita o botão enquanto carrega
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> // Ícone de carregamento
            ) : (
              "Salvar"
            )}
          </Button>
        </Modal.Footer>

      </Modal>
    </div>
  );
};

export default CalendarioInterativo;
