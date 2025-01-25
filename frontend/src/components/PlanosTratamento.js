import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function PlanosTratamento() {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchPlanos = async () => {
      try {
        const response = await axios.get('http://localhost:5000/planos_de_tratamento/');
        setPlanos(response.data);
        setLoading(false);
      } catch (error) {
        setErrorMessage('Erro ao carregar os planos de tratamento.');
        setLoading(false);
      }
    };

    fetchPlanos();
  }, []);

  return (
    <div className="container my-5">
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      <div className="card shadow">
        <div className="card-header bg-primary text-white text-center">
          <h2>Planos de Tratamento</h2>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">Carregando...</div>
          ) : (
            <>
              {planos.length > 0 ? (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome do Paciente</th>
                      <th>Descrição do Plano</th>
                      <th>Data de Início</th>
                      <th>Data de Término</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planos.map((plano) => (
                      <tr key={plano.id}>
                        <td>{plano.id}</td>
                        <td>{plano.pacienteNome}</td>
                        <td>{plano.descricao}</td>
                        <td>{plano.dataInicio}</td>
                        <td>{plano.dataTermino}</td>
                        <td>
                          <button
                            className="btn btn-info btn-sm me-2"
                            onClick={() => alert(`Visualizar plano ${plano.id}`)}
                          >
                            Visualizar
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => alert(`Excluir plano ${plano.id}`)}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center">Nenhum plano de tratamento encontrado.</div>
              )}
            </>
          )}
        </div>
        <div className="card-footer text-center">
          <button
            className="btn btn-success"
            onClick={() => alert('Redirecionar para adicionar novo plano')}
          >
            Adicionar Novo Plano
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlanosTratamento;
