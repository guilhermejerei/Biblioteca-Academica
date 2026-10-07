package com.biblioteca.service.capa;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ArmazenamentoCapaServiceTest {

    private Path tempDir;
    private ArmazenamentoCapaService service;

    @BeforeEach
    void setUp() throws IOException {
        tempDir = Files.createTempDirectory("capas_test_");
        service = new ArmazenamentoCapaService(tempDir.toString());
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
    @DisplayName("Salva capa com nome seguro derivado exclusivamente do ID do livro")
    void salvarCapa_nomeSeguroDerivadoDoId() throws IOException {
        byte[] dados = "fake image content".getBytes();
        String nome = service.salvarCapa(42L, dados, "jpg");

        assertThat(nome).isEqualTo("capa_livro_42.jpg");
        Path arquivo = service.recuperarArquivo(nome);
        assertThat(arquivo).isNotNull();
        assertThat(Files.readAllBytes(arquivo)).isEqualTo(dados);
    }

    @Test
    @DisplayName("Rejeita tentativa de path traversal com ../ ou barras")
    void resolverCaminhoSeguro_rejeitaPathTraversal() {
        assertThatThrownBy(() -> service.resolverCaminhoSeguro("../arquivo_secreto.txt"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("Tentativa de acesso a caminho inválido");

        assertThatThrownBy(() -> service.resolverCaminhoSeguro("subpasta/arquivo.jpg"))
                .isInstanceOf(SecurityException.class);

        assertThatThrownBy(() -> service.resolverCaminhoSeguro("..\\windows\\win.ini"))
                .isInstanceOf(SecurityException.class);
    }

    @Test
    @DisplayName("Substituição de capa remove arquivo anterior com extensão diferente")
    void salvarCapa_removeAnteriorAoAtualizar() throws IOException {
        service.salvarCapa(10L, "imagem1".getBytes(), "png");
        assertThat(service.recuperarArquivo("capa_livro_10.png")).isNotNull();

        service.salvarCapa(10L, "imagem2".getBytes(), "jpg");
        assertThat(service.recuperarArquivo("capa_livro_10.png")).isNull();
        assertThat(service.recuperarArquivo("capa_livro_10.jpg")).isNotNull();
    }
}
