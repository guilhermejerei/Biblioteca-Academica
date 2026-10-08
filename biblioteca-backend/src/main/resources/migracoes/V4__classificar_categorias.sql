-- =========================================================
-- Migração V4: classificar as categorias nas 10 áreas
--
-- A V3 criou as estruturas (categoria_pai_id, ordem_exibicao, cor,
-- livro_categoria, categoria_legada) e deixou as 129 categorias antigas no
-- estado legado. Esta migração:
--   1. cria as 10 áreas, na ordem fixa e com a cor de cada uma
--   2. cria as 47 subcategorias, cada uma sob sua área
--   3. religa os 20 livros que tinham categoria, marcando uma principal
--   4. dá categoria aos 33 livros que estavam sem nenhuma
--
-- NÃO DESTRUTIVA: as 129 categorias antigas continuam existindo, apenas
-- deixam de apontar para livro nenhum. A remoção delas fica para uma
-- migração posterior, com aprovação. A tabela livros_categorias e a
-- coluna livros.categoria_legada também ficam intactas.
--
-- Origem: docs/mapa_categorias.csv (aprovado). Para mudar a taxonomia,
-- edite o CSV e regenere este arquivo.
--
-- Aplicar via cmd:
--   mysql -u root -p --default-character-set=utf8mb4 biblioteca < V4__classificar_categorias.sql
-- =========================================================
SET NAMES utf8mb4;

START TRANSACTION;

-- -------------------------------------------------------------
-- 1. As 10 áreas
-- -------------------------------------------------------------
-- O nome da área é o que amarra o CSV ao banco, então cada INSERT
-- é guardado: rodar duas vezes não duplica nada.
INSERT INTO categorias (nome, ordem_exibicao, cor)
SELECT 'Literatura', 1, '#8C2B2B'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Literatura' AND categoria_pai_id IS NULL);

INSERT INTO categorias (nome, ordem_exibicao, cor)
SELECT 'História e Sociedade', 2, '#6B4A3A'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'História e Sociedade' AND categoria_pai_id IS NULL);

INSERT INTO categorias (nome, ordem_exibicao, cor)
SELECT 'Ciências', 3, '#2F6B4F'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Ciências' AND categoria_pai_id IS NULL);

INSERT INTO categorias (nome, ordem_exibicao, cor)
SELECT 'Computação e Tecnologia', 4, '#1E3D59'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Computação e Tecnologia' AND categoria_pai_id IS NULL);

INSERT INTO categorias (nome, ordem_exibicao, cor)
SELECT 'Filosofia e Psicologia', 5, '#4A2545'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Filosofia e Psicologia' AND categoria_pai_id IS NULL);

INSERT INTO categorias (nome, ordem_exibicao, cor)
SELECT 'Educação e Pesquisa', 6, '#6E5A16'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Educação e Pesquisa' AND categoria_pai_id IS NULL);

INSERT INTO categorias (nome, ordem_exibicao, cor)
SELECT 'Política e Economia', 7, '#9C4A1E'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Política e Economia' AND categoria_pai_id IS NULL);

INSERT INTO categorias (nome, ordem_exibicao, cor)
SELECT 'Quadrinhos e Artes', 8, '#7A2E5C'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Quadrinhos e Artes' AND categoria_pai_id IS NULL);

INSERT INTO categorias (nome, ordem_exibicao, cor)
SELECT 'Biografias e Memórias', 9, '#3F6B7A'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Biografias e Memórias' AND categoria_pai_id IS NULL);

INSERT INTO categorias (nome, ordem_exibicao, cor)
SELECT 'Infantojuvenil', 10, '#8C6B2B'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Infantojuvenil' AND categoria_pai_id IS NULL);

