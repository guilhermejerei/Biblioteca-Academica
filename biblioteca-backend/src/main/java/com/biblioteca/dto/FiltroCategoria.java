package com.biblioteca.dto;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Um filtro de categorias já interpretado, com as regras de combinação prontas.
 *
 * A distinção importante é entre o conjunto de categorias e os grupos. Um grupo
 * é o que vem de uma única escolha na interface: uma área inteira vira um grupo
 * com todas as subcategorias dela, e uma subcategoria marcada solta vira um
 * grupo de um elemento só.
 *
 * No modo "qualquer" vale a união: basta ter uma das categorias escolhidas. No
 * modo "todas" vale um grupo por escolha: é preciso ter ao menos uma categoria
 * de cada grupo. É isso que faz "selecionar uma área" contar como uma única
 * escolha, e não como uma chuva de condições.
 */
public final class FiltroCategoria {

    public enum Modo { QUALQUER, TODAS }

    private final Modo modo;
    private final Set<Long> categoriaIds;
    private final List<Set<Long>> grupos;

    private FiltroCategoria(Modo modo, Set<Long> categoriaIds, List<Set<Long>> grupos) {
        this.modo = modo;
        this.categoriaIds = categoriaIds;
        this.grupos = grupos;
    }

    /** Sem categoria escolhida: devolve o acervo inteiro, e o filtro não pesa. */
    public static FiltroCategoria vazio() {
        return new FiltroCategoria(Modo.QUALQUER, Set.of(), List.of());
    }

    /**
     * @param idsSubcategorias    subcategorias marcadas diretamente
     * @param idsAreas            áreas marcadas inteiras
     * @param subcategoriasDaArea subcategorias de cada área, para expandir as áreas
     */
    public static FiltroCategoria de(Modo modo,
                                     Set<Long> idsSubcategorias,
                                     Set<Long> idsAreas,
                                     Map<Long, Set<Long>> subcategoriasDaArea) {
        Set<Long> categorias = new LinkedHashSet<>(idsSubcategorias);
        List<Set<Long>> grupos = new ArrayList<>();

        for (Long id : idsSubcategorias) grupos.add(Set.of(id));

        for (Long idArea : idsAreas) {
            Set<Long> doArea = subcategoriasDaArea.getOrDefault(idArea, Set.of());
            if (doArea.isEmpty()) continue; // área sem subcategoria não restringe nada
            categorias.addAll(doArea);
            grupos.add(new LinkedHashSet<>(doArea));
        }
        return new FiltroCategoria(modo == null ? Modo.QUALQUER : modo, categorias, grupos);
    }

    /** O mesmo filtro com outro modo, para o controle "Qualquer (N) · Todas (M)". */
    public FiltroCategoria comModo(Modo novo) {
        return new FiltroCategoria(novo, categoriaIds, grupos);
    }

    public Modo getModo() { return modo; }
    public String getModoTexto() { return modo.name().toLowerCase(); }
    public Set<Long> getCategoriaIds() { return categoriaIds; }
    public List<Set<Long>> getGrupos() { return grupos; }
    public boolean isVazio() { return grupos.isEmpty(); }
    public boolean ehTodas() { return modo == Modo.TODAS; }

    /**
     * Um fragmento de condição por grupo, usando apelidos de tabela distintos
     * (g0, g1, ...) para que o mesmo filtro possa ser montado em consultas
     * diferentes sem colidir com o apelido da linha que está contando.
     */
    public List<String> condicoesDeGrupo(String prefixo) {
        List<String> partes = new ArrayList<>();
        for (int i = 0; i < grupos.size(); i++) {
            partes.add("EXISTS (SELECT 1 FROM livro_categoria " + prefixo + i
                    + " WHERE " + prefixo + i + ".livro_id = " + prefixo + "0.livro_id"
                    + " AND " + prefixo + i + ".categoria_id IN (:grupo" + i + "))");
        }
        return partes;
    }

    /** Os parâmetros dos grupos, na mesma ordem de condicoesDeGrupo. */
    public Map<String, Object> parametrosDeGrupo() {
        Map<String, Object> params = new LinkedHashMap<>();
        for (int i = 0; i < grupos.size(); i++) {
            params.put("grupo" + i, grupos.get(i));
        }
        return params;
    }
}