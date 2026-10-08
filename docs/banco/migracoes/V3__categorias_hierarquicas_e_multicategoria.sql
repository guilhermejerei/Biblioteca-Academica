-- =========================================================
-- Migração: categorias em dois níveis + multicategoria por livro
--
-- NÃO DESTRUTIVA. Nada é removido:
--   - categorias.nome, categorias.id          → intactos
--   - tabela livros_categorias                  → intacta (estado anterior, para rollback manual)
--   - livros.categoria_id                       → não existe neste banco (a relação já era N:N),
--                                                então não há coluna a remover. Ver docs/mapa_categorias.csv.
--
-- O que é criado:
--   1. categorias.categoria_pai_id  → área (NULL) ou subcategoria (pai = área)
--   2. categorias.ordem_exibicao    → ordem fixa de exibição das áreas
--   3. categorias.cor               → cor da área, em hexadecimal, da paleta de index.css
--   4. livro_categoria              → N categorias por livro, com uma principal
--   5. livros.categoria_legada      → nome(s) original(is) do livro, para reversão
--
-- Dados: a categoria atual de cada livro é copiada para livro_categoria
--        marcada como principal, e o nome original vai para livros.categoria_legada.
--
-- Aplicar via cmd:
--   mysql -u root -p --default-character-set=utf8mb4 biblioteca < V3__categorias_hierarquicas_e_multicategoria.sql
-- =========================================================
SET NAMES utf8mb4;

-- -------------------------------------------------------------
-- 1. Estrutura das categorias hierárquicas
-- -------------------------------------------------------------
ALTER TABLE categorias
    ADD COLUMN categoria_pai_id BIGINT NULL AFTER nome,
    ADD COLUMN ordem_exibicao   INT         NOT NULL DEFAULT 0 AFTER categoria_pai_id,
    ADD COLUMN cor              VARCHAR(7)  NULL AFTER ordem_exibicao;

-- Três estados possíveis, não dois. O terceiro é o estado LEGADO:
--   ÁREA          → categoria_pai_id IS NULL,     ordem_exibicao > 0, cor NOT NULL
--   SUBCATEGORIA  → categoria_pai_id IS NOT NULL, ordem_exibicao = 0, cor NULL
--   LEGADA        → categoria_pai_id IS NULL,     ordem_exibicao = 0, cor NULL
--
-- As 129 categorias existentes caem todas no estado LEGADO, porque ainda
-- não foram classificadas. Sem esse terceiro estado o ALTER nem rodaria.
-- A V4 (aplicada só depois da sua aprovação do mapa_categorias.csv)
-- classifica todas e aperta esta regra, removendo o estado legado.
ALTER TABLE categorias
    ADD CONSTRAINT chk_categoria_estrutura
        CHECK ((categoria_pai_id IS NULL     AND ordem_exibicao > 0 AND cor IS NOT NULL)
            OR (categoria_pai_id IS NOT NULL AND ordem_exibicao = 0 AND cor IS NULL)
            OR (categoria_pai_id IS NULL     AND ordem_exibicao = 0 AND cor IS NULL));

-- O CHECK não impede uma subcategoria de virar pai, o que criaria um
-- terceiro nível. Isso é barrado por trigger, porque a condição depende
-- de outra linha da própria tabela — algo que CHECK não expressa.
DROP TRIGGER IF EXISTS trg_categoria_pai_e_area;
DELIMITER $$
CREATE TRIGGER trg_categoria_pai_e_area
BEFORE INSERT ON categorias
FOR EACH ROW
BEGIN
    IF NEW.categoria_pai_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM categorias
            WHERE id = NEW.categoria_pai_id AND categoria_pai_id IS NULL
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'A categoria pai deve ser uma area (sem categoria_pai_id).';
        END IF;
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_categoria_upd_pai_e_area$$
CREATE TRIGGER trg_categoria_upd_pai_e_area
BEFORE UPDATE ON categorias
FOR EACH ROW
BEGIN
    IF NEW.categoria_pai_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM categorias
            WHERE id = NEW.categoria_pai_id AND categoria_pai_id IS NULL
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'A categoria pai deve ser uma area (sem categoria_pai_id).';
        END IF;
    END IF;
END$$
DELIMITER ;

