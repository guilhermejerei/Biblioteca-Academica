package com.biblioteca.dto;

import java.util.List;
import java.util.Map;

/**
 * Uma página de livros com o bloco de facetas que o filtro em pilhas precisa.
 *
 * As facetas respondem a três perguntas de uma vez:
 *  - totalQualquer e totalTodas alimentam o controle "Qualquer (N) · Todas (M)"
 *  - porSubcategoria diz quantos livros apareceriam se aquela subcategoria fosse
 *    marcada, já considerando a seleção atual e o modo atual
 *  - porArea faz o mesmo para a área inteira, que é o número na pilha
 */
public class PaginaLivros {

    private List<com.biblioteca.model.Livro> itens = List.of();
    private int  pagina = 1;
    private int  tamanho;
    private long total;
    private int  totalPaginas;

    /** Total com o modo atual, para o número grande ao lado do acervo. */
    private long totalNoModo;

    /** Total em "qualquer" e em "todas", para o controle segmentado. */
    private long totalQualquer;
    private long totalTodas;

    /** Modo com que a página foi montada. */
    private String modo = "qualquer";

    /** true quando o total no modo atual é zero mas o outro modo tem livros. */
    private boolean zeroNoModo;

    private Map<Long, Long> porSubcategoria = Map.of();
    private Map<Long, Long> porArea = Map.of();

    public List<com.biblioteca.model.Livro> getItens() { return itens; }
    public void setItens(List<com.biblioteca.model.Livro> itens) { this.itens = itens; }

    public int getPagina() { return pagina; }
    public void setPagina(int pagina) { this.pagina = pagina; }

    public int getTamanho() { return tamanho; }
    public void setTamanho(int tamanho) { this.tamanho = tamanho; }

    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }

    public int getTotalPaginas() { return totalPaginas; }
    public void setTotalPaginas(int totalPaginas) { this.totalPaginas = totalPaginas; }

    public long getTotalNoModo() { return totalNoModo; }
    public void setTotalNoModo(long totalNoModo) { this.totalNoModo = totalNoModo; }

    public long getTotalQualquer() { return totalQualquer; }
    public void setTotalQualquer(long totalQualquer) { this.totalQualquer = totalQualquer; }

    public long getTotalTodas() { return totalTodas; }
    public void setTotalTodas(long totalTodas) { this.totalTodas = totalTodas; }

    public String getModo() { return modo; }
    public void setModo(String modo) { this.modo = modo; }

    public boolean isZeroNoModo() { return zeroNoModo; }
    public void setZeroNoModo(boolean zeroNoModo) { this.zeroNoModo = zeroNoModo; }

    public Map<Long, Long> getPorSubcategoria() { return porSubcategoria; }
    public void setPorSubcategoria(Map<Long, Long> porSubcategoria) {
        this.porSubcategoria = porSubcategoria;
    }

    public Map<Long, Long> getPorArea() { return porArea; }
    public void setPorArea(Map<Long, Long> porArea) { this.porArea = porArea; }
}