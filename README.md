# Biblioteca Acadêmica

Sistema completo de gerenciamento de acervo e empréstimos para biblioteca universitária, desenvolvido como projeto acadêmico.

**Backend:** Spring Boot 3.4.5 · Java 25 · MySQL  
**Frontend:** React 18 · Vite 5 · React Router 6

---

## Funcionalidades

- Catálogo de livros com busca, filtros e paginação
- Gestão de autores e categorias com busca integrada
- Controle de empréstimos e devoluções com histórico
- Sistema de capas automático: busca nas APIs BrasilAPI, Google Books e Open Library em cascata
- Dois perfis de acesso: **Aluno** (leitura e próprios empréstimos) e **Bibliotecário** (acesso total)
- Interface responsiva para desktop e mobile

---

## Estrutura do Repositório

```
Projeto web/
├── biblioteca-backend/     ← API REST (Spring Boot + Maven)
├── biblioteca-frontend/    ← Interface web (React + Vite)
├── docs/
│   ├── CAPAS.md            ← Arquitetura do sistema de capas
│   ├── REGRAS_E_BASE_LEGAL.md
│   └── tecnico/
│       ├── ARQUITETURA.md  ← Visão geral do sistema
│       ├── BACKEND.md      ← Estrutura de pacotes, regras e endpoints
│       ├── FRONTEND.md     ← Componentes, design system e roteamento
│       └── CAPAS.md        ← Implementação interna do sistema de capas
├── dados.sql               ← Script SQL com dados de exemplo
└── README.md               ← Este arquivo
```

---

## Pré-requisitos

| Ferramenta | Versão mínima | Download |
|---|---|---|
| Java JDK | 25 | https://adoptium.net |
| Maven | 3.8+ | https://maven.apache.org |
| MySQL | 8.0+ | https://dev.mysql.com/downloads |
| Node.js | 18+ | https://nodejs.org |

---

## Configuração Inicial

### 1. Banco de dados

No MySQL Workbench ou terminal MySQL:

```sql
CREATE DATABASE biblioteca CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Variáveis de ambiente do backend

```bash
cd biblioteca-backend
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
DB_USERNAME=root
DB_PASSWORD=sua_senha_aqui
JWT_SECRET=uma_string_longa_e_aleatoria_aqui
ADMIN_SENHA=SenhaSegura@2026
```

> O Hibernate criará todas as tabelas automaticamente na primeira execução.

### 3. Variáveis de ambiente do frontend

```bash
cd biblioteca-frontend
cp .env.example .env
```

O arquivo padrão já aponta para `http://localhost:8080/api` — não precisa alterar para desenvolvimento local.

---

## Executando o Projeto

### Backend

```bash
cd biblioteca-backend
mvn spring-boot:run
```

O servidor sobe em `http://localhost:8080`. Para confirmar:

```bash
curl http://localhost:8080/api/livros
# deve retornar [] ou a lista de livros
```

### Frontend

```bash
cd biblioteca-frontend
npm install
npm run dev
```

Acesse em `http://localhost:5173`.

> O **DevTools** do Spring Boot reinicia o servidor ao salvar arquivos Java.  
> O **Vite** atualiza o navegador ao salvar arquivos React.

---

## Primeiro Acesso

Na primeira execução, o sistema cria automaticamente um usuário administrador com as credenciais definidas em `.env`:

```
E-mail: admin@biblioteca.edu.br  (ou o valor de ADMIN_EMAIL)
Senha:  o valor de ADMIN_SENHA
```

Use estas credenciais para entrar como **Bibliotecário** e começar a cadastrar o acervo.

### Ordem recomendada de cadastro

```
1. Autores      → menu Autores → Novo Autor
2. Categorias   → menu Categorias → Nova Categoria
3. Livros       → menu Livros → Novo Livro
4. Usuários     → registram-se pelo link "Cadastre-se" na tela de login
5. Empréstimos  → menu Empréstimos → Novo Empréstimo
```

