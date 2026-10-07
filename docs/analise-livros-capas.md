# Análise do Sistema de Livros e Capas — Projeto Biblioteca

**Data:** Julho de 2026  
**Escopo:** Backend Spring Boot 3.4.5 + Frontend React/Vite  
**Análise:** Modelos, Controllers, Services, Repositories, DTOs e Frontend relativos a Livros, Capas, Autores e Categorias.

---

## Sumário Executivo

O projeto é um sistema de biblioteca escolar/acadêmica composto por um backend Spring Boot com MySQL e um frontend React. O sistema de livros é bem estruturado com regras de negócio explícitas (ISBN imutável, controle de estoque atômico, restrição de edição com empréstimos ativos). O sistema de capas é o componente mais sofisticado: busca imagens automaticamente em três APIs externas em cascata (BrasilAPI → Google Books → Open Library), valida o arquivo binário por magic bytes e tamanho, compara títulos para detectar capas incorretas, e implementa um fluxo de revisão manual pelo bibliotecário. O frontend consome esses recursos com o componente `CapaLivro` que exibe a imagem real ou faz fallback para uma capa gerada em CSS com paleta determinística. O sistema está em boa forma geral, com cobertura de testes unitários para os serviços de capa. Foram identificados alguns pontos de atenção relevantes.

---

## 1. Estrutura Tecnológica

### Backend
- **Stack:** Spring Boot 3.4.5, Java 25, Spring Data JPA, Spring Security (usado apenas para BCrypt), MySQL
- **Autenticação:** JWT customizado via `AuthInterceptor` + `TokenUtil` (não usa Spring Security filter chain padrão)
- **Build:** Maven (`pom.xml`)
- **Configuração:** `application.properties` com suporte a variáveis de ambiente via `spring-dotenv`

### Frontend
- **Stack:** React + Vite, Axios
- **API:** `src/api/config.js` — instância Axios com interceptors de autenticação e redirecionamento 401

---

## 2. Modelos / Entidades

### `Livro` (`model/Livro.java`)
Tabela: `livros`

| Campo | Tipo Java | Coluna SQL | Restrições |
|---|---|---|---|
| `id` | `Long` | `id` | PK, auto-increment |
| `titulo` | `String` | `titulo` | NOT NULL |
| `isbn` | `String` | `isbn` | NOT NULL, UNIQUE |
| `anoPublicacao` | `Integer` | `ano_publicacao` | nullable |
| `quantidadeTotal` | `Integer` | `quantidade_total` | NOT NULL |
| `quantidadeDisponivel` | `Integer` | `quantidade_disponivel` | NOT NULL |
| `autor` | `Autor` | `autor_id` (FK) | NOT NULL |
| `categoria` | `Categoria` | `categoria_id` (FK) | NOT NULL |
| `capaArquivo` | `String` | `capa_arquivo` | nullable — nome do arquivo no disco |
| `capaOrigem` | `CapaOrigem` (enum) | `capa_origem` | nullable — BRASILAPI, GOOGLE_BOOKS, OPEN_LIBRARY, MANUAL |
| `capaStatus` | `CapaStatus` (enum) | `capa_status` | NOT NULL, default `SEM_CAPA` |
| `capaAtualizadaEm` | `LocalDateTime` | `capa_atualizada_em` | nullable |
| `emprestimos` | `List<Emprestimo>` | (via FK) | `@JsonIgnore`, cascade ALL |

**Propriedades calculadas (JSON):**
- `urlCapa`: retorna `/api/capas/{id}` somente se `capaStatus == ENCONTRADA` e `capaArquivo != null`
- `urlCapaInterna`: retorna `/api/capas/{id}` se `capaArquivo != null` (usado pelo bibliotecário mesmo em status REVISAR)

**Relacionamentos:**
- `@ManyToOne` com `Autor` (N livros → 1 autor)
- `@ManyToOne` com `Categoria` (N livros → 1 categoria)
- `@OneToMany` com `Emprestimo` (1 livro → N empréstimos), `@JsonIgnore`

---

### `Autor` (`model/Autor.java`)
Tabela: `autores`

| Campo | Tipo | Restrições |
|---|---|---|
| `id` | `Long` | PK, auto-increment |
| `nome` | `String` | NOT NULL |
| `livros` | `List<Livro>` | `@JsonIgnore`, cascade ALL |

