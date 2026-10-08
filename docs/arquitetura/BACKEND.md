# Backend — Documentação Técnica

## Estrutura de Pacotes

```
src/main/java/com/biblioteca/
│
├── BibliotecaApplication.java      ← Ponto de entrada Spring Boot + @EnableAsync
│
├── config/
│   ├── SecurityConfig.java         ← Desativa CSRF, configura CORS, libera endpoints
│   │                                  (quem protege de fato é o AuthInterceptor)
│   └── WebConfig.java              ← Registra AuthInterceptor e configura CORS no MVC
│
├── controller/                     ← Camada HTTP: recebe requisições, delega ao service
│   ├── AuthController.java         ← /api/auth — login, registro, logout
│   ├── AutorController.java        ← /api/autores — CRUD
│   ├── CapaController.java         ← /api/capas/{id} — serve imagem (público)
│   ├── CategoriaController.java    ← /api/categorias — CRUD
│   ├── EmprestimoController.java   ← /api/emprestimos — empréstimos e devoluções
│   ├── Filtros.java                ← /api/livros/filtros — opções de filtro do acervo
│   ├── LivroController.java        ← /api/livros — CRUD + gestão de capas
│   └── UsuarioController.java      ← /api/usuarios — CRUD
│
├── dto/                            ← Objetos de transferência de dados
│   ├── ArvoreCategorias.java       ← Estrutura hierárquica de áreas e subcategorias
│   ├── CadastroRequest.java        ← Dados de registro de novo usuário
│   ├── EmprestimoRequest.java      ← usuarioId + livroId + dataPrevista
│   ├── EmprestimoResponse.java     ← Saída com diasRestantes calculados em tempo real
│   ├── FiltroAcervo.java           ← Parâmetros de busca do acervo (texto, autor, etc.)
│   ├── FiltroCategoria.java        ← Filtro por área e/ou subcategoria
│   ├── LoginRequest.java           ← email + senha
│   ├── LoginResponse.java          ← token + dados básicos do usuário
│   ├── PaginaLivros.java           ← Resultado paginado da busca de livros
│   ├── ProrrogacaoRequest.java     ← novaDataPrevista para alterar prazo
│   ├── RelatorioSincronizacao.java ← Resultado da sincronização em lote de capas
│   ├── UsuarioDTO.java             ← Usuário sem senha para respostas seguras
│   └── UsuarioParaEmprestimo.java  ← Nome + empréstimos em aberto (tela de empréstimo)
│
├── exception/
│   ├── EstoqueInsuficienteException.java  ← HTTP 409 — sem exemplares disponíveis
│   ├── GlobalExceptionHandler.java        ← Transforma exceções em JSON `{ "erro": "..." }`
│   ├── NegocioException.java              ← HTTP 400 — regra de negócio violada
│   └── RecursoNaoEncontradoException.java ← HTTP 404 — entidade não encontrada
│
├── model/                          ← Entidades JPA mapeadas para o banco
│   ├── Autor.java                  ← tabela: autores
│   ├── CapaOrigem.java             ← enum: BRASILAPI | GOOGLE_BOOKS | OPEN_LIBRARY | MANUAL
│   ├── CapaStatus.java             ← enum: SEM_CAPA | ENCONTRADA | REVISAR
│   ├── Categoria.java              ← tabela: categorias (áreas e subcategorias)
│   ├── Emprestimo.java             ← tabela: emprestimos (enum Status: ATIVO|DEVOLVIDO|ATRASADO)
│   ├── Livro.java                  ← tabela: livros (inclui campos de capa)
│   ├── LivroCategoria.java         ← tabela: livro_categoria (N:N com campo principal)
│   ├── LivroCategoriaId.java       ← Chave composta de LivroCategoria
│   └── Usuario.java                ← tabela: usuarios (enum TipoUsuario: ALUNO|BIBLIOTECARIO)
│
├── repository/
│   ├── AutorRepository.java        ← CRUD padrão JPA
│   ├── CategoriaRepository.java    ← CRUD padrão JPA
│   ├── EmprestimoRepository.java   ← findByUsuarioId, countEmprestimosAtivos,
│   │                                  findNaoDevolvidos, listarAbertosComLivro
│   ├── LivroBuscaRepository.java   ← Busca dinâmica com filtros combinados (SQL nativo)
│   ├── LivroCategoriaRepository.java
│   ├── LivroRepository.java        ← findByIsbn, findByCapaStatus,
│   │                                  decrementarDisponivel (atômico),
│   │                                  incrementarDisponivel (atômico)
│   └── UsuarioRepository.java      ← findByEmail, existsByEmail, existsByCpf,
│                                      findByTipoOrderByNomeAsc
│
├── security/
│   ├── AuthInterceptor.java        ← Valida token em toda requisição /api/**
│   └── TokenUtil.java              ← ConcurrentHashMap de token → dados do usuário
│
└── service/
    ├── AutorService.java           ← CRUD de autores
    ├── CategoriaService.java       ← CRUD de categorias com estrutura hierárquica
    ├── EmprestimoService.java      ← Empréstimo atômico, devolução, prorrogação
    ├── LivroBuscaService.java      ← Monta e executa queries dinâmicas de busca
    ├── LivroService.java           ← CRUD com ISBN imutável, recálculo de estoque
    ├── UsuarioService.java         ← CRUD com hash BCrypt de senha
    └── capa/
        ├── ArmazenamentoCapaService.java ← Salva/remove arquivos em ./uploads/capas/
        ├── CapaCascataService.java       ← Busca em cascata: BrasilAPI → Google Books
        │                                   → Open Library
        ├── CapaLivroService.java         ← Orquestra o ciclo completo de capas
        ├── ImagemValidador.java          ← Valida magic bytes, tamanho e comparação de títulos
        └── IsbnUtil.java                 ← Valida e converte ISBN-10 ↔ ISBN-13
```

