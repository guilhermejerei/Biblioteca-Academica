package com.biblioteca.service.capa;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class CapaCascataServiceTest {

    private HttpServer server;
    private int port;
    private CapaCascataService service;

    private byte[] gerarImagemValida() throws IOException {
        BufferedImage img = new BufferedImage(120, 180, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", baos);
        return baos.toByteArray();
    }

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        port = server.getAddress().getPort();
        server.start();

        service = new CapaCascataService("", new ObjectMapper());
    }

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    @DisplayName("Simulação de retry em erro 5xx: faz segunda tentativa quando servidor retorna 500")
    void retry_erro5xx() throws Exception {
        byte[] imagemBytes = gerarImagemValida();
        AtomicInteger tentativas = new AtomicInteger(0);

        server.createContext("/imagem-com-retry.jpg", exchange -> {
            int attempt = tentativas.incrementAndGet();
            if (attempt == 1) {
                exchange.sendResponseHeaders(500, 0);
                exchange.close();
            } else {
                exchange.sendResponseHeaders(200, imagemBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(imagemBytes);
                }
            }
        });

        String url = "http://localhost:" + port + "/imagem-com-retry.jpg";
        byte[] resultado = ReflectionTestUtils.invokeMethod(service, "baixarImagemComRetry", url);

        assertThat(resultado).isNotNull();
        assertThat(resultado).isEqualTo(imagemBytes);
        assertThat(tentativas.get()).isEqualTo(2);
    }

    @Test
    @DisplayName("Google Books: converte http para https e seleciona melhor imagem")
    void googleBooks_melhorImagemComHttps() {
        ObjectMapper mapper = new ObjectMapper();
        String json = """
        {
            "items": [{
                "volumeInfo": {
                    "title": "Livro Teste",
                    "imageLinks": {
                        "thumbnail": "http://books.google.com/thumb.jpg",
                        "large": "http://books.google.com/large.jpg"
                    }
                }
            }]
        }
        """;

        try {
            var root = mapper.readTree(json);
            var imageLinks = root.get("items").get(0).get("volumeInfo").get("imageLinks");
            String melhor = ReflectionTestUtils.invokeMethod(service, "extrairMelhorImagem", imageLinks);

            assertThat(melhor).isEqualTo("https://books.google.com/large.jpg");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
