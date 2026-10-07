package com.biblioteca.service.capa;

import com.biblioteca.model.CapaOrigem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;

@Service
public class CapaCascataService {

    private static final Logger log = LoggerFactory.getLogger(CapaCascataService.class);
    private static final String USER_AGENT = "BibliotecaAcervo/1.0 (projeto-academico; contato@biblioteca.edu.br)";
    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String googleBooksApiKey;

    public record CapaEncontrada(
            byte[] bytes,
            String tituloFonte,
            CapaOrigem origem
    ) {}

    public CapaCascataService(
            @Value("${GOOGLE_BOOKS_API_KEY:${app.capas.google-books-api-key:}}") String googleBooksApiKey,
            ObjectMapper objectMapper
    ) {
        this.googleBooksApiKey = googleBooksApiKey != null ? googleBooksApiKey.trim() : "";
        this.objectMapper = objectMapper;

        // Configuração de cliente HTTP nativo com timeout de 5 segundos
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(TIMEOUT)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(TIMEOUT);

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .defaultHeader(HttpHeaders.USER_AGENT, USER_AGENT)
                .build();
    }

    /**
     * Executa a busca em cascata: BrasilAPI -> Google Books -> Open Library.
     * Para na primeira fonte que devolver uma capa com bytes válidos.
     */
    public CapaEncontrada buscarCapaEmCascata(String isbn13) {
        if (isbn13 == null || isbn13.isBlank()) {
            return null;
        }

        // 1. BrasilAPI
        try {
            CapaEncontrada capa = buscarBrasilApi(isbn13);
            if (capa != null) {
                log.info("Capa encontrada via BrasilAPI para ISBN {}", isbn13);
                return capa;
            }
        } catch (Exception e) {
            log.warn("Erro ao consultar BrasilAPI para ISBN {}: {}", isbn13, e.getMessage());
        }

        // 2. Google Books API
        try {
            CapaEncontrada capa = buscarGoogleBooks(isbn13);
            if (capa != null) {
                log.info("Capa encontrada via Google Books para ISBN {}", isbn13);
                return capa;
            }
        } catch (Exception e) {
            log.warn("Erro ao consultar Google Books para ISBN {}: {}", isbn13, e.getMessage());
        }

        // 3. Open Library Covers
        try {
            CapaEncontrada capa = buscarOpenLibrary(isbn13);
            if (capa != null) {
                log.info("Capa encontrada via Open Library para ISBN {}", isbn13);
                return capa;
            }
        } catch (Exception e) {
            log.warn("Erro ao consultar Open Library para ISBN {}: {}", isbn13, e.getMessage());
        }

        log.info("Nenhuma capa encontrada nas fontes externas para ISBN {}", isbn13);
        return null;
    }