**Relacionamentos:** `@OneToMany` com `Livro`, mapeado por `autor`. `@JsonIgnore` impede loop de serialização.

---

### `Categoria` (`model/Categoria.java`)
Tabela: `categorias`

| Campo | Tipo | Restrições |
|---|---|---|
| `id` | `Long` | PK, auto-increment |
| `nome` | `String` | NOT NULL |
| `livros` | `List<Livro>` | `@JsonIgnore`, cascade ALL |

**Relacionamentos:** `@OneToMany` com `Livro`, mapeado por `categoria`. `@JsonIgnore` impede loop.

---

### `CapaOrigem` (`model/CapaOrigem.java`) — Enum
```
BRASILAPI | GOOGLE_BOOKS | OPEN_LIBRARY | MANUAL
```
Registra a fonte de onde a imagem foi obtida.

### `CapaStatus` (`model/CapaStatus.java`) — Enum
```
ENCONTRADA | SEM_CAPA | REVISAR
```
- `ENCONTRADA`: capa aprovada, `urlCapa` pública disponível
- `SEM_CAPA`: sem arquivo de capa
- `REVISAR`: capa encontrada mas com divergência de título — aguardando aprovação do bibliotecário, **não exposta publicamente**

---

## 3. Controllers e Endpoints da API

### `LivroController` — `/api/livros`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/livros` | Autenticado | Lista todos os livros |
| GET | `/api/livros/{id}` | Autenticado | Busca livro por ID |
| GET | `/api/livros/isbn/{isbn}` | Autenticado | Busca livro por ISBN |
| POST | `/api/livros` | Bibliotecário | Cadastra novo livro |
| PUT | `/api/livros/{id}` | Bibliotecário | Atualiza livro existente |
| DELETE | `/api/livros/{id}` | Bibliotecário | Exclui livro |
| POST | `/api/livros/{id}/capa/buscar` | Bibliotecário | Força nova busca de capa nas fontes externas |
| POST | `/api/livros/{id}/capa` | Bibliotecário | Upload manual de capa (multipart: campo `arquivo` ou `file`) |
| GET | `/api/livros/capas/revisao` | Bibliotecário | Lista livros com capa em status REVISAR |
| PUT | `/api/livros/{id}/capa/aprovar` | Bibliotecário | Aprova capa em revisão → status ENCONTRADA |
| PUT | `/api/livros/{id}/capa/rejeitar` | Bibliotecário | Rejeita capa → remove arquivo, status SEM_CAPA |
| POST | `/api/livros/capas/sincronizar` | Bibliotecário | Sincronização em lote de capas para livros SEM_CAPA |

**Retorno padrão de erros:** JSON `{ "erro": "mensagem em português" }` via `GlobalExceptionHandler`.

---

### `CapaController` — `/api/capas`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/capas/{livroId}` | **Público** (sem token) | Serve o arquivo de imagem da capa do livro |

**Detalhes de cache:**
- Responde `Cache-Control: public, max-age=604800` (7 dias)
- Gera `ETag` baseado em `{livroId}-{lastModifiedMs}-{tamanhoBytes}`
- Suporta `If-None-Match` → responde `304 Not Modified` quando cache válido
- Detecta Content-Type por extensão do arquivo (`.jpg` → `image/jpeg`, `.png` → `image/png`, `.webp` → `image/webp`)

---

### `AutorController` — `/api/autores`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/autores` | Autenticado | Lista todos os autores |
| GET | `/api/autores/{id}` | Autenticado | Busca autor por ID |
| POST | `/api/autores` | Bibliotecário | Cadastra novo autor |
| PUT | `/api/autores/{id}` | Bibliotecário | Atualiza autor |
| DELETE | `/api/autores/{id}` | Bibliotecário | Exclui autor |

---

### `CategoriaController` — `/api/categorias`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/categorias` | Autenticado | Lista todas as categorias |
| GET | `/api/categorias/{id}` | Autenticado | Busca categoria por ID |
| POST | `/api/categorias` | Bibliotecário | Cadastra nova categoria |
| PUT | `/api/categorias/{id}` | Bibliotecário | Atualiza categoria |
| DELETE | `/api/categorias/{id}` | Bibliotecário | Exclui categoria |

---

## 4. Lógica de Negócio nos Services

### `LivroService`