---

## Capas de Livros

Ao cadastrar um livro com ISBN válido, o sistema busca a capa automaticamente nas APIs externas. Para livros já cadastrados:

1. Acesse o menu **Livros** como bibliotecário
2. Clique em **Sincronizar Capas** — o sistema processa todos os livros sem capa
3. Um toast no canto da tela informa o progresso e o resultado
4. Se alguma capa ficar com status "para revisar", um botão âmbar aparece no cabeçalho para você aprovar ou rejeitar

---

## Dados de Exemplo

O arquivo `dados.sql` na raiz contém um conjunto de livros, autores e categorias para demonstração. Para importar:

```bash
mysql -u root -p biblioteca < dados.sql
```

---

## Testando a API

Para testar os endpoints sem o frontend, use o [Postman](https://www.postman.com/), [Insomnia](https://insomnia.rest/) ou o [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) do VS Code.

**Exemplo — login:**
```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "admin@biblioteca.edu.br",
  "senha": "SenhaSegura@2026"
}
```

**Exemplo — listar livros (com token):**
```http
GET http://localhost:8080/api/livros
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## Executando os Testes

```bash
cd biblioteca-backend
mvn test
```

Os testes cobrem os services principais (empréstimos, livros, capas) e o controller de capas.

---

## Documentação Técnica

A pasta `docs/tecnico/` contém documentação detalhada para cada parte do sistema:

| Arquivo | Conteúdo |
|---|---|
| [`ARQUITETURA.md`](docs/tecnico/ARQUITETURA.md) | Visão geral, stack, fluxo de requisição e autenticação |
| [`BACKEND.md`](docs/tecnico/BACKEND.md) | Estrutura de pacotes, regras de negócio, endpoints completos |
| [`FRONTEND.md`](docs/tecnico/FRONTEND.md) | Componentes, sistema de design, roteamento |
| [`CAPAS.md`](docs/tecnico/CAPAS.md) | Sistema de busca, validação e armazenamento de capas |

---

## Variáveis de Ambiente — Referência Completa

### Backend (`biblioteca-backend/.env`)

| Variável | Descrição | Padrão |
|---|---|---|
| `DB_URL` | URL JDBC de conexão | `jdbc:mysql://localhost:3306/biblioteca...` |
| `DB_USERNAME` | Usuário MySQL | `root` |
| `DB_PASSWORD` | Senha MySQL | *(vazio)* |
| `JWT_SECRET` | Segredo para tokens (mín. 32 chars) | *(valor inseguro de dev)* |
| `JWT_EXPIRATION_HOURS` | Validade do token em horas | `8` |
| `ADMIN_EMAIL` | E-mail do administrador inicial | `admin@biblioteca.edu.br` |
| `ADMIN_NOME` | Nome do administrador inicial | `Administrador` |
| `ADMIN_SENHA` | Senha do administrador inicial | *(trocar antes de usar)* |
| `APP_CAPAS_DIRETORIO` | Pasta para arquivos de capa | `./uploads/capas` |
| `GOOGLE_BOOKS_API_KEY` | Chave API Google Books (opcional) | *(vazio)* |

### Frontend (`biblioteca-frontend/.env`)

| Variável | Descrição | Padrão |
|---|---|---|
| `VITE_API_URL` | URL base da API do backend | `http://localhost:8080/api` |

---

## Tecnologias Utilizadas

**Backend**
- Spring Boot 3.4.5 com Spring Data JPA, Spring Security (BCrypt) e Spring Web
- MySQL 8 com Hibernate
- Maven para build e dependências
- `spring-dotenv` para leitura de `.env`

**Frontend**
- React 18 com Hooks e Context API
- React Router 6 para roteamento SPA
- Axios para requisições HTTP
- Vite 5 como bundler e servidor de desenvolvimento
- Fontes: Newsreader (títulos) e DM Sans (interface) via Google Fonts