-- -------------------------------------------------------------
-- 2. As subcategorias, cada uma sob sua área
-- -------------------------------------------------------------
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Aventura e Distopia', id FROM categorias
WHERE nome = 'Literatura' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Aventura e Distopia' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Crônica Ensaio e Sátira', id FROM categorias
WHERE nome = 'Literatura' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Crônica Ensaio e Sátira' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Fantasia e Mitologia', id FROM categorias
WHERE nome = 'Literatura' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Fantasia e Mitologia' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Ficção Científica', id FROM categorias
WHERE nome = 'Literatura' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Ficção Científica' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Literaturas Nacionais', id FROM categorias
WHERE nome = 'Literatura' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Literaturas Nacionais' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Mistério Thriller e Terror', id FROM categorias
WHERE nome = 'Literatura' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Mistério Thriller e Terror' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Poesia e Conto', id FROM categorias
WHERE nome = 'Literatura' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Poesia e Conto' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Romance e Realismo', id FROM categorias
WHERE nome = 'Literatura' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Romance e Realismo' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Geografia', id FROM categorias
WHERE nome = 'História e Sociedade' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Geografia' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'História do Brasil', id FROM categorias
WHERE nome = 'História e Sociedade' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'História do Brasil' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'História Geral', id FROM categorias
WHERE nome = 'História e Sociedade' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'História Geral' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Religião e Espiritualidade', id FROM categorias
WHERE nome = 'História e Sociedade' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Religião e Espiritualidade' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Sociologia e Antropologia', id FROM categorias
WHERE nome = 'História e Sociedade' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Sociologia e Antropologia' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Biologia e Evolução', id FROM categorias
WHERE nome = 'Ciências' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Biologia e Evolução' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Ciência Geral e Divulgação', id FROM categorias
WHERE nome = 'Ciências' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Ciência Geral e Divulgação' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Física e Astronomia', id FROM categorias
WHERE nome = 'Ciências' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Física e Astronomia' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Matemática', id FROM categorias
WHERE nome = 'Ciências' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Matemática' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Medicina e Saúde', id FROM categorias
WHERE nome = 'Ciências' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Medicina e Saúde' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Natureza e Meio Ambiente', id FROM categorias
WHERE nome = 'Ciências' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Natureza e Meio Ambiente' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Química', id FROM categorias
WHERE nome = 'Ciências' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Química' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Banco de Dados', id FROM categorias
WHERE nome = 'Computação e Tecnologia' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Banco de Dados' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Engenharia de Software', id FROM categorias
WHERE nome = 'Computação e Tecnologia' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Engenharia de Software' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Programação', id FROM categorias
WHERE nome = 'Computação e Tecnologia' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Programação' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Redes e Sistemas', id FROM categorias
WHERE nome = 'Computação e Tecnologia' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Redes e Sistemas' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Tecnologia e Sociedade', id FROM categorias
WHERE nome = 'Computação e Tecnologia' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Tecnologia e Sociedade' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Autoajuda e Desenvolvimento Pessoal', id FROM categorias
WHERE nome = 'Filosofia e Psicologia' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Autoajuda e Desenvolvimento Pessoal' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Filosofia', id FROM categorias
WHERE nome = 'Filosofia e Psicologia' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Filosofia' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Psicologia', id FROM categorias
WHERE nome = 'Filosofia e Psicologia' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Psicologia' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Educação', id FROM categorias
WHERE nome = 'Educação e Pesquisa' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Educação' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Jornalismo', id FROM categorias
WHERE nome = 'Educação e Pesquisa' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Jornalismo' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Linguística e Comunicação', id FROM categorias
WHERE nome = 'Educação e Pesquisa' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Linguística e Comunicação' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Metodologia Científica', id FROM categorias
WHERE nome = 'Educação e Pesquisa' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Metodologia Científica' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Direito', id FROM categorias
WHERE nome = 'Política e Economia' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Direito' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Economia', id FROM categorias
WHERE nome = 'Política e Economia' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Economia' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Política', id FROM categorias
WHERE nome = 'Política e Economia' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Política' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Artes Visuais', id FROM categorias
WHERE nome = 'Quadrinhos e Artes' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Artes Visuais' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Cinema e Audiovisual', id FROM categorias
WHERE nome = 'Quadrinhos e Artes' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Cinema e Audiovisual' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Culinária e Viagem', id FROM categorias
WHERE nome = 'Quadrinhos e Artes' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Culinária e Viagem' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Música', id FROM categorias
WHERE nome = 'Quadrinhos e Artes' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Música' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Quadrinhos', id FROM categorias
WHERE nome = 'Quadrinhos e Artes' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Quadrinhos' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Autobiografia e Memórias', id FROM categorias
WHERE nome = 'Biografias e Memórias' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Autobiografia e Memórias' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Biografia', id FROM categorias
WHERE nome = 'Biografias e Memórias' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Biografia' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Diário e Cartas', id FROM categorias
WHERE nome = 'Biografias e Memórias' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Diário e Cartas' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Contos e Fábulas', id FROM categorias
WHERE nome = 'Infantojuvenil' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Contos e Fábulas' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Jovem Adulto', id FROM categorias
WHERE nome = 'Infantojuvenil' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Jovem Adulto' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Literatura Infantil', id FROM categorias
WHERE nome = 'Infantojuvenil' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Literatura Infantil' AND sc.categoria_pai_id IS NOT NULL);
INSERT INTO categorias (nome, categoria_pai_id)
SELECT 'Literatura Infantil e Juvenil', id FROM categorias
WHERE nome = 'Infantojuvenil' AND categoria_pai_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM categorias sc WHERE sc.nome = 'Literatura Infantil e Juvenil' AND sc.categoria_pai_id IS NOT NULL);

