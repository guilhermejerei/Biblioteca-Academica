# Documentação Técnica — Backend

## Estrutura de Pacotes

```
src/main/java/com/biblioteca/
│
├── BibliotecaApplication.java      ← Ponto de entrada Spring Boot + @EnableAsync
│
├── config/
│   ├── SecurityConfig.java         ← Spring Security: desativa CSRF, configura CORS
│   │                                  e libera todos os endpoints (AuthInterceptor faz a proteção)
│   └── WebConfig.java              ← Registra AuthInterceptor e configura CORS no MVC
│
├── controller/                     ← Camada HTTP: recebe requisições, delega ao service
│   ├── AuthController.java         ← /api/auth/login, /register, /logout
│   ├── AutorController.java        ← /api/autores — CRUD
│   ├── CapaController.java         ← /api/capas/{id} — serve imagem (público)
│   ├── CategoriaController.java    ← /api/categorias — CRUD
│   ├── EmprestimoController.java   ← /api/emprestimos — CRUD + devolução + prazo
│   ├── LivroController.java        ← /api/livros — CRUD + gestão de capas
│   └── UsuarioController.java      ← /api/usuarios — CRUD
│
├── dto/                            ← Objetos de transferência (entrada e saída)
│   ├── CadastroRequest.java        ← Dados de registro de novo usuário
│   ├── EmprestimoRequest.java      ← usuarioId + livroId para novo empréstimo
│   ├── EmprestimoResponse.java     ← DTO de saída com status calculado em tempo real
│   ├── LoginRequest.java           ← email + senha
│   ├── LoginResponse.java          ← token + dados básicos do usuário
│   ├── ProrrogacaoRequest.java     ← novaDataPrevista para alterar prazo
│   ├── RelatorioSincronizacao.java ← resultado da sincronização em lote de capas
│   └── UsuarioDTO.java             ← usuário sem campo senha para respostas seguras
│
├── exception/                      ← Hierarquia de exceções de negócio
│   ├── EstoqueInsuficienteException.java  ← HTTP 409 — sem exemplares disponíveis
│   ├── GlobalExceptionHandler.java        ← @RestControllerAdvice: transforma exceções em JSON
│   ├── NegocioException.java              ← HTTP 400 — regra de negócio violada
│   └── RecursoNaoEncontradoException.java ← HTTP 404 — entidade não encontrada por ID
│
├── model/                          ← Entidades JPA mapeadas para tabelas do banco
│   ├── Autor.java                  ← tabela: autores
│   ├── CapaOrigem.java             ← enum: BRASILAPI | GOOGLE_BOOKS | OPEN_LIBRARY | MANUAL
│   ├── CapaStatus.java             ← enum: SEM_CAPA | ENCONTRADA | REVISAR
│   ├── Categoria.java              ← tabela: categorias
│   ├── Emprestimo.java             ← tabela: emprestimos (enum Status: ATIVO|DEVOLVIDO|ATRASADO)
│   ├── Livro.java                  ← tabela: livros (inclui campos de capa)
│   └── Usuario.java                ← tabela: usuarios (enum TipoUsuario: ALUNO|BIBLIOTECARIO)
│
├── repository/                     ← Interfaces JPA — acesso ao banco
│   ├── AutorRepository.java
│   ├── CategoriaRepository.java
│   ├── EmprestimoRepository.java   ← queries: countEmprestimosAtivos, findNaoDevolvidos
│   ├── LivroRepository.java        ← queries: findByIsbn, findByCapaStatus,
│   │                                            decrementarDisponivel (atômico),
│   │                                            incrementarDisponivel (atômico)
│   └── UsuarioRepository.java      ← queries: findByEmail, existsByEmail, existsByCpf
│
├── security/
│   ├── AuthInterceptor.java        ← HandlerInterceptor: valida token em toda requisição
│   └── TokenUtil.java              ← Gerencia mapa token→dados em ConcurrentHashMap
│
└── service/
    ├── AutorService.java           ← CRUD de autores
    ├── CategoriaService.java       ← CRUD de categorias
    ├── EmprestimoService.java      ← Empréstimo atômico, devolução idempotente,
    │                                  status calculado, prorrogação com validações
    ├── LivroService.java           ← CRUD com ISBN imutável, recálculo de estoque
    ├── UsuarioService.java         ← CRUD com hash BCrypt de senha
    └── capa/
        ├── ArmazenamentoCapaService.java ← Salva/remove arquivos em ./uploads/capas/
        │                                   com proteção contra path traversal
        ├── CapaCascataService.java       ← Busca em cascata: BrasilAPI → Google Books
        │                                   → Open Library, com retry em 5xx
        ├── CapaLivroService.java         ← Orquestra o ciclo completo de capas:
        │                                   busca assíncrona, validação, revisão manual,
        │                                   sincronização em lote
        ├── ImagemValidador.java          ← Valida magic bytes (JPEG/PNG/WebP),
        │                                   tamanho máximo 2MB, largura mínima 100px,
        │                                   comparação de títulos por Jaccard
        └── IsbnUtil.java                 ← Valida e converte ISBN-10 ↔ ISBN-13
```

