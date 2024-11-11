# Gestão de Consultório de Fisioterapia e Estúdio de Pilates

Este projeto tem como objetivo criar um aplicativo para a gestão de consultórios de fisioterapia e estúdios de pilates, oferecendo ferramentas para organizar e gerenciar sessões, cadastros de clientes, planos de tratamento e outras funcionalidades essenciais para o bom funcionamento do estabelecimento.

## Funcionalidades Principais

- **Agendamento de Sessões**: Controle de horários e datas de atendimentos para fisioterapeutas e instrutores.
- **Cadastro de Pacientes e Alunos**: Armazenamento de informações pessoais, histórico de saúde e sessões realizadas.
- **Gestão Financeira**: Controle de pagamentos, faturas e recibos.
- **Planos de Tratamento**: Criação e acompanhamento de planos de tratamento para cada paciente.
- **Gestão de Colaboradores**: Cadastro e controle das agendas dos profissionais.
- **Notificações e Lembretes**: Sistema de notificação para lembrar pacientes e alunos sobre consultas e aulas.
  
## Tecnologias Utilizadas

- **Linguagem**: Python
- **Framework Web**: [Flask](https://flask.palletsprojects.com/).
- **Banco de Dados**: PostgreSQL ou SQLite
- **Frontend**: HTML, CSS, JavaScript (ou framework React.js)

## Estrutura do Projeto

O projeto está organizado da seguinte forma:

```markdown
fisiomais/
├── backend/                # Diretório do backend (Flask)
│   ├── app/
│   │   ├── __init__.py      # Inicialização do app Flask
│   │   ├── models.py        # Definição dos modelos (Pacientes, Sessões, etc.)
│   │   ├── routes.py        # Definição das rotas (API endpoints)
│   │   ├── services.py      # Lógica de negócio (ex: agendamentos, pagamentos)
│   │   └── utils.py         # Funções utilitárias
│   ├── config.py            # Configurações do Flask e do banco de dados
│   ├── requirements.txt     # Dependências do backend
│   └── wsgi.py              # Arquivo para servir a aplicação
├── frontend/                # Diretório do frontend (React.js)
│   ├── public/              # Arquivos estáticos como index.html
│   ├── src/
│   │   ├── components/      # Componentes React (ex: Navbar, Footer)
│   │   ├── pages/           # Páginas (ex: Login, Dashboard, Agendamentos)
│   │   ├── services/        # Chamadas de API (usando fetch/axios)
│   │   ├── App.js           # Arquivo principal do React
│   │   └── index.js         # Ponto de entrada do React
│   ├── package.json         # Dependências do frontend (React, Axios, etc.)
│   └── package-lock.json
├── tests/                   # Testes unitários e de integração
│   ├── backend/             # Testes para o backend
│   └── frontend/            # Testes para o frontend
├── .gitignore               # Arquivos a serem ignorados no Git
├── README.md                # Documentação do projeto
└── docker-compose.yml       # Docker Compose para orquestrar backend e frontend

```

## Como Executar o Projeto

1. Clone o repositório:
   ```bash
   git clone https://github.com/IFSERTAOPE-FLO/fisiomais.git
   ```

2. Entre na pasta do projeto:
   ```bash
   cd backend
   ```

3. Crie um ambiente virtual e ative-o:
   ```bash
   python -m venv venv
   source venv/bin/activate  # No Windows: .\venv\Scripts\activate
   ```

4. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

5. Execute o servidor de desenvolvimento:
   - Se estiver usando Flask:
     ```bash
     flask run
     ```

## Contribuição

Sinta-se à vontade para contribuir com o projeto. Sugestões e melhorias são bem-vindas! Para contribuir, siga os seguintes passos:

1. Faça um Fork do repositório.
2. Crie uma nova branch (`git checkout -b feature/MinhaFeature`).
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova funcionalidade'`).
4. Faça o push para a branch (`git push origin feature/MinhaFeature`).
5. Abra um Pull Request.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.
```

Este `README.md` cobre uma descrição básica do projeto, suas funcionalidades, tecnologias e instruções de instalação e execução. Você pode adaptá-lo conforme o desenvolvimento do app.
