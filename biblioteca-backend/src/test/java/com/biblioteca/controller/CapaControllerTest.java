package com.biblioteca.controller;

import com.biblioteca.model.Livro;
import com.biblioteca.repository.LivroRepository;
import com.biblioteca.service.capa.ArmazenamentoCapaService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CapaControllerTest {

    @Mock private LivroRepository livroRepository;
    @Mock private ArmazenamentoCapaService armazenamentoCapaService;
    @InjectMocks private CapaController controller;

    private Path tempDir;
    private Path tempFile;

    @BeforeEach
    void setUp() throws IOException {
        tempDir = Files.createTempDirectory("capa_ctrl_test_");
        tempFile = tempDir.resolve("capa_livro_1.jpg");
        Files.write(tempFile, "conteudo-imagem-fake".getBytes());
    }

    @AfterEach
    void tearDown() throws IOException {
        if (tempDir != null && Files.exists(tempDir)) {
            Files.walk(tempDir)
                    .sorted(Comparator.reverseOrder())
                    .forEach(p -> {
                        try { Files.deleteIfExists(p); } catch (IOException ignored) {}
                    });
        }
    }

    @Test
    @DisplayName("Endpoint público serve imagem com cache longo e ETag")
    void obterCapa_retornaImagemComETagECache() throws IOException {
        Livro livro = new Livro();
        livro.setId(1L);
        livro.setCapaArquivo("capa_livro_1.jpg");

        when(livroRepository.findById(1L)).thenReturn(Optional.of(livro));
        when(armazenamentoCapaService.recuperarArquivo("capa_livro_1.jpg")).thenReturn(tempFile);

        ResponseEntity<byte[]> response = controller.obterCapa(1L, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getCacheControl()).contains("max-age=604800");
        assertThat(response.getHeaders().getETag()).isNotNull();
        assertThat(response.getBody()).isEqualTo("conteudo-imagem-fake".getBytes());
    }

    @Test
    @DisplayName("Quando If-None-Match bate com o ETag, retorna 304 Not Modified")
    void obterCapa_comEtagCorrespondente_retorna304() throws IOException {
        Livro livro = new Livro();
        livro.setId(1L);
        livro.setCapaArquivo("capa_livro_1.jpg");

        when(livroRepository.findById(1L)).thenReturn(Optional.of(livro));
        when(armazenamentoCapaService.recuperarArquivo("capa_livro_1.jpg")).thenReturn(tempFile);

        // Primeiro request para obter o ETag
        ResponseEntity<byte[]> r1 = controller.obterCapa(1L, null);
        String etag = r1.getHeaders().getETag();

        // Segundo request com If-None-Match
        ResponseEntity<byte[]> r2 = controller.obterCapa(1L, etag);
        assertThat(r2.getStatusCode()).isEqualTo(HttpStatus.NOT_MODIFIED);
        assertThat(r2.getBody()).isNull();
    }

    @Test
    @DisplayName("Retorna 404 quando livro não possui capa gravada")
    void obterCapa_semCapa_retorna404() throws IOException {
        Livro livro = new Livro();
        livro.setId(1L);
        livro.setCapaArquivo(null);

        when(livroRepository.findById(1L)).thenReturn(Optional.of(livro));

        ResponseEntity<byte[]> response = controller.obterCapa(1L, null);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
