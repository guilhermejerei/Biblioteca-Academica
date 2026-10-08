-- ============================================================================
--  1 de 3  ·  ESTRUTURA DO BANCO
--  Cria o schema completo da biblioteca, do zero.
-- ============================================================================
--
--  Como usar
--    mysql -u root -p < 01-esquema.sql
--
--  Este é o único arquivo que cria tabelas. Ele não depende de nenhum outro e
--  pode ser aplicado em um banco vazio.
--
--  ── Por que este arquivo existe ──
--
--  O schema era criado pelo Hibernate, com spring.jpa.hibernate.ddl-auto=update.
--  Isso funciona para desenvolvimento, mas quebra a reprodutibilidade: o
--  banco passa a depender da ordem em que os campos foram adicionados no
--  código, duas máquinas podem ficar com schemas diferentes, e não existe um
--  lugar que descreva o banco. As migrações V1 a V5 existiam justamente para
--  tapar esse buraco, uma a uma.
--
--  Com este arquivo, o schema é declarado uma vez, aqui, e o Hibernate não
--  tem mais o que inventar. Em produção, use ddl-auto=validate para o
--  Java avisar se o banco e o código divergirem.
--
--  ── O que ficou de fora, de propósito ──
--
--  As 129 categorias antigas da migração NÃO entram aqui. Elas existiam para
--  guardar o nome que cada livro tinha antes do acervo virar duas categorias,
--  e não têm mais uso: nada as consulta. Quem quiser o acervo como ele era
-- antes tem os dumps em ../backups/.
--
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
--  Banco
-- ---------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS biblioteca
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE biblioteca;

-- ---------------------------------------------------------------------------
--  autores
-- ---------------------------------------------------------------------------