## Regras de Negócio Importantes

### Empréstimo
- `decrementarDisponivel` é uma query atômica (`UPDATE ... WHERE disponivel > 0`) — evita race condition em empréstimos simultâneos do mesmo livro
- Se 0 linhas afetadas → `EstoqueInsuficienteException` (409)
- Status do empréstimo **não é salvo** como ATRASADO no banco — é calculado em tempo real no `EmprestimoResponse.de()` comparando `dataPrevistaDevolucao` com `LocalDate.now()`

### Livro
- ISBN nunca pode ser alterado após cadastro (identidade física do exemplar)
- `quantidadeDisponivel` é sempre recalculado pelo service (`total - emprestados`), nunca aceito do cliente
- Título/autor/categoria só podem mudar sem empréstimos ativos

### Capas
- Capa `MANUAL` nunca é sobrescrita por busca automática
- Capa `REVISAR` não aparece publicamente (`urlCapa` retorna null) — bibliotecário vê via `urlCapaInterna`
- Nomenclatura de arquivo é determinística: `capa_livro_{id}.{ext}` — previne colisões

## Configuração de Variáveis de Ambiente

Todas as configurações sensíveis ficam em `.env` (nunca commitado). Copie `.env.example` para `.env` e preencha:

| Variável | Descrição | Padrão |
|---|---|---|
| `DB_URL` | URL de conexão JDBC | `jdbc:mysql://localhost:3306/biblioteca...` |
| `DB_USERNAME` | Usuário do MySQL | `root` |
| `DB_PASSWORD` | Senha do MySQL | *(vazio)* |
| `JWT_SECRET` | Segredo para tokens | *(valor inseguro de dev)* |
| `JWT_EXPIRATION_HOURS` | Validade do token em horas | `8` |
| `ADMIN_EMAIL` | E-mail do admin inicial | `admin@biblioteca.edu.br` |
| `ADMIN_SENHA` | Senha do admin inicial | *(trocar antes de usar)* |
| `APP_CAPAS_DIRETORIO` | Pasta para salvar capas | `./uploads/capas` |
| `GOOGLE_BOOKS_API_KEY` | Chave API Google Books (opcional) | *(vazio)* |

## Endpoints Completos

### Auth — `/api/auth`
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| POST | `/login` | Público | Login com email + senha |
| POST | `/register` | Público | Cadastro de novo usuário |
| POST | `/logout` | Autenticado | Invalida o token atual |

### Livros — `/api/livros`
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/` | Autenticado | Lista todos os livros |
| GET | `/{id}` | Autenticado | Busca por ID |
| GET | `/isbn/{isbn}` | Autenticado | Busca por ISBN |
| POST | `/` | Bibliotecário | Cadastra livro |
| PUT | `/{id}` | Bibliotecário | Atualiza livro |
| DELETE | `/{id}` | Bibliotecário | Exclui livro |
| POST | `/{id}/capa/buscar` | Bibliotecário | Força nova busca de capa |
| POST | `/{id}/capa` | Bibliotecário | Upload manual de capa |
| GET | `/capas/revisao` | Bibliotecário | Lista livros com capa em REVISAR |
| PUT | `/{id}/capa/aprovar` | Bibliotecário | Aprova capa em revisão |
| PUT | `/{id}/capa/rejeitar` | Bibliotecário | Rejeita capa em revisão |
| POST | `/capas/sincronizar` | Bibliotecário | Sincronização em lote |

### Capas — `/api/capas`
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/{livroId}` | **Público** | Serve arquivo de imagem com ETag e cache 7 dias |

### Empréstimos — `/api/emprestimos`
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/` | Bibliotecário | Lista todos |
| GET | `/{id}` | Autenticado | Busca por ID |
| GET | `/usuario/{usuarioId}` | Autenticado | Por usuário |
| GET | `/ativos` | Bibliotecário | Apenas ATIVO |
| GET | `/atrasados` | Bibliotecário | Apenas ATRASADO |
| POST | `/` | Autenticado | Realiza empréstimo |
| PUT | `/{id}/devolucao` | Bibliotecário | Registra devolução |
| PUT | `/{id}/prazo` | Bibliotecário | Altera data prevista |