-- -------------------------------------------------------------
-- 3. Religação dos 20 livros que já tinham categoria
-- -------------------------------------------------------------
-- Antes disso, as linhas que a V3 copiou para livro_categoria são removidas.
-- Elas apontam para as categorias ANTIGAS (id baixo), que não são mais o
-- alvo: o destino agora é a subcategoria classificada. Sem esta limpeza cada
-- livro ganharia uma segunda principal e o índice UNIQUE recusaria.
--
-- Nada se perde: a relação antiga continua inteira na tabela
-- livros_categorias, e o nome original continua em livros.categoria_legada.
DELETE FROM livro_categoria WHERE categoria_id IN (
    SELECT id FROM categorias WHERE categoria_pai_id IS NULL AND cor IS NULL
);

-- A categoria antiga vira a subcategoria, marcada como principal.
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Romance e Realismo' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 1
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Ficção Científica' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 2
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Fantasia e Mitologia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 3
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Mistério Thriller e Terror' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 4
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Mistério Thriller e Terror' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 5
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Mistério Thriller e Terror' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 6
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Aventura e Distopia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 7
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Aventura e Distopia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 8
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Biografia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Biografias e Memórias'
WHERE lc.categoria_id = 9
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Autobiografia e Memórias' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Biografias e Memórias'
WHERE lc.categoria_id = 10
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'História Geral' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'História e Sociedade'
WHERE lc.categoria_id = 11
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Filosofia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Filosofia e Psicologia'
WHERE lc.categoria_id = 12
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Psicologia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Filosofia e Psicologia'
WHERE lc.categoria_id = 13
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Autoajuda e Desenvolvimento Pessoal' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Filosofia e Psicologia'
WHERE lc.categoria_id = 14
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Ciência Geral e Divulgação' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE lc.categoria_id = 15
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Tecnologia e Sociedade' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE lc.categoria_id = 16
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Economia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Política e Economia'
WHERE lc.categoria_id = 17
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Política' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Política e Economia'
WHERE lc.categoria_id = 18
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Sociologia e Antropologia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'História e Sociedade'
WHERE lc.categoria_id = 19
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Sociologia e Antropologia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'História e Sociedade'
WHERE lc.categoria_id = 20
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Literaturas Nacionais' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 21
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Literaturas Nacionais' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 22
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Literaturas Nacionais' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 23
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Literaturas Nacionais' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 24
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Literaturas Nacionais' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 25
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Poesia e Conto' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 26
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Poesia e Conto' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 27
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Crônica Ensaio e Sátira' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 28
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Crônica Ensaio e Sátira' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 29
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Fantasia e Mitologia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 30
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Religião e Espiritualidade' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'História e Sociedade'
WHERE lc.categoria_id = 31
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Religião e Espiritualidade' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'História e Sociedade'
WHERE lc.categoria_id = 32
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Artes Visuais' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Quadrinhos e Artes'
WHERE lc.categoria_id = 33
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Artes Visuais' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Quadrinhos e Artes'
WHERE lc.categoria_id = 34
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Música' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Quadrinhos e Artes'
WHERE lc.categoria_id = 35
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Cinema e Audiovisual' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Quadrinhos e Artes'
WHERE lc.categoria_id = 36
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Artes Visuais' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Quadrinhos e Artes'
WHERE lc.categoria_id = 37
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Culinária e Viagem' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Quadrinhos e Artes'
WHERE lc.categoria_id = 38
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Culinária e Viagem' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Quadrinhos e Artes'
WHERE lc.categoria_id = 39
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Natureza e Meio Ambiente' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE lc.categoria_id = 40
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Matemática' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE lc.categoria_id = 41
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Física e Astronomia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE lc.categoria_id = 42
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Química' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE lc.categoria_id = 43
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Biologia e Evolução' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE lc.categoria_id = 44
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Medicina e Saúde' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE lc.categoria_id = 45
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Direito' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Política e Economia'
WHERE lc.categoria_id = 46
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Educação' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Educação e Pesquisa'
WHERE lc.categoria_id = 47
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Linguística e Comunicação' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Educação e Pesquisa'
WHERE lc.categoria_id = 48
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Jornalismo' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Educação e Pesquisa'
WHERE lc.categoria_id = 49
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Crônica Ensaio e Sátira' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 50
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Geografia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'História e Sociedade'
WHERE lc.categoria_id = 101
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Programação' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE lc.categoria_id = 102
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Programação' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE lc.categoria_id = 103
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Engenharia de Software' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE lc.categoria_id = 104
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Redes e Sistemas' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE lc.categoria_id = 105
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Banco de Dados' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE lc.categoria_id = 106
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Engenharia de Software' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE lc.categoria_id = 107
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Banco de Dados' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE lc.categoria_id = 108
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Tecnologia e Sociedade' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE lc.categoria_id = 109
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Engenharia de Software' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE lc.categoria_id = 110
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Ficção Científica' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 111
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Física e Astronomia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE lc.categoria_id = 112
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Ciência Geral e Divulgação' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE lc.categoria_id = 113
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Filosofia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Filosofia e Psicologia'
WHERE lc.categoria_id = 114
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Física e Astronomia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE lc.categoria_id = 115
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Psicologia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Filosofia e Psicologia'
WHERE lc.categoria_id = 116
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Romance e Realismo' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 117
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Contos e Fábulas' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Infantojuvenil'
WHERE lc.categoria_id = 118
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Romance e Realismo' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 119
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Romance e Realismo' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 120
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Romance e Realismo' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 121
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Romance e Realismo' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 122
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Romance e Realismo' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 123
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Crônica Ensaio e Sátira' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE lc.categoria_id = 124
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Política' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Política e Economia'
WHERE lc.categoria_id = 125
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Quadrinhos' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Quadrinhos e Artes'
WHERE lc.categoria_id = 126
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Diário e Cartas' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Biografias e Memórias'
WHERE lc.categoria_id = 127
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'História do Brasil' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'História e Sociedade'
WHERE lc.categoria_id = 128
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT lc.livro_id, sc.id, TRUE
FROM livros_categorias lc
JOIN categorias sc ON sc.nome = 'Metodologia Científica' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Educação e Pesquisa'
WHERE lc.categoria_id = 129
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = lc.livro_id AND x.categoria_id = sc.id);

