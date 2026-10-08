# Arquitetura do Sistema

## Visão Geral

O sistema é uma aplicação web de biblioteca composta por dois projetos independentes
que se comunicam via HTTP:

```
┌──────────────────────┐        HTTP/JSON        ┌──────────────────────┐
│  biblioteca-         │ ◄──────────────────────► │  biblioteca-         │
│  frontend            │       porta 8080          │  backend             │
│  (React + Vite)      │                           │  (Spring Boot)       │
│  porta 5173          │                           │                      │
└──────────────────────┘                           └──────────┬───────────┘
                                                              │ JPA/Hibernate
                                                              ▼
                                                   ┌──────────────────────┐
                                                   │  MySQL               │
                                                   │  banco: biblioteca   │
                                                   │  porta 3306          │
                                                   └──────────────────────┘
```

---

## Stack

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
| Hash de senha | BCrypt (Spring Security) | — |

---

## Fluxo de uma Requisição

```
Usuário clica num botão
        │
        ▼
Componente React chama função em src/api/*.js
        │
        ▼
Axios envia HTTP com header Authorization: Bearer <token>
        │
        ▼
Spring Boot recebe no Controller correspondente
        │
        ▼
AuthInterceptor valida o token antes de qualquer método
        │  401 se inválido · 403 se sem permissão
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

---

## Autenticação e Autorização

O sistema usa tokens UUID armazenados em memória no servidor (não JWT):

1. `POST /api/auth/login` valida email + senha com BCrypt
2. Gera um UUID, armazena no `TokenUtil` (mapa em `ConcurrentHashMap`)
3. O token é retornado ao frontend e guardado em `localStorage`
4. Cada requisição envia `Authorization: Bearer <token>`
5. `AuthInterceptor.preHandle()` intercepta toda requisição em `/api/**`, valida
   o token no mapa e injeta `usuarioId`, `usuarioTipo` e `usuarioEmail` no request
6. Quando o servidor reinicia, todos os tokens são invalidados — usuários precisam logar novamente

**Perfis:**
- `ALUNO` — acesso de leitura ao acervo e aos próprios empréstimos
- `BIBLIOTECARIO` — acesso total, incluindo cadastro e gestão de livros, usuários e empréstimos

---

## CORS

Configurado em dois pontos por razões técnicas:
- `SecurityConfig` — filtro do Spring Security (processa preflight `OPTIONS` antes do interceptor)
- `WebConfig` — configuração MVC (para requisições normais)

As origens permitidas são `http://localhost:5173` e `http://localhost:3000` por padrão.
Em produção, atualizar nos dois arquivos (ou via variável de ambiente).

---

## Banco de Dados

**Tabelas:**

| Tabela | Descrição |
|---|---|
| `autores` | Autores dos livros |
| `categorias` | Áreas e subcategorias (dois níveis) |
| `livros` | Acervo completo com controle de estoque e capas |
| `livro_categoria` | Relação N:N entre livros e categorias |
| `usuarios` | Usuários do sistema (alunos e bibliotecários) |
| `emprestimos` | Registro de empréstimos e devoluções |

O esquema completo está em `docs/banco/instalar/01-esquema.sql`.
As migrações históricas estão em `docs/banco/migracoes/`.
