-- =========================================================
-- Migração V5: dar mais de uma categoria a cada livro
--
-- Por que: a V4 refletiu fielmente o acervo antigo, em que cada livro tinha
-- UMA categoria. Isso deixa o modo "todas" do filtro estruturalmente vazio —
-- nenhum livro satisfaz duas condições ao mesmo tempo, porque ninguém tem duas
-- categorias. A biblioteca não usa a linguagem que o filtro implementa.
--
-- O que faz:
--   1. corrige três classificações que a V4 herdou do mapeamento mecânico
--   2. dá a cada livro de 2 a 3 subcategorias coerentes com o conteúdo
--
-- A principal continua sendo a da V4, exceto nos três casos do item 1. É a
-- principal que define a cor da lombada e a etiqueta da capa, então mexer nela
-- muda a aparência do livro na estante.
--
-- Não destrutiva: só INSERE linhas novas em livro_categoria. Para desfazer,
-- veja o "ROLLBACK" no fim do arquivo.
--
-- Aplicar via cmd:
--   mysql -u root -p --default-character-set=utf8mb4 biblioteca < V5__completar_categorias.sql
-- =========================================================
SET NAMES utf8mb4;

START TRANSACTION;

-- -------------------------------------------------------------
-- 1. Três correções de classificação
-- -------------------------------------------------------------
-- Estas três saíram do mapeamento automático da V4 e estão claramente piores
-- que a alternativa. Estão comentadas porque mexem na cor da lombada.

-- Ilíada: "Épico" tinha entrado em "Crônica Ensaio e Sátira" na fusão do CSV.
-- É poesia épica, não crônica.
UPDATE livro_categoria lc
JOIN categorias sc ON sc.id = lc.categoria_id
SET lc.principal = FALSE
WHERE lc.principal
  AND sc.nome = 'Crônica Ensaio e Sátira'
  AND lc.livro_id IN (SELECT id FROM livros WHERE titulo = 'Ilíada');

-- As Crônicas de Nárnia: caiu em "Religião e Espiritualidade" porque a
-- categoria antiga se chamava "Religião". É fantasia.
UPDATE livro_categoria lc
JOIN categorias sc ON sc.id = lc.categoria_id
SET lc.principal = FALSE
WHERE lc.principal
  AND sc.nome = 'Religião e Espiritualidade'
  AND lc.livro_id IN (SELECT id FROM livros WHERE titulo = 'As Crônicas de Nárnia');

-- Reinações de Narizinho: caiu em "Crônica Ensaio e Sátira" pela fusão do CSV.
-- É literatura infantil.
UPDATE livro_categoria lc
JOIN categorias sc ON sc.id = lc.categoria_id
SET lc.principal = FALSE
WHERE lc.principal
  AND sc.nome = 'Crônica Ensaio e Sátira'
  AND lc.livro_id IN (SELECT id FROM livros WHERE titulo = 'Reinações de Narizinho');

INSERT IGNORE INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE FROM livros l
JOIN categorias sc ON sc.nome = 'Poesia e Conto'
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE l.titulo = 'Ilíada';

INSERT IGNORE INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE FROM livros l
JOIN categorias sc ON sc.nome = 'Fantasia e Mitologia'
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Literatura'
WHERE l.titulo = 'As Crônicas de Nárnia';

INSERT IGNORE INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, TRUE FROM livros l
JOIN categorias sc ON sc.nome = 'Contos e Fábulas'
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.nome = 'Infantojuvenil'
WHERE l.titulo = 'Reinações de Narizinho';

-- -------------------------------------------------------------
-- 2. Categorias adicionais
-- -------------------------------------------------------------
-- Cada linha liga um livro a uma subcategoria extra, sem virar principal.
-- A busca é por título + subcategoria, e o INSERT IGNORE evita duplicar se a
-- migração rodar duas vezes.
--
-- O JOIN com "sc.categoria_pai_id IS NOT NULL" não é enfeite: os nomes se
-- repetem nas 129 categorias legadas que a V4 deixou de lado. "Matemática",
-- "Biografia" e "Educação" existem três vezes cada no banco, e sem esse filtro
-- cada INSERT pegava as três e estourava o limite de quatro categorias por livro.

