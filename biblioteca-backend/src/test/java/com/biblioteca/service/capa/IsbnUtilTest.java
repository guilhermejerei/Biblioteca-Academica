package com.biblioteca.service.capa;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class IsbnUtilTest {

    @Test
    @DisplayName("Normalização remove hífens e espaços")
    void normalizar_removeHifensEEspacos() {
        assertThat(IsbnUtil.normalizar(" 978-85-357-0900-1 ")).isEqualTo("9788535709001");
        assertThat(IsbnUtil.normalizar("0-306-40615-2")).isEqualTo("0306406152");
        assertThat(IsbnUtil.normalizar(null)).isNull();
    }

    @Test
    @DisplayName("Validação e conversão de ISBN-10 válido com dígito numérico")
    void validarEConverter_isbn10ValidoNumerico() {
        // ISBN-10: 0-306-40615-2 -> ISBN-13 esperado: 9780306406157
        IsbnUtil.ResultadoIsbn resultado = IsbnUtil.validarEConverter("0-306-40615-2");
        assertThat(resultado.valido()).isTrue();
        assertThat(resultado.isbn13()).isEqualTo("9780306406157");
        assertThat(resultado.motivo()).isNull();
    }

    @Test
    @DisplayName("Validação e conversão de ISBN-10 válido com dígito X")
    void validarEConverter_isbn10ValidoComX() {
        // ISBN-10: 0-8044-2957-X -> 080442957X
        // 9*0 + 8*8 + 7*0 + 6*4 + 5*4 + 4*2 + 3*9 + 2*5 + 1*7 + 10 = 0 + 64 + 0 + 24 + 20 + 8 + 27 + 10 + 7 + 10 = 170 % 11 == 5 != 0?
        // Vamos usar um ISBN-10 real com X: "155860714X" (9*1 + 8*5 + 7*5 + 6*8 + 5*6 + 4*0 + 3*7 + 2*1 + 1*4 + 10 = 9+40+35+48+30+0+21+2+4+10 = 199 % 11 != 0)
        // Cálculo direto: "048665088X" -> sum = 0*10 + 4*9 + 8*8 + 6*7 + 6*6 + 5*5 + 0*4 + 8*3 + 8*2 + 10 = 0+36+64+42+36+25+0+24+16+10 = 253 = 23*11.
        IsbnUtil.ResultadoIsbn resultado = IsbnUtil.validarEConverter("0-486-65088-X");
        assertThat(resultado.valido()).isTrue();
        assertThat(resultado.isbn13()).startsWith("978048665088");
    }

    @Test
    @DisplayName("Validação rejeita ISBN-10 com caractere inválido (não dígito, não X)")
    void validarEConverter_isbn10Invalido() {
        // Caractere inválido no meio — deve rejeitar
        IsbnUtil.ResultadoIsbn resultado = IsbnUtil.validarEConverter("0-306-4061A-9");
        assertThat(resultado.valido()).isFalse();
        assertThat(resultado.motivo()).contains("Formato de ISBN-10 inválido");
    }

    @Test
    @DisplayName("Validação aceita ISBN-13 válido")
    void validarEConverter_isbn13Valido() {
        // "978-85-357-0900-1" é o único válido dos 50 livros originais
        IsbnUtil.ResultadoIsbn resultado = IsbnUtil.validarEConverter("978-85-357-0900-1");
        assertThat(resultado.valido()).isTrue();
        assertThat(resultado.isbn13()).isEqualTo("9788535709001");
    }

    @Test
    @DisplayName("ISBN-13 com dígito verificador incorreto é aceito (tolerância para ISBNs digitados manualmente)")
    void validarEConverter_isbn13ComDigitoErrado_aceitaParaTentarBusca() {
        // ISBN com último dígito errado — aceito para tentar a busca nas APIs externas
        IsbnUtil.ResultadoIsbn resultado = IsbnUtil.validarEConverter("978-85-01-08311-5");
        assertThat(resultado.valido()).isTrue();
        assertThat(resultado.isbn13()).isEqualTo("9788501083115");
    }

    @Test
    @DisplayName("Validação rejeita ISBN vazio ou de tamanho inadequado")
    void validarEConverter_isbnVazioOuTamanhoErrado() {
        assertThat(IsbnUtil.validarEConverter("").valido()).isFalse();
        assertThat(IsbnUtil.validarEConverter(null).valido()).isFalse();
        assertThat(IsbnUtil.validarEConverter("12345").valido()).isFalse();
        assertThat(IsbnUtil.validarEConverter("123456789012345").valido()).isFalse();
    }
}
