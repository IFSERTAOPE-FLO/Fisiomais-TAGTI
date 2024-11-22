import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './Cadastro.css';

function AddColaborador() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [referencias, setReferencias] = useState('');
  const [cargo, setCargo] = useState('');
  const [endereco, setEndereco] = useState('');
  const [rua, setRua] = useState('');
  const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); // Campo adicional para administrador
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (!nome || !email || !senha) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post("http://localhost:5000/register-colaborador", {
        nome,
        email,
        senha,
        telefone,
        referencias,
        cargo,
        endereco,
        rua,
        estado,
        cidade,
        bairro,
        is_admin: isAdmin,
      });

      if (response.status === 201) {
        alert("Colaborador cadastrado com sucesso!");
        // Resetar os campos
        setNome('');
        setEmail('');
        setSenha('');
        setTelefone('');
        setReferencias('');
        setCargo('');
        setEndereco('');
        setRua('');
        setEstado('');
        setCidade('');
        setBairro('');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Erro ao cadastrar colaborador:", error);
      const message = error.response?.data?.message || "Erro ao cadastrar colaborador. Verifique os dados fornecidos.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2 className="mb-4">Adicionar Colaborador</h2>
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
        <div className="row mb-3">
          <div className="col-12 col-md-6">
            <label htmlFor="nome" className="form-label">Nome*</label>
            <input
              type="text"
              className="form-control"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="email" className="form-label">Email*</label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-12 col-md-6">
            <label htmlFor="senha" className="form-label">Senha*</label>
            <input
              type="password"
              className="form-control"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="telefone" className="form-label">Telefone</label>
            <input
              type="tel"
              className="form-control"
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-12">
            <label htmlFor="referencias" className="form-label">Referências</label>
            <input
              type="text"
              className="form-control"
              id="referencias"
              value={referencias}
              onChange={(e) => setReferencias(e.target.value)}
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-12 col-md-6">
            <label htmlFor="cargo" className="form-label">Cargo</label>
            <input
              type="text"
              className="form-control"
              id="cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="isAdmin" className="form-label">Administrador</label>
            <input
              type="checkbox"
              className="form-check-input"
              id="isAdmin"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-12 col-md-6">
            <label htmlFor="estado" className="form-label">Estado</label>
            <input
              type="text"
              className="form-control"
              id="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="cidade" className="form-label">Cidade</label>
            <input
              type="text"
              className="form-control"
              id="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-12">
            <label htmlFor="bairro" className="form-label">Bairro</label>
            <input
              type="text"
              className="form-control"
              id="bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-login w-auto mx-auto d-block" disabled={loading}>
          {loading ? "Carregando..." : "Cadastrar"}
        </button>
      </form>
    </div>
  );
}

export default AddColaborador;
