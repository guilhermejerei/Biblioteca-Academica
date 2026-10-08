-- ============================================================================
--  V6 · Índices de performance
--
--  Este arquivo adiciona índices baseados nas queries reais do backend:
--
--    · EmprestimoRepository  — filtros por status, usuario_id, livro_id
--    · LivroBuscaRepository  — LIKE em titulo/isbn, filtro autor_id,
--                               filtro quantidade_disponivel, ORDER BY titulo
--    · UsuarioRepository     — findByEmail (login), findByTipo + ORDER BY nome
--    · AutorRepository       — ORDER BY nome (findAll implícito do serviço)
--
--  Todos os CREATE INDEX usam IF NOT EXISTS: pode ser reaplicado sem erro.
--  Os índices PRIMARY KEY e UNIQUE KEY do 01-esquema.sql não são repetidos.
-- ============================================================================

USE biblioteca;

-- ----------------------------------------------------------------------------
--  emprestimos
-- ----------------------------------------------------------------------------

-- EmprestimoRepository.findNaoDevolvidos()  →  WHERE status <> 'DEVOLVIDO'
-- EmprestimoRepository.listarAbertosComLivro()  →  WHERE status <> 'DEVOLVIDO'
-- EmprestimoRepository.countEmprestimosAtivos()  →  WHERE livro_id = ? AND status <> 'DEVOLVIDO'
CREATE INDEX IF NOT EXISTS idx_emp_status
    ON emprestimos (status);

-- EmprestimoRepository.countEmprestimosAtivos()
-- Cobre o par (livro_id, status) de uma vez — evita que o MySQL use dois índices
-- separados e depois faça intersecção (mais lento que um índice composto).
CREATE INDEX IF NOT EXISTS idx_emp_livro_status
    ON emprestimos (livro_id, status);

-- EmprestimoRepository.findByUsuarioId()  →  WHERE usuario_id = ?
-- (já existe idx_emprestimos_usuario no 01-esquema.sql — não duplicar)
-- EmprestimoService: busca empréstimos ativos/atrasados por usuário
CREATE INDEX IF NOT EXISTS idx_emp_usuario_status
    ON emprestimos (usuario_id, status);

-- Ordenação padrão da listagem de empréstimos (mais recentes primeiro)
CREATE INDEX IF NOT EXISTS idx_emp_data_emprestimo
    ON emprestimos (data_emprestimo DESC);

-- Empréstimos vencidos (ATRASADO): data_prevista_devolucao < hoje
-- Usado pelo job/serviço que atualiza status para ATRASADO
CREATE INDEX IF NOT EXISTS idx_emp_prevista_status
    ON emprestimos (data_prevista_devolucao, status);

-- ----------------------------------------------------------------------------
--  livros
-- ----------------------------------------------------------------------------

-- LivroBuscaRepository.condicoesDoAcervo()
--   WHERE l.titulo LIKE '%texto%'  — LIKE com % no início não usa B-tree,
--   mas com FULLTEXT o MySQL pode usar o índice de forma eficiente.
--   Para LIKE simples (sem FULLTEXT), o índice convencional ainda ajuda no
--   filtro de autor_id e disponibilidade que acompanha o texto.

-- Busca full-text em titulo — substitui o LIKE '%texto%' para acervos grandes.
-- O serviço pode usar MATCH(titulo) AGAINST (:texto IN BOOLEAN MODE) no futuro.
CREATE FULLTEXT INDEX IF NOT EXISTS ft_livros_titulo
    ON livros (titulo);

-- LivroBuscaRepository: WHERE l.autor_id = :autorId
-- (já existe idx_livros_autor no 01-esquema.sql — não duplicar)

-- LivroBuscaRepository: WHERE l.quantidade_disponivel > 0  (filtro "apenas disponíveis")
-- Índice parcial não existe no MySQL padrão — índice normal é suficiente
-- para filtrar rápido e cobrir o UPDATE atômico de decremento/incremento.
CREATE INDEX IF NOT EXISTS idx_livros_disponivel
    ON livros (quantidade_disponivel);

-- LivroRepository.findByCapaStatus()  →  WHERE capa_status = ?
-- Usado pelo serviço de sincronização de capas para buscar livros sem capa.
CREATE INDEX IF NOT EXISTS idx_livros_capa_status
    ON livros (capa_status);

-- Ordenação padrão da listagem (ORDER BY titulo ASC nos resultados paginados)
CREATE INDEX IF NOT EXISTS idx_livros_titulo
    ON livros (titulo);

-- LivroBuscaRepository: WHERE l.ano_publicacao BETWEEN :anoDe AND :ateAno
CREATE INDEX IF NOT EXISTS idx_livros_ano
    ON livros (ano_publicacao);

-- ----------------------------------------------------------------------------
--  autores
-- ----------------------------------------------------------------------------

-- AutorService.findAll() → ORDER BY nome ASC implícito nos controllers
-- Também cobre a busca por nome no LIKE do LivroBuscaRepository (OR a.nome LIKE :texto)
CREATE FULLTEXT INDEX IF NOT EXISTS ft_autores_nome
    ON autores (nome);

CREATE INDEX IF NOT EXISTS idx_autores_nome
    ON autores (nome);

-- ----------------------------------------------------------------------------
--  usuarios
-- ----------------------------------------------------------------------------

-- UsuarioRepository.findByEmail()  →  WHERE email = ?
-- (já existe UNIQUE KEY uk_usuarios_email no 01-esquema.sql — cobre essa query)

-- UsuarioRepository.findByTipoOrderByNomeAsc()  →  WHERE tipo = ? ORDER BY nome ASC
-- Índice composto cobre o WHERE e o ORDER BY numa passagem só.
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_nome
    ON usuarios (tipo, nome);

-- UsuarioRepository.existsByCpf()  →  WHERE cpf = ?
-- (já existe UNIQUE KEY uk_usuarios_cpf no 01-esquema.sql — cobre essa query)

-- ----------------------------------------------------------------------------
--  categorias
-- ----------------------------------------------------------------------------

-- CategoriaService: busca áreas (WHERE categoria_pai_id IS NULL)
-- e subcategorias (WHERE categoria_pai_id = ?)
-- (já existe KEY idx_categorias_pai no 01-esquema.sql — cobre essas queries)

-- Ordenação da listagem de áreas (ORDER BY ordem_exibicao ASC)
-- (já existe KEY idx_categorias_ordem no 01-esquema.sql — cobre essa query)

-- ----------------------------------------------------------------------------
--  livro_categoria
-- ----------------------------------------------------------------------------

-- (todos os índices relevantes já existem no 01-esquema.sql:
--  PRIMARY KEY (livro_id, categoria_id), idx_lc_livro, idx_lc_categoria,
--  idx_lc_categoria_livro, uk_livro_categoria_principal)

-- ----------------------------------------------------------------------------
--  Conferência
-- ----------------------------------------------------------------------------

SELECT
    INDEX_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'biblioteca'
  AND INDEX_NAME NOT IN ('PRIMARY')
ORDER BY TABLE_NAME, INDEX_NAME;
