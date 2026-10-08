package com.biblioteca.controller;

import com.biblioteca.dto.FiltroAcervo;
import com.biblioteca.dto.FiltroCategoria;
import com.biblioteca.service.LivroBuscaService;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Monta os filtros a partir dos parâmetros da requisição.
 *
 * Fica fora dos controllers porque as duas rotas — a busca de livros e a árvore
 * de categorias — precisam montar o filtro do mesmo jeito, e divergir entre as
 * duas faria a contagem da pilha não bater com a da estante.
 */
final class Filtros {

    private Filtros() {}

    /**
     * O filtro de categorias, com as áreas já expandidas em subcategorias.
     *
     * A lista cat= aceita ids de subcategoria e de área ao mesmo tempo, porque
     * é assim que a URL fica quando o usuário marca as duas coisas. Os ids que
     * não correspondem a nada são descartados em silêncio: uma URL antiga ou
     * uma categoria apagada não pode derrubar a página inteira.
     */
    static FiltroCategoria categorias(List<Long> idsCategoria, List<Long> idsArea,
                                      String modo, LivroBuscaService busca) {
        Set<Long> validasAreas = new LinkedHashSet<>(busca.idsDeAreas());
        Set<Long> validasSubs  = new LinkedHashSet<>(busca.idsDeSubcategorias());
        Map<Long, Set<Long>> subPorArea = busca.subcategoriasPorArea();

        Set<Long> areasEscolhidas = new LinkedHashSet<>();
        if (idsArea != null) {
            for (Long id : idsArea) if (validasAreas.contains(id)) areasEscolhidas.add(id);
        }
        Set<Long> subsEscolhidas = new LinkedHashSet<>();
        if (idsCategoria != null) {
            for (Long id : idsCategoria) if (validasSubs.contains(id)) subsEscolhidas.add(id);
        }

        return FiltroCategoria.de(interpretarModo(modo), subsEscolhidas, areasEscolhidas, subPorArea);
    }

    /**
     * "qualquer" ou "todas". Qualquer valor fora disso — inclusive ausente —
     * vira "qualquer", que é o padrão pedido.
     */
    static FiltroCategoria.Modo interpretarModo(String modo) {
        return "todas".equalsIgnoreCase(modo) ? FiltroCategoria.Modo.TODAS
                                             : FiltroCategoria.Modo.QUALQUER;
    }

    /**
     * Os critérios do acervo: texto, autor, época e disponibilidade.
     *
     * A época chega no formato "inicio-fim" que o seletor da interface já usa
     * (por exemplo "1940-1949" ou "-9999-499" para a Antiguidade).
     */
    static FiltroAcervo acervo(String texto, Long autor, String epoca, Boolean disponiveis) {
        FiltroAcervo f = FiltroAcervo.vazio().comTexto(texto).comAutorId(autor)
                .comApenasDisponiveis(disponiveis);
        int[] anos = lerEpoca(epoca);
        if (anos != null) f.comAnoDe(anos[0], anos[1]);
        return f;
    }

    /** "1940-1949" vira {1940, 1949}. Texto fora do formato é ignorado. */
    private static int[] lerEpoca(String epoca) {
        if (epoca == null || epoca.isBlank()) return null;
        int separador = epoca.indexOf('-', 1); // pula o sinal do primeiro número
        if (separador < 0) return null;
        try {
            int de  = Integer.parseInt(epoca.substring(0, separador));
            int ate = Integer.parseInt(epoca.substring(separador + 1));
            return de > ate ? null : new int[]{de, ate};
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** Teto de itens por página, para ninguém derrubar a consulta por engano. */
    static int tamanho(Integer pedido, int padrao) {
        if (pedido == null || pedido < 1) return padrao;
        return Math.min(pedido, LivroBuscaService.TAMANHO_MAXIMO);
    }
}