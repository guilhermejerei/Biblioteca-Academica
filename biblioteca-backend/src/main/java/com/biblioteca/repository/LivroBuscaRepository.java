package com.biblioteca.repository;

import com.biblioteca.dto.FiltroAcervo;
import com.biblioteca.dto.FiltroCategoria;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Consultas de busca do acervo com filtro de categoria.
 *
 * Fica fora do LivroRepository de propósito: o JPQL não dá conta de uma
 * condição cuja forma muda com o modo e com o número de grupos escolhidos — em
 * "todas" há uma EXISTS por grupo, e quantos grupos existem depende de quantas
 * áreas o usuário marcou. Nenhuma consulta aninhada do JPQL faz isso, e
 * interpolar nomes de coluna seria perigoso.
 *
 * Aqui as condições são montadas em texto e os VALORES vão sempre como
 * parâmetro nomeado. Só a forma é concatenada, nunca um dado do cliente.
 *
 * Nenhuma consulta carrega livro: tudo é COUNT ou DISTINCT id, para a contagem
 * de facetas não custar o mesmo que uma listagem.
 *
 * Um detalhe que custou 940 ms por requisição: as consultas de faceta partem
 * de livro_categoria, e juntei livros e autores só porque o texto do filtro às
 * vezes precisa deles. Quando o filtro não é por texto nem por autor, esse join
 * é desperdício — o MySQL materializava um produto cartesiano de centenas de
 * milhares de linhas para descartar tudo. Por isso o FROM é montado por
 * consulta, com o join só quando alguém vai usar a coluna.
 */
@Repository
public class LivroBuscaRepository {

    @PersistenceContext
    private EntityManager em;

    // ═══════════════════════════════════════════════════════════
    // Contagens e página
    // ═══════════════════════════════════════════════════════════

    /** Quantos livros satisfazem o filtro inteiro. */
    @Transactional(readOnly = true)
    public long contar(FiltroCategoria filtroCat, FiltroAcervo acervo) {
        Map<String, Object> params = new LinkedHashMap<>();
        String sql = "SELECT COUNT(DISTINCT l.id) FROM livros l"
                   + joinsDoAcervo(acervo, "l")
                   + " WHERE 1 = 1"
                   + condicoesDoAcervo(acervo, "l", params)
                   + condicaoDeCategoria(filtroCat, "l.id", params);

        return ((Number) comParametros(em.createNativeQuery(sql), params).getSingleResult())
                .longValue();
    }

    /**
     * Os ids de uma página, em ordem alfabética de título.
     *
     * Devolve só ids de propósito: o conteúdo dos livros vem num findByIdIn em
     * seguida. Trazer as linhas inteiras aqui carregaria as categorias da página
     * duas vezes, uma para contar e outra para serializar.
     */
    @Transactional(readOnly = true)
    public List<Long> idsDaPagina(FiltroCategoria filtroCat, FiltroAcervo acervo,
                                  int pagina, int tamanho) {
        Map<String, Object> params = new LinkedHashMap<>();
        String sql = "SELECT l.id FROM livros l"
                   + joinsDoAcervo(acervo, "l")
                   + " WHERE 1 = 1"
                   + condicoesDoAcervo(acervo, "l", params)
                   + condicaoDeCategoria(filtroCat, "l.id", params)
                   + " ORDER BY l.titulo, l.id"
                   + " LIMIT :limite OFFSET :deslocamento";
        params.put("limite", tamanho);
        params.put("deslocamento", Math.max(0, (pagina - 1) * tamanho));

        List<?> bruto = comParametros(em.createNativeQuery(sql), params).getResultList();
        List<Long> ids = new ArrayList<>(bruto.size());
        for (Object o : bruto) ids.add(((Number) o).longValue());
        return ids;
    }

    // ═══════════════════════════════════════════════════════════
    // Facetas
    // ═══════════════════════════════════════════════════════════

    /**
     * Para cada categoria, quantos livros a reachem dentro dos filtros do
     * acervo — sem nenhuma condição da seleção atual.
     *
     * É a contagem bruta M(X) de cada candidata, que o modo "qualquer" usa
     * para somar com o total atual.
     *
     * COUNT(*) e não COUNT(DISTINCT livro_id): a chave primária é
     * (livro_id, categoria_id), então dentro de um grupo de categoria_id fixo
     * cada livro aparece uma vez só.
     */
    @Transactional(readOnly = true)
    public Map<Long, Long> contagemPorCategoria(FiltroAcervo acervo) {
        Map<String, Object> params = new LinkedHashMap<>();
        String sql = "SELECT f.categoria_id, COUNT(*)"
                   + fromDeLigacoes(acervo, params)
                   + " GROUP BY f.categoria_id";
        return agrupado(sql, params);
    }

