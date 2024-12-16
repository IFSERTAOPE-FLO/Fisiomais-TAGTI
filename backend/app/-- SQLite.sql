-- SQLite
-- Habilitar suporte a chaves estrangeiras no SQLite
PRAGMA foreign_keys = ON;


-- Tabela: Clientes
CREATE TABLE Clientes (
    ID_Cliente INTEGER PRIMARY KEY,
    nome VARCHAR(255),
    telefone_trabalho VARCHAR(20),
    telefone_pessoal VARCHAR(20),
    email VARCHAR(255),
    referencias TEXT,
    dt_nasc DATE,
    endereco VARCHAR(255),
    rua VARCHAR(255),
    estado VARCHAR(50),
    cidade VARCHAR(100),
    bairro VARCHAR(100)
);

-- Tabela: Agendamentos
CREATE TABLE Agendamentos (
    ID_Agendamento INTEGER PRIMARY KEY,
    data_e_hora DATETIME,
    ID_Cliente INTEGER,
    ID_Colaborador INTEGER,
    FOREIGN KEY (ID_Cliente) REFERENCES Clientes(ID_Cliente) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ID_Colaborador) REFERENCES Colaboradores(ID_Colaborador) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabela: Servicos
CREATE TABLE Servicos (
    ID_Servico INTEGER PRIMARY KEY,
    Nome_servico VARCHAR(255),
    Descricao TEXT,
    Valor DECIMAL(10, 2)
);

-- Tabela: Pagamentos
CREATE TABLE Pagamentos (
    ID_Pagamento INTEGER PRIMARY KEY,
    valor DECIMAL(10, 2),
    data_pagamento DATE,
    ID_servico INTEGER,
    ID_cliente INTEGER,
    FOREIGN KEY (ID_servico) REFERENCES Servicos(ID_Servico) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ID_cliente) REFERENCES Clientes(ID_Cliente) ON DELETE CASCADE ON UPDATE CASCADE
);
