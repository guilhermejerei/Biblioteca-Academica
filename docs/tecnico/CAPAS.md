# Sistema de Capas — Documentação Técnica

> O fluxo completo e os princípios arquiteturais estão em `docs/CAPAS.md`.
> Este arquivo detalha a implementação interna.

## Classes Envolvidas

```
LivroController
    └── CapaLivroService          ← orquestrador principal
            ├── IsbnUtil                  ← valida e normaliza ISBN
            ├── CapaCascataService        ← busca nas APIs externas
            │       ├── BrasilAPI
            │       ├── Google Books API
            │       └── Open Library
            ├── ImagemValidador           ← valida o arquivo binário
            └── ArmazenamentoCapaService  ← salva/remove no disco

CapaController  ← serve a imagem (endpoint público com ETag)
```

## Estados de uma Capa (CapaStatus)

```
       cadastro
          │
          ▼
       SEM_CAPA ◄──────────────────────────────┐
          │                                     │ rejeitar()
          │ buscarCapaSincrono()                │
          ▼                                     │
    [Busca externa]                             │
          │                                     │
    ┌─────┴──────┐                              │
    │            │                              │
    ▼            ▼                              │
 títulos      títulos                           │
 compatíveis  divergentes                       │
    │            │                              │
    ▼            ▼                              │
ENCONTRADA    REVISAR ──── aprovar() ──► ENCONTRADA
    │
    ▼
urlCapa pública disponível
```

## Validação de Imagem (ImagemValidador)

### Magic Bytes
O tipo real do arquivo é verificado pelos primeiros bytes, independentemente do Content-Type HTTP:

| Formato | Assinatura (hex) |
|---|---|
| JPEG | `FF D8 FF` |
| PNG | `89 50 4E 47 0D 0A 1A 0A` |
| WebP | `52 49 46 46 ?? ?? ?? ?? 57 45 42 50` |

### Comparação de Títulos
Executada quando a fonte retorna um título junto com a imagem (BrasilAPI e Google Books):

1. Normaliza os dois títulos: minúsculas, sem acentos, sem pontuação
2. Verifica igualdade ou containment direto → compatível
3. Interseção de tokens (palavras > 2 chars): compatível se ≥ 50%
4. Similaridade de Jaccard ≥ 0.35 como fallback final

Se incompatível → status `REVISAR` (bibliotecário decide).

## Busca em Cascata (CapaCascataService)

### Ordem e Estratégia

```
ISBN-13 normalizado
        │
        ├──► 1. BrasilAPI
        │    GET https://brasilapi.com.br/api/isbn/v1/{isbn}
        │    Extrai: cover_url, title
        │    ◄── Sucesso: retorna bytes + título
        │
        ├──► 2. Google Books API
        │    GET https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}
        │    Extrai: imageLinks (extraLarge > large > medium > small > thumbnail)
        │    Converte http:// → https://
        │    ◄── Sucesso: retorna bytes + título
        │
        └──► 3. Open Library
             GET https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false
             ?default=false → retorna 404 em vez de placeholder
             ◄── Sucesso: retorna bytes (sem título)
```

### Tolerância a Erros
- Erro 5xx: 1 retry com pausa de 500ms
- Erro 4xx, timeout, falha de conexão: passa direto para a próxima fonte
- Se todas as fontes falharem: livro fica como `SEM_CAPA`

## Armazenamento Local (ArmazenamentoCapaService)

### Nomenclatura
Arquivos são nomeados exclusivamente pelo servidor: `capa_livro_{id}.{ext}`
- Sem conteúdo do cliente no nome → proteção contra path traversal
- Determinístico → salvar nova capa automaticamente substitui a anterior

### Proteção de Path Traversal
```java
// rejeita nomes com / \ ou ..
// verifica que o path resolvido começa com diretorioBase
Path resolvido = diretorioBase.resolve(nomeArquivo).normalize();
if (!resolvido.startsWith(diretorioBase)) {
    throw new SecurityException("Tentativa de escape de diretório");
}
```

## Endpoint Público (CapaController)

`GET /api/capas/{livroId}` — sem autenticação (necessário para tags `<img>`):

- Cache: `Cache-Control: public, max-age=604800` (7 dias)
- ETag: `"{livroId}-{lastModifiedMs}-{tamanhoBytes}"`
- Suporte a `If-None-Match` → responde `304 Not Modified` quando cache válido
- Content-Type detectado pela extensão do arquivo

## Frontend (CapaLivro.jsx)

O componente **nunca** faz chamadas a APIs externas. Apenas consome o endpoint `/api/capas/{id}` servido pelo backend:

```javascript
// Normaliza URL — sempre aponta para o backend local
const apiBase = VITE_API_URL.replace(/\/api\/?$/, '')
const urlCompleta = `${apiBase}/api/capas/${livro.id}`
```

Se o carregamento falhar (404 ou erro de rede), o componente exibe automaticamente a capa desenhada em CSS com paleta determinística.
