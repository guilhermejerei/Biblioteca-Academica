package com.biblioteca.service.capa;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class ImagemValidadorTest {

    private byte[] gerarImagem(String formato, int largura, int altura) throws IOException {
        BufferedImage img = new BufferedImage(largura, altura, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, formato, baos);
        return baos.toByteArray();
    }

    @Test
    @DisplayName("Aceita imagem JPEG válida com largura >= 100px")
    void validar_jpegValido() throws IOException {
        byte[] bytes = gerarImagem("jpg", 150, 200);
        ImagemValidador.ResultadoValidacaoImagem res = ImagemValidador.validar(bytes);

        assertThat(res.valida()).isTrue();
        assertThat(res.formato()).isEqualTo(ImagemValidador.FormatoImagem.JPEG);
        assertThat(res.largura()).isEqualTo(150);
        assertThat(res.altura()).isEqualTo(200);
    }

    @Test
    @DisplayName("Aceita imagem PNG válida com largura >= 100px")
    void validar_pngValido() throws IOException {
        byte[] bytes = gerarImagem("png", 120, 180);
        ImagemValidador.ResultadoValidacaoImagem res = ImagemValidador.validar(bytes);

        assertThat(res.valida()).isTrue();
        assertThat(res.formato()).isEqualTo(ImagemValidador.FormatoImagem.PNG);
        assertThat(res.largura()).isEqualTo(120);
    }

    @Test
    @DisplayName("Rejeita imagem muito pequena (< 100px de largura)")
    void validar_imagemPequenaRejeitada() throws IOException {
        byte[] bytes = gerarImagem("png", 1, 1); // 1x1 pixel típico de placeholder
        ImagemValidador.ResultadoValidacaoImagem res = ImagemValidador.validar(bytes);

        assertThat(res.valida()).isFalse();
        assertThat(res.motivoRejeicao()).contains("Imagem muito pequena");
    }

    @Test
    @DisplayName("Rejeita imagem que excede 2 MB")
    void validar_tamanhoExcessivoRejeitado() {
        byte[] bytesGrandes = new byte[2 * 1024 * 1024 + 10]; // > 2MB
        ImagemValidador.ResultadoValidacaoImagem res = ImagemValidador.validar(bytesGrandes);

        assertThat(res.valida()).isFalse();
        assertThat(res.motivoRejeicao()).contains("2 MB");
    }

    @Test
    @DisplayName("Rejeita arquivo com magic bytes inválidos (ex: PDF ou texto)")
    void validar_formatoInvalidoRejeitado() {
        byte[] fakePdf = "%PDF-1.4 Fake document content not an image".getBytes();
        ImagemValidador.ResultadoValidacaoImagem res = ImagemValidador.validar(fakePdf);

        assertThat(res.valida()).isFalse();
        assertThat(res.motivoRejeicao()).contains("Formato inválido");
    }

    @Test
    @DisplayName("Comparação de títulos considera compatíveis com pequenas diferenças e acentuação")
    void titulosCompativeis_aceitaSemelhantes() {
        assertThat(ImagemValidador.titulosCompativeis(
                "Sua Vida Vale Muito",
                "Sua vida vale muito!"
        )).isTrue();

        assertThat(ImagemValidador.titulosCompativeis(
                "Cem Anos de Solidão",
                "Cem anos de solidao: Edicao Comemorativa"
        )).isTrue();

        // Se a fonte não retornar título, considera compatível
        assertThat(ImagemValidador.titulosCompativeis("Dom Casmurro", null)).isTrue();
    }

    @Test
    @DisplayName("Comparação de títulos sinaliza divergência quando são livros completamente diferentes")
    void titulosCompativeis_rejeitaDivergentes() {
        boolean compativel = ImagemValidador.titulosCompativeis(
                "Como Evitar um Desastre Climático",
                "Harry Potter e a Pedra Filosofal"
        );
        assertThat(compativel).isFalse();
    }
}