    /**
     * Fonte 1: BrasilAPI (https://brasilapi.com.br/api/isbn/v1/{isbn})
     */
    private CapaEncontrada buscarBrasilApi(String isbn13) {
        String url = "https://brasilapi.com.br/api/isbn/v1/" + isbn13;
        String json = executarRequisicaoTextoComRetry(url);
        if (json == null || json.isBlank()) return null;

        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode coverUrlNode = root.get("cover_url");
            if (coverUrlNode != null && !coverUrlNode.isNull() && !coverUrlNode.asText().isBlank()) {
                String coverUrl = coverUrlNode.asText();
                byte[] bytes = baixarImagemComRetry(coverUrl);
                if (bytes != null && bytes.length > 0) {
                    String title = root.has("title") && !root.get("title").isNull() ? root.get("title").asText() : null;
                    return new CapaEncontrada(bytes, title, CapaOrigem.BRASILAPI);
                }
            }
        } catch (Exception e) {
            log.debug("Falha ao analisar JSON da BrasilAPI: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Fonte 2: Google Books API (https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn})
     */
    private CapaEncontrada buscarGoogleBooks(String isbn13) {
        StringBuilder urlBuilder = new StringBuilder("https://www.googleapis.com/books/v1/volumes?q=isbn:")
                .append(isbn13);
        if (!googleBooksApiKey.isEmpty()) {
            urlBuilder.append("&key=").append(googleBooksApiKey);
        }

        String json = executarRequisicaoTextoComRetry(urlBuilder.toString());
        if (json == null || json.isBlank()) return null;

        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode items = root.get("items");
            if (items != null && items.isArray() && !items.isEmpty()) {
                JsonNode first = items.get(0);
                JsonNode volumeInfo = first.get("volumeInfo");
                if (volumeInfo != null) {
                    String title = volumeInfo.has("title") ? volumeInfo.get("title").asText() : null;
                    JsonNode imageLinks = volumeInfo.get("imageLinks");
                    if (imageLinks != null) {
                        String imageUrl = extrairMelhorImagem(imageLinks);
                        if (imageUrl != null) {
                            byte[] bytes = baixarImagemComRetry(imageUrl);
                            if (bytes != null && bytes.length > 0) {
                                return new CapaEncontrada(bytes, title, CapaOrigem.GOOGLE_BOOKS);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Falha ao analisar JSON do Google Books: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Fonte 3: Open Library Covers (https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false)
     */
    private CapaEncontrada buscarOpenLibrary(String isbn13) {
        String url = "https://covers.openlibrary.org/b/isbn/" + isbn13 + "-L.jpg?default=false";
        byte[] bytes = baixarImagemComRetry(url);
        if (bytes != null && bytes.length > 0) {
            return new CapaEncontrada(bytes, null, CapaOrigem.OPEN_LIBRARY);
        }
        return null;
    }

    private String extrairMelhorImagem(JsonNode imageLinks) {
        String[] prioridades = { "extraLarge", "large", "medium", "small", "thumbnail" };
        for (String chave : prioridades) {
            if (imageLinks.has(chave) && !imageLinks.get(chave).asText().isBlank()) {
                String link = imageLinks.get(chave).asText();
                if (link.startsWith("http://")) {
                    link = "https://" + link.substring(7);
                }
                return link;
            }
        }
        return null;
    }

    /**
     * Faz requisição GET para obter string (JSON), com 1 nova tentativa APENAS em erro 5xx.
     */
    private String executarRequisicaoTextoComRetry(String url) {
        return executarComRetry(url, () -> restClient.get()
                .uri(URI.create(url))
                .retrieve()
                .onStatus(HttpStatusCode::is5xxServerError, (req, resp) -> {
                    throw new Servidor5xxException("Erro 5xx da API externa: " + resp.getStatusCode());
                })
                .body(String.class));
    }

    /**
     * Faz download de binário (imagem), com 1 nova tentativa APENAS em erro 5xx.
     */
    private byte[] baixarImagemComRetry(String url) {
        return executarComRetry(url, () -> restClient.get()
                .uri(URI.create(url))
                .retrieve()
                .onStatus(HttpStatusCode::is5xxServerError, (req, resp) -> {
                    throw new Servidor5xxException("Erro 5xx ao baixar imagem: " + resp.getStatusCode());
                })
                .body(byte[].class));
    }

    @FunctionalInterface
    private interface Requisicao<T> {
        T executar() throws Exception;
    }

    private <T> T executarComRetry(String url, Requisicao<T> requisicao) {
        try {
            return requisicao.executar();
        } catch (Servidor5xxException e) {
            log.warn("Erro 5xx em {}. Tentando novamente uma única vez...", url);
            try {
                Thread.sleep(500);
                return requisicao.executar();
            } catch (Exception retryEx) {
                log.warn("Falha na segunda tentativa em {}: {}", url, retryEx.getMessage());
                return null;
            }
        } catch (Exception e) {
            // 4xx ou outras falhas de cliente/conexão não fazem retry
            log.debug("Requisição não sucedida em {}: {}", url, e.getMessage());
            return null;
        }
    }

    private static class Servidor5xxException extends RuntimeException {
        public Servidor5xxException(String msg) { super(msg); }
    }
}
