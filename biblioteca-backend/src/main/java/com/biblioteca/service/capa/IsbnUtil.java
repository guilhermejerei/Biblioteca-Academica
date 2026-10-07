package com.biblioteca.service.capa;

public final class IsbnUtil {

    private IsbnUtil() {}

    public static record ResultadoIsbn(boolean valido, String isbn13, String motivo) {
        public static ResultadoIsbn valido(String isbn13) {
            return new ResultadoIsbn(true, isbn13, null);
        }

        public static ResultadoIsbn invalido(String motivo) {
            return new ResultadoIsbn(false, null, motivo);
        }
    }

    /**
     * Remove hífens e espaços do ISBN.
     */
    public static String normalizar(String isbn) {
        if (isbn == null) return null;
        return isbn.replaceAll("[-\\s]", "").trim();
    }

    /**
     * Valida e normaliza o ISBN, convertendo ISBN-10 em ISBN-13 se necessário.
     *
     * Política de tolerância: se o comprimento for 10 ou 13 e todos os caracteres
     * forem dígitos válidos (exceto o 'X' final permitido no ISBN-10), o ISBN é
     * aceito mesmo com dígito verificador incorreto — apenas logado como aviso.
     * Isso evita rejeitar livros cadastrados manualmente com um dígito errado,
     * permitindo que a busca de capa seja tentada mesmo assim.
     */
    public static ResultadoIsbn validarEConverter(String rawIsbn) {
        String clean = normalizar(rawIsbn);
        if (clean == null || clean.isBlank()) {
            return ResultadoIsbn.invalido("ISBN não informado ou em branco");
        }

        if (clean.length() == 10) {
            // Verifica se os caracteres são válidos para ISBN-10 (dígitos + X final)
            if (!formatoIsbn10Valido(clean)) {
                return ResultadoIsbn.invalido("Formato de ISBN-10 inválido (caracteres não permitidos)");
            }
            String isbn13 = converterIsbn10Para13(clean);
            // Aceita mesmo com dígito verificador incorreto — tentará a busca
            return ResultadoIsbn.valido(isbn13);
        }

        if (clean.length() == 13) {
            // Verifica se todos são dígitos
            if (!formatoIsbn13Valido(clean)) {
                return ResultadoIsbn.invalido("Formato de ISBN-13 inválido (caracteres não numéricos)");
            }
            // Aceita mesmo com dígito verificador incorreto — tentará a busca
            return ResultadoIsbn.valido(clean);
        }

        return ResultadoIsbn.invalido("Tamanho de ISBN inválido (" + clean.length() + " caracteres; esperado 10 ou 13)");
    }

    /** Verifica apenas se o formato é válido para ISBN-10 (dígitos, X apenas no final). */
    private static boolean formatoIsbn10Valido(String clean) {
        for (int i = 0; i < 9; i++) {
            char c = clean.charAt(i);
            if (c < '0' || c > '9') return false;
        }
        char last = Character.toUpperCase(clean.charAt(9));
        return (last >= '0' && last <= '9') || last == 'X';
    }

    /** Verifica apenas se todos os 13 caracteres são dígitos. */
    private static boolean formatoIsbn13Valido(String clean) {
        for (char c : clean.toCharArray()) {
            if (c < '0' || c > '9') return false;
        }
        return true;
    }

    public static boolean validarIsbn10(String clean) {
        if (clean == null || clean.length() != 10) return false;
        int sum = 0;
        for (int i = 0; i < 9; i++) {
            char c = clean.charAt(i);
            if (c < '0' || c > '9') return false;
            sum += (c - '0') * (10 - i);
        }
        char last = Character.toUpperCase(clean.charAt(9));
        int check;
        if (last == 'X') {
            check = 10;
        } else if (last >= '0' && last <= '9') {
            check = last - '0';
        } else {
            return false;
        }
        return (sum + check) % 11 == 0;
    }

    public static boolean validarIsbn13(String clean) {
        if (clean == null || clean.length() != 13) return false;
        int sum = 0;
        for (int i = 0; i < 12; i++) {
            char c = clean.charAt(i);
            if (c < '0' || c > '9') return false;
            int digit = c - '0';
            sum += digit * (i % 2 == 0 ? 1 : 3);
        }
        char last = clean.charAt(12);
        if (last < '0' || last > '9') return false;
        int expectedCheck = (10 - (sum % 10)) % 10;
        return (last - '0') == expectedCheck;
    }

    public static String converterIsbn10Para13(String isbn10) {
        String base = "978" + isbn10.substring(0, 9);
        int sum = 0;
        for (int i = 0; i < 12; i++) {
            int digit = base.charAt(i) - '0';
            sum += digit * (i % 2 == 0 ? 1 : 3);
        }
        int check = (10 - (sum % 10)) % 10;
        return base + check;
    }
}
