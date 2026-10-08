package com.biblioteca.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

/**
 * Contraste da cor de área contra o branco.
 *
 * O número importa porque a cor da área fica atrás do texto branco da lombada
 * e do rótulo da capa. As dez áreas do acervo passam todas; o teste existe
 * para garantir que continuam passando, e que uma cor nova não passa por
 * acaso.
 */
class ContrasteTest {

    @Test
    @DisplayName("as dez áreas do acervo passam em 4.5:1")
    void areasDoAcervoPassam() {
        // Se alguma destas regredir, o branco da lombada daquela pilha fica
        // ilegível — e a falha só apareceria olhando a tela, não nos testes.
        String[] areas = {
            "#8C2B2B",  // Literatura
            "#6B4A3A",  // História e Sociedade
            "#2F6B4F",  // Ciências
            "#1E3D59",  // Computação e Tecnologia
            "#4A2545",  // Filosofia e Psicologia
            "#6E5A16",  // Educação e Pesquisa
            "#9C4A1E",  // Política e Economia
            "#7A2E5C",  // Quadrinhos e Artes
            "#3F6B7A",  // Biografias e Memórias
            "#8C6B2B",  // Infantojuvenil — a mais clara das dez, 4.94:1
        };
        for (String cor : areas) {
            assertThat(Contraste.contraBranco(cor))
                    .as("contraste de %s", cor)
                    .isGreaterThanOrEqualTo(Contraste.MINIMO);
        }
    }

    @ParameterizedTest
    @DisplayName("cor clara é rejeitada")
    @ValueSource(strings = {"#FFFFFF", "#F0E0D0", "#FFFFE0", "#D3D3D3"})
    void rejeitaCorClara(String cor) {
        assertThat(Contraste.passaConBranco(cor)).as("%s", cor).isFalse();
    }

    @ParameterizedTest
    @DisplayName("cor escura é aceita")
    @ValueSource(strings = {"#000000", "#8C2B2B", "#1E3D59", "#5A3D8C"})
    void aceitaCorEscura(String cor) {
        assertThat(Contraste.passaConBranco(cor)).as("%s", cor).isTrue();
    }

    @Test
    @DisplayName("branco puro é 1:1, o mínimo teórico")
    void brancoPuro() {
        assertThat(Contraste.contraBranco("#FFFFFF")).isCloseTo(1.0, within(0.01));
    }

    @Test
    @DisplayName("preto puro é 21:1, o máximo da escala")
    void pretoPuro() {
        assertThat(Contraste.contraBranco("#000000")).isCloseTo(21.0, within(0.05));
    }

    @ParameterizedTest
    @DisplayName("normaliza para #RRGGBB maiúsculo")
    @CsvSource({
        "#8c2b2b, #8C2B2B",
        "8C2B2B,  #8C2B2B",
        "'#abc',  #AABBCC",
        "'  #1E3D59  ', #1E3D59",
    })
    void normaliza(String entrada, String esperado) {
        assertThat(Contraste.normalizar(entrada)).isEqualTo(esperado);
    }

    @ParameterizedTest
    @DisplayName("rejeita o que não é cor")
    @ValueSource(strings = {"azul", "#GGGGGG", "#12345", "", "#", "rgb(1,2,3)", "8C2B2BZZ"})
    void rejeitaCorInvalida(String entrada) {
        assertThat(Contraste.normalizar(entrada)).as("\"%s\"", entrada).isNull();
        // E um inválido nunca passa, nem como 0 nem por acidente
        assertThat(Contraste.passaConBranco(entrada)).isFalse();
    }

    @Test
    @DisplayName("null não estoura")
    void nuloNaoEstoura() {
        assertThat(Contraste.normalizar(null)).isNull();
        assertThat(Contraste.contraBranco(null)).isZero();
        assertThat(Contraste.passaConBranco(null)).isFalse();
    }
}