CREATE TABLE autores (
  id    BIGINT       NOT NULL AUTO_INCREMENT,
  nome  VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------------
--  usuarios
-- ---------------------------------------------------------------------------

CREATE TABLE usuarios (
  id        BIGINT                          NOT NULL AUTO_INCREMENT,
  cpf       VARCHAR(14)                     NOT NULL,
  email     VARCHAR(255)                    NOT NULL,
  nome      VARCHAR(255)                    NOT NULL,
  telefone  VARCHAR(255)                    DEFAULT NULL,
  senha     VARCHAR(255)                    NOT NULL,
  tipo      ENUM('ALUNO', 'BIBLIOTECARIO')  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_cpf   (cpf),
  UNIQUE KEY uk_usuarios_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------------
--  categorias
--
--  Dois níveis, e o nível é deduzido do pai, não de um campo "tipo":
--
--    ÁREA          categoria_pai_id nulo,     ordem_exibicao > 0, cor preenchida
--    SUBCATEGORIA  categoria_pai_id preenchido, ordem_exibicao = 0, cor nula
--
--  Um CHECK não conseguiria exigir isso: ele olha só a própria linha, e a
--  definição de área depende de campos que já estão nela. O que o banco não
--  consegue ver sozinho é se o PAI é uma área de verdade, e é por isso que
--  existem os dois triggers no fim do arquivo.
-- ---------------------------------------------------------------------------

CREATE TABLE categorias (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  nome             VARCHAR(255) NOT NULL,
  categoria_pai_id BIGINT       DEFAULT NULL,
  ordem_exibicao   INT          NOT NULL DEFAULT 0,
  cor              VARCHAR(7)   DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_categorias_pai   (categoria_pai_id),
  KEY idx_categorias_ordem (ordem_exibicao),

  CONSTRAINT chk_categoria_estrutura CHECK (
         (categoria_pai_id IS NULL     AND ordem_exibicao > 0 AND cor IS NOT NULL)
      OR (categoria_pai_id IS NOT NULL AND ordem_exibicao = 0 AND cor IS NULL)
  )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------------
--  livros
--
--  categoria_legada guarda o nome da categoria de antes da migração para duas
--  categorias. Fica vazia em uma instalação nova e existe só para que o
--  mapeamento do Java não quebre em um banco que ainda tem dado antigo.
-- ---------------------------------------------------------------------------

CREATE TABLE livros (
  id                    BIGINT       NOT NULL AUTO_INCREMENT,
  titulo                VARCHAR(255) NOT NULL,
  isbn                  VARCHAR(255) NOT NULL,
  ano_publicacao        INT          DEFAULT NULL,
  quantidade_total      INT          NOT NULL,
  quantidade_disponivel INT          NOT NULL,
  autor_id              BIGINT       NOT NULL,
  categoria_legada      VARCHAR(255) DEFAULT NULL,
  capa_arquivo          VARCHAR(255) DEFAULT NULL,
  capa_atualizada_em    DATETIME(6)  DEFAULT NULL,
  capa_origem           ENUM('BRASILAPI', 'GOOGLE_BOOKS', 'MANUAL', 'OPEN_LIBRARY') DEFAULT NULL,
  capa_status           ENUM('ENCONTRADA', 'REVISAR', 'SEM_CAPA') NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_livros_isbn (isbn),
  KEY idx_livros_autor (autor_id),
  CONSTRAINT fk_livros_autor FOREIGN KEY (autor_id) REFERENCES autores (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------------
--  livro_categoria
--
--  A ligação tem chave primária dupla: uma linha só existe ligada a um livro,
--  e apagar o livro tem que apagar as linhas junto, coisa que um id artificial
--  não faria sozinho.
--
--  principal_norm é uma coluna gerada que vale 1 na principal e NULL nas
--  demais. together com o índice UNIQUE abaixo, é o que garante exatamente uma
--  principal por livro: o índice único rejeita duas linhas com 1 no mesmo
--  livro, mas deixa passar N NULLs. Um CHECK não expressaria isso.
-- ---------------------------------------------------------------------------

CREATE TABLE livro_categoria (
  livro_id        BIGINT      NOT NULL,
  categoria_id    BIGINT      NOT NULL,
  principal       TINYINT(1)  NOT NULL DEFAULT 0,
  principal_norm  TINYINT GENERATED ALWAYS AS (IF(principal, 1, NULL)) STORED,
  PRIMARY KEY (livro_id, categoria_id),
  UNIQUE KEY uk_livro_categoria_principal (livro_id, principal_norm),
  KEY idx_lc_livro             (livro_id),
  KEY idx_lc_categoria         (categoria_id),
  KEY idx_lc_categoria_livro   (categoria_id, livro_id),
  CONSTRAINT fk_lc_livro     FOREIGN KEY (livro_id)     REFERENCES livros (id),
  CONSTRAINT fk_lc_categoria FOREIGN KEY (categoria_id) REFERENCES categorias (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------------
--  emprestimos
-- ---------------------------------------------------------------------------

CREATE TABLE emprestimos (
  id                       BIGINT      NOT NULL AUTO_INCREMENT,
  livro_id                 BIGINT      NOT NULL,
  usuario_id               BIGINT      NOT NULL,
  data_emprestimo          DATE        NOT NULL,
  data_prevista_devolucao  DATE        NOT NULL,
  data_devolucao           DATE        DEFAULT NULL,
  status                   ENUM('ATIVO', 'DEVOLVIDO', 'ATRASADO') NOT NULL,
  PRIMARY KEY (id),
  KEY idx_emprestimos_livro   (livro_id),
  KEY idx_emprestimos_usuario (usuario_id),
  CONSTRAINT fk_emprestimos_livro   FOREIGN KEY (livro_id)   REFERENCES livros (id),
  CONSTRAINT fk_emprestimos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------------
--  A chave estrangeira da categoria
--
--  Fica depois dos triggers de propósito: os triggers consultam a própria
--  categorias para conferir se o pai é uma área, e isso só funciona se a
--  hierarquia puder existir sem a chave restringindo a inserção.
-- ---------------------------------------------------------------------------

ALTER TABLE categorias
  ADD CONSTRAINT fk_categoria_pai
  FOREIGN KEY (categoria_pai_id) REFERENCES categorias (id);

-- ---------------------------------------------------------------------------
--  Triggers: o pai tem que ser uma área
--
--  O CHECK acima garante que uma linha seja área OU subcategoria. O que ele
--  não vê é se o PAI apontado é uma área: essa condição depende de outra linha
--  da mesma tabela, e CHECK só olha a linha que está sendo validada.
--
--  Sem estes dois triggers, seria possível criar um terceiro nível, e o filtro
--  do acervo — que espera exatamente dois — deixaria de funcionar sem erro
--  nenhum: o livro simplesmente sumiria da busca.
-- ---------------------------------------------------------------------------

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
DELIMITER ;

DROP TRIGGER IF EXISTS trg_categoria_upd_pai_e_area;
DELIMITER $$
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

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
--  Conferindo
-- ============================================================================

SELECT 'tabelas criadas' AS conferido, COUNT(*) AS total
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = 'biblioteca';

-- Deve dar 6.
SELECT
    (SELECT COUNT(*) FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = 'biblioteca' AND TABLE_NAME IN
        ('autores', 'usuarios', 'categorias', 'livros',
         'livro_categoria', 'emprestimos'))              AS tabelas_esperadas,
    (SELECT COUNT(*) FROM information_schema.TRIGGERS
      WHERE TRIGGER_SCHEMA = 'biblioteca')                AS triggers,
    (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = 'biblioteca'
        AND CONSTRAINT_NAME = 'chk_categoria_estrutura')  AS check_estrutura;