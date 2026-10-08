package com.biblioteca.migracao;

import org.junit.jupiter.api.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Testa a migração V3 (categorias hierárquicas + multicategoria) contra um
 * MySQL real.
 *
 * Precisa ser MySQL de verdade porque o que se verifica aqui é justamente o
 * comportamento do banco: a coluna gerada principal_norm, o índice UNIQUE que
 * impede duas principais, os CHECKs e os triggers. Nada disso existe em H2.
 *
 * Cada teste cria um banco descartável (prefixo migr_v3_) com o schema atual,
 * aplica a migração e dropa no final. Se o MySQL não estiver acessível, os
 * testes são pulados com motivo explícito em vez de falhar.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class MigracaoV3Test {

    private static final String HOST  = System.getenv().getOrDefault("DB_HOST", "localhost");
    private static final String PORTA = System.getenv().getOrDefault("DB_PORT", "3306");
    private static final String USER  = System.getenv().getOrDefault("DB_USERNAME", "root");
    private static final String SENHA = System.getenv().getOrDefault("DB_PASSWORD", "");
    private static final String PARAMETROS =
            "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    /**
     * A migração saiu de src/main/resources: não há Flyway, elas são aplicadas
     * à mão, e ficar dentro do código só as enterrava no .jar sem ganho nenhum.
     * Agora ficam com as demais em docs/banco/migracoes/.
     *
     * O caminho é relativo à raiz do backend, que é onde o Maven roda.
     */
    private static final String ARQUIVO_V3 =
            "../docs/banco/migracoes/V3__categorias_hierarquicas_e_multicategoria.sql";

    /** O recorte de dados de exemplo cria 3 livros, 2 deles com categoria. */
    private static final int EXEMPLO_LIVROS_COM_CATEGORIA = 2;
    private static final int EXEMPLO_TOTAL_CATEGORIAS  = 5;

    private String banco;

    @BeforeAll
    static void exigeMySql() {
        // o driver vem em escopo runtime; o ServiceLoader do DriverManager nem
        // sempre o enxerga quando a classe roda dentro do surefire
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new IllegalStateException(
                    "driver MySQL ausente no classpath de teste - verifique a dependencia mysql-connector-j", e);
        }
        try {
            // conecta sem selecionar schema: cada teste cria o seu banco
            // descartavel, e criar o schema e parte do que se exercita
            DriverManager.getConnection(urlBase() + "/" + PARAMETROS, USER, SENHA).close();
        } catch (SQLException e) {
            Assumptions.assumeTrue(false, () -> "MySQL indisponivel em " + HOST + ":" + PORTA
                    + " - testes de migracao pulados (" + e.getMessage() + ")");
        }
    }

    @BeforeEach
    void criaBancoDeTeste() throws SQLException {
        banco = "migr_v3_t" + System.nanoTime();
        executaSemSchema("DROP DATABASE IF EXISTS " + banco);
        executaSemSchema("CREATE DATABASE " + banco + " CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci");
        for (String stmt : schemaModelo()) executaNo(banco, stmt);
        for (String stmt : dadosDeExemplo()) executaNo(banco, stmt);
    }

    @AfterEach
    void dropaBancoDeTeste() throws SQLException {
        if (banco != null) executaSemSchema("DROP DATABASE IF EXISTS " + banco);
    }

    // =========================================================
    // Banco novo, sem dados
    // =========================================================

    @Test
    @Order(1)
    @DisplayName("V3 roda em banco novo sem dados e cria todas as estruturas")
    void bancoNovo_aplicaSemErro() throws Exception {
        String vazio = banco + "_vazio";
        executaSemSchema("DROP DATABASE IF EXISTS " + vazio);
        executaSemSchema("CREATE DATABASE " + vazio + " CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci");
        try {
            for (String stmt : schemaModelo()) executaNo(vazio, stmt);
            aplicaMigracao(vazio);

            assertThat(contaColunas(vazio, "categorias", "categoria_pai_id", "ordem_exibicao", "cor"))
                    .as("tres colunas novas em categorias").isEqualTo(3);
            assertThat(contaColunas(vazio, "livros", "categoria_legada"))
                    .as("coluna de nome legado em livros").isEqualTo(1);
            assertThat(existeTabela(vazio, "livro_categoria")).as("tabela livro_categoria").isTrue();
        } finally {
            executaSemSchema("DROP DATABASE IF EXISTS " + vazio);
        }
    }

    // =========================================================
    // Copia do acervo
    // =========================================================

    @Test
    @Order(2)
    @DisplayName("V3 copia a categoria atual de cada livro como principal")
    void copiaDoAcervo_cadaLivroFicaComUmaPrincipal() throws Exception {
        aplicaMigracao(banco);

        assertThat(inteiro(banco, "SELECT COUNT(*) FROM livro_categoria"))
                .as("nenhuma linha da tabela antiga se perde")
                .isEqualTo(inteiro(banco, "SELECT COUNT(*) FROM livros_categorias"));

        assertThat(inteiro(banco, "SELECT COUNT(*) FROM livro_categoria WHERE principal"))
                .as("uma principal por livro que tinha categoria")
                .isEqualTo(EXEMPLO_LIVROS_COM_CATEGORIA);

        // o livro sem categoria antiga fica sem principal nenhuma
        assertThat(inteiro(banco, "SELECT COUNT(*) FROM livro_categoria WHERE livro_id = 3")).isZero();
    }

    @Test
    @Order(3)
    @DisplayName("V3 grava em categoria_legada exatamente o nome que o livro tinha")
    void copiaDoAcervo_nomeLegadoBateComOriginal() throws Exception {
        aplicaMigracao(banco);

        List<List<Object>> divergentes = consulta(banco,
                "SELECT l.id, l.categoria_legada FROM livros l WHERE NOT (l.categoria_legada <=> ("
                        + "  SELECT GROUP_CONCAT(c.nome ORDER BY c.nome SEPARATOR ', ')"
                        + "  FROM livros_categorias lc JOIN categorias c ON c.id = lc.categoria_id"
                        + "  WHERE lc.livro_id = l.id))");

        assertThat(divergentes)
                .as("categoria_legada deve reproduzir os nomes da tabela antiga, sem divergencia")
                .isEmpty();

        // livro sem categoria fica com NULL, nunca com string vazia
        assertThat(inteiro(banco, "SELECT COUNT(*) FROM livros WHERE categoria_legada = ''"))
                .as("nada de string vazia no lugar de NULL").isZero();
        assertThat(inteiro(banco, "SELECT COUNT(*) FROM livros WHERE categoria_legada IS NOT NULL"))
                .isEqualTo(EXEMPLO_LIVROS_COM_CATEGORIA);
    }

    @Test
    @Order(4)
    @DisplayName("V3 e nao destrutiva: nenhuma tabela ou coluna anterior e removida")
    void naoDestrutiva_preservaEstruturaAnterior() throws Exception {
        List<String> antes = tabelasEColunas(banco);
        aplicaMigracao(banco);
        List<String> depois = tabelasEColunas(banco);

        assertThat(depois).as("tudo que existia antes precisa continuar existindo")
                .containsAll(antes);

        assertThat(inteiro(banco, "SELECT COUNT(*) FROM categorias"))
                .as("as categorias antigas continuam todas la")
                .isEqualTo(EXEMPLO_TOTAL_CATEGORIAS);
        assertThat(inteiro(banco, "SELECT COUNT(*) FROM livros_categorias"))
                .as("a tabela antiga segue populada")
                .isEqualTo(inteiro(banco, "SELECT COUNT(*) FROM livro_categoria"));
    }

    @Test
    @Order(5)
    @DisplayName("Categorias existentes ficam no estado legado, aguardando a V4")
    void legado_ficaSemPaiNemCor() throws Exception {
        aplicaMigracao(banco);

        assertThat(inteiro(banco,
                "SELECT COUNT(*) FROM categorias"
                        + " WHERE categoria_pai_id IS NULL AND ordem_exibicao = 0 AND cor IS NULL"))
                .isEqualTo(EXEMPLO_TOTAL_CATEGORIAS);
    }

    // =========================================================
    // Invariantes garantidas pelo banco
    // =========================================================

    @Test
    @Order(6)
    @DisplayName("Banco recusa duas categorias principais no mesmo livro")
    void duasPrincipais_saoRecusadas() throws Exception {
        aplicaMigracao(banco);

        // categoria 3 é diferente da que o livro 1 já tem (categoria 1), senão o
        // banco baria pela chave primária e o teste não provaria nada
        assertThat(inteiro(banco, "SELECT categoria_id FROM livro_categoria"
                + " WHERE livro_id = 1 AND principal")).isEqualTo(1);

        assertThatThrownBy(() -> executaNo(banco,
                "INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES (1, 3, TRUE)"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("uk_livro_categoria_principal");
    }

    @Test
    @Order(7)
    @DisplayName("Banco aceita varias categorias secundarias no mesmo livro")
    void variasSecundarias_saoAceitas() throws Exception {
        aplicaMigracao(banco);

        // as secundárias usam categorias que o livro 1 ainda não tem
        executaNo(banco, "INSERT INTO livro_categoria (livro_id, categoria_id, principal)"
                + " VALUES (1, 4, FALSE), (1, 5, FALSE)");

        assertThat(inteiro(banco, "SELECT COUNT(*) FROM livro_categoria WHERE livro_id = 1"))
                .as("a principal antiga mais duas secundarias").isEqualTo(3);
        assertThat(inteiro(banco, "SELECT COUNT(*) FROM livro_categoria WHERE livro_id = 1 AND principal"))
                .as("continua exatamente uma principal").isEqualTo(1);
    }

    @Test
    @Order(8)
    @DisplayName("So existem dois niveis: uma subcategoria nao pode virar pai")
    void tresNiveis_saoRecusados() throws Exception {
        aplicaMigracao(banco);
        long area = insere("INSERT INTO categorias (nome, ordem_exibicao, cor) VALUES ('Area teste', 99, '#8C2B2B')");
        long sub  = insere("INSERT INTO categorias (nome, categoria_pai_id) VALUES ('Sub teste', " + area + ")");

        // area com pai: cai no CHECK de estrutura
        assertThatThrownBy(() -> executaNo(banco,
                "INSERT INTO categorias (nome, ordem_exibicao, categoria_pai_id, cor)"
                        + " VALUES ('Neto teste', 99, " + area + ", '#6B4A3A')"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("chk_categoria_estrutura");

        // subcategoria como pai: barrado pelo trigger
        assertThatThrownBy(() -> executaNo(banco,
                "INSERT INTO categorias (nome, categoria_pai_id) VALUES ('Sobrinha teste', " + sub + ")"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("deve ser uma area");

        // o mesmo barramento vale em UPDATE
        assertThatThrownBy(() -> executaNo(banco,
                "UPDATE categorias SET categoria_pai_id = " + sub + " WHERE id = " + area))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("deve ser uma area");
    }

    @Test
    @Order(9)
    @DisplayName("Subcategoria nao pode ter cor nem ordem propria")
    void subcategoria_semCorOuOrdem() throws Exception {
        aplicaMigracao(banco);
        long area = insere("INSERT INTO categorias (nome, ordem_exibicao, cor) VALUES ('Area cor', 98, '#6B4A3A')");

        assertThatThrownBy(() -> executaNo(banco,
                "INSERT INTO categorias (nome, categoria_pai_id, cor) VALUES ('Sub com cor', " + area + ", '#8C2B2B')"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("chk_categoria_estrutura");

        assertThatThrownBy(() -> executaNo(banco,
                "INSERT INTO categorias (nome, ordem_exibicao, categoria_pai_id)"
                        + " VALUES ('Sub com ordem', 5, " + area + ")"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("chk_categoria_estrutura");
    }

    @Test
    @Order(10)
    @DisplayName("Area sem cor e recusada")
    void areaSemCor_eRecusada() throws Exception {
        aplicaMigracao(banco);

        assertThatThrownBy(() -> executaNo(banco,
                "INSERT INTO categorias (nome, ordem_exibicao) VALUES ('Area sem cor', 97)"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("chk_categoria_estrutura");
    }

    // =========================================================
    // Utilidades
    // =========================================================

    private void aplicaMigracao(String esquema) throws Exception {
        String sql = Files.readString(Path.of(ARQUIVO_V3), StandardCharsets.UTF_8);
        for (String stmt : divideComandos(sql)) executaNo(esquema, stmt);
    }

    /**
     * Divide o arquivo em comandos respeitando o DELIMITER $$ dos triggers.
     *
     * Um split simples por ponto e vírgula quebra o corpo dos triggers, porque
     * o "END IF;" interno seria tomado como fim de comando. Aqui o delimitador
     * troca para $$ dentro dos blocos delimitados e volta para ";" no fim.
     */
    private List<String> divideComandos(String sql) {
        List<String> comandos = new ArrayList<>();
        String delimitador = ";";
        StringBuilder atual = new StringBuilder();

        for (String linha : semComentarios(sql).split("\n")) {
            String limpa = linha.trim();
            if (limpa.toUpperCase().startsWith("DELIMITER ")) {
                delimita(atual, comandos, delimitador);
                delimitador = limpa.substring("DELIMITER ".length()).trim();
                continue;
            }
            atual.append(linha).append('\n');
            // procura o delimitador fora de literais de texto. O delimitador
            // so volta a ";" numa linha DELIMITER — mantê-lo aqui quebraria
            // o segundo trigger do bloco
            int pos = posDelimitador(atual.toString(), delimitador);
            if (pos >= 0) {
                String comando = atual.substring(0, pos).trim();
                if (!comando.isBlank()) comandos.add(comando);
                atual.setLength(0);
            }
        }
        delimita(atual, comandos, delimitador);
        return comandos;
    }

    /** Emite o que sobrou no buffer, ignorando o delimitador final. */
    private void delimita(StringBuilder buffer, List<String> comandos, String delimitador) {
        String texto = buffer.toString().trim();
        if (texto.isBlank()) return;
        if (texto.endsWith(delimitador)) texto = texto.substring(0, texto.length() - delimitador.length()).trim();
        if (!texto.isBlank()) comandos.add(texto);
        buffer.setLength(0);
    }

    /** Posição do primeiro delimitador fora de literais, ou -1. */
    private int posDelimitador(String texto, String delimitador) {
        char aspa = 0;
        for (int i = 0; i < texto.length(); i++) {
            char atual = texto.charAt(i);
            if (aspa != 0) {
                if (atual == aspa) {
                    // literal escapado com barra invertida nao fecha a string
                    if (i > 0 && texto.charAt(i - 1) == '\\') continue;
                    aspa = 0;
                } else if (atual == '\\') {
                    i++;
                }
                continue;
            }
            if (atual == '\'' || atual == '"') { aspa = atual; continue; }
            if (texto.startsWith(delimitador, i)) return i;
        }
        return -1;
    }

    /** O mysql.exe aceita comentarios; o JDBC nao remove a linha inteira. */
    private String semComentarios(String sql) {
        StringBuilder limpo = new StringBuilder();
        for (String linha : sql.split("\n")) {
            if (linha.trim().startsWith("--")) continue;
            limpo.append(linha).append('\n');
        }
        return limpo.toString();
    }

    /**
     * Schema equivalente ao que o Hibernate cria hoje (ddl-auto=update), sem
     * dados. Espelha a estrutura real de biblioteca no momento da migracao.
     */
    private List<String> schemaModelo() {
        return List.of(
            "CREATE TABLE autores ("
                    + " id BIGINT NOT NULL AUTO_INCREMENT, nome VARCHAR(255) NOT NULL,"
                    + " PRIMARY KEY (id)) ENGINE=InnoDB",
            "CREATE TABLE categorias ("
                    + " id BIGINT NOT NULL AUTO_INCREMENT, nome VARCHAR(255) NOT NULL,"
                    + " PRIMARY KEY (id)) ENGINE=InnoDB",
            "CREATE TABLE livros ("
                    + " id BIGINT NOT NULL AUTO_INCREMENT, titulo VARCHAR(255) NOT NULL,"
                    + " isbn VARCHAR(255) NOT NULL, ano_publicacao INT, quantidade_total INT NOT NULL,"
                    + " quantidade_disponivel INT NOT NULL, autor_id BIGINT NOT NULL,"
                    + " capa_arquivo VARCHAR(255), capa_origem VARCHAR(50),"
                    + " capa_status VARCHAR(50) NOT NULL DEFAULT 'SEM_CAPA', capa_atualizada_em DATETIME,"
                    + " PRIMARY KEY (id), UNIQUE KEY uk_isbn (isbn), KEY idx_autor (autor_id)) ENGINE=InnoDB",
            "CREATE TABLE livros_categorias ("
                    + " livro_id BIGINT NOT NULL, categoria_id BIGINT NOT NULL,"
                    + " PRIMARY KEY (livro_id, categoria_id), KEY fk_lc_categoria (categoria_id)) ENGINE=InnoDB"
        );
    }

    /**
     * Recorte do acervo real: 3 livros, 2 com categoria e 1 sem (como os 33
     * que hoje estao sem nenhuma), 5 categorias.
     */
    private List<String> dadosDeExemplo() {
        return List.of(
            "INSERT INTO autores (nome) VALUES ('Autor Um')",
            "INSERT INTO categorias (nome) VALUES ('Ficcao Cientifica'), ('Fantasia'), ('Filosofia'),"
                    + " ('Medicina'), ('Ciencia')",
            "INSERT INTO livros (titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id)"
                    + " VALUES ('Fundacao', '978111', 1951, 2, 2, 1),"
                    + " ('Duna', '978222', 1965, 1, 1, 1),"
                    + " ('Sapiens', '978333', 2011, 3, 3, 1)",
            "INSERT INTO livros_categorias (livro_id, categoria_id) VALUES (1, 1), (2, 2), (2, 3)"
        );
    }

    // ---- acesso ao banco ----------------------------------------

    private List<String> tabelasEColunas(String esquema) throws SQLException {
        List<String> itens = new ArrayList<>(
                consultaStrings(esquema, "SELECT table_name FROM information_schema.tables"
                        + " WHERE table_schema = '" + esquema + "'"));
        for (String tabela : consultaStrings(esquema,
                "SELECT DISTINCT table_name FROM information_schema.columns"
                        + " WHERE table_schema = '" + esquema + "'")) {
            itens.addAll(consultaStrings(esquema,
                    "SELECT CONCAT(table_name, '.', column_name) FROM information_schema.columns"
                            + " WHERE table_schema = '" + esquema + "' AND table_name = '" + tabela + "'"));
        }
        return itens;
    }

    private long contaColunas(String esquema, String tabela, String... colunas) {
        String lista = String.join(", ", java.util.Arrays.stream(colunas)
                .map(c -> "'" + c + "'").toList());
        return inteiro(esquema, "SELECT COUNT(*) FROM information_schema.columns"
                + " WHERE table_schema = '" + esquema + "' AND table_name = '" + tabela
                + "' AND column_name IN (" + lista + ")");
    }

    private boolean existeTabela(String esquema, String tabela) throws SQLException {
        return inteiro(esquema, "SELECT COUNT(*) FROM information_schema.tables"
                + " WHERE table_schema = '" + esquema + "' AND table_name = '" + tabela + "'") == 1;
    }

    private long insere(String sql) throws SQLException {
        try (Connection c = DriverManager.getConnection(url(banco), USER, SENHA);
             Statement s = c.createStatement()) {
            s.executeUpdate(sql, Statement.RETURN_GENERATED_KEYS);
            try (ResultSet rs = s.getGeneratedKeys()) {
                rs.next();
                return rs.getLong(1);
            }
        }
    }

    private long inteiro(String esquema, String sql) {
        try (Connection c = DriverManager.getConnection(url(esquema), USER, SENHA);
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery(sql)) {
            rs.next();
            return rs.getLong(1);
        } catch (SQLException e) {
            throw new IllegalStateException("falha na consulta: " + sql, e);
        }
    }

    private List<List<Object>> consulta(String esquema, String sql) throws SQLException {
        List<List<Object>> linhas = new ArrayList<>();
        try (Connection c = DriverManager.getConnection(url(esquema), USER, SENHA);
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery(sql)) {
            int total = rs.getMetaData().getColumnCount();
            while (rs.next()) {
                List<Object> linha = new ArrayList<>();
                for (int i = 1; i <= total; i++) linha.add(rs.getObject(i));
                linhas.add(linha);
            }
        }
        return linhas;
    }

    private List<String> consultaStrings(String esquema, String sql) throws SQLException {
        return consulta(esquema, sql).stream().map(l -> String.valueOf(l.get(0))).toList();
    }

    private void executaNo(String esquema, String sql) throws SQLException {
        try (Connection c = DriverManager.getConnection(url(esquema), USER, SENHA);
             Statement s = c.createStatement()) {
            s.execute(sql);
        }
    }

    /** Executa contra a instancia sem schema - usado para criar e dropar bancos. */
    private void executaSemSchema(String sql) throws SQLException {
        try (Connection c = DriverManager.getConnection(urlSemSchema(), USER, SENHA);
             Statement s = c.createStatement()) {
            s.execute(sql);
        }
    }

    private static String url(String esquema) {
        return urlBase() + "/" + esquema + PARAMETROS;
    }

    private static String urlSemSchema() {
        return urlBase() + "/" + PARAMETROS;
    }

    private static String urlBase() {
        return "jdbc:mysql://" + HOST + ":" + PORTA;
    }
}