-- -------------------------------------------------------------
-- 4. Os 33 livros que estavam sem categoria nenhuma
-- -------------------------------------------------------------
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'História Geral' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'História e Sociedade'
WHERE l.id = 151
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Literaturas Nacionais' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE l.id = 152
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Programação' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE l.id = 153
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Programação' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE l.id = 154
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Engenharia de Software' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE l.id = 155
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Redes e Sistemas' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE l.id = 156
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Banco de Dados' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE l.id = 157
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Engenharia de Software' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE l.id = 158
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Poesia e Conto' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE l.id = 159
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Romance e Realismo' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE l.id = 160
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Literatura Infantil' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Infantojuvenil'
WHERE l.id = 161
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Literaturas Nacionais' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE l.id = 162
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Literaturas Nacionais' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE l.id = 163
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Banco de Dados' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE l.id = 164
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Programação' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE l.id = 165
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Engenharia de Software' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Computação e Tecnologia'
WHERE l.id = 166
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Literatura Infantil e Juvenil' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Infantojuvenil'
WHERE l.id = 167
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Ficção Científica' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE l.id = 168
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Física e Astronomia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE l.id = 169
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Biologia e Evolução' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE l.id = 170
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Quadrinhos' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Quadrinhos e Artes'
WHERE l.id = 171
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Psicologia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Filosofia e Psicologia'
WHERE l.id = 172
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Sociologia e Antropologia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'História e Sociedade'
WHERE l.id = 173
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Autobiografia e Memórias' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Biografias e Memórias'
WHERE l.id = 174
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'História do Brasil' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'História e Sociedade'
WHERE l.id = 175
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Metodologia Científica' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Educação e Pesquisa'
WHERE l.id = 176
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Física e Astronomia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE l.id = 177
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Ciência Geral e Divulgação' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE l.id = 178
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Física e Astronomia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Ciências'
WHERE l.id = 179
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Psicologia' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Filosofia e Psicologia'
WHERE l.id = 180
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Literaturas Nacionais' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE l.id = 181
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Romance e Realismo' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE l.id = 182
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE
FROM livros l
JOIN categorias sc ON sc.nome = 'Política' AND sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Política e Economia'
WHERE l.id = 183
  AND NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id AND x.categoria_id = sc.id);

