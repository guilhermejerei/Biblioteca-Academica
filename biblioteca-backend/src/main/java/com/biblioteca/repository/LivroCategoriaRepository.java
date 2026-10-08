package com.biblioteca.repository;

import com.biblioteca.model.LivroCategoria;
import com.biblioteca.model.LivroCategoriaId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LivroCategoriaRepository extends JpaRepository<LivroCategoria, LivroCategoriaId> {

    /**
     * As ligações de um livro, prontas para reuso.
     *
     * A edição reaproveita estas instâncias em vez de criar novas. Criar uma
     * cópia de uma linha que já existe na sessão estoura com
     * DuplicateKeyException, porque as duas têm a mesma chave composta
     * (livro_id, categoria_id).
     */
    @Query("SELECT lc FROM LivroCategoria lc WHERE lc.livro.id = :livroId ORDER BY lc.categoria.id")
    List<LivroCategoria> listarDoLivro(@Param("livroId") Long livroId);
}