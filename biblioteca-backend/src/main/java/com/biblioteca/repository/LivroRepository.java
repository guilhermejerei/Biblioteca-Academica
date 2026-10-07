package com.biblioteca.repository;

import com.biblioteca.model.CapaStatus;
import com.biblioteca.model.Livro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LivroRepository extends JpaRepository<Livro, Long> {

    Optional<Livro> findByIsbn(String isbn);

    List<Livro> findByCapaStatus(CapaStatus capaStatus);

    /**
     * Decrementa quantidade_disponivel de forma atômica e condicional:
     * só atua se disponivel > 0. Retorna o número de linhas afetadas (0 ou 1).
     * Usado para evitar race condition em empréstimos simultâneos.
     */
    @Modifying
    @Query("UPDATE Livro l SET l.quantidadeDisponivel = l.quantidadeDisponivel - 1 " +
           "WHERE l.id = :id AND l.quantidadeDisponivel > 0")
    int decrementarDisponivel(@Param("id") Long id);

    /**
     * Incrementa quantidade_disponivel de forma atômica e condicional:
     * só atua se disponivel < total. Retorna 0 ou 1.
     * Usado na devolução para nunca ultrapassar o total.
     */
    @Modifying
    @Query("UPDATE Livro l SET l.quantidadeDisponivel = l.quantidadeDisponivel + 1 " +
           "WHERE l.id = :id AND l.quantidadeDisponivel < l.quantidadeTotal")
    int incrementarDisponivel(@Param("id") Long id);
}
