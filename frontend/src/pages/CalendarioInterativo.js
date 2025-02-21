import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import "../css/fullcalendar.css";
import ptLocale from "@fullcalendar/core/locales/pt-br";
import { Modal, Button, Form } from "react-bootstrap"; // Importando os componentes do react-bootstrap
import { Link } from "react-router-dom";
const CalendarioInterativo = () => {
  const [eventos, setEventos] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [showModalHorario, setShowModalHorario] = useState(false); // Controla o modal de edição de horário
  const [showModalDetalhes, setShowModalDetalhes] = useState(false); // Controla o modal de detalhes do agendamento

  const [novoHorario, setNovoHorario] = useState(""); // Armazena o novo horário selecionado
  const [loading, setLoading] = useState(false);

  const role = localStorage.getItem('role'); // Obtém o papel do usuário logado

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
          agendamento.status === "confirmado" || agendamento.status === "Confirmado"
            ? "#2d9184"

            : agendamento.status === "Pendente" || agendamento.status === "pendente"
              ? "#6c757d"
              : agendamento.status === "Pedido de Remarcação"
                ? "#17a2b8"
                : "#dc3545",
        textColor: "#ffffff",
        description: `Agendamento: ${agendamento.id}\nServiço: ${agendamento.servico}\nCliente: ${agendamento.cliente || "Não informado"}
Colaborador: ${agendamento.colaborador || "Não informado"}\nStatus: ${agendamento.status}
Horário: ${agendamento.hora}${agendamento.status === "Pedido de Remarcação" && agendamento.dias_e_horarios
            ? `\n\nNovo dia e horário pretendido: ${formatarDataBrasileira(agendamento.dias_e_horarios)}`
            : ""
          }`,
        extendedProps: {
          cliente: agendamento.cliente || "Não informado",
          colaborador: agendamento.colaborador || "Não informado",
          status: agendamento.status || "Não informado", // Garantindo que o status seja passado corretamente
          dias_e_horarios: agendamento.dias_e_horarios, // Garantindo que a nova data de remarcação seja passada corretamente
        },
      }));

      setEventos(agendamentos);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
    }
  };

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  const handleEventDrop = async (info) => {
    const { id, start, end } = info.event;

    // Verificando se o evento foi movido para outro mês
    const startBR = new Date(start);
    const endBR = new Date(end);

    startBR.setHours(startBR.getHours() - 3); // Ajuste de fuso horário
    endBR.setHours(endBR.getHours() - 3); // Ajuste de fuso horário

    const novaData = startBR.toISOString().split("T")[0];
    const novoHorario = startBR.toISOString().split("T")[1].slice(0, 5);



    setNovoHorario(novoHorario);
    setShowModalHorario(true); // Abre o modal de edição de horário

    setEventoSelecionado({
      id,
      novaData,
      novoHorario,
      novaDataFim: endBR.toISOString().split("T")[0], // Atualiza a data de fim do evento
      novoHorarioFim: endBR.toISOString().split("T")[1].slice(0, 5), // Atualiza o horário de fim
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
        setShowModalHorario(false); // Fecha o modal
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

  const handleEventClick = (info) => {
    const evento = info.event;
    setEventoSelecionado({
      id: evento.id,
      title: evento.title,
      cliente: evento.extendedProps.cliente,
      colaborador: evento.extendedProps.colaborador,
      status: evento.extendedProps.status,
      start: evento.start,
      descricao: evento.extendedProps.description,
      dias_e_horarios: evento.extendedProps.dias_e_horarios,
    });
    console.log("Evento Selecionado ID: ", evento.id);  // Verifique o ID aqui
    setShowModalDetalhes(true);
  };




  return (
    <div className="container  my-2">
      <div className="card shadow">
        <div className="card-header">
          <h1 className="text-center text-primary ">
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
            eventClick={handleEventClick} // Evento de clique simples
            eventDrop={handleEventDrop} // Evento de arrastar (drag)
            height="auto"
            eventContent={(eventInfo) => {
              const { title, extendedProps } = eventInfo.event;
              const cliente = extendedProps.cliente || "Cliente não informado";
              const colaborador = extendedProps.colaborador || "Colaborador não informado";
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
                    fontSize: "clamp(0.4rem, 2vw, 0.8rem)",
                    lineHeight: "1.2",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  <strong>{title}</strong>
                  <br />
                  <span>
                    {new Date(eventInfo.event.start).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {role !== 'cliente' && (<><br /> <span> {cliente}</span> </>)}
                  <br />
                  {role === 'admin' && <span> {colaborador}</span>}
                  {role === 'cliente' && <span> {colaborador}</span>}
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* Modal de edição de horário */}
      <Modal show={showModalHorario} onHide={() => setShowModalHorario(false)} centered>
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
          <Button variant="secondary" onClick={() => {
            setShowModalHorario(false);  // Fecha o modal
            fetchAgendamentos();          // Chama a função para buscar os agendamentos
          }}>
            Fechar
          </Button>
          <Button
            variant="primary"
            onClick={handleSalvarHorario}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              "Salvar"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de detalhes do agendamento */}
      <Modal show={showModalDetalhes} onHide={() => setShowModalDetalhes(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalhes do Agendamento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {eventoSelecionado && (
            <>
              <p><strong>Serviço:</strong> {eventoSelecionado.title}</p>
              <p><strong>Cliente:</strong> {eventoSelecionado.cliente}</p>
              <p><strong>Colaborador:</strong> {eventoSelecionado.colaborador}</p>
              <p><strong>Horário:</strong> {formatarDataBrasileira(eventoSelecionado.start)}</p>
              <p><strong>Status:</strong> {eventoSelecionado.status || "Não informado"}</p>
              {eventoSelecionado.status === 'Pedido de Remarcação' && eventoSelecionado.dias_e_horarios && (
                <p><strong>Pedido de Remarcação:</strong> {formatarDataBrasileira(eventoSelecionado.dias_e_horarios)}</p>
              )}

              {eventoSelecionado.extendedProps?.descricao && (
                <p><strong>Descrição:</strong> {eventoSelecionado.extendedProps.descricao}</p>
              )}
            </>
          )}


        </Modal.Body>
        <Modal.Footer>
          <Link
            to={eventoSelecionado && eventoSelecionado.id ? `/visualizaragendamentos?agendamentoId=${eventoSelecionado.id}` : "#"}
            className="btn btn-info text-decoration-none"
          >
            <i className="bi bi-calendar-check"></i> Visualizar
          </Link>



          <Button variant="secondary" onClick={() => setShowModalDetalhes(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CalendarioInterativo;
