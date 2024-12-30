import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../css/Estilos.css';

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [confirmarEmail, setConfirmarEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [referencias, setReferencias] = useState('');
  const [endereco, setEndereco] = useState('');
  const [rua, setRua] = useState('');
  const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [dtNasc, setDtNasc] = useState('');
  const [cidades, setCidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const buscarCidades = async (estado) => {
    try {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/distritos`);
      if (response.ok) {
        const cidades = await response.json();
        const cidadesOrdenadas = cidades
          .map((cidade) => cidade.nome)
          .sort((a, b) => a.localeCompare(b));
        setCidades(cidadesOrdenadas);
      } else {
        throw new Error("Erro ao carregar cidades.");
      }
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleRegister = async () => {
    if (!nome || !email || !senha || !cpf) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }
  
    if (email !== confirmarEmail) {
      alert('Os emails não correspondem.');
      return;
    }
  
    if (senha !== confirmarSenha) {
      alert('As senhas não correspondem.');
      return;
    }
  
    setLoading(true);
    setErrorMessage('');
  
    try {
      const response = await axios.post("http://localhost:5000/register", {
        nome,
        email,
        cpf,
        senha,
        telefone,
        referencias,
        endereco,
        rua,
        estado,
        cidade,
        bairro,
        dt_nasc: dtNasc,
      });
  
      if (response.status === 201) {
        alert("Inscrição realizada com sucesso!");
        setNome('');
        setEmail('');
        setConfirmarEmail('');
        setCpf('');
        setSenha('');
        setConfirmarSenha('');
        setTelefone('');
        setReferencias('');
        setEndereco('');
        setRua('');
        setEstado('');
        setCidade('');
        setBairro('');
        setDtNasc('');
        setCidades([]);
      }
    } catch (error) {
      console.error("Erro na inscrição:", error);
      const message = error.response?.data?.message || "Erro ao fazer inscrição. Verifique os dados fornecidos.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container col-md-9 my-5">      
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      <div className="card shadow ">
        <div className="card-header ">
          <h2 className="text-center text-primary">Cadastro</h2>
        </div>
        <div className="card-body">
          <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
            <div className="row mb-2">
              <div className="col-12 col-md-4">
                <label htmlFor="nome" className="form-label text-secondary">Nome*</label>
                <input
                  type="text"
                  className="form-control"
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="col-12 col-md-2">
                <label htmlFor="cpf" className="form-label text-secondary">CPF*</label>
                <input
                  type="text"
                  className="form-control"
                  id="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="123.456.789-00"
                  required
                />
              </div>
              <div className="col-12 col-md-3">
                <label htmlFor="email" className="form-label text-secondary">Email*</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="col-12 col-md-3">
                <label htmlFor="confirmarEmail" className="form-label text-secondary">Confirme seu Email*</label>
                <input
                  type="email"
                  className="form-control"
                  id="confirmarEmail"
                  value={confirmarEmail}
                  onChange={(e) => setConfirmarEmail(e.target.value)}
                  required
                />
              </div>
            </div>
  
            <div className="row mb-3">
              <div className="col-12 col-md-2">
                <label htmlFor="senha" className="form-label text-secondary">Senha*</label>
                <input
                  type="password"
                  className="form-control"
                  id="senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>
              <div className="col-12 col-md-2">
                <label htmlFor="confirmarSenha" className="form-label text-secondary">Confirme sua Senha*</label>
                <input
                  type="password"
                  className="form-control"
                  id="confirmarSenha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                />
              </div>
              <div className="col-12 col-md-2">
                <label htmlFor="dtNasc" className="form-label text-secondary">Data de Nascimento</label>
                <input
                  type="date"
                  className="form-control"
                  id="dtNasc"
                  value={dtNasc}
                  onChange={(e) => setDtNasc(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-2">
                <label htmlFor="telefone" className="form-label text-secondary">Telefone*</label>
                <input
                  type="tel"
                  className="form-control"
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                />
              </div>
              <div className="col-12 col-md-1">
                <label htmlFor="estado" className="form-label text-secondary">Estado*</label>
                <select
                  className="form-select"
                  id="estado"
                  value={estado}
                  onChange={(e) => {
                    setEstado(e.target.value);
                    buscarCidades(e.target.value);
                  }}
                  required
                >
                  <option value="">Selecione um estado</option>
                  {estados.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-2">
                <label htmlFor="cidade" className="form-label text-secondary">Cidade*</label>
                <select
                  className="form-select"
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  required
                >
                  <option value="">Selecione uma cidade</option>
                  {cidades.map((city, index) => (
                    <option key={index} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
  
            <div className="row mb-2">
              <div className="col-12 col-md-5">
                <label htmlFor="endereco" className="form-label text-secondary">Endereço</label>
                <input
                  type="text"
                  className="form-control"
                  id="endereco"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-3">
                <label htmlFor="bairro" className="form-label text-secondary">Bairro</label>
                <input
                  type="text"
                  className="form-control"
                  id="bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="referencias" className="form-label text-secondary">Referências</label>
                <input
                  type="text"
                  className="form-control"
                  id="referencias"
                  value={referencias}
                  onChange={(e) => setReferencias(e.target.value)}
                />
              </div>
            </div>
  
            <div className="col-12 text-center">
              <button type="submit" className="btn btn-signup w-auto mx-auto" disabled={loading}>
              <i className="bi bi-person-plus"></i>
                {loading ? "Carregando..." : " Inscrever-se"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Cadastro;