    /**
     * Para cada categoria, quantos livros a reachem E satisfazem a seleção
     * atual. É o K(X) de que o modo "qualquer" precisa para descontar a
     * sobreposição com o resultado atual.
     */
    @Transactional(readOnly = true)
    public Map<Long, Long> contagemPorCategoriaDentroDoFiltro(
            FiltroCategoria filtroCat, FiltroAcervo acervo) {
        Map<String, Object> params = new LinkedHashMap<>();
        String sql = "SELECT f.categoria_id, COUNT(*)"
                   + fromDeLigacoes(acervo, params)
                   + condicaoDeCategoria(filtroCat, "f.livro_id", params)
                   + " GROUP BY f.categoria_id";
        return agrupado(sql, params);
    }

    /**
     * Mesma contagem, agrupada pela área da categoria.
     *
     * Aqui o DISTINCT é obrigatório: um livro pode ter duas subcategorias da
     * mesma área, e sem DISTINCT contaria duas vezes.
     */
    @Transactional(readOnly = true)
    public Map<Long, Long> contagemPorAreaDentroDoFiltro(
            FiltroCategoria filtroCat, FiltroAcervo acervo) {
        Map<String, Object> params = new LinkedHashMap<>();
        String sql = "SELECT p.id, COUNT(DISTINCT f.livro_id)"
                   + " FROM livro_categoria f"
                   + " JOIN categorias sc ON sc.id = f.categoria_id"
                   + " JOIN categorias p  ON p.id = sc.categoria_pai_id"
                   + joinsDoAcervoAposLigacao(acervo)
                   + " WHERE 1 = 1"
                   + condicoesDoAcervo(acervo, "l", params)
                   + condicaoDeCategoria(filtroCat, "f.livro_id", params)
                   + " GROUP BY p.id";
        return agrupado(sql, params);
    }

    /**
     * Quantos livros cada área tem, sem filtro de categoria.
     *
     * Esta parte de categorias, não das ligações: o que se quer contar são os
     * livros por área, e começar pelas ligações exigiria um LEFT JOIN para não
     * perder as áreas vazias — que é justamente o que o bibliotecário precisa ver.
     *
     * O DISTINCT é obrigatório. Um livro pode estar em duas subcategorias da
     * mesma área (1984 está em Ficção Científica, Aventura e Distopia e Mistério,
     * todas de Literatura): sem DISTINCT, a pilha de Literatura anunciava 37
     * livros e "Toda a pilha" devolvia 20. A soma das subcategorias conta
     * livro duas vezes; o número da pilha tem que ser o de livros distintos.
     */
    @Transactional(readOnly = true)
    public Map<Long, Long> totalPorArea(FiltroAcervo acervo) {
        Map<String, Object> params = new LinkedHashMap<>();
        String sql = "SELECT p.id, COUNT(DISTINCT f.livro_id)"
                   + " FROM categorias p"
                   + " JOIN categorias sc ON sc.categoria_pai_id = p.id"
                   + " LEFT JOIN livro_categoria f ON f.categoria_id = sc.id"
                   + joinsDoAcervoAposLigacao(acervo)
                   + " WHERE 1 = 1"
                   + condicoesDoAcervo(acervo, "l", params)
                   + " GROUP BY p.id";
        return agrupado(sql, params);
    }

    /**
     * Os joins que as consultas orientadas por ligação precisam, e nada mais.
     *
     * Existe um helper só, de propósito: com dois helpers separados foi poss��vel
     * um deles trazer o join com livros e esquecer o de autores, e a consulta
     * morria com "unknown column a.nome" assim que havia busca por texto.
     */
    private String joinsDoAcervoAposLigacao(FiltroAcervo acervo) {
        if (!precisaLivro(acervo)) return "";
        return " JOIN livros l ON l.id = f.livro_id"
                + (acervo.getTexto() != null ? " JOIN autores a ON a.id = l.autor_id" : "");
    }

    /** Quantos livros cada subcategoria tem, sem filtro de categoria. */
    @Transactional(readOnly = true)
    public Map<Long, Long> totalPorSubcategoria(FiltroAcervo acervo) {
        Map<String, Object> params = new LinkedHashMap<>();
        String sql = "SELECT f.categoria_id, COUNT(*)"
                   + fromDeLigacoes(acervo, params)
                   + " GROUP BY f.categoria_id";
        return agrupado(sql, params);
    }

    // ═══════════════════════════════════════════════════════════
    // Montagem
    // ═══════════════════════════════════════════════════════════

    /**
     * O FROM das consultas que partem de livro_categoria, com o filtro do
     * acervo já embutido.
     *
     * O join com autores só entra quando há busca por texto — é a única coisa
     * que olha o nome do autor. O join com livros só entra quando algum filtro
     * usa coluna do livro (época, estoque, autor); com o filtro vazio, sairiam
     * as duas tabelas fora da consulta.
     */
    private String fromDeLigacoes(FiltroAcervo acervo, Map<String, Object> params) {
        return " FROM livro_categoria f"
                + joinsDoAcervoAposLigacao(acervo)
                + " WHERE 1 = 1"
                + condicoesDoAcervo(acervo, "l", params);
    }

