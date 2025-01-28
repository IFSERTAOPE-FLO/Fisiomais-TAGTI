import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Card } from 'react-bootstrap';
import { FaDollarSign } from 'react-icons/fa';
import Paginator from '../components/Paginator';

const GerenciarPagamentos = () => {
  const [pagamentos, setPagamentos] = useState([]);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [selectedPagamento, setSelectedPagamento] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const role = localStorage.getItem('role');  // 'cliente', 'colaborador', 'admin'

  const isCliente = role === 'cliente';
  const isColaborador = role === 'colaborador';
  const isAdmin = role === 'admin';

  useEffect(() => {
    const fetchPagamentos = async () => {
      try {
        const response = await axios.get('http://localhost:5000/pagamentos/listar', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPagamentos(response.data.pagamentos);
      } catch (error) {
        console.error('Erro ao buscar pagamentos:', error);
        setErro('Erro ao buscar pagamentos. Tente novamente.');
      }
    };
    fetchPagamentos();
  }, []);

  const handleShowEditModal = (pagamento) => {
    setSelectedPagamento(pagamento);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPagamento(null);
    setSucesso(null);
    setErro(null);
  };

  const handleSalvarAlteracoes = async () => {
    setLoading(true);
    setSucesso('');
    try {
      // Envia a requisição PUT para o backend
      const response = await axios.put(
        `http://localhost:5000/pagamentos/editar/${selectedPagamento.id_pagamento}`,
        selectedPagamento,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      // Verifica se a resposta do backend foi de sucesso
      if (response.status === 200) {
        setShowModal(false); // Fecha o modal
        setLoading(false); // Desativa o carregamento
        setSucesso(response.data.message); // Exibe a mensagem de sucesso recebida do backend

        // Atualiza a lista de pagamentos
        const pagamentosResponse = await axios.get('http://localhost:5000/pagamentos/listar', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPagamentos(pagamentosResponse.data.pagamentos);
        setErro('');
      } else {
        // Caso não seja sucesso, exibe a mensagem de erro
        setErro(response.data.message || 'Erro desconhecido. Tente novamente.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      setErro(error.response?.data?.message || 'Erro ao atualizar pagamento. Tente novamente.');
      setLoading(false);
    }
  };
  // Função para formatar data UTC para o formato datetime-local
  const formatDateToLocal = (date) => {
    if (!date) return '';
    const localDate = new Date(date);
    return localDate.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
  };


  return (
    <div className="container my-2">
      <div className="card shadow">
        <div className="card-header">
          <h2 className="text-center text-primary fw-bold">Gerenciar Pagamentos</h2>
        </div>

        <div className="card-body">
          {erro && <div className="alert alert-danger">{erro}</div>}
          {sucesso && <div className="alert alert-success">{sucesso}</div>}

          <div className="table-responsive">
            <table className="table table-striped table-bordered mt-4 agendamento-header">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Clínica</th>
                  <th>Valor</th>
                  <th>Método de Pagamento</th>
                  <th>Status</th>
                  <th>Data de Pagamento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {pagamentos.map((pagamento) => (
                  <tr key={pagamento.id_pagamento}>
                    <td>{pagamento.id_pagamento}</td>
                    <td>{pagamento.cliente.nome}</td>
                    <td>
                      {pagamento.servico.nome}
                      {/* Exibe o nome e a descrição do plano, se houver */}
                      {pagamento.plano && (
                        <div>
                          <strong>{pagamento.plano.nome}</strong><br />
                          {pagamento.plano.descricao}
                        </div>
                      )}
                    </td>
                    <td>{pagamento.clinica?.nome}</td>
                    <td>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(pagamento.valor)}
                    </td>
                    <td>{pagamento.metodo_pagamento}</td>
                    <td>
                      {
                        pagamento.status === "Pendente" ? (
                          <>
                            <i className="bi bi-hourglass-split" style={{ color: 'gray' }}></i>
                            <span style={{ color: 'gray' }}> </span>
                          </>
                        ) : pagamento.status === "Pago" ? (
                          <>
                            <i className="bi bi-check-circle" style={{ color: 'green' }}></i>
                            <span style={{ color: 'green' }}></span>
                          </>
                        ) : pagamento.status === "Cancelado" ? (
                          <>
                            <i className="bi bi-x-circle" style={{ color: 'red' }}></i>
                            <span style={{ color: 'red' }}></span>
                          </>
                        ) : pagamento.status === "Atrasado" ? (
                          <>
                            <i className="bi bi-clock" style={{ color: 'orange' }}></i> {/* Ícone de relógio */}
                            <span style={{ color: 'orange' }}>Atrasado</span>
                          </>
                        ) : null
                      }
                    </td>



                    <td>
                      {pagamento.data_pagamento && new Date(pagamento.data_pagamento).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>


                    <td>
                      {(isAdmin || isColaborador) && (
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => handleShowEditModal(pagamento)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                      )}
                      <button
                        className="btn btn-info btn-sm"
                      >
                        <i className="bi bi-file-earmark-text"></i> Gerar fatura
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginator
            currentPage={currentPage}
            totalItems={pagamentos.length}
            itemsPerPage={itemsPerPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>

      {/* Modal de Edição de Pagamento */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Pagamento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {erro && <div className="alert alert-danger">{erro}</div>}
          {sucesso && <div className="alert alert-success">{sucesso}</div>}
          {selectedPagamento && (
            <div>
              <div className="mb-3">
                <label htmlFor="valor" className="form-label">Valor</label>
                <input
                  type="number"
                  className="form-control"
                  id="valor"
                  value={selectedPagamento.valor || ''}
                  onChange={(e) => {
                    setSelectedPagamento((prevState) => ({
                      ...prevState,
                      valor: parseFloat(e.target.value) || null,
                    }));

                  }}
                  disabled={isCliente}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="metodo_pagamento" className="form-label">Método de Pagamento</label>
                <select
                  className="form-control"
                  id="metodo_pagamento"
                  value={selectedPagamento.metodo_pagamento || ''}
                  onChange={(e) => {
                    setSelectedPagamento((prevState) => ({
                      ...prevState,
                      metodo_pagamento: e.target.value,
                    }));
                  }}
                  disabled={isCliente}
                >
                  <option value="">Selecione o método de pagamento</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="pix">Pix</option>
                  <option value="transferencia_bancaria">Transferência Bancária</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>


              {/* Status */}
              {(isAdmin || isColaborador) && (
                <div className="mb-3">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    className="form-select"
                    id="status"
                    value={selectedPagamento.status || 'pendente'}
                    onChange={(e) =>
                      setSelectedPagamento({ ...selectedPagamento, status: e.target.value })
                    }
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                    <option value="Cancelado">Cancelado</option>
                    <option value="Atrasado">Atrasado</option>
                  </select>
                </div>
              )}

              {/* Data de Pagamento */}
              <div className="mb-3">
                <label htmlFor="data_pagamento" className="form-label">Data de Pagamento</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  id="data_pagamento"
                  value={formatDateToLocal(selectedPagamento.data_pagamento)}
                  onChange={(e) => {
                    // Converte a data para o formato UTC ao enviar para o backend
                    const localDate = new Date(e.target.value);
                    setSelectedPagamento((prevState) => ({
                      ...prevState,
                      data_pagamento: localDate.toISOString(), // Envia para o backend no formato UTC
                    }));
                  }}
                  disabled={isCliente}
                />
              </div>

              {/* Referência de Pagamento */}
              <div className="mb-3">
                <label htmlFor="referencia_pagamento" className="form-label">Referência de Pagamento</label>
                <input
                  type="text"
                  className="form-control"
                  id="referencia_pagamento"
                  value={selectedPagamento.referencia_pagamento || ''}
                  onChange={(e) => {
                    setSelectedPagamento((prevState) => ({
                      ...prevState,
                      referencia_pagamento: e.target.value,
                    }));
                  }}
                  disabled={isCliente}
                />
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={handleCloseModal}>Fechar</button>
          <button className="btn btn-primary" onClick={handleSalvarAlteracoes}>Salvar alterações</button>
        </Modal.Footer>
      </Modal>

    </div >
  );
};

export default GerenciarPagamentos;
