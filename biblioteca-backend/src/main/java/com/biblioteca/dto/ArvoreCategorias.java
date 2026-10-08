package com.biblioteca.dto;

import java.util.List;
import java.util.Map;

/**
 * A árvore de categorias que o filtro em pilhas consome.
 *
 * Uma área por item, na ordem fixa de exibição, com as subcategorões dentro.
 * Os totais vêm prontos do banco para o frontend não precisar contar nada.
 */
public class ArvoreCategorias {

    /**
     * Uma área.
     *
     * A cor vem do banco, não do frontend: a paleta é definida uma vez nas
     * variáveis CSS e no cadastro da área, e a interface só a consome. Assim a
     * cor da lombada e a da pilha não têm como divergir.
     */
    public record No(
            Long   id,
            String nome,
            Integer ordem,
            String cor,
            Long   totalLivros,
            List<Sub> subcategorias
    ) {}

    /**
     * Uma subcategoria dentro da área. "totalLivros" é o total absoluto e
     * "contagemNoFiltro" é o que o botão mostraria se fosse marcada agora —
     * os dois são diferentes e a interface precisa dos dois.
     */
    public record Sub(
            Long   id,
            String nome,
            Long   totalLivros,
            Long   contagemNoFiltro
    ) {}

    private List<No> areas;

    public ArvoreCategorias() {}

    public ArvoreCategorias(List<No> areas) {
        this.areas = areas;
    }

    public List<No> getAreas() { return areas; }
    public void setAreas(List<No> areas) { this.areas = areas; }

    /**
     * Ajuda o frontend a marcar o que já está selecionado sem refazer a árvore:
     * traz só os ids, já desdobrados (área marcada entra com todas as
     * subcategorias dela).
     */
    public Map<String, Object> asMap() {
        return Map.of("areas", areas == null ? List.of() : areas);
    }
}