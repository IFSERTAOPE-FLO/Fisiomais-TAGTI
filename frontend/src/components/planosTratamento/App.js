import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HistoricoPlanos from "./CriarPlanoTratamento"; // Importa o componente de histórico
import CriarPlanoTratamento from "./CriarPlanoTratamento"; // Importa o componente de criação de plano

function App() {
  return (
    <Router> {/* Este componente gerencia a navegação */}
      <Routes>
        <Route path="/" element={<HistoricoPlanos />} /> {/* Página de histórico */}
        <Route path="/planos_de_tratamento/criar_planos_de_tratamento" element={<planos_de_tratamento />} /> {/* Página de criação */}
      </Routes>
    </Router>
  );
}

export default App;
