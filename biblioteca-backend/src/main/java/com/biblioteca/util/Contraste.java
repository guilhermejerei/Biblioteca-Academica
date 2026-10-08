package com.biblioteca.util;

/**
 * Contraste de cor — a regra que a paleta de áreas do acervo cumpre.
 *
 * A cor de uma área aparece em três lugares onde o texto branco senta em cima
 * dela: a lombada do livro, o rótulo da capa e o ponto do cursor. Se a cor for
 * clara demais, esse branco some e o usuário perde a informação sem perceber
 * por quê.
 *
 * Por isso a validação é feita aqui e não só na escolha da tela: uma cor
 *-clear-pode-entrar-por-outro-caminho. As dez áreas já cadastradas passam
 * todas; o corte é em 4.5:1, o mesmo número do resto do projeto.
 */
public final class Contraste {

    private Contraste() {}

    /** Razão de contraste mínima entre a cor da área e o branco. */
    public static final double MINIMO = 4.5;

    /**
     * Razão de contraste entre uma cor hexadecimal e o branco.
     *
     * Usa a fórmula WCAG 2.1: (L1 + 0.05) / (L2 + 0.05), onde L é a
     * luminância relativa. L1 é a cor e L2 o branco, então o resultado sai
     * sempre ≥ 1 e é tanto maior quanto mais escura a cor.
     *
     * Devolve 0 quando a cor não é hexadecimal válido: aí a validação de
     * formato acontece antes, e um 0 nunca passa porBom.
     */
    public static double contraBranco(String hex) {
        int[] rgb = paraRgb(hex);
        if (rgb == null) return 0;
        return (1.05) / (luminancia(rgb) + 0.05);
    }

    /** A cor passa no contraste do site? */
    public static boolean passaConBranco(String hex) {
        return contraBranco(hex) >= MINIMO;
    }

    /**
     * Converte "#RRGGBB" ou "#RGB" em {r, g, b}, ou null se não der.
     *
     * Aceita as duas formas porque o seletor de cor do navegador entrega
     * "#rrggbb" e o atalho de três dígitos é comum em colagem.
     */
    public static int[] paraRgb(String hex) {
        if (hex == null) return null;
        String limpo = hex.trim();
        if (limpo.startsWith("#")) limpo = limpo.substring(1);
        if (!limpo.matches("[0-9a-fA-F]{3}|[0-9a-fA-F]{6}")) return null;

        if (limpo.length() == 3) {
            // "#abc" quer dizer "#aabbcc"
            limpo = "" + limpo.charAt(0) + limpo.charAt(0)
                      + limpo.charAt(1) + limpo.charAt(1)
                      + limpo.charAt(2) + limpo.charAt(2);
        }
        return new int[]{
            Integer.parseInt(limpo.substring(0, 2), 16),
            Integer.parseInt(limpo.substring(2, 4), 16),
            Integer.parseInt(limpo.substring(4, 6), 16)
        };
    }

    /** Normaliza para "#RRGGBB" maiúsculo, ou null se a cor for inválida. */
    public static String normalizar(String hex) {
        int[] rgb = paraRgb(hex);
        if (rgb == null) return null;
        return String.format("#%02X%02X%02X", rgb[0], rgb[1], rgb[2]);
    }

    private static double luminancia(int[] rgb) {
        double r = linear(rgb[0] / 255.0);
        double g = linear(rgb[1] / 255.0);
        double b = linear(rgb[2] / 255.0);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * Componente sRGB → linear.
     *
     * Não dá para somar os canais direto: a fórmula do WCAG define a
     * luminância em espaço linear, e usar os valores 0..255 direto superestimaria
     * as cores médias e deixaria a cor passar onde não devia.
     */
    private static double linear(double canal) {
        return canal <= 0.03928
                ? canal / 12.92
                : Math.pow((canal + 0.055) / 1.055, 2.4);
    }
}