-- ── Literatura ──
INSERT IGNORE INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, FALSE FROM livros l
JOIN categorias sc ON sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.cor IS NOT NULL
WHERE (l.titulo = '1984'                AND sc.nome IN ('Ficção Científica','Mistério Thriller e Terror'))
   OR (l.titulo = 'A Hora da Estrela'    AND sc.nome = 'Romance e Realismo')
   OR (l.titulo = 'A Revoluçao dos Bichos' AND sc.nome = 'Contos e Fábulas')
   OR (l.titulo = 'Deuses Americanos'    AND sc.nome = 'Poesia e Conto')
   OR (l.titulo = 'Dom Casmurro'         AND sc.nome = 'Romance e Realismo')
   OR (l.titulo = 'Duna'                 AND sc.nome = 'Aventura e Distopia')
   OR (l.titulo = 'Garota Exemplar'      AND sc.nome = 'Romance e Realismo')
   OR (l.titulo = 'Grande Sertao: Veredas' AND sc.nome = 'Literaturas Nacionais')
   OR (l.titulo = 'Iracema'              AND sc.nome = 'Romance e Realismo')
   OR (l.titulo = 'It — A Coisa'         AND sc.nome = 'Ficção Científica')
   OR (l.titulo = 'Memorias Postumas de Bras Cubas' AND sc.nome = 'Literaturas Nacionais')
   OR (l.titulo = 'O Cortico'            AND sc.nome = 'Literaturas Nacionais')
   OR (l.titulo = 'O Corvo e Outros Poemas' AND sc.nome = 'Mistério Thriller e Terror')
   OR (l.titulo = 'O Senhor dos Anéis'   AND sc.nome = 'Crônica Ensaio e Sátira')
   OR (l.titulo = 'Vidas Secas'          AND sc.nome = 'Romance e Realismo')
   OR (l.titulo = 'Vinte Mil Léguas Submarinas' AND sc.nome = 'Ficção Científica')
   OR (l.titulo = 'Fundação'             AND sc.nome = 'História Geral');

-- ── História e Sociedade ──
INSERT IGNORE INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, FALSE FROM livros l
JOIN categorias sc ON sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.cor IS NOT NULL
WHERE (l.titulo = 'Casa-Grande e Senzala' AND sc.nome = 'História do Brasil')
   OR (l.titulo = 'O Diario de Anne Frank' AND sc.nome = 'História Geral')
   OR (l.titulo = 'Raizes do Brasil'      AND sc.nome = 'Sociologia e Antropologia')
   OR (l.titulo = 'Sapiens: Uma Breve Historia da Humanidade'
                  AND sc.nome IN ('Sociologia e Antropologia','História do Brasil'));

-- ── Ciências ──
INSERT IGNORE INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, FALSE FROM livros l
JOIN categorias sc ON sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.cor IS NOT NULL
WHERE (l.titulo = 'Cosmos'                     AND sc.nome = 'Física e Astronomia')
   OR (l.titulo = 'O Gene Egoista'             AND sc.nome = 'Filosofia')
   OR (l.titulo = 'O Universo numa Casca de Noz' AND sc.nome = 'Ciência Geral e Divulgação')
   OR (l.titulo = 'Palido Ponto Azul'          AND sc.nome = 'Ciência Geral e Divulgação')
   OR (l.titulo = 'Uma Breve Historia do Tempo' AND sc.nome = 'Ciência Geral e Divulgação')
   OR (l.titulo = 'O Homem que Confundiu sua Mulher com um Chapéu'
                  AND sc.nome = 'Biologia e Evolução');

-- ── Computação e Tecnologia ──
INSERT IGNORE INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, FALSE FROM livros l
JOIN categorias sc ON sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.cor IS NOT NULL
WHERE (l.titulo = 'Algoritmos: Teoria e Pratica' AND sc.nome IN ('Engenharia de Software','Matemática'))
   OR (l.titulo = 'Arquitetura Limpa'          AND sc.nome = 'Programação')
   OR (l.titulo = 'Codigo Limpo'              AND sc.nome = 'Engenharia de Software')
   OR (l.titulo = 'O Codificador Limpo'       AND sc.nome = 'Engenharia de Software')
   OR (l.titulo = 'Padroes de Projeto'        AND sc.nome = 'Programação')
   OR (l.titulo = 'Engenharia de Software'    AND sc.nome = 'Programação')
   OR (l.titulo = 'Redes de Computadores'     AND sc.nome = 'Programação')
   OR (l.titulo = 'Sistema de Banco de Dados' AND sc.nome = 'Engenharia de Software')
   OR (l.titulo = 'Sistemas de Banco de Dados' AND sc.nome = 'Engenharia de Software')
   OR (l.titulo = 'Como Evitar um Desastre Climático' AND sc.nome = 'Natureza e Meio Ambiente');

