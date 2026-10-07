package com.biblioteca.service.capa;

import com.biblioteca.exception.NegocioException;
import com.biblioteca.model.CapaOrigem;
import com.biblioteca.model.CapaStatus;
import com.biblioteca.model.Livro;
import com.biblioteca.repository.LivroRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CapaLivroServiceTest {

    @Mock private LivroRepository livroRepository;
    @Mock private ArmazenamentoCapaService armazenamentoCapaService;
    @Mock private CapaCascataService capaCascataService;
    @InjectMocks private CapaLivroService capaLivroService;

    private Livro livro;

    private byte[] gerarImagem(int largura, int altura) throws IOException {
        BufferedImage img = new BufferedImage(largura, altura, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", baos);
        return baos.toByteArray();
    }

    @BeforeEach
    void setUp() {
        livro = new Livro();
        livro.setId(10L);
        livro.setTitulo("Sua Vida Vale Muito");
        livro.setIsbn("978-85-357-0900-1"); // ISBN válido
        livro.setCapaStatus(CapaStatus.SEM_CAPA);
    }

    @Test
    @DisplayName("Quando fontes de capa falham, livro permanece SEM_CAPA e cadastro não quebra")
    void buscarCapa_quandoFontesFalham_permaneceSemCapa() {
        when(livroRepository.findById(10L)).thenReturn(Optional.of(livro));
        when(capaCascataService.buscarCapaEmCascata(any())).thenReturn(null);
        when(livroRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Livro atualizado = capaLivroService.buscarCapaSincrono(10L, true);

        assertThat(atualizado.getCapaStatus()).isEqualTo(CapaStatus.SEM_CAPA);
        assertThat(atualizado.getCapaArquivo()).isNull();
        assertThat(atualizado.getUrlCapa()).isNull();
    }

    @Test
    @DisplayName("Quando título retornado é divergente, status fica REVISAR e urlCapa pública é null")
    void buscarCapa_tituloDivergente_ficaRevisarECapaNaoPublica() throws IOException {
        byte[] imagemValida = gerarImagem(200, 300);
        CapaCascataService.CapaEncontrada encontrada = new CapaCascataService.CapaEncontrada(
                imagemValida,
                "Título Completamente Diferente Desconhecido",
                CapaOrigem.GOOGLE_BOOKS
        );

        when(livroRepository.findById(10L)).thenReturn(Optional.of(livro));
        when(capaCascataService.buscarCapaEmCascata(any())).thenReturn(encontrada);
        when(armazenamentoCapaService.salvarCapa(eq(10L), any(), any())).thenReturn("capa_livro_10.jpg");
        when(livroRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Livro atualizado = capaLivroService.buscarCapaSincrono(10L, true);

        assertThat(atualizado.getCapaStatus()).isEqualTo(CapaStatus.REVISAR);
        assertThat(atualizado.getCapaOrigem()).isEqualTo(CapaOrigem.GOOGLE_BOOKS);
        // Regra: capa candidata em REVISAR não deve ser mostrada ao público
        assertThat(atualizado.getUrlCapa()).isNull();
        // Mas está disponível internamente para o bibliotecário revisar
        assertThat(atualizado.getUrlCapaInterna()).isEqualTo("/api/capas/10");
    }

    @Test
    @DisplayName("Quando capa e título são compatíveis, status fica ENCONTRADA e urlCapa pública é exibida")
    void buscarCapa_tituloCompativel_ficaEncontradaEUrlPublica() throws IOException {
        byte[] imagemValida = gerarImagem(200, 300);
        CapaCascataService.CapaEncontrada encontrada = new CapaCascataService.CapaEncontrada(
                imagemValida,
                "Sua Vida Vale Muito: Uma Jornada",
                CapaOrigem.BRASILAPI
        );

        when(livroRepository.findById(10L)).thenReturn(Optional.of(livro));
        when(capaCascataService.buscarCapaEmCascata(any())).thenReturn(encontrada);
        when(armazenamentoCapaService.salvarCapa(eq(10L), any(), any())).thenReturn("capa_livro_10.jpg");
        when(livroRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Livro atualizado = capaLivroService.buscarCapaSincrono(10L, true);

        assertThat(atualizado.getCapaStatus()).isEqualTo(CapaStatus.ENCONTRADA);
        assertThat(atualizado.getCapaOrigem()).isEqualTo(CapaOrigem.BRASILAPI);
        assertThat(atualizado.getUrlCapa()).isEqualTo("/api/capas/10");
    }

    @Test
    @DisplayName("Imagem menor que 100px de largura é rejeitada e status fica SEM_CAPA")
    void buscarCapa_imagemPequena_rejeitada() throws IOException {
        byte[] imagemPequena = gerarImagem(1, 1); // 1x1 px
        CapaCascataService.CapaEncontrada encontrada = new CapaCascataService.CapaEncontrada(
                imagemPequena,
                "Sua Vida Vale Muito",
                CapaOrigem.OPEN_LIBRARY
        );

        when(livroRepository.findById(10L)).thenReturn(Optional.of(livro));
        when(capaCascataService.buscarCapaEmCascata(any())).thenReturn(encontrada);
        when(livroRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Livro atualizado = capaLivroService.buscarCapaSincrono(10L, true);

        assertThat(atualizado.getCapaStatus()).isEqualTo(CapaStatus.SEM_CAPA);
        assertThat(atualizado.getCapaArquivo()).isNull();
    }

    @Test
    @DisplayName("Busca automática nunca sobrescreve livro com origem MANUAL")
    void buscarCapa_origemManual_nuncaSobrescreve() {
        livro.setCapaOrigem(CapaOrigem.MANUAL);
        livro.setCapaStatus(CapaStatus.ENCONTRADA);
        livro.setCapaArquivo("capa_livro_10.jpg");

        when(livroRepository.findById(10L)).thenReturn(Optional.of(livro));

        Livro resultado = capaLivroService.buscarCapaSincrono(10L, true);

        assertThat(resultado.getCapaOrigem()).isEqualTo(CapaOrigem.MANUAL);
        verify(capaCascataService, never()).buscarCapaEmCascata(any());
    }

    @Test
    @DisplayName("Upload manual aceita imagem válida e define origem MANUAL e status ENCONTRADA")
    void salvarCapaManual_imagemValida_sucesso() throws IOException {
        byte[] imagemValida = gerarImagem(150, 200);
        MockMultipartFile file = new MockMultipartFile("arquivo", "minha_capa.jpg", "image/jpeg", imagemValida);

        when(livroRepository.findById(10L)).thenReturn(Optional.of(livro));
        when(armazenamentoCapaService.salvarCapa(eq(10L), any(), any())).thenReturn("capa_livro_10.jpg");
        when(livroRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Livro atualizado = capaLivroService.salvarCapaManual(10L, file);

        assertThat(atualizado.getCapaOrigem()).isEqualTo(CapaOrigem.MANUAL);
        assertThat(atualizado.getCapaStatus()).isEqualTo(CapaStatus.ENCONTRADA);
        assertThat(atualizado.getCapaArquivo()).isEqualTo("capa_livro_10.jpg");
    }

    @Test
    @DisplayName("Upload manual rejeita arquivo que não é imagem")
    void salvarCapaManual_arquivoInvalido_lancaExcecao() {
        MockMultipartFile fakeFile = new MockMultipartFile("arquivo", "documento.pdf", "application/pdf", "texto fake".getBytes());
        when(livroRepository.findById(10L)).thenReturn(Optional.of(livro));

        assertThatThrownBy(() -> capaLivroService.salvarCapaManual(10L, fakeFile))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("Imagem inválida");
    }

    @Test
    @DisplayName("Aprovação de capa em revisão altera status para ENCONTRADA")
    void aprovarCapa_alteraStatusParaEncontrada() {
        livro.setCapaStatus(CapaStatus.REVISAR);
        livro.setCapaArquivo("capa_livro_10.jpg");
        when(livroRepository.findById(10L)).thenReturn(Optional.of(livro));
        when(livroRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Livro atualizado = capaLivroService.aprovarCapa(10L);

        assertThat(atualizado.getCapaStatus()).isEqualTo(CapaStatus.ENCONTRADA);
        assertThat(atualizado.getUrlCapa()).isEqualTo("/api/capas/10");
    }

    @Test
    @DisplayName("Rejeição de capa em revisão apaga arquivo e altera status para SEM_CAPA")
    void rejeitarCapa_apagaArquivoEAlteraStatusParaSemCapa() {
        livro.setCapaStatus(CapaStatus.REVISAR);
        livro.setCapaArquivo("capa_livro_10.jpg");
        when(livroRepository.findById(10L)).thenReturn(Optional.of(livro));
        when(livroRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Livro atualizado = capaLivroService.rejeitarCapa(10L);

        verify(armazenamentoCapaService).removerCapa(10L);
        assertThat(atualizado.getCapaStatus()).isEqualTo(CapaStatus.SEM_CAPA);
        assertThat(atualizado.getCapaArquivo()).isNull();
    }
}
