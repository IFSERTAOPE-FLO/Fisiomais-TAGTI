import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css'; 
import './Profile.css'; 

const Profile = () => {
  const [userData, setUserData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editData, setEditData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [userRole, setUserRole] = useState(''); // Novo estado para armazenar o papel do usuário

  const token = localStorage.getItem('access_token');
  const apiBaseUrl = 'http://localhost:5000/api';

  // Função para buscar dados do usuário
  const fetchUserData = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/perfil`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setEditData(data);
        setUserRole(data.role); // Armazenando o papel do usuário
      } else {
        throw new Error('Erro ao buscar dados do usuário.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Função para atualizar dados do usuário
  const updateUser = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/editar_usuario/${userRole}/${userData.ID}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        fetchUserData(); 
      } else {
        throw new Error(data.message || 'Erro ao atualizar usuário.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Função para alterar a foto de perfil
  const handlePhotoUpload = () => {
    console.log('Foto selecionada:', selectedFile);
    alert('A funcionalidade de upload ainda não foi implementada.');
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Perfil do Usuário</h1>

      {error && <p className="alert alert-danger">{error}</p>}
      {success && <p className="alert alert-success">{success}</p>}

      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body">
              <div className="row">
                {/* Foto de perfil */}
                <div className="col-md-4 text-center">
                  <img
                    src={userData.photo || 'https://via.placeholder.com/150'}
                    alt="Foto do Usuário"
                    className="img-fluid rounded-circle mb-3"
                    style={{ width: '150px', height: '150px' }}
                  />
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="form-control mb-2"
                  />
                  <button className="btn btn-primary" onClick={handlePhotoUpload}>
                    Alterar Foto
                  </button>
                </div>

                {/* Detalhes do perfil */}
                <div className="col-md-8">
                  <form>
                    <div className="mb-3">
                      <label className="form-label">Nome:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editData.nome || ''}
                        onChange={(e) =>
                          setEditData({ ...editData, nome: e.target.value })
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email:</label>
                      <input
                        type="email"
                        className="form-control"
                        value={editData.email || ''}
                        onChange={(e) =>
                          setEditData({ ...editData, email: e.target.value })
                        }
                      />
                    </div>
                    {userRole === 'cliente' && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">Telefone:</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editData.telefone || ''}
                            onChange={(e) =>
                              setEditData({ ...editData, telefone: e.target.value })
                            }
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Endereço:</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editData.endereco || ''}
                            onChange={(e) =>
                              setEditData({ ...editData, endereco: e.target.value })
                            }
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Cidade:</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editData.cidade || ''}
                            onChange={(e) =>
                              setEditData({ ...editData, cidade: e.target.value })
                            }
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Bairro:</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editData.bairro || ''}
                            onChange={(e) =>
                              setEditData({ ...editData, bairro: e.target.value })
                            }
                          />
                        </div>
                      </>
                    )}
                    {userRole === 'colaborador' && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">Cargo:</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editData.cargo || ''}
                            onChange={(e) =>
                              setEditData({ ...editData, cargo: e.target.value })
                            }
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Telefone:</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editData.telefone || ''}
                            onChange={(e) =>
                              setEditData({ ...editData, telefone: e.target.value })
                            }
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Endereço:</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editData.endereco || ''}
                            onChange={(e) =>
                              setEditData({ ...editData, endereco: e.target.value })
                            }
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Cidade:</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editData.cidade || ''}
                            onChange={(e) =>
                              setEditData({ ...editData, cidade: e.target.value })
                            }
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Bairro:</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editData.bairro || ''}
                            onChange={(e) =>
                              setEditData({ ...editData, bairro: e.target.value })
                            }
                          />
                        </div>
                      </>
                    )}
                    <div className="text-center">
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={updateUser}
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
