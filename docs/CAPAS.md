# Arquitetura e Fluxo de Capas de Livros

Este documento descreve o fluxo de busca, validação, armazenamento e exibição de capas de livros no sistema de biblioteca.

---

> [!WARNING]
> **Aviso Legal e Direitos Autorais:**
> As capas de livros são obras visuais protegidas por direitos autorais pertencentes às editoras e aos seus respectivos criadores. A implementação deste recurso foi desenvolvida estritamente para um **projeto local acadêmico**.
> Antes de qualquer implantação ou uso em ambiente de produção, é mandatório:
> 1. Revisar detalhadamente os termos de serviço de cada API provedora (notadamente os [Termos de Serviço da Google Books API](https://developers.google.com/books/terms), que possuem diretrizes específicas de exibição, atribuição e links para a loja Google Play Livros);
> 2. Consultar o departamento jurídico da instituição de ensino para validar as diretrizes de propriedade intelectual e fair use aplicáveis ao acervo.

---

## 1. Princípio Arquitetural

* **Isolamento de Requisições Externas:** O frontend **nunca** faz chamadas diretas a APIs externas de capas nem referencia URLs de terceiros.
* **Backend como Provedor Único:** O backend realiza a busca uma única vez por livro, valida o arquivo binário, salva a imagem em disco local (`app.capas.diretorio`, padrão `./uploads/capas`) e serve a imagem através do endpoint `/api/capas/{id}`.
* **Benefícios:**
  * Respeito às cotas e limites de taxa (rate limits) das APIs externas;
  * Funcionamento integral do catálogo caso a conexão com a internet fique indisponível;
  * Eliminação de problemas de CORS e dependência de domínios instáveis de terceiros.

---

## 2. Normalização e Validação de ISBN

Antes de qualquer consulta externa, o ISBN é tratado pela classe [`IsbnUtil`](../biblioteca-backend/src/main/java/com/biblioteca/service/capa/IsbnUtil.java):
1. **Sanitização:** Remoção completa de hífens (`-`) e espaços em branco;
2. **ISBN-10:** Validação pelo algoritmo módulo 11 (dígito final de 0 a 9 ou 'X' correspondente a 10). Se válido, é automaticamente convertido para **ISBN-13** com prefixo `978` e novo dígito verificador calculado;
3. **ISBN-13:** Validação pelo algoritmo módulo 10 com pesos alternados 1 e 3;
4. **Tratamento de Inválidos:** Se o ISBN for inválido, em branco ou inconsistente, **nenhuma chamada externa é realizada**. O livro é registrado como `SEM_CAPA` e o motivo é logado e reportado na sincronização, sem jamais bloquear o cadastro da obra física.

---

## 3. Busca em Cascata

A busca de capas é disparada em cascata pelo [`CapaCascataService`](../biblioteca-backend/src/main/java/com/biblioteca/service/capa/CapaCascataService.java), parando imediatamente na primeira fonte que retornar uma capa válida:

1. **BrasilAPI (`https://brasilapi.com.br/api/isbn/v1/{isbn}`):**
   * Consulta o endpoint oficial de ISBN da BrasilAPI;
   * Extrai a URL contida no campo `cover_url` e baixa a imagem;
   * Extrai o título (`title`) para validação comparativa.
2. **Google Books API (`https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`):**
   * Consulta o catálogo do Google Livros;
   * Se configurada a variável `GOOGLE_BOOKS_API_KEY`, anexa a chave para ampliar o limite de requisições;
   * Seleciona o maior tamanho disponível em `imageLinks` (`extraLarge` > `large` > `medium` > `small` > `thumbnail`), convertendo o protocolo para `https://`;
   * Extrai o título em `volumeInfo.title` para comparação.
3. **Open Library Covers (`https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false`):**
   * Consulta a biblioteca aberta Open Library;
   * O parâmetro `?default=false` garante que a API retorne HTTP 404 quando a capa não existir, evitando imagens de placeholder.

### Parâmetros de Rede:
* **Timeout:** 5 segundos por chamada HTTP via `RestClient`;
* **Retry:** 1 nova tentativa apenas em caso de erro 5xx do servidor externo (com pausa de 500ms);
* **Pausa em Lote:** Pelo menos 500ms entre processamentos de livros em sincronizações em massa;
* **User-Agent:** Identificação padronizada: `BibliotecaAcervo/1.0 (projeto-academico; contato@biblioteca.edu.br)`.

---

## 4. Validação Rigorosa da Imagem

Antes de gravar qualquer imagem no acervo, a classe [`ImagemValidador`](../biblioteca-backend/src/main/java/com/biblioteca/service/capa/ImagemValidador.java) valida:
1. **Magic Bytes (Assinatura do Arquivo):** O tipo é verificado pelos primeiros bytes do payload e não apenas pelo header `Content-Type`:
   * **JPEG:** `FF D8 FF`
   * **PNG:** `89 50 4E 47 0D 0A 1A 0A`
   * **WebP:** `RIFF` ... `WEBP`
2. **Tamanho Máximo:** 2 MB;
3. **Dimensão Mínima:** Largura mínima de 100 pixels (descarta imagens de 1x1 pixel ou corrompidas);
4. **Comparação de Títulos:**
   * Quando a fonte retorna o título da obra, este é comparado com o título cadastrado no sistema (após normalização de minúsculas, remoção de acentos e pontuações);
   * Se os títulos forem muito divergentes (ex.: livro cadastrado *"Como Evitar um Desastre Climático"* e capa retornada de *"Harry Potter"*), a capa é classificada como candidata com status `REVISAR`;
   * O status `REVISAR` **não exibe a capa ao público**, mantendo-a disponível apenas para a conferência e aprovação do bibliotecário.

---

## 5. Armazenamento e Servir Imagens

* **Armazenamento:** Realizado pelo [`ArmazenamentoCapaService`](../biblioteca-backend/src/main/java/com/biblioteca/service/capa/ArmazenamentoCapaService.java) no diretório configurado (`app.capas.diretorio`, padrão `./uploads/capas`);
* **Nomenclatura Segura:** O arquivo é nomeado exclusivamente pelo servidor a partir do identificador do livro: `capa_livro_{id}.{ext}`. Qualquer caractere de path traversal (como `../`) é explicitamente bloqueado;
* **Endpoint Público:** `GET /api/capas/{id}`
  * Endpoint público liberado no [`AuthInterceptor`](../biblioteca-backend/src/main/java/com/biblioteca/security/AuthInterceptor.java) para permitir carregamento nativo por tags `<img>`;
  * Headers de Cache: `Cache-Control: public, max-age=604800` (7 dias) e `ETag`;
  * Suporte a `If-None-Match`, respondendo `304 Not Modified` quando o arquivo em cache do navegador estiver atualizado.

---

## 6. Upload Manual e Ações do Bibliotecário

* **Envio Manual:** `POST /api/livros/{id}/capa` (Multipart)
  * Restrito a usuários com perfil de bibliotecário;
  * Passa pelas mesmas validações de magic bytes, tamanho e dimensões;
  * Define a origem como `MANUAL`. Uma capa manual **nunca é sobrescrita** por buscas automáticas.
* **Revisão:**
  * `GET /api/livros/capas/revisao`: Lista livros com status `REVISAR`;
  * `PUT /api/livros/{id}/capa/aprovar`: Altera o status para `ENCONTRADA`;
  * `PUT /api/livros/{id}/capa/rejeitar`: Descarta o arquivo físico e retorna o status para `SEM_CAPA`.
* **Sincronização em Lote:** `POST /api/livros/capas/sincronizar`
  * Processa sequencialmente livros sem capa, com pausa de proteção, gerando relatório de auditoria.

---

## 7. Frontend e Experiência Visual

* O componente reutilizável [`CapaLivro`](../biblioteca-frontend/src/components/CapaLivro.jsx):
  * Exibe a imagem real com proporção 2:3, recorte sem distorção (`object-fit: cover`) e `loading="lazy"`;
  * Quando não há imagem (ou em caso de erro de rede), faz fallback gracioso para a capa tipográfica em CSS com paleta de cores calculada a partir do título da obra;
  * Mantém as camadas de dobra de lombada à esquerda e corte de páginas à direita, garantindo a estética de livro físico em todos os estados.
