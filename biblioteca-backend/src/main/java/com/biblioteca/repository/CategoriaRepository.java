package com.biblioteca.repository;

import com.biblioteca.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    /**
     * Uma linha de área: só o que a árvore precisa, semLivro nem Subcategoria,
     * para o cálculo da faceta não arrastar a coleção inteira.
     */
    record AreaRow(Long id, String nome, Integer ordem, String cor) {}

    /** Uma linha de subcategoria com o id da área a que pertence. */
    record SubcategoriaRow(Long id, String nome, Long areaId) {}

    /**
     * As áreas na ordem fixa de exibição.
     *
     * "categoria_pai_id IS NULL AND cor IS NOT NULL" separa as áreas das
     * categorias antigas que a migração deixou sem classificar: elas também não
     * têm pai, mas também não têm cor, e não devem aparecer em lugar nenhum.
     */
    @Query("SELECT new com.biblioteca.repository.CategoriaRepository$AreaRow(c.id, c.nome, c.ordemExibicao, c.cor) "
         + "FROM Categoria c "
         + "WHERE c.categoriaPai IS NULL AND c.cor IS NOT NULL "
         + "ORDER BY c.ordemExibicao, c.nome")
    List<AreaRow> findAreasOrdenadas();

    /** Todas as subcategorias, com a área a que pertencem. */
    @Query("SELECT new com.biblioteca.repository.CategoriaRepository$SubcategoriaRow("
         + "c.id, c.nome, c.categoriaPai.id) "
         + "FROM Categoria c "
         + "WHERE c.categoriaPai IS NOT NULL "
         + "ORDER BY c.nome")
    List<SubcategoriaRow> findSubcategorias();

    @Query("SELECT c.id FROM Categoria c "
         + "WHERE c.categoriaPai IS NULL AND c.cor IS NOT NULL")
    List<Long> findIdsDasAreas();

    /** Só as subcategorias, para validar ids vindos do parâmetro. */
    @Query("SELECT c.id FROM Categoria c WHERE c.categoriaPai IS NOT NULL")
    List<Long> findIdsDasSubcategorias();

    /**
     * As categorias que ainda valem: as 10 áreas e as 47 subcategorias.
     *
     * Um findAll() traria também as 129 categorias que a migração deixou sem
     * classificar. Elas existem só para o rollback e não apontam para livro
     * nenhum, então devolvê-las punha na tela de administração 129 linhas
     * órfãs que ninguém consegue usar nem apagar com sentido.
     */
    @Query("SELECT c FROM Categoria c "
         + "WHERE c.categoriaPai IS NOT NULL "
            + "OR (c.categoriaPai IS NULL AND c.cor IS NOT NULL) "
         + "ORDER BY c.ordemExibicao, c.nome")
    List<Categoria> findAllReais();

    // ════════════════════════════════════════════════════════════
    // Regras da árvore — o que a tela de administração precisa
    // ════════════════════════════════════════════════════════════

    /**
     * Já existe uma área com esse nome? Comparação sem diferenciar maiúsculas
     * e acentos-insensitiva via LOWER, que é o que a pessoa digita.
     *
     * O id ignorado é para uma categoria poder ser renomeada para o mesmo
     * nome que já tem — sem isso, editar sem mudar o nome acusaria duplicidade
     * da categoria consigo mesma.
     */
    @Query("SELECT COUNT(c) > 0 FROM Categoria c "
         + "WHERE LOWER(c.nome) = LOWER(:nome) "
            + "AND c.categoriaPai IS NULL "
            + "AND (:ignorarId IS NULL OR c.id <> :ignorarId)")
    boolean existeAreaComNome(@Param("nome") String nome, @Param("ignorarId") Long ignorarId);

    /** Mesma regra, mas entre as filhas de uma área. */
    @Query("SELECT COUNT(c) > 0 FROM Categoria c "
         + "WHERE LOWER(c.nome) = LOWER(:nome) "
            + "AND c.categoriaPai.id = :areaId "
            + "AND (:ignorarId IS NULL OR c.id <> :ignorarId)")
    boolean existeSubcategoriaComNome(
            @Param("nome") String nome,
            @Param("areaId") Long areaId,
            @Param("ignorarId") Long ignorarId);

    /** Quantas subcategorias a área tem. Para o aviso antes de excluir. */
    @Query("SELECT COUNT(c) FROM Categoria c WHERE c.categoriaPai.id = :areaId")
    long contarSubcategoriasDe(@Param("areaId") Long areaId);

    /**
     * Quantos livros estão ligados a esta categoria.
     *
     * É o que impede a exclusão de uma categoria em uso. Sem esta contagem o
     * banco recusaria com violação de chave estrangeira e a tela mostraria um
     * 404 sem dizer nada — que foi exatamente o defeito.
     */
    @Query("SELECT COUNT(lc) FROM LivroCategoria lc WHERE lc.categoria.id = :categoriaId")
    long contarLivrosDe(@Param("categoriaId") Long categoriaId);

    /** A maior ordem já usada entre as áreas, para sugerir a próxima. */
    @Query("SELECT COALESCE(MAX(c.ordemExibicao), 0) FROM Categoria c "
         + "WHERE c.categoriaPai IS NULL AND c.cor IS NOT NULL")
    int maiorOrdemDeArea();
}