---

## Regras de Negócio

### Empréstimo
- `decrementarDisponivel` é uma query atômica: `UPDATE ... WHERE disponivel > 0`
  — evita race condition em empréstimos simultâneos do mesmo exemplar
- Se 0 linhas afetadas → `EstoqueInsuficienteException` (HTTP 409)
- O status `ATRASADO` **não é salvo no banco** — é calculado em tempo real no `EmprestimoResponse`
  comparando `dataPrevistaDevolucao` com `LocalDate.now()`

### Livro
- ISBN nunca pode ser alterado após o cadastro
- `quantidadeDisponivel` é sempre recalculado pelo service (`total - emprestados`),
  nunca aceito diretamente do cliente
- Título, autor e categoria só podem mudar se não há exemplares emprestados no momento

### Capas
Documentado separadamente em `docs/arquitetura/capas.md`.

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha antes de subir o backend:

| Variável | Descrição | Padrão |
|---|---|---|
| `DB_URL` | URL de conexão JDBC | `jdbc:mysql://localhost:3306/biblioteca...` |
| `DB_USERNAME` | Usuário do MySQL | `root` |
| `DB_PASSWORD` | Senha do MySQL | *(vazio)* |
| `JWT_SECRET` | Segredo para os tokens | *(valor fraco — trocar antes de usar)* |
| `JWT_EXPIRATION_HOURS` | Validade do token em horas | `8` |
| `ADMIN_EMAIL` | E-mail do administrador inicial | `admin@biblioteca.edu.br` |
| `ADMIN_NOME` | Nome do administrador inicial | `Administrador` |
| `ADMIN_SENHA` | Senha do administrador inicial | *(trocar antes de usar)* |
| `APP_CAPAS_DIRETORIO` | Pasta para salvar imagens de capa | `./uploads/capas` |
| `GOOGLE_BOOKS_API_KEY` | Chave da Google Books API (opcional) | *(vazio)* |

---

## Endpoints

### Auth — `/api/auth`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| POST | `/login` | Público | Login com email + senha |
| POST | `/register` | Público | Cadastro de novo usuário |
| POST | `/logout` | Autenticado | Invalida o token atual |

### Livros — `/api/livros`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/` | Autenticado | Lista paginada com filtros (texto, autor, categoria, época, estoque) |
| GET | `/{id}` | Autenticado | Busca por ID |
| GET | `/isbn/{isbn}` | Autenticado | Busca por ISBN |
| POST | `/` | Bibliotecário | Cadastra livro |
| PUT | `/{id}` | Bibliotecário | Atualiza livro |
| DELETE | `/{id}` | Bibliotecário | Exclui livro |
| POST | `/{id}/capa/buscar` | Bibliotecário | Força nova busca de capa nas APIs externas |
| POST | `/{id}/capa` | Bibliotecário | Upload manual de capa (multipart) |
| GET | `/capas/revisao` | Bibliotecário | Lista livros com capa em status `REVISAR` |
| PUT | `/{id}/capa/aprovar` | Bibliotecário | Aprova capa → `ENCONTRADA` |
| PUT | `/{id}/capa/rejeitar` | Bibliotecário | Rejeita capa → remove arquivo, volta a `SEM_CAPA` |
| POST | `/capas/sincronizar` | Bibliotecário | Processa todos os livros `SEM_CAPA` em lote |

### Capas — `/api/capas`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/{livroId}` | **Público** | Serve o arquivo de imagem com ETag e cache de 7 dias |

### Autores — `/api/autores`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/` | Autenticado | Lista todos |
| GET | `/{id}` | Autenticado | Busca por ID |
| POST | `/` | Bibliotecário | Cadastra |
| PUT | `/{id}` | Bibliotecário | Atualiza |
| DELETE | `/{id}` | Bibliotecário | Exclui |

### Categorias — `/api/categorias`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/` | Autenticado | Lista com estrutura hierárquica (áreas e subcategorias) |
| GET | `/{id}` | Autenticado | Busca por ID |
| POST | `/` | Bibliotecário | Cadastra |
| PUT | `/{id}` | Bibliotecário | Atualiza |
| DELETE | `/{id}` | Bibliotecário | Exclui |

### Usuários — `/api/usuarios`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/` | Bibliotecário | Lista todos |
| GET | `/{id}` | Autenticado | Busca por ID |
| POST | `/` | Bibliotecário | Cadastra |
| PUT | `/{id}` | Bibliotecário | Atualiza |
| DELETE | `/{id}` | Bibliotecário | Exclui |
| GET | `/para-emprestimo` | Bibliotecário | Lista alunos com empréstimos em aberto (tela de empréstimo) |

### Empréstimos — `/api/emprestimos`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/` | Bibliotecário | Lista todos |
| GET | `/{id}` | Autenticado | Busca por ID |
| GET | `/usuario/{usuarioId}` | Autenticado | Empréstimos de um usuário |
| GET | `/ativos` | Bibliotecário | Apenas `ATIVO` |
| GET | `/atrasados` | Bibliotecário | Apenas `ATRASADO` |
| POST | `/` | Autenticado | Realiza empréstimo |
| PUT | `/{id}/devolucao` | Bibliotecário | Registra devolução |
| PUT | `/{id}/prazo` | Bibliotecário | Altera data prevista de devolução |
