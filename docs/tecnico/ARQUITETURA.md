# Arquitetura do Sistema

## Visão Geral

O sistema é uma aplicação web de biblioteca universitária composta por dois projetos independentes que se comunicam via HTTP:

```
┌─────────────────────┐        HTTP/JSON        ┌──────────────────────┐
│   biblioteca-       │ ◄──────────────────────► │   biblioteca-        │
│   frontend          │       porta 8080          │   backend            │
│   (React + Vite)    │                           │   (Spring Boot)      │
│   porta 5173        │                           │                      │
└─────────────────────┘                           └──────────┬───────────┘
                                                             │ JPA/Hibernate
                                                             ▼
                                                  ┌──────────────────────┐
                                                  │   MySQL              │
                                                  │   banco: biblioteca  │
                                                  │   porta 3306         │
                                                  └──────────────────────┘
```

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | React | 18 |
| Build frontend | Vite | 5 |
| Roteamento | React Router | 6 |
| HTTP client | Axios | 1.x |
| Backend | Spring Boot | 3.4.5 |
| Linguagem | Java | 25 |
| Persistência | Spring Data JPA + Hibernate | — |
| Banco de dados | MySQL | 8+ |
| Build backend | Maven | 3.8+ |
| Autenticação | Token UUID em memória (TokenUtil) | — |
| Hash de senha | BCrypt (Spring Security) | — |

## Fluxo de uma Requisição

```
Usuário clica num botão
        │
        ▼
Componente React chama função em src/api/*.js
        │
        ▼
Axios envia requisição HTTP com header Authorization: Bearer <token>
        │
        ▼
Spring Boot recebe no Controller correspondente
        │
        ▼
AuthInterceptor valida o token antes de qualquer método
        │  (retorna 401 se inválido, 403 se sem permissão)
        ▼
Controller chama o Service
        │
        ▼
Service aplica regras de negócio e chama o Repository
        │
        ▼
Repository executa SQL via Hibernate no MySQL
        │
        ▼
Resultado volta pelo mesmo caminho como JSON
        │
        ▼
React atualiza o estado e re-renderiza a tela
```

## Autenticação e Autorização

O sistema usa um mecanismo de token simples baseado em UUID (não JWT):

1. `POST /api/auth/login` valida email + senha com BCrypt
2. Gera um UUID em Base64 e armazena em `TokenUtil` (mapa em memória)
3. O token é retornado ao frontend e guardado em `localStorage`
4. Cada requisição envia `Authorization: Bearer <token>`
5. `AuthInterceptor.preHandle()` intercepta toda requisição em `/api/**`, extrai o token, valida no mapa e injeta `usuarioId`, `usuarioTipo` e `usuarioEmail` como atributos do request
6. Quando o servidor reinicia, todos os tokens são invalidados (usuários precisam fazer login de novo)

**Perfis:**
- `ALUNO` — acesso de leitura ao acervo e aos próprios empréstimos
- `BIBLIOTECARIO` — acesso total, incluindo criação e edição de livros, usuários, empréstimos

## CORS

Configurado em dois pontos por razões técnicas:
- `SecurityConfig` — filtro do Spring Security (processa preflight OPTIONS antes do interceptor)
- `WebConfig` — configuração MVC (para requisições normais)

As origens permitidas são lidas de variável de ambiente (ou padrão `localhost:5173` e `localhost:3000`).

## Banco de Dados

O esquema é gerenciado pelo Hibernate com `ddl-auto=update` (cria e altera tabelas automaticamente). As migrações históricas estão em `src/main/resources/migracoes/` como scripts SQL de referência.

**Tabelas:**

| Tabela | Descrição |
|---|---|
| `autores` | Autores dos livros |
| `categorias` | Categorias/gêneros literários |
| `livros` | Acervo completo com controle de estoque e capas |
| `usuarios` | Usuários do sistema (alunos e bibliotecários) |
| `emprestimos` | Registro de empréstimos e devoluções |
