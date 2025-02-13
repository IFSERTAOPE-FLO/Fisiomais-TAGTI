import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PageWrapper from "./components/PageTitulos"; // Importa o wrapper

// Páginas
import Home from "./pages/Home";
import AddColaborador from "./pages/AddColaborador";
import AddCliente from './pages/AddCliente';
import CriarAgendamento from "./pages/CriarAgendamento";
import Contato from "./pages/Contato";
import SobreNos from "./pages/SobreNos";
import Cadastro from "./pages/Cadastro";
import Perfil from "./pages/Perfil";
import VisualizarAgendamentos from "./pages/VisualizarAgendamentos";
import AdminPage from "./pages/AdminPage";
import Especialidades from "./pages/Especialidades";
import GerenciarPagamentos from "./pages/GerenciarPagamentos.js";
import CalendarioInterativo from "./pages/CalendarioInterativo";
import ClientPage from "./pages/ClientPage";

// Componentes Pagamentos


// Componentes de Pilates
import AdicionarAulaPilates from "./components/pilates/usuariocolaborador/AdicionarAulaPilates.js";
import AdicionarClienteAulaColaborador from "./components/pilates/usuariocolaborador/AdicionarClienteAulaColaborador.js";
import CadastrarAulaCliente from "./components/pilates/usuariocliente/CadastrarAulaCliente.js";
import GerenciarAulasPilates from "./components/pilates/usuariocolaborador/GerenciarAulasPilates.js";
import MinhasAulasCliente from  "./components/pilates/usuariocliente/MinhasAulasCliente.js";

function App() {
    return (
        <Router>
            <div>
                <Navbar />
                <Routes>
                    <Route
                        path="/"
                        element={
                            <PageWrapper title="Início - Fisiomais">
                                <Home />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/addcolaborador"
                        element={
                            <PageWrapper title="Adicionar Colaborador - Fisiomais">
                                <AddColaborador />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/addcliente"
                        element={
                            <PageWrapper title="Adicionar Cliente - Fisiomais">
                                <AddCliente />
                            </PageWrapper>
                        }
                    />

                    <Route
                        path="/contato"
                        element={
                            <PageWrapper title="Contato - Fisiomais">
                                <Contato />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/sobrenos"
                        element={
                            <PageWrapper title="Sobre Nós - Fisiomais">
                                <SobreNos />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/especialidades"
                        element={
                            <PageWrapper title="Especialidades - Fisiomais">
                                <Especialidades />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/cadastro"
                        element={
                            <PageWrapper title="Cadastro - Fisiomais">
                                <Cadastro />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/perfil"
                        element={
                            <PageWrapper title="Perfil - Fisiomais">
                                <Perfil />
                            </PageWrapper>
                        }
                    />

                    <Route
                        path="/adminPage"
                        element={
                            <PageWrapper title="Central de Controle - Fisiomais">
                                <AdminPage />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/gerenciarPagamentos"
                        element={
                            <PageWrapper title="Gerenciar Pagamentos - Fisiomais">
                                < GerenciarPagamentos/>
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/visualizaragendamentos"
                        element={
                            <PageWrapper title="Visualizar Agendamentos - Fisiomais">
                                <VisualizarAgendamentos />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/criaragendamento"
                        element={
                            <PageWrapper title="Criar Agendamento - Fisiomais">
                                <CriarAgendamento />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/calendario_agendamentos"
                        element={
                            <PageWrapper title=" Agendamentos | Calendário - Fisiomais">
                                <CalendarioInterativo />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/adicionar-aula-pilates"
                        element={
                            <PageWrapper title="Adicionar Aula de Pilates - Fisiomais">
                                <AdicionarAulaPilates />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/adicionar-cliente-aula-colaborador"
                        element={
                            <PageWrapper title="Adicionar Cliente à Aula - Fisiomais">
                                <AdicionarClienteAulaColaborador />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/cadastrar-aula-cliente"
                        element={
                            <PageWrapper title="Cadastrar Aula para Cliente - Fisiomais">
                                <CadastrarAulaCliente />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/gerenciar-pilates"
                        element={
                            <PageWrapper title="Gerenciar Aulas de Pilates - Fisiomais">
                                <GerenciarAulasPilates />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/minhas-aulas-pilates"
                        element={
                            <PageWrapper title="Minhas Aulas Pilates - Fisiomais">
                                <MinhasAulasCliente />
                            </PageWrapper>
                        }
                    />
                    <Route
                        path="/clientepage"
                        element={
                            <PageWrapper title="Dashboard Cliente - Fisiomais">
                                <ClientPage />
                            </PageWrapper>
                        }
                    />
                    
                    
                </Routes>

                <Footer />
            </div>
        </Router>
    );
}

export default App;