-- -------------------------------------------------------------
-- Conferência
-- -------------------------------------------------------------
SELECT 'areas' AS o, COUNT(*) AS total FROM categorias WHERE categoria_pai_id IS NULL AND cor IS NOT NULL
UNION ALL SELECT 'subcategorias', COUNT(*) FROM categorias WHERE categoria_pai_id IS NOT NULL
UNION ALL SELECT 'legadas (intocadas)', COUNT(*) FROM categorias WHERE categoria_pai_id IS NULL AND cor IS NULL
UNION ALL SELECT 'ligacoes', COUNT(*) FROM livro_categoria
UNION ALL SELECT 'livros sem categoria', COUNT(*) FROM livros l
    WHERE NOT EXISTS (SELECT 1 FROM livro_categoria x WHERE x.livro_id = l.id);

-- Todo livro tem de ter exatamente uma principal
SELECT 'livros com contagem de principais != 1' AS alerta, COUNT(*) AS total FROM (
    SELECT livro_id FROM livro_categoria WHERE principal
    GROUP BY livro_id HAVING SUM(principal) <> 1
) t;

SELECT 'livros com mais de 4 categorias' AS alerta, COUNT(*) AS total FROM (
    SELECT livro_id FROM livro_categoria
    GROUP BY livro_id HAVING COUNT(*) > 4
) t;

COMMIT;
