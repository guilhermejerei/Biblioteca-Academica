package com.biblioteca.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

/**
 * Ligação entre um livro e uma de suas categorias.
 *
 * Um livro tem de 1 a 4 destas linhas. Exatamente uma tem principal = true, e
 * é ela que define a cor da lombada e a etiqueta da capa.
 *
 * A unicidade da principal não é conferida aqui: quem garante é o índice
 * UNIQUE (livro_id, principal_norm) do banco, onde principal_norm é uma coluna
 * gerada que vale 1 na principal e NULL nas demais. Isso deixa passar N
 * secundárias e barra duas principais, algo que um CHECK não expressaria.
 *
 * A chave é composta (livro_id, categoria_id) e não há id artificial: uma
 * linha só existe ligada a um livro, e apagar um livro tem que apagar as
 * linhas junto, o que o id artificial não faria sozinho.
 */
@Entity
@Table(name = "livro_categoria")
@IdClass(LivroCategoriaId.class)
public class LivroCategoria {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "livro_id", nullable = false)
    @JsonIgnore
    private Livro livro;

    @Id
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @Column(nullable = false)
    private boolean principal;

    public LivroCategoria() {}

    public LivroCategoria(Categoria categoria, boolean principal) {
        this.categoria = categoria;
        this.principal = principal;
    }

    public Long getIdLivro() {
        return livro == null ? null : livro.getId();
    }

    /** Só o service usa, para amarrar o lado da variável ao livro. */
    public void setLivroInterno(Livro livro) { this.livro = livro; }

    public Long getIdCategoria() {
        return categoria == null ? null : categoria.getId();
    }

    public Categoria getCategoria() { return categoria; }
    public void setCategoria(Categoria categoria) { this.categoria = categoria; }

    public boolean isPrincipal() { return principal; }
    public void setPrincipal(boolean principal) { this.principal = principal; }
}