-- ── Filosofia e Psicologia ──
INSERT IGNORE INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, FALSE FROM livros l
JOIN categorias sc ON sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.cor IS NOT NULL
WHERE (l.titulo = 'Em Busca de Sentido'      AND sc.nome IN ('Filosofia','Religião e Espiritualidade'))
   OR (l.titulo = 'O Principe'              AND sc.nome = 'Filosofia')
   OR (l.titulo = 'Rapido e Devagar: Duas Formas de Pensar' AND sc.nome = 'Filosofia')
   OR (l.titulo = 'Como Fazer Amigos e Influenciar Pessoas' AND sc.nome = 'Psicologia')
   OR (l.titulo = 'Iniciação à História da Filosofia' AND sc.nome = 'História Geral')
   OR (l.titulo = 'Textos Básicos de Filosofia e História das Ciências'
                  AND sc.nome = 'História Geral');

-- ── Educação e Pesquisa ──
INSERT IGNORE INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, FALSE FROM livros l
JOIN categorias sc ON sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.cor IS NOT NULL
WHERE (l.titulo = 'Pedagogia do Oprimido' AND sc.nome = 'Sociologia e Antropologia')
   OR (l.titulo = 'Fundamentos de Metodologia Cientifica'
                  AND sc.nome IN ('Educação','Ciência Geral e Divulgação'))
   OR (l.titulo = 'Variedades da Experiencia Cientifica' AND sc.nome = 'Metodologia Científica');

-- ── Política e Economia ──
INSERT IGNORE INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, FALSE FROM livros l
JOIN categorias sc ON sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.cor IS NOT NULL
WHERE l.titulo = 'Formação Econômica do Brasil' AND sc.nome = 'História do Brasil';

-- ── Quadrinhos e Artes ──
INSERT IGNORE INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, FALSE FROM livros l
JOIN categorias sc ON sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.cor IS NOT NULL
WHERE l.titulo = 'Maus: A Historia de um Sobrevivente' AND sc.nome = 'História Geral';

-- ── Biografias e Memórias ──
INSERT IGNORE INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, FALSE FROM livros l
JOIN categorias sc ON sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.cor IS NOT NULL
WHERE (l.titulo = 'Quarto de Despejo: Diario de uma Favelada'
                  AND sc.nome = 'Sociologia e Antropologia')
   OR (l.titulo = 'O Homem que Confundiu sua Mulher com um Chapéu'
                  AND sc.nome = 'Biografia');

-- ── Infantojuvenil ──
INSERT IGNORE INTO livro_categoria (livro_id, categoria_id, principal)
SELECT l.id, sc.id, FALSE FROM livros l
JOIN categorias sc ON sc.categoria_pai_id IS NOT NULL
JOIN categorias ar ON ar.id = sc.categoria_pai_id AND ar.cor IS NOT NULL
WHERE l.titulo = 'O Pequeno Principe' AND sc.nome = 'Fantasia e Mitologia';

-- -------------------------------------------------------------
-- Conferência
-- -------------------------------------------------------------
SELECT 'areas' AS o, COUNT(*) AS total FROM categorias WHERE categoria_pai_id IS NULL AND cor IS NOT NULL
UNION ALL SELECT 'subcategorias', COUNT(*) FROM categorias WHERE categoria_pai_id IS NOT NULL
UNION ALL SELECT 'livros', COUNT(*) FROM livros
UNION ALL SELECT 'ligacoes', COUNT(*) FROM livro_categoria
UNION ALL SELECT 'livros com 1 categoria so', COUNT(*) FROM (
    SELECT livro_id FROM livro_categoria GROUP BY livro_id HAVING COUNT(*) = 1) t
UNION ALL SELECT 'livros com mais de 4', COUNT(*) FROM (
    SELECT livro_id FROM livro_categoria GROUP BY livro_id HAVING COUNT(*) > 4) t
UNION ALL SELECT 'livros sem 1 principal', COUNT(*) FROM (
    SELECT livro_id FROM livro_categoria GROUP BY livro_id HAVING SUM(principal) <> 1) t;

COMMIT;

-- -------------------------------------------------------------
-- ROLLBACK
-- -------------------------------------------------------------
-- Esta migração só INSERE linhas, então desfazer é apagar as linhas com
-- principal = FALSE e restaurar as três principais. O jeito limpo de saber
-- quais são as novas é comparar com o estado anterior:
--
--   DELETE lc FROM livro_categoria lc
--     JOIN livros l ON l.id = lc.livro_id
--    LEFT JOIN livro_categoria ant ON ant.livro_id = lc.livro_id AND ant.principal
--   WHERE ant.principal IS NULL;          -- as linhas sem principal eram as novas
--
-- E devolver a Ilíada, As Crônicas de Nárnia e Reinações de Narizinho às
-- antigas: Crônica Ensaio e Sátira, Religião e Espiritualidade e
-- Crônica Ensaio e Sátira, respectivamente.
--
-- O caminho seguro de verdade é o dump: docs/backups/pre_multicategoria_20261007.sql
-- seguido de V3, V4 e V5, nessa ordem.