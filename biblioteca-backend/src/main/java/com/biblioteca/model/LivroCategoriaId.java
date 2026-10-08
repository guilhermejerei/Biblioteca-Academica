package com.biblioteca.model;

import java.io.Serializable;
import java.util.Objects;

/**
 * Chave composta de livro_categoria: (livro_id, categoria_id).
 *
 * Existe como classe própria porque a tabela tem chave primária dupla. Não é
 * uma entidade: só o par de ids que identifica a linha.
 */
public class LivroCategoriaId implements Serializable {

    private Long livro;
    private Long categoria;

    public LivroCategoriaId() {}

    public LivroCategoriaId(Long livro, Long categoria) {
        this.livro = livro;
        this.categoria = categoria;
    }

    public Long getLivro() { return livro; }
    public void setLivro(Long livro) { this.livro = livro; }

    public Long getCategoria() { return categoria; }
    public void setCategoria(Long categoria) { this.categoria = categoria; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof LivroCategoriaId other)) return false;
        return Objects.equals(livro, other.livro) && Objects.equals(categoria, other.categoria);
    }

    @Override
    public int hashCode() {
        return Objects.hash(livro, categoria);
    }
}