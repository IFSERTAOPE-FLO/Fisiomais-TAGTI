import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../css/Estilos.css';
import { Link } from "react-router-dom";

function AddColaborador() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [confirmarEmail, setConfirmarEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [referencias, setReferencias] = useState('');
  const [cargo, setCargo] = useState('');
  const [endereco, setEndereco] = useState('');
  const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairros, setBairro] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [cpf, setCpf] = useState('');
  const [dtNasc, setDtNasc] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);

  // Busca estados ao carregar o componente
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const response = await axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
        setEstados(response.data.sort((a, b) => a.nome.localeCompare(b.nome)));
      } catch (error) {
        console.error('Erro ao buscar estados:', error);
      }
    };

    fetchEstados();
  }, []);

  // Busca cidades ao selecionar um estado
  useEffect(() => {
    if (estado) {
      const fetchCidades = async () => {
        try {
          const response = await axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`);
          setCidades(response.data.sort((a, b) => a.nome.localeCompare(b.nome)));
        } catch (error) {
          console.error('Erro ao buscar cidades:', error);
        }
      };

      fetchCidades();
    } else {
      setCidades([]);
    }
  }, [estado]);

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
      const response = await axios.post('http://localhost:5000/colaboradores/register', {
        nome,
        email,
        cpf,
        senha,
        telefone,
        referencias,
        cargo,
        endereco: {
          rua: endereco,
          bairro: bairros,
          cidade,
          estado,
        },
        dt_nasc: dtNasc,
        is_admin: isAdmin,
      });

      if (response.status === 201) {
        alert('Colaborador cadastrado com sucesso!');
        // Resetar os campos
        setNome('');
        setEmail('');
        setConfirmarEmail('');
        setSenha('');
        setConfirmarSenha('');
        setTelefone('');
        setReferencias('');
        setCargo('');
        setEndereco('');
        setEstado('');
        setCidade('');
        setBairro('');
        setCpf('');
        setIsAdmin(false);
        setDtNasc('');
      }
    } catch (error) {
      console.error('Erro ao cadastrar colaborador:', error);
      const message = error.response?.data?.message || 'Erro ao cadastrar colaborador. Verifique os dados fornecidos.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container col-md-9 my-5">
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      <div className="card shadow">
        <div className="card-header">
          <h2 className="text-center text-primary">Adicionar Colaborador</h2>
        </div>
        <div className="card-body">
          <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
            {/* Nome e CPF */}
            <div className="row mb-2">
              <div className="col-md-4">
                <label className="form-label">Nome*</label>
                <input type="text" className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">CPF*</label>
                <input type="text" className="form-control" value={cpf} onChange={(e) => setCpf(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Data de Nascimento*</label>
                <input type="date" className="form-control" value={dtNasc} onChange={(e) => setDtNasc(e.target.value)} required />
              </div>
            </div>

            {/* Endereço */}
            <div className="row mb-2">
              <div className="col-md-4">
                <label className="form-label">Estado*</label>
                <select className="form-select" value={estado} onChange={(e) => setEstado(e.target.value)} required>
                  <option value="">Selecione um estado</option>
                  {estados.map((estado) => (
                    <option key={estado.id} value={estado.sigla}>{estado.nome}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Cidade*</label>
                <select className="form-select" value={cidade} onChange={(e) => setCidade(e.target.value)} required>
                  <option value="">Selecione uma cidade</option>
                  {cidades.map((cidade) => (
                    <option key={cidade.id} value={cidade.nome}>{cidade.nome}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Bairro*</label>
                <input type="text" className="form-control" value={bairros} onChange={(e) => setBairro(e.target.value)} required />
              </div>
            </div>

            {/* Cargo e Telefone */}
            <div className="row mb-2">
              <div className="col-md-6">
                <label className="form-label">Cargo</label>
                <input type="text" className="form-control" value={cargo} onChange={(e) => setCargo(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Telefone</label>
                <input type="text" className="form-control" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
            </div>

            {/* Botões */}
            <div className="text-center">
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Carregando...' : 'Cadastrar'}</button>
              <Link className="btn btn-secondary ms-2" to="/adminpage">Voltar</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddColaborador;
