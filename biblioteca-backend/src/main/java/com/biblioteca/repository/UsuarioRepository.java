package com.biblioteca.repository;

import com.biblioteca.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Necessário para buscar o usuário pelo email durante o login
    Optional<Usuario> findByEmail(String email);

    // Verificações de unicidade antes de salvar
    boolean existsByEmail(String email);
    boolean existsByCpf(String cpf);

    /**
     * Quem pode levar livro, so o nome.
     *
     * So nomes, sem colecao: os emprestimos em abertos sao buscados a parte, em
     * listarEmprestimosAbertos. Filtrar a colecao direto no WHERE do fetch
     *Tentado antes e e um erro silencioso: num LEFT JOIN FETCH, a condicao
     * "e.status IN (...)" no WHERE descarta a PESSOA inteira quando todos os
     * emprestimos dela ja foram devolvidos, em vez de devolver a pessoa com a
     * lista vazia. Aluno que devolveu tudo sumia do balcao.
     *
     * Ordenado pelo nome porque a lista sera buscada por nome: findAll nao sabe
     * ordenar por nome.
     */
    List<Usuario> findByTipoOrderByNomeAsc(Usuario.TipoUsuario tipo);

    /** Alunos em ordem alfabetica, sem tocar na colecao de emprestimos. */
    default List<Usuario> listarAlunos() {
        return findByTipoOrderByNomeAsc(Usuario.TipoUsuario.ALUNO);
    }
}
