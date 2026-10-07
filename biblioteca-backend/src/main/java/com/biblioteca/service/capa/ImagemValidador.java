package com.biblioteca.service.capa;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

public final class ImagemValidador {

    public static final int TAMANHO_MAXIMO_BYTES = 2 * 1024 * 1024; // 2 MB
    public static final int LARGURA_MINIMA_PX = 100;

    private ImagemValidador() {}

    public enum FormatoImagem {
        JPEG("jpg", "image/jpeg"),
        PNG("png", "image/png"),
        WEBP("webp", "image/webp");

        private final String extensao;
        private final String mimeType;

        FormatoImagem(String extensao, String mimeType) {
            this.extensao = extensao;
            this.mimeType = mimeType;
        }

        public String getExtensao() { return extensao; }
        public String getMimeType() { return mimeType; }
    }

    public static record ResultadoValidacaoImagem(
            boolean valida,
            FormatoImagem formato,
            int largura,
            int altura,
            String motivoRejeicao
    ) {
        public static ResultadoValidacaoImagem sucesso(FormatoImagem formato, int largura, int altura) {
            return new ResultadoValidacaoImagem(true, formato, largura, altura, null);
        }

        public static ResultadoValidacaoImagem falha(String motivo) {
            return new ResultadoValidacaoImagem(false, null, 0, 0, motivo);
        }
    }

    /**
     * Valida os bytes da imagem por magic bytes, tamanho máximo (2MB) e largura mínima (100px).
     */
    public static ResultadoValidacaoImagem validar(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return ResultadoValidacaoImagem.falha("Arquivo de imagem vazio");
        }

        if (bytes.length > TAMANHO_MAXIMO_BYTES) {
            return ResultadoValidacaoImagem.falha("Imagem excede o limite máximo de 2 MB (tamanho: " + bytes.length + " bytes)");
        }

        FormatoImagem formato = detectarFormato(bytes);
        if (formato == null) {
            return ResultadoValidacaoImagem.falha("Formato inválido. Apenas JPEG, PNG e WebP são aceitos");
        }

        int[] dimensoes = extrairDimensoes(bytes, formato);
        if (dimensoes == null || dimensoes[0] <= 0) {
            return ResultadoValidacaoImagem.falha("Não foi possível ler as dimensões da imagem ou arquivo corrompido");
        }

        int largura = dimensoes[0];
        int altura = dimensoes[1];

        if (largura < LARGURA_MINIMA_PX) {
            return ResultadoValidacaoImagem.falha("Imagem muito pequena (largura: " + largura + "px; mínimo exigido: " + LARGURA_MINIMA_PX + "px)");
        }