**`salvar(Livro livro)`:**
1. Valida existência do `Autor` e `Categoria` pelo ID — lança `RecursoNaoEncontradoException` (→ 404) se ausentes
2. Se `quantidadeTotal` não informada, assume valor de `quantidadeDisponivel`
3. Salva no banco
4. Dispara `capaLivroService.buscarCapaAssincrono(id)` — não bloqueia o cadastro

**`atualizar(Long id, Livro livroAtualizado)`:**
Regras de negócio rígidas:
- **ISBN é imutável** — lança `NegocioException` (→ 400) se tentar alterar
- Título, autor ou categoria só podem mudar se `countEmprestimosAtivos == 0` — proteção contra modificar um livro com exemplares em circulação
- `quantidadeTotal` pode ser reduzida, mas nunca para menos que os exemplares atualmente emprestados
- `quantidadeDisponivel` é **sempre recalculado** (`= novoTotal - emprestados`) — nunca aceito do cliente

**`excluir(Long id)`:**
- Valida existência, deleta com cascade (empréstimos vinculados são deletados via `CascadeType.ALL`)

---

### `AutorService` e `CategoriaService`
CRUD simples sem regras de negócio específicas além da existência do registro. Lançam `RuntimeException` genérico em vez de `RecursoNaoEncontradoException` — **inconsistência identificada** (ver Pontos de Atenção).

---

### `CapaLivroService` — Orquestração completa do ciclo de vida de capas

**`buscarCapaAssincrono(Long livroId)`:**  
Chama `buscarCapaSincrono` em thread separada (`@Async`). Falhas são silenciosas (apenas log de erro), garantindo que o cadastro do livro nunca falhe por conta das APIs externas.

**`buscarCapaSincrono(Long livroId, boolean forcar)`:**  
Fluxo:
1. Carrega livro; se `capaOrigem == MANUAL`, aborta (capas manuais são imutáveis)
2. Se já `ENCONTRADA` e não forçado, retorna sem fazer nada
3. Valida/normaliza ISBN via `IsbnUtil` — se inválido, marca `SEM_CAPA` e retorna
4. Chama `capaCascataService.buscarCapaEmCascata(isbn13)`
5. Valida imagem retornada via `ImagemValidador.validar(bytes)` — rejeita se: vazia, > 2MB, formato inválido, largura < 100px
6. Salva arquivo no disco via `armazenamentoCapaService.salvarCapa()`
7. Compara título do livro com o título retornado pela fonte:
   - Compatíveis → `CapaStatus.ENCONTRADA`
   - Divergentes → `CapaStatus.REVISAR`
8. Persiste livro atualizado

**`salvarCapaManual(Long livroId, MultipartFile file)`:**  
- Mesmas validações de imagem do fluxo automático
- Define origem `MANUAL` e status `ENCONTRADA` diretamente (sem revisão)
- Capa manual **nunca é sobrescrita** por buscas automáticas futuras

**`aprovarCapa(Long livroId)`:**  
Muda status de `REVISAR` para `ENCONTRADA` sem alterar o arquivo.

**`rejeitarCapa(Long livroId)`:**  
Remove arquivo físico via `armazenamentoCapaService.removerCapa()`, limpa `capaArquivo`, `capaOrigem`, define `SEM_CAPA`.

**`sincronizarCapasLote()`:**  
- Processa todos os livros com `CapaStatus.SEM_CAPA`
- Pula livros com `capaOrigem == MANUAL`
- Valida ISBN antes de tentar busca externa
- Pausa de 550ms entre cada processamento (proteção de rate limit)
- Retorna `RelatorioSincronizacao` com contadores de: total, encontradas, semCapa, emRevisao, isbnsInvalidos

---

### `CapaCascataService` — Busca em três fontes externas

**Ordem de busca (para no primeiro sucesso):**

1. **BrasilAPI** — `https://brasilapi.com.br/api/isbn/v1/{isbn13}`  
   JSON → campo `cover_url` → download da imagem; extrai `title` para comparação

2. **Google Books** — `https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn13}`  
   JSON → `items[0].volumeInfo.imageLinks` → seleção da maior resolução disponível (`extraLarge > large > medium > small > thumbnail`); converte `http://` para `https://`; extrai `volumeInfo.title`

3. **Open Library** — `https://covers.openlibrary.org/b/isbn/{isbn13}-L.jpg?default=false`  
   Download direto da imagem; sem título disponível (retorna `null`, tratado como compatível)

