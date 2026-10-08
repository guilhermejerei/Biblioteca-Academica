package com.biblioteca.dto;

/**
 * Os critérios que não são categoria, applados a uma página de livros.
 *
 * Ficam separados de {@link FiltroCategoria} porque entram em todas as consultas
 * por um caminho só: a contagem da página, a contagem do outro modo, e as facetas.
 */
public class FiltroAcervo {

    private String texto;
    private Long   autorId;
    private Integer anoDe;
    private Integer ateAno;
    private Boolean apenasDisponiveis;

    public static FiltroAcervo vazio() {
        return new FiltroAcervo();
    }

    public String getTexto() { return texto; }
    public FiltroAcervo comTexto(String texto) {
        this.texto = (texto == null || texto.isBlank()) ? null : texto.trim();
        return this;
    }

    public Long getAutorId() { return autorId; }
    public FiltroAcervo comAutorId(Long autorId) { this.autorId = autorId; return this; }

    public Integer getAnoDe() { return anoDe; }
    public Integer getAteAno() { return ateAno; }
    public FiltroAcervo comAnoDe(Integer de, Integer ate) {
        this.anoDe = de;
        this.ateAno = ate;
        return this;
    }

    public Boolean getApenasDisponiveis() { return apenasDisponiveis; }
    public FiltroAcervo comApenasDisponiveis(Boolean apenas) { this.apenasDisponiveis = apenas; return this; }

    public boolean isVazio() {
        return texto == null && autorId == null && anoDe == null && apenasDisponiveis == null;
    }

    /**
     * Fragmentos de WHERE para a tabela de livros com o apelido dado, já sem o
     * WHERE e sem os AND, prontos para concatenar.
     *
     * Os valores vão sempre como parâmetro nomeado; aqui só entra a forma da
     * condição, nunca um valor vindo do cliente.
     */
    public java.util.List<String> condicoes(String tabelaLivros, String tabelaAutores) {
        java.util.List<String> partes = new java.util.ArrayList<>();

        if (texto != null) {
            partes.add("(" + tabelaLivros + ".titulo LIKE :texto"
                    + " OR " + tabelaAutores + ".nome LIKE :texto"
                    + " OR " + tabelaLivros + ".isbn LIKE :textoTexto)");
        }
        if (autorId != null) {
            partes.add(tabelaLivros + ".autor_id = :autorId");
        }
        if (anoDe != null && ateAno != null) {
            partes.add(tabelaLivros + ".ano_publicacao BETWEEN :anoDe AND :ateAno");
        }
        return partes;
    }

    public java.util.Map<String, Object> parametros() {
        java.util.Map<String, Object> params = new java.util.LinkedHashMap<>();
        if (texto != null) {
            params.put("texto", "%" + texto + "%");
            params.put("textoTexto", "%" + texto + "%");
        }
        if (autorId != null) params.put("autorId", autorId);
        if (anoDe != null) params.put("anoDe", anoDe);
        if (ateAno != null) params.put("ateAno", ateAno);
        return params;
    }
}