# Projeto FisioMais - Backend

Este projeto é a API em Flask para o sistema FisioMais. Siga as instruções abaixo para configurar e executar o backend.

---

## Estrutura do Projeto

A estrutura principal do projeto é a seguinte:

```
backend/
├── pycache/
├── app/
│   ├── pycache/
│   ├── admin.py
│   ├── models.py
│   ├── services.py
│   ├── utils.py
│   ├── uploads/
│   └── rotas/
│       ├── pycache/
│       ├── routes.py
│       ├── routes_agendamentos.py
│       ├── routes_clientes.py
│       ├── routes_clinicas.py
│       ├── routes_colaboradores.py
│       ├── routes_dashboards.py
│       ├── routes_historico.py
│       ├── routes_pagamentos.py
│       ├── routes_pilates.py
│       ├── routes_planos_tratamentos.py
│       └── routes_servicos.py
├── instance/
├── logs/
├── migrations/
├── uploads/
├── venv/
├── .env
├── .gitignore
├── config.py
├── README.md
├── requirements.txt
└── wsgi.py
frontend/
├── build/
├── node_modules/
├── public/
│   ├── images/
│   ├── tests/
│   ├── favicon.ico
│   ├── fisiomais ico.png
│   ├── fisiomais.png
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── pilates/
│   │   │   ├── usuariocliente/
│   │   │   │   ├── css/
│   │   │   │   ├── CadastrarAulaCliente.js
│   │   │   │   └── MinhasAulasCliente.js
│   │   │   ├── usuariocolaborador/
│   │   │   │   ├── AdicionarAulaPilates.js
│   │   │   │   ├── AdicionarClienteAulaColaborador.js
│   │   │   │   ├── AulasDoCliente.js
│   │   │   │   ├── GerenciarAulasPilates.js
│   │   │   │   └── VincularAlunoPlano.js
│   │   ├── planosTratamento/
│   │   ├── AddClinica.js
│   │   ├── AddColaboradoresServicos.js
│   │   ├── CadastroClienteModal.js
│   │   ├── EditarClinica.js
│   │   ├── EditarHorarios.js
│   │   ├── EditarServicoModal.js
│   │   ├── EditarUsuario.js
│   │   ├── EscolherDiasHorariosClientesModal.js
│   │   ├── Footer.js
│   │   ├── GerenciarClinicas.js
│   │   ├── GerenciarServicos.js
│   │   ├── GerenciarUsuarios.js
│   │   ├── Navbar.js
│   │   ├── PageTitulos.js
│   │   ├── Paginator.js
│   ├── css/
│   │   ├── AdminPage.css
│   │   ├── Contato.css
│   │   ├── CriarAgendamento.css
│   │   ├── Estilos.css
│   │   ├── fullcalendar.css
│   │   ├── Home.css
│   │   ├── Navbar.css
│   │   ├── Profile.css
│   ├── pages/
│   │   ├── AddCliente.js
│   │   ├── AddColaborador.js
│   │   ├── AdminPage.js
│   │   ├── Cadastro.js
│   │   ├── CalendarioInterativo.js
│   │   ├── ClientPage.js
│   │   ├── Contato.js
│   │   ├── CriarAgendamento.js
│   │   ├── Dashboard.js
│   │   ├── DashboardCliente.js
│   │   ├── DashboardColaborador.js
│   │   ├── Especialidades.js
│   │   ├── GerenciarPagamentos.js
│   │   ├── Home.js
│   │   ├── Perfil.js
│   │   ├── SobreNos.js
│   │   ├── VisualizarAgendamentos.js
│   ├── services/
│   ├── App.css
│   ├── App.js
│   ├── App.test.js
│   ├── index.css
│   ├── index.js
│   ├── logo.svg
│   ├── reportWebVitals.js
│   └── setupTests.js
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

---

## Pré-requisitos

- **Python 3.x**
- **Virtualenv**
- **SQLite** (recomendado utilizar [DBeaver](https://dbeaver.io/) para visualizar/manipular o banco de dados)
- **Git**

---

## Configurando o Ambiente

### 1. Preparação do Ambiente Virtual

Abra o terminal e navegue até a pasta `backend`:

```bash
cd backend
```

Crie o ambiente virtual (apenas na primeira execução):

```bash
python -m venv venv
```

Ative o ambiente virtual:

Windows:

```bash
venv\Scripts\activate
```

Linux/Mac:

```bash
source venv/bin/activate
```

### 2. Instalação das Dependências

Instale as dependências listadas no arquivo `requirements.txt`:

```bash
pip install -r requirements.txt
```

Caso adicione novas dependências durante o desenvolvimento, atualize o arquivo:

```bash
pip freeze > requirements.txt
```

### 3. Configuração das Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend` (ou utilize o arquivo de exemplo `arquivo_env_exemplo.txt`) com as seguintes variáveis:

```
SECRET_KEY=sua-chave-secreta-aqui
MAIL_USERNAME=seu_email@gmail.com
MAIL_PASSWORD=sua_senha
MAIL_DEFAULT_SENDER=seu_email@gmail.com
```

### 4. Banco de Dados e Migrações

O projeto utiliza Flask-Migrate para gerenciamento do banco de dados (SQLite).

#### Inicializar o Repositório de Migrações

Apenas na primeira execução:

```bash
flask db init
```

#### Criar uma Nova Migração

Sempre que alterar os modelos, crie uma migração:

```bash
flask db migrate -m "Descrição da mudança realizada"
```

#### Aplicar as Migrações

```bash
flask db upgrade
```

### 5. Executando o Backend

Após concluir as etapas acima, inicie a aplicação Flask:

```bash
flask run
```

A aplicação será iniciada na URL `http://127.0.0.1:5000`.

---

## Credenciais de Teste

- **Email:** fisiomaispilatesefisioterapia@gmail.com  
- **Senha:** 12345

---

## Logs e Pastas

- **Logs:** Os registros de execução são armazenados na pasta `logs/` (arquivo `app.log`).
- **Uploads:** Os arquivos enviados são armazenados em `app/uploads/`.
- **Anamnese:** As fichas de anamnese para clientes ficam em `uploads/anamneses/clientes/`.

---

## Integração com o Frontend

Caso o projeto possua um frontend (por exemplo, utilizando React):

1. Abra um novo terminal.
2. Navegue até a pasta `frontend`:

```bash
cd frontend
```

3. Instale as dependências:

```bash
npm install
```

4. Inicie o frontend:

```bash
npm start
```

O frontend normalmente ficará disponível em `http://localhost:3000`.

---

## Observações Finais

- **Ambiente de Desenvolvimento:** Durante o desenvolvimento, certifique-se de que o ambiente virtual esteja ativo para evitar conflitos de dependências.
- **Atualizações:** Sempre que realizar alterações nos modelos ou adicionar novas dependências, não esqueça de atualizar o banco de dados e o arquivo `requirements.txt`.
- **Erros e Logs:** Em caso de erros, consulte os logs em `logs/app.log` para obter mais informações.

Aproveite o desenvolvimento e, em caso de dúvidas, consulte a documentação oficial do Flask e Flask-Migrate.

**Happy coding!**

