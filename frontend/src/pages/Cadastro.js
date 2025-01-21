import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../css/Estilos.css';
import { useNavigate } from 'react-router-dom';  // Importe o useNavigate

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
  const [sexo, setSexo] = useState('');
  const [foto, setFoto] = useState(null);
  const [cidades, setCidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const navigate = useNavigate(); // Declare useNavigate no escopo do componente


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
    if (!nome || !email || !senha || !cpf || !sexo) {
      alert('Por favor, preencha todos os campos obrigatórios.');
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
  
    // Criar o objeto endereco com os dados do formulário
    const enderecoObj = {
      rua: rua,
      numero: numero,
      complemento: complemento,
      bairro: bairro,
      cidade: cidade,
      estado: estado,
    };
  
    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("email", email);
    formData.append("cpf", cpf);
    formData.append("senha", senha);
    formData.append("sexo", sexo);
    formData.append("telefone", telefone);
    formData.append("referencias", referencias);
    formData.append("endereco", JSON.stringify(enderecoObj));  // Envia o endereço como JSON    
    formData.append("dt_nasc", dtNasc);
    // Log FormData contents for debugging
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
  
    try {
      const response = await axios.post("http://localhost:5000/clientes/register/public", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      if (response.status === 201) {
        alert("Inscrição realizada com sucesso!");
        
        // Armazenar o token de acesso no localStorage (ou sessionStorage)
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('user_id', response.data.userId);
        localStorage.setItem('user_name', response.data.name);
        localStorage.setItem('user_role', response.data.role);
        localStorage.setItem('user_photo', response.data.photo);
  
        // Limpar os campos após sucesso
        setNome('');
        setEmail('');
        setConfirmarEmail('');
        setCpf('');
        setSenha('');
        setConfirmarSenha('');
        setTelefone('');
        setReferencias('');
        setEndereco('');
        setSexo('');
        setFoto(null);
        setDtNasc('');
        setCidades([]);
  
        // Redirecionar para a página principal após o sucesso
        
      navigate('/criaragendamento');
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
      <div className="card shadow">
        <div className="card-header">
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
              <div className="col-12 col-md-2">
                <label htmlFor="sexo" className="form-label text-secondary">Sexo</label>
                <select
                  className="form-select"
                  id="sexo"
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value)}
                >
                  <option value="">Selecione o sexo</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
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

            </div>

            <div className="row mb-2">
              <div className="col-12 col-md-2">
                <label htmlFor="numero" className="form-label text-secondary">Número</label>
                <input
                  type="text"
                  className="form-control"
                  id="numero"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-2">
                <label htmlFor="complemento" className="form-label text-secondary">Complemento</label>
                <input
                  type="text"
                  className="form-control"
                  id="complemento"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
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
              <div className="col-12 col-md-3 ">
                <label htmlFor="cidade" className="form-label text-secondary">Cidade*</label>
                <select
                  className="form-select py-2"
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