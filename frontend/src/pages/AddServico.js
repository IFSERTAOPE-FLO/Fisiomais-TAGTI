import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function AddServico() {
  const [nomeServico, setNomeServico] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomeServico || !descricao || !valor) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setMensagem('');

    try {
      const response = await axios.post('http://localhost:5000/add_servico', {
        nome_servico: nomeServico,
        descricao,
        valor,
      });

      if (response.status === 200) {
        setMensagem('Serviço adicionado com sucesso!');
        setNomeServico('');
        setDescricao('');
        setValor('');
      } else {
        throw new Error('Erro ao adicionar o serviço.');
      }
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error);
      setMensagem('Erro ao adicionar serviço. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 ">
      <h2 className="text-center mb-4">Adicionar Serviço</h2>
      {mensagem && (
        <div className={`alert ${mensagem.includes('Erro') ? 'alert-danger' : 'alert-success'}`}>
          {mensagem}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* Nome e Valor */}
        <div className="row mb-3 justify-content-center">
          <div className="col-md-3">
            <label htmlFor="nomeServico" className="form-label">Nome do Serviço</label>
            <input
              type="text"
              className="form-control"
              id="nomeServico"
              value={nomeServico}
              onChange={(e) => setNomeServico(e.target.value)}
              required
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="valor" className="form-label">Valor (R$)</label>
            <input
              type="number"
              className="form-control"
              id="valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Descrição */}
        <div className="row mb-3 justify-content-center">
          <div className="col-md-6">
            <label htmlFor="descricao" className="form-label">Descrição</label>
            <textarea
              className="form-control"
              id="descricao"
              rows="3"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            ></textarea>
          </div>
        </div>

        {/* Botão */}
        <div className="row mb-3">
          <div className="col-md-12 text-center">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar Serviço'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AddServico;
