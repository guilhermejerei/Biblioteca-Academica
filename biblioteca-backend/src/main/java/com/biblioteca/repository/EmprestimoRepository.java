package com.biblioteca.repository;

import com.biblioteca.model.Emprestimo;
import com.biblioteca.model.Emprestimo.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmprestimoRepository extends JpaRepository<Emprestimo, Long> {

    List<Emprestimo> findByUsuarioId(Long usuarioId);

    /** Conta empréstimos não devolvidos de um livro (para validar redução de estoque). */
    @Query("SELECT COUNT(e) FROM Emprestimo e WHERE e.livro.id = :livroId AND e.status <> 'DEVOLVIDO'")
    long countEmprestimosAtivos(@Param("livroId") Long livroId);

    /** Lista empréstimos cujo status gravado é ATIVO ou ATRASADO (não devolvidos). */
    @Query("SELECT e FROM Emprestimo e WHERE e.status <> com.biblioteca.model.Emprestimo.Status.DEVOLVIDO")
    List<Emprestimo> findNaoDevolvidos();

    /**
     * Os empréstimos em aberto de toda a biblioteca, com o livro de cada um.
     *
     * Um conjunto limitado pelo tamanho do acervo, não pelo histórico: só o que
     * ainda está com alguém. Traz o livro porque a tela mostra "1984 está com
     * fulano" e a data, e sem o join do livro viriam N+1 na hora de listar.
     */
    @Query("SELECT e FROM Emprestimo e "
         + "JOIN FETCH e.livro "
         + "WHERE e.status <> com.biblioteca.model.Emprestimo.Status.DEVOLVIDO")
    List<Emprestimo> listarAbertosComLivro();
}
