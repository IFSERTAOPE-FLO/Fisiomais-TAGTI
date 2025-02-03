import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import ClientesDropdown from "../components/ClientesDropdown";
import { Modal, Button } from 'react-bootstrap';  // Import Modal and Button

function GerenciarPilates() {
  const [aulas, setAulas] = useState([
    { id: 1, name: 'Segunda-Feira', students: [] },
  ]);
  const [novoNomeAula, setNovoNomeAula] = useState(''); // Estado para armazenar o novo nome da aula
  const [alunoSelecionado, setAlunoSelecionado] = useState(null); // Estado para armazenar o aluno selecionado
  const [editarAula, setEditarAula] = useState(null); // Estado para armazenar a aula sendo editada
  const [showModal, setShowModal] = useState(false); // Estado para controlar a visibilidade do modal

  const editarAulaFunc = (idAula) => {
    setAulas(
      aulas.map((aula) =>
        aula.id === idAula ? { ...aula, name: novoNomeAula } : aula
      )
    );
    setShowModal(false);
  };

  const handleEditarClick = (aula) => {
    setEditarAula(aula);
    setNovoNomeAula(" ");
    setShowModal(true);
  };

  const adicionarAula = () => {
    setAulas([
      ...aulas,
      { id: Date.now(), name: novoNomeAula, students: [] }
    ]);
    setNovoNomeAula('');
  };

  const removerAluno = (idAula, indiceAluno) => {
    setAulas(
      aulas.map((aula) =>
        aula.id === idAula
          ? { ...aula, students: aula.students.filter((_, index) => index !== indiceAluno) }
          : aula
      )
    );
  };

  const removerAula = (idAula) => {
    setAulas(aulas.filter((aula) => aula.id !== idAula));
  };

  const adicionarAlunoNaAula = (idAula) => {
    if (alunoSelecionado) {
      setAulas(
        aulas.map((aula) =>
          aula.id === idAula
            ? { ...aula, students: [...aula.students, alunoSelecionado] }
            : aula
        )
      );
      setAlunoSelecionado('');
    }
  };

  return (
    <div>
      <div className="container mt-4">
        <h1 className="text-center fw-bold text-primary mb-3">Administração das Aulas e Alunos</h1>
        <h2 className="mt-4">Aulas</h2>

        <ul className="list-group">
          {aulas.length === 0 ? (
            <li className="list-group-item">Nenhuma aula cadastrada.</li>
          ) : (
            aulas.map((aula) => (
              <li key={aula.id} className="list-group-item">
                <div className="d-flex float-end gap-3">
                  <button
                    className='btn btn-warning btn-sm'
                    onClick={() => handleEditarClick(aula)}
                  >
                    Editar Aula
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removerAula(aula.id)}
                  >
                    Remover Esta Aula
                  </button>
                </div>
                

                <h3>{aula.name}</h3>

                <ul className="list-group">
                  {aula.students.map((aluno, index) => (
                    <li key={index} className="list-group-item d-flex justify-content-between">
                      {aluno}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => removerAluno(aula.id, index)}
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>

                <ClientesDropdown onSelect={setAlunoSelecionado} value={alunoSelecionado} placeholder="Selecione um Aluno" />
                <button
                  onClick={() => adicionarAlunoNaAula(aula.id)}
                  className="btn btn-success mt-2"
                >
                  Adicionar Aluno
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Nome da Aula</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            type="text"
            value={novoNomeAula}
            onChange={(e) => setNovoNomeAula(e.target.value)}
            className="form-control"
            placeholder="Novo nome da aula"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fechar
          </Button>
          <Button
            variant="primary"
            onClick={() => editarAulaFunc(editarAula?.id)}
          >
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="container mt-4 fw-bold">
        <h2 className="mt-4">Nova Aula</h2>
        <input
          type="text"
          value={novoNomeAula}
          onChange={(e) => setNovoNomeAula(e.target.value)}
          placeholder="Nome da Aula"
          className="form-control mb-2"
        />
        <button onClick={adicionarAula} className="btn btn-primary">Adicionar Nova Aula</button>
      </div>
    </div>
  );
}

export default GerenciarPilates;
