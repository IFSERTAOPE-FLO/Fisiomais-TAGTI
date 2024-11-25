import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Profile.css";

const Profile = () => {
  const [userData, setUserData] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editData, setEditData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [userRole, setUserRole] = useState("");

  const token = localStorage.getItem("access_token");
  const apiBaseUrl = "http://localhost:5000/api";

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/perfil`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setEditData(data);
        setUserRole(data.role);
      } else {
        throw new Error("Erro ao buscar dados do usuário.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const updateUser = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/editar_usuario/${userRole}/${userData.ID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
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
        throw new Error(data.message || "Erro ao atualizar usuário.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) {
      setError("Selecione uma foto para fazer o upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${apiBaseUrl}/upload_photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setUserData((prev) => ({ ...prev, photo: data.photo }));
      } else {
        throw new Error(data.message || "Erro ao enviar foto.");
      }
    } catch (err) {
      setError(err.message);
    }
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
                <div className="col-md-4 text-center">
                  <img
                    src={`http://localhost:5000${userData.photo || "/uploads/default.jpg"}`}
                    alt="Foto do Usuário"
                    className="img-fluid rounded-circle mb-3"
                    style={{ width: "150px", height: "150px" }}
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
                <div className="col-md-8">
                  <form>
                    {/* Campos de edição */}
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={updateUser}
                    >
                      Salvar Alterações
                    </button>
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