**Configurações de rede:**
- Timeout: 5 segundos por chamada (connect + read) via `JdkClientHttpRequestFactory`
- Retry: 1 nova tentativa **apenas em erros 5xx**, com pausa de 500ms
- Erros 4xx, timeout e falhas de conexão: sem retry, passa para próxima fonte
- User-Agent customizado: `BibliotecaAcervo/1.0 (projeto-academico; contato@biblioteca.edu.br)`
- Google Books API Key: opcional, lida de `GOOGLE_BOOKS_API_KEY` (env var)

---

### `ArmazenamentoCapaService` — Armazenamento local de arquivos

- Diretório configurável: `app.capas.diretorio` (padrão `./uploads/capas`)
- Nomenclatura determinística: `capa_livro_{id}.{ext}` — previne colisões e facilita limpeza
- `salvarCapa()` e `removerCapa()` são `synchronized` — proteção contra condição de corrida em chamadas concorrentes
- **Path traversal prevention:** `resolverCaminhoSeguro()` rejeita qualquer `nomeArquivo` contendo `/`, `\` ou `..`, e verifica que o path resolvido começa com o diretório base (`startsWith(diretorioBase)`)
- Ao salvar, remove versões anteriores da capa do mesmo livro (`removerCapa()` antes de `write`)

---

### `ImagemValidador` — Validação binária de imagens

- **Magic bytes** para detectar tipo real (ignora Content-Type do HTTP):
  - JPEG: `FF D8 FF`
  - PNG: `89 50 4E 47 0D 0A 1A 0A`
  - WebP: `RIFF....WEBP`
- Tamanho máximo: 2 MB
- Largura mínima: 100px (descarta placeholders e imagens corrompidas)
- `titulosCompativeis()`: normaliza (remove acentos, pontuação, lowercase), depois verifica:
  1. Igualdade ou containment de strings
  2. Interseção de tokens (palavras > 2 chars): compatível se ≥ 50% das palavras do título cadastrado estão presentes
  3. Similaridade de Jaccard ≥ 0.35 como fallback

---

### `IsbnUtil` — Validação e conversão de ISBN

- Remove hífens e espaços antes de validar
- **ISBN-10:** validação por módulo 11 (dígito final pode ser 'X' = 10); converte para ISBN-13 com prefixo `978` e novo dígito verificador
- **ISBN-13:** validação por módulo 10 com pesos alternados 1 e 3
- ISBN inválido → `ResultadoIsbn.invalido(motivo)` — nunca bloqueia cadastro, apenas registra no relatório

---

## 5. Repositories e Queries Customizadas

### `LivroRepository`
```java
Optional<Livro> findByIsbn(String isbn);
List<Livro> findByCapaStatus(CapaStatus capaStatus);