        return ResultadoValidacaoImagem.sucesso(formato, largura, altura);
    }

    /**
     * Identifica formato a partir dos magic bytes.
     */
    public static FormatoImagem detectarFormato(byte[] bytes) {
        if (bytes == null || bytes.length < 12) return null;

        // JPEG: FF D8 FF
        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return FormatoImagem.JPEG;
        }

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G' &&
            bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A) {
            return FormatoImagem.PNG;
        }

        // WebP: RIFF....WEBP
        if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F' &&
            bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return FormatoImagem.WEBP;
        }

        return null;
    }

    /**
     * Extrai largura e altura [largura, altura].
     */
    private static int[] extrairDimensoes(byte[] bytes, FormatoImagem formato) {
        try {
            BufferedImage img = ImageIO.read(new ByteArrayInputStream(bytes));
            if (img != null) {
                return new int[]{ img.getWidth(), img.getHeight() };
            }
        } catch (Exception ignored) {
        }

        // Fallback para WebP se o ImageIO do JDK não tiver leitor de WebP
        if (formato == FormatoImagem.WEBP) {
            return extrairDimensoesWebP(bytes);
        }

        return null;
    }

    private static int[] extrairDimensoesWebP(byte[] bytes) {
        if (bytes.length < 30) return null;
        try {
            // Verifica tipo de chunk WebP a partir do offset 12
            String chunk = new String(bytes, 12, 4);
            if ("VP8X".equals(chunk) && bytes.length >= 30) {
                int width = 1 + ((bytes[24] & 0xFF) | ((bytes[25] & 0xFF) << 8) | ((bytes[26] & 0xFF) << 16));
                int height = 1 + ((bytes[27] & 0xFF) | ((bytes[28] & 0xFF) << 8) | ((bytes[29] & 0xFF) << 16));
                return new int[]{ width, height };
            }
            if ("VP8L".equals(chunk) && bytes.length >= 25) {
                // Lossless VP8L: signature 0x2F em bytes[20]
                if (bytes[20] == 0x2F) {
                    int b1 = bytes[21] & 0xFF;
                    int b2 = bytes[22] & 0xFF;
                    int b3 = bytes[23] & 0xFF;
                    int b4 = bytes[24] & 0xFF;
                    int width = 1 + (b1 | ((b2 & 0x3F) << 8));
                    int height = 1 + (((b2 >> 6) & 0x03) | (b3 << 2) | ((b4 & 0xF) << 10));
                    return new int[]{ width, height };
                }
            }
            if ("VP8 ".equals(chunk) && bytes.length >= 30) {
                // Lossy VP8: frame tag e magic 0x9D 0x01 0x2A
                int start = 20;
                if ((bytes[start + 3] & 0xFF) == 0x9D && (bytes[start + 4] & 0xFF) == 0x01 && (bytes[start + 5] & 0xFF) == 0x2A) {
                    int width = (bytes[start + 6] & 0xFF) | ((bytes[start + 7] & 0xFF) << 8);
                    int height = (bytes[start + 8] & 0xFF) | ((bytes[start + 9] & 0xFF) << 8);
                    return new int[]{ width & 0x3FFF, height & 0x3FFF };
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    /**
     * Normaliza texto para comparação: minúsculas, sem acentos, sem pontuação.
     */
    public static String normalizarTexto(String s) {
        if (s == null) return "";
        String semAcentos = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return semAcentos.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /**
     * Retorna true se os títulos forem considerados compatíveis, ou false se forem muito divergentes.
     * Se a fonte externa não devolver título, retorna true (não há divergência demonstrada).
     */
    public static boolean titulosCompativeis(String tituloCadastrado, String tituloEncontrado) {
        if (tituloEncontrado == null || tituloEncontrado.isBlank()) {
            return true; // sem título retornado para comparar
        }
        if (tituloCadastrado == null || tituloCadastrado.isBlank()) {
            return true;
        }

        String t1 = normalizarTexto(tituloCadastrado);
        String t2 = normalizarTexto(tituloEncontrado);

        if (t1.equals(t2) || t1.contains(t2) || t2.contains(t1)) {
            return true;
        }

        // Comparação de tokens (palavras significativas com mais de 2 letras)
        Set<String> words1 = Arrays.stream(t1.split(" "))
                .filter(w -> w.length() > 2)
                .collect(Collectors.toSet());

        Set<String> words2 = Arrays.stream(t2.split(" "))
                .filter(w -> w.length() > 2)
                .collect(Collectors.toSet());

        if (words1.isEmpty() || words2.isEmpty()) {
            return true;
        }

        Set<String> intersecao = new HashSet<>(words1);
        intersecao.retainAll(words2);

        // Se compartilham pelo menos metade das palavras do título cadastrado
        double ratioCadastrado = (double) intersecao.size() / words1.size();
        if (ratioCadastrado >= 0.5) {
            return true;
        }

        // Similaridade de Jaccard
        Set<String> uniao = new HashSet<>(words1);
        uniao.addAll(words2);
        double jaccard = (double) intersecao.size() / uniao.size();

        return jaccard >= 0.35;
    }
}