    /** O FROM quando a consulta parte de livros: o autor só entra se houver texto. */
    private String joinsDoAcervo(FiltroAcervo acervo, String apelido) {
        if (acervo != null && acervo.getTexto() != null) {
            return " JOIN autores a ON a.id = " + apelido + ".autor_id";
        }
        return "";
    }

    /**
     * A consulta precisa da tabela livros?
     *
     * Esta é a ÚNICA fonte da verdade sobre isso, e todos os constructors de
     * FROM consultam. Tinha dois lugares decidindo isso e eles divergiram: um
     * trazia o join e o outro não, e a consulta morria com "unknown column
     * l.titulo" só quando havia busca por texto.
     *
     * Texto entra na conta porque olha titulo e isbn, que são colunas do livro
     * — e não só do autor.
     */
    private boolean precisaLivro(FiltroAcervo acervo) {
        if (acervo == null) return false;
        return acervo.getTexto() != null
                || acervo.getAutorId() != null
                || acervo.getAnoDe() != null
                || Boolean.TRUE.equals(acervo.getApenasDisponiveis());
    }

    private String condicoesDoAcervo(FiltroAcervo acervo, String livro,
                                     Map<String, Object> params) {
        StringBuilder sql = new StringBuilder();
        if (acervo == null) return "";

        if (acervo.getTexto() != null) {
            sql.append(" AND (").append(livro).append(".titulo LIKE :texto")
               .append(" OR a.nome LIKE :texto")
               .append(" OR ").append(livro).append(".isbn LIKE :textoIsbn)");
            params.put("texto", "%" + acervo.getTexto() + "%");
            params.put("textoIsbn", "%" + acervo.getTexto() + "%");
        }
        if (acervo.getAutorId() != null) {
            sql.append(" AND ").append(livro).append(".autor_id = :autorId");
            params.put("autorId", acervo.getAutorId());
        }
        if (acervo.getAnoDe() != null && acervo.getAteAno() != null) {
            sql.append(" AND ").append(livro)
               .append(".ano_publicacao BETWEEN :anoDe AND :ateAno");
            params.put("anoDe", acervo.getAnoDe());
            params.put("ateAno", acervo.getAteAno());
        }
        if (Boolean.TRUE.equals(acervo.getApenasDisponiveis())) {
            sql.append(" AND ").append(livro).append(".quantidade_disponivel > 0");
        }
        return sql.toString();
    }

    /**
     * O filtro de categoria virando condições AND.
     *
     * "qualquer" precisa de uma EXISTS só, sobre o conjunto inteiro de
     * categorias escolhidas (as áreas já vêm expandidas). "todas" precisa de uma
     * EXISTS por grupo, e o livro tem de satisfazer todas.
     *
     * A coluna de correlação importa: quando a consulta parte de
     * livro_categoria, correlacionar com f.livro_id deixa o MySQL materializar
     * o semi-join. Correlacionar com l.id, atrás de um join, o obrigava a
     * reavaliar a EXISTS para cada linha do produto cartesiano.
     */
    private String condicaoDeCategoria(FiltroCategoria filtro, String coluna,
                                       Map<String, Object> params) {
        if (filtro == null || filtro.isVazio()) return "";

        if (!filtro.ehTodas()) {
            Set<Long> cats = filtro.getCategoriaIds();
            if (cats.isEmpty()) return "";
            params.put("categorias", cats);
            return " AND EXISTS (SELECT 1 FROM livro_categoria f2 WHERE f2.livro_id = "
                 + coluna + " AND f2.categoria_id IN (:categorias))";
        }

        StringBuilder sql = new StringBuilder();
        List<Set<Long>> grupos = filtro.getGrupos();
        for (int i = 0; i < grupos.size(); i++) {
            params.put("grupo" + i, grupos.get(i));
            sql.append(" AND EXISTS (SELECT 1 FROM livro_categoria g").append(i)
               .append(" WHERE g").append(i).append(".livro_id = ").append(coluna)
               .append(" AND g").append(i).append(".categoria_id IN (:grupo").append(i).append("))");
        }
        return sql.toString();
    }

    @SuppressWarnings("unchecked")
    private Map<Long, Long> agrupado(String sql, Map<String, Object> params) {
        List<Object[]> linhas = comParametros(em.createNativeQuery(sql), params).getResultList();
        Map<Long, Long> saida = new LinkedHashMap<>();
        for (Object[] linha : linhas) {
            saida.put(((Number) linha[0]).longValue(), ((Number) linha[1]).longValue());
        }
        return saida;
    }

    /**
     * Liga os parâmetros nomeados na consulta.
     *
     * O Query da Jakarta não tem setParameters(Map) — esse método é do
     * Hibernate — então o vínculo é feito um a um, o que mantém o código
     * funcionando se o provedor mudar.
     */
    private jakarta.persistence.Query comParametros(
            jakarta.persistence.Query consulta, Map<String, Object> params) {
        for (Map.Entry<String, Object> e : params.entrySet()) {
            consulta.setParameter(e.getKey(), e.getValue());
        }
        return consulta;
    }
}