@Modifying
@Query("UPDATE Livro l SET l.quantidadeDisponivel = l.quantidadeDisponivel - 1 
       WHERE l.id = :id AND l.quantidadeDisponivel > 0")
int decrementarDisponivel(@Param("id") Long id);

@Modifying
@Query("UPDATE Livro l SET l.quantidadeDisponivel = l.quantidadeDisponivel + 1 
       WHERE l.id = :id AND l.quantidadeDisponivel < l.quantidadeTotal")
int incrementarDisponivel(@Param("id") Long id);
```

- `decrementarDisponivel` e `incrementarDisponivel` são operações atômicas condicionais para evitar race conditions em empréstimos simultâneos
- `findByCapaStatus` é usado pelo sistema de capas para buscar livros SEM_CAPA (sincronização) e REVISAR (tela de revisão)

### `AutorRepository` e `CategoriaRepository`
Apenas herdam `JpaRepository<T, Long>` — sem queries customizadas.

### `EmprestimoRepository` (contextual)
```java
@Query("SELECT COUNT(e) FROM Emprestimo e WHERE e.livro.id = :livroId AND e.status <> 'DEVOLVIDO'")
long countEmprestimosAtivos(@Param("livroId") Long livroId);
```
Usada por `LivroService.atualizar()` para validar se há empréstimos ativos antes de modificar o livro.

---

## 6. DTOs

### `RelatorioSincronizacao` (record)
Retornado pelo endpoint `POST /api/livros/capas/sincronizar`:
```json
{
  "totalProcessados": 10,
  "capasEncontradas": 6,
  "semCapa": 2,
  "emRevisao": 1,
  "isbnsInvalidos": [
    { "livroId": 5, "titulo": "Livro X", "isbn": "123", "motivo": "Tamanho inválido" }
  ]
}
```

---

## 7. Migrações SQL

### `V1__adicionar_quantidade_total.sql`
- Adiciona coluna `quantidade_total INT NOT NULL`
- Popula retroativamente: `quantidade_total = disponivel + emprestimos_ativos`
- Adiciona constraints SQL: `quantidade_disponivel >= 0` e `quantidade_disponivel <= quantidade_total`

### `V2__adicionar_campos_capa.sql`
- Adiciona 4 colunas: `capa_arquivo VARCHAR(255)`, `capa_origem VARCHAR(50)`, `capa_status VARCHAR(50) NOT NULL DEFAULT 'SEM_CAPA'`, `capa_atualizada_em DATETIME`
- Popular livros existentes com `SEM_CAPA`

> **Atenção:** As migrações são scripts manuais (não Flyway/Liquibase). Devem ser executadas com `mysql < V1__.sql` antes de reiniciar o backend. Não há controle automático de versão.

---

## 8. Como o Sistema de Capas Funciona — Fluxo Completo

```
Cadastro de Livro (POST /api/livros)
    │
    ├─ Salva livro (capaStatus = SEM_CAPA)
    │
    └─ @Async: buscarCapaAssincrono(id)
            │
            ├─ IsbnUtil.validarEConverter(isbn)
            │       └─ Inválido → SEM_CAPA (log, sem erro)
            │
            └─ CapaCascataService.buscarCapaEmCascata(isbn13)
                    │
                    ├─ 1. BrasilAPI
                    ├─ 2. Google Books
                    └─ 3. Open Library
                            │
                            ├─ Nenhuma encontrada → SEM_CAPA
                            │
                            └─ Encontrada → ImagemValidador.validar(bytes)
                                    │
                                    ├─ Inválida (tamanho, formato, dimensão) → SEM_CAPA
                                    │
                                    └─ Válida → ArmazenamentoCapaService.salvarCapa()
                                            │
                                            ├─ Título compatível → ENCONTRADA
                                            │       urlCapa = /api/capas/{id} (público)
                                            │
                                            └─ Título divergente → REVISAR
                                                    urlCapa = null (não público)
                                                    urlCapaInterna = /api/capas/{id}
                                                            │
                                                            ├─ Bibliotecário aprova → ENCONTRADA
                                                            └─ Bibliotecário rejeita → SEM_CAPA + remove arquivo
```

**Upload Manual:**  
`POST /api/livros/{id}/capa` → validação binária → salva → origem MANUAL, status ENCONTRADA  
*(Nunca sobrescrito por busca automática)*

**Sincronização em Lote:**  
`POST /api/livros/capas/sincronizar` → processa todos SEM_CAPA → pausa 550ms/livro → relatório

---

## 9. Como o Frontend Consome os Recursos

### `api/config.js` — Configuração Axios
- `baseURL`: `VITE_API_URL` ou `http://localhost:8080/api`
- **Interceptor de requisição:** injeta `Authorization: Bearer {token}` de `localStorage`
- **Interceptor de resposta:** em erro 401 fora de `/auth/*`, remove token e redireciona para `/login`

### `api/livros.js` — Funções de API
Mapeia todos os endpoints do `LivroController`, incluindo todas as operações de capa (`buscarCapaNovamente`, `uploadCapaManual`, `listarCapasParaRevisao`, `aprovarCapa`, `rejeitarCapa`, `sincronizarCapas`).

### `api/autores.js` e `api/categorias.js`
CRUD completo via axios, sem lógica adicional.

### Componente `CapaLivro.jsx`
Componente reutilizável que:
1. Recebe `livro` (objeto completo) ou props avulsas (`urlCapa`, `titulo`, `autor`, `ano`, `categoria`)
2. Constrói URL completa: extrai o host de `VITE_API_URL`, concatena o path `/api/capas/{id}`
3. **Com imagem:** `<img loading="lazy">` com tratamento de erro via `onError`
4. **Sem imagem ou erro:** capa gerada em CSS com gradiente determinístico baseado em hash do título (12 paletas predefinidas)
5. Aplica dois pseudo-elementos: `capa-dobra-esquerda` (lombada) e `capa-corte-direita` (corte de páginas) para estética de livro físico
6. Acessível: `alt="Capa do livro {titulo}"`, `aria-label` na capa CSS, `aria-hidden` nos efeitos decorativos

### Página `Livros.jsx`
- **Visão Aluno:** grid configurável (3, 4 ou 5 colunas × 4 linhas = 12, 16 ou 20 por página) com filtros por texto, categoria, autor, época e estoque
- **Visão Bibliotecário:** tabela com ações de editar/excluir + botões para Sincronizar Capas, Revisão de Capas (com badge de contagem pendente)
- Filtros são reativos — cada filtro restringe as opções dos outros (faceted search)
- Épocas cobrem de Antiguidade (< 500) à Atualidade (2010+) com 17 faixas predefinidas

---

## 10. Segurança

### Autenticação e Autorização
- `AuthInterceptor` protege todos os endpoints exceto `/api/auth/*` e `GET /api/capas/*`
- Ações de escrita em livros, autores, categorias, usuários e devoluções exigem role `BIBLIOTECARIO`
- Token inválido → 401; role insuficiente → 403; ambos com JSON em português

### CORS
- Configurado em dois lugares: `SecurityConfig` (filtro Spring Security) e `WebConfig` (MVC)
- Origens permitidas: `http://localhost:5173` e `http://localhost:3000`
- **Problema identificado:** produção precisará atualizar as origens em ambas as classes

---

## 11. Cobertura de Testes

| Classe de Teste | O que cobre |
|---|---|
| `CapaControllerTest` | Servir imagem com cache/ETag, 304 Not Modified, 404 sem capa |
| `CapaLivroServiceTest` | Falha das fontes (SEM_CAPA), título divergente (REVISAR), título compatível (ENCONTRADA), imagem pequena, proteção de capa MANUAL, upload manual, rejeição de arquivo inválido, aprovação e rejeição de revisão |
| `CapaCascataServiceTest` | (arquivo presente, não lido nesta análise) |
| `ArmazenamentoCapaServiceTest` | (arquivo presente, não lido nesta análise) |
| `ImagemValidadorTest` | (arquivo presente, não lido nesta análise) |
| `IsbnUtilTest` | (arquivo presente, não lido nesta análise) |
| `LivroServiceTest` | (arquivo presente, não lido nesta análise) |
| `EmprestimoServiceTest` | (arquivo presente, não lido nesta análise) |

---

## 12. Pontos de Atenção, Problemas e Melhorias

### 🔴 Problemas (Requerem Correção)

**1. Inconsistência no tratamento de exceções em `AutorController` e `CategoriaController`**  
`AutorController.atualizar()` e `CategoriaController.atualizar()` capturam `RuntimeException` com try/catch e retornam `404` diretamente, em vez de lançar `RecursoNaoEncontradoException` e deixar o `GlobalExceptionHandler` tratar. Já `AutorController.excluir()` faz o mesmo. Isso é inconsistente com `LivroController` e pode mascarar erros inesperados como 404.  
**Correção:** Remover os try/catch e lançar `RecursoNaoEncontradoException` nos services.

**2. `AutorService` e `CategoriaService` lançam `RuntimeException` genérica**  
Em vez de `RecursoNaoEncontradoException`, lançam `new RuntimeException("... não encontrado...")`. O `GlobalExceptionHandler` tratará esses casos como erro 500, não 404.  
**Correção:** Substituir por `RecursoNaoEncontradoException`.

**3. Ausência de validação de unicidade em Autor e Categoria**  
Não há verificação de nome duplicado em autores ou categorias. O banco não tem constraint UNIQUE em `autores.nome` ou `categorias.nome`, permitindo dados duplicados.  
**Correção:** Adicionar `UNIQUE` nas colunas e/ou validação no service.

**4. Deleção em cascata de Autores/Categorias pode excluir livros silenciosamente**  
`Autor` e `Categoria` têm `cascade = CascadeType.ALL` na relação com `Livro`. Deletar um autor deleta todos os seus livros e, por cascata, todos os empréstimos desses livros. Não há qualquer verificação antes de permitir a deleção.  
**Correção:** Verificar se o autor/categoria possui livros vinculados antes de excluir; lançar `NegocioException` se houver.

**5. Sincronização em lote bloqueia a thread principal com `Thread.sleep(550ms)`**  
`CapaLivroService.sincronizarCapasLote()` é chamado de forma síncrona pelo endpoint `POST /api/livros/capas/sincronizar` e faz `Thread.sleep(550)` entre cada livro. Com 100 livros sem capa, isso dura no mínimo 55 segundos de request bloqueado, podendo resultar em timeout HTTP.  
**Correção:** Executar a sincronização de forma assíncrona (`@Async`) e retornar imediatamente um job ID ou um status de "iniciado". O progresso poderia ser consultado por outro endpoint.

**6. CORS hardcoded para localhost**  
As origens `http://localhost:5173` e `http://localhost:3000` estão hardcoded em `SecurityConfig.java` e `WebConfig.java`. Em produção isso precisará ser configurável via variável de ambiente.

---

### 🟡 Pontos de Atenção (Melhorias Recomendadas)

**7. `ddl-auto=update` em produção**  
`spring.jpa.hibernate.ddl-auto=update` é perigoso em produção. Pode executar ALTER TABLE automaticamente. Para produção, usar `validate` ou `none`, com migrações gerenciadas (recomenda-se adotar Flyway).

**8. Migrações SQL manuais**  
Os arquivos `V1__*.sql` e `V2__*.sql` estão em `src/main/resources/migracoes/` mas **não são executados automaticamente** pelo Flyway ou Liquibase — são scripts manuais de referência. A falta de automação cria risco de ambientes desincronizados.  
**Sugestão:** Integrar o Flyway ao `pom.xml` e configurar para ler o diretório `migracoes/`.

**9. Ausência de paginação na API de livros**  
`GET /api/livros` retorna todos os livros sem paginação. O frontend compensa com paginação client-side, mas isso é ineficiente com acervos grandes.  
**Sugestão:** Adotar `Page<Livro>` com `Pageable` no `LivroRepository` e `LivroController`.

**10. Hash de paleta duplicado em `Livros.jsx`**  
A lógica de geração de cor por hash do título existe em dois lugares: `CapaLivro.jsx` (componente reutilizável, 12 paletas) e `Livros.jsx` (variável `PALETA_CAPAS` e função `corCapa`, 12 paletas com valores diferentes). A função em `Livros.jsx` aparece não ser usada pelo componente `CardLivro` (que usa `CapaLivro`). Código morto potencial.

**11. JWT secret padrão inseguro em dev**  
`jwt.secret` tem default `segredo-padrao-apenas-para-dev-troque-em-producao`. Está comentado no arquivo, mas se o `.env` não for configurado em produção, o sistema funcionará com secret fraco.

**12. Ausência de busca server-side**  
Toda a filtragem (título, autor, categoria, época, estoque) é feita no cliente após carregar todos os livros. Com acervos grandes, o tempo de carregamento inicial e o processamento de filtros no navegador se tornam problemáticos.

**13. `java.version` definido como `25` no `pom.xml`**  
Java 25 ainda não foi lançado como versão estável no período de análise. Isso pode causar problemas em ambientes com JDK mais antigos. Verificar se o ambiente de desenvolvimento está alinhado.

---

## 13. Diagrama de Dependências do Sistema de Capas

```
LivroController
    │
    ├─ LivroService
    │       └─ CapaLivroService (via @Autowired)
    │
    └─ CapaLivroService (direto, para endpoints de capa)
            │
            ├─ CapaCascataService
            │       └─ BrasilAPI / Google Books / Open Library (HTTP externo)
            │
            ├─ ArmazenamentoCapaService
            │       └─ Disco local: ./uploads/capas/capa_livro_{id}.{ext}
            │
            └─ ImagemValidador / IsbnUtil (utilitários estáticos)

CapaController (serve imagem)
    ├─ LivroRepository (busca livro e nome do arquivo)
    └─ ArmazenamentoCapaService (recupera Path do arquivo)
```

---

## 14. Conclusão

O sistema está bem arquitetado para um projeto acadêmico. O sistema de capas é notavelmente robusto — busca em cascata, validação por magic bytes, comparação de títulos com similaridade por Jaccard, proteção de path traversal, cache HTTP com ETag, upload manual imutável, e testes unitários abrangentes.

Os principais riscos são:
1. **Cascata de deleção** em Autor/Categoria pode causar perda de dados não intencional
2. **Sincronização síncrona bloqueante** pode causar timeout com acervos maiores
3. **Falta de validação de unicidade** em Autor e Categoria
4. **Inconsistência no tratamento de exceções** entre os services (RuntimeException vs RecursoNaoEncontradoException)

Os pontos 1 e 2 são os mais críticos para correção imediata. Os demais são melhorias de qualidade e robustez para crescimento do sistema.