ALTER TABLE categorias
    ADD CONSTRAINT fk_categoria_pai
        FOREIGN KEY (categoria_pai_id) REFERENCES categorias (id);

CREATE INDEX idx_categorias_pai ON categorias (categoria_pai_id);
CREATE INDEX idx_categorias_ordem ON categorias (ordem_exibicao);

-- -------------------------------------------------------------
-- 2. Tabela livro_categoria
-- -------------------------------------------------------------
-- principal_norm é uma coluna gerada que vale 1 na principal e NULL nas
-- demais. O índice UNIQUE (livro_id, principal_norm) aceita vários NULL
-- (o que permite N secundárias) mas proíbe duas principais — é assim que
-- "exatamente uma principal por livro" fica garantido no banco.
CREATE TABLE livro_categoria (
    livro_id       BIGINT     NOT NULL,
    categoria_id   BIGINT     NOT NULL,
    principal      BOOLEAN    NOT NULL DEFAULT FALSE,
    principal_norm TINYINT GENERATED ALWAYS AS (IF(principal, 1, NULL)) STORED,

    PRIMARY KEY (livro_id, categoria_id),
    UNIQUE KEY uk_livro_categoria_principal (livro_id, principal_norm),
    -- nomes com prefixo próprio: MySQL exige nomes de constraint únicos
    -- em todo o schema, e a tabela antiga livros_categorias já usa fk_lc_*
    KEY idx_lc_livro     (livro_id),
    KEY idx_lc_categoria (categoria_id),

    CONSTRAINT fk_livro_categoria_livro     FOREIGN KEY (livro_id)     REFERENCES livros (id),
    CONSTRAINT fk_livro_categoria_categoria FOREIGN KEY (categoria_id) REFERENCES categorias (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Índice composto para as contagens de faceta por subcategoria e por área.
CREATE INDEX idx_lc_categoria_livro ON livro_categoria (categoria_id, livro_id);

-- -------------------------------------------------------------
-- 3. Preservar o nome original em livros
-- -------------------------------------------------------------
ALTER TABLE livros
    ADD COLUMN categoria_legada VARCHAR(255) NULL AFTER autor_id;

-- -------------------------------------------------------------
-- 4. Copiar o estado atual para as novas estruturas
-- -------------------------------------------------------------
-- 4.1 Nome original do livro. Um livro pode ter vindo com mais de uma
--     categoria; guardamos todas, separadas por ", ", para o rollback
--     ser possível a partir de uma única coluna.
UPDATE livros l
LEFT JOIN (
    SELECT lc.livro_id,
           GROUP_CONCAT(c.nome ORDER BY c.nome SEPARATOR ', ') AS nomes
    FROM livros_categorias lc
    JOIN categorias c ON c.id = lc.categoria_id
    GROUP BY lc.livro_id
) ant ON ant.livro_id = l.id
SET l.categoria_legada = ant.nomes;

-- 4.2 Categorias do livro na nova tabela. Se o livro já tiver várias
--     categorias antigas, a de menor id vira a principal — é a que o
--     formulário marcava primeiro e a que preserva o comportamento
--     atual da listagem (que usa LinkedHashSet, ordem de inserção).
INSERT INTO livro_categoria (livro_id, categoria_id, principal)
SELECT t.livro_id, t.categoria_id, t.categoria_id = t.minimo
FROM (
    SELECT lc.livro_id,
           lc.categoria_id,
           MIN(lc.categoria_id) OVER (PARTITION BY lc.livro_id) AS minimo
    FROM livros_categorias lc
) t;

-- -------------------------------------------------------------
-- 5. conference
-- -------------------------------------------------------------
SELECT 'livros'          AS verificacao, COUNT(*) AS total FROM livros
UNION ALL
SELECT 'livro_categoria',      COUNT(*) FROM livro_categoria
UNION ALL
SELECT 'principais',           COUNT(*) FROM livro_categoria WHERE principal
UNION ALL
SELECT 'livros_com_legada',    COUNT(*) FROM livros WHERE categoria_legada IS NOT NULL
UNION ALL
SELECT 'legado_com_principal', COUNT(*)
FROM livros l
WHERE NOT EXISTS (SELECT 1 FROM livro_categoria lc
                  WHERE lc.livro_id = l.id AND lc.principal);