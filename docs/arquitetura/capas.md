# Sistema de Capas de Livros

> **Aviso sobre direitos autorais:**
> Capas de livros são protegidas por direitos autorais das editoras. Esta implementação
> é para uso local acadêmico. Antes de qualquer uso em produção, revise os termos de
> serviço de cada API (especialmente [Google Books](https://developers.google.com/books/terms))
> e consulte a assessoria jurídica da instituição.

---

## Como funciona, do começo ao fim

Quando um livro é cadastrado, o sistema tenta encontrar a capa automaticamente em segundo
plano. O cadastro não espera — ele termina e a capa chega depois.

```
Cadastro do livro
      │
      └─► busca assíncrona (@Async)
                │
                ▼
          ISBN válido?
          ├─ Não → SEM_CAPA (sem tentar)
          └─ Sim
                │
                ▼
          Busca em cascata (para no 1º sucesso)
          ├─ BrasilAPI
          ├─ Google Books
          └─ Open Library
                │
                ├─ Nenhuma encontrou → SEM_CAPA
                └─ Encontrou → valida a imagem
                                    │
                                    ├─ Inválida → SEM_CAPA
                                    └─ Válida → compara título
                                                    │
                                                    ├─ Compatível → ENCONTRADA ✓
                                                    └─ Divergente → REVISAR
                                                                        │
                                                              bibliotecário decide
                                                              ├─ Aprovar → ENCONTRADA
                                                              └─ Rejeitar → SEM_CAPA
```

---

## Estados de uma capa

| Estado | Significa | Capa aparece para o aluno? |
|---|---|---|
| `SEM_CAPA` | Sem imagem — mostra capa gerada em CSS | Não (capa CSS) |
| `ENCONTRADA` | Imagem aprovada e disponível | **Sim** |
| `REVISAR` | Imagem encontrada mas título diverge | Não — só o bibliotecário vê |

---

## 1. Validação do ISBN

Antes de qualquer busca, `IsbnUtil` normaliza e valida o ISBN:

1. Remove hífens e espaços
2. **ISBN-10** → valida pelo módulo 11 (dígito final pode ser `X` = 10) → converte para ISBN-13 com prefixo `978`
3. **ISBN-13** → valida pelo módulo 10 com pesos alternados 1 e 3
4. Se inválido → marca `SEM_CAPA` e registra o motivo. O cadastro do livro não é afetado.

---

## 2. Busca em cascata

`CapaCascataService` tenta cada fonte em ordem, parando no primeiro sucesso.

### Fonte 1 — BrasilAPI
```
GET https://brasilapi.com.br/api/isbn/v1/{isbn13}
Extrai: cover_url (URL da imagem), title (para comparar com o cadastrado)
```

### Fonte 2 — Google Books
```
GET https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn13}[&key=...]
Extrai: imageLinks → escolhe a maior resolução disponível
        extraLarge > large > medium > small > thumbnail
Converte http:// → https://
Extrai: volumeInfo.title (para comparar)
```
A chave de API (`GOOGLE_BOOKS_API_KEY`) é opcional. Sem ela, o limite de requisições é menor.

### Fonte 3 — Open Library
```
GET https://covers.openlibrary.org/b/isbn/{isbn13}-L.jpg?default=false
?default=false faz a API retornar 404 em vez de uma imagem de placeholder
Não retorna título — tratado como compatível automaticamente
```

### Configurações de rede
- **Timeout:** 5 segundos por chamada
- **Retry:** 1 nova tentativa em erros 5xx (com pausa de 500ms). Erros 4xx e timeouts passam direto para a próxima fonte.
- **User-Agent:** `BibliotecaAcervo/1.0 (projeto-academico; contato@biblioteca.edu.br)`

---

## 3. Validação da imagem

`ImagemValidador` rejeita imagens inválidas antes de salvar qualquer coisa.

### Verificação por magic bytes
O tipo real do arquivo é lido dos primeiros bytes — o `Content-Type` do HTTP não é confiado:

| Formato | Assinatura (bytes iniciais) |
|---|---|
| JPEG | `FF D8 FF` |
| PNG | `89 50 4E 47 0D 0A 1A 0A` |
| WebP | `RIFF....WEBP` |

### Outras verificações
- Tamanho máximo: **2 MB**
- Largura mínima: **100px** — descarta placeholders e imagens corrompidas

### Comparação de títulos
Quando a fonte retorna um título, ele é comparado com o título cadastrado:

1. Normaliza os dois: minúsculas, sem acentos, sem pontuação
2. Verifica igualdade ou containment direto → compatível
3. Interseção de palavras (> 2 chars): compatível se ≥ 50% das palavras batem
4. Similaridade de Jaccard ≥ 0.35 como fallback final

Se incompatível → status `REVISAR`.

---

## 4. Armazenamento

`ArmazenamentoCapaService` salva os arquivos em disco no diretório configurado
(`app.capas.diretorio`, padrão `./uploads/capas`).

**Nomenclatura:** `capa_livro_{id}.{ext}` — gerada pelo servidor, nunca pelo cliente.
Isso previne colisões e elimina path traversal: nenhum dado externo entra no nome do arquivo.

**Proteção adicional:**
```java
Path resolvido = diretorioBase.resolve(nomeArquivo).normalize();
if (!resolvido.startsWith(diretorioBase)) {
    throw new SecurityException("Tentativa de escape de diretório");
}
```

Os métodos `salvarCapa()` e `removerCapa()` são `synchronized` — sem corridas em chamadas simultâneas.

---

## 5. Endpoints de capas

### Servir a imagem — `GET /api/capas/{livroId}` (público, sem token)
Necessário sem autenticação para que tags `<img>` carreguem a imagem diretamente.

- **Cache:** `Cache-Control: public, max-age=604800` (7 dias)
- **ETag:** `"{livroId}-{lastModifiedMs}-{tamanhoBytes}"` — suporta `If-None-Match` → responde `304 Not Modified`
- **Content-Type:** detectado pela extensão do arquivo (`.jpg`, `.png`, `.webp`)

### Ações do bibliotecário

| Método | Endpoint | O que faz |
|---|---|---|
| POST | `/api/livros/{id}/capa/buscar` | Força nova busca nas fontes externas |
| POST | `/api/livros/{id}/capa` | Upload manual (multipart, campo `arquivo` ou `file`) |
| GET | `/api/livros/capas/revisao` | Lista livros com capa em `REVISAR` |
| PUT | `/api/livros/{id}/capa/aprovar` | Aprova capa → `ENCONTRADA` |
| PUT | `/api/livros/{id}/capa/rejeitar` | Rejeita capa → remove arquivo, volta a `SEM_CAPA` |
| POST | `/api/livros/capas/sincronizar` | Processa todos os livros `SEM_CAPA` em lote |

**Capa manual:** definida com origem `MANUAL` e status `ENCONTRADA` direto, sem revisão.
Uma capa manual **nunca é sobrescrita** por buscas automáticas futuras.

**Sincronização em lote:** processa sequencialmente com pausa de 550ms entre livros
(proteção de rate limit). Retorna um relatório com contadores de encontradas, em revisão,
sem capa e ISBNs inválidos.

---

## 6. Frontend — componente CapaLivro

O componente nunca faz chamadas a APIs externas. Só consome `/api/capas/{id}`:

```
urlCapa preenchida e sem erro de carregamento?
  → <img loading="lazy" alt="Capa do livro {titulo}">

Caso contrário (sem capa ou erro de rede):
  → div com gradiente CSS determinístico
    (hash do título % 12 paletas predefinidas)

Sempre presentes:
  → dobra de lombada à esquerda (pseudo-elemento CSS)
  → corte de páginas à direita (pseudo-elemento CSS)
```

A URL é construída extraindo o host de `VITE_API_URL`:
```javascript
const apiBase = VITE_API_URL.replace(/\/api\/?$/, '')
const urlCompleta = `${apiBase}/api/capas/${livro.id}`
```
