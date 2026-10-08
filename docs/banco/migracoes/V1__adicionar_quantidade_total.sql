-- =========================================================
-- Migração: adicionar coluna quantidade_total em livros
-- e popular com valor coerente para dados já existentes.
--
-- Importar via cmd:
--   mysql -u root -p --default-character-set=utf8mb4 biblioteca < V1__adicionar_quantidade_total.sql
--
-- Execute UMA VEZ no banco antes de reiniciar o backend.
-- Depois, o Hibernate (ddl-auto=update) já enxerga a coluna.
-- =========================================================
SET NAMES utf8mb4;

-- 1. Adiciona a coluna permitindo NULL temporariamente
ALTER TABLE livros
    ADD COLUMN quantidade_total INT NULL AFTER quantidade_disponivel;

-- 2. Preenche quantidade_total = disponivel atual + empréstimos ativos do livro
--    (garante coerência com dados históricos)
UPDATE livros l
SET l.quantidade_total = l.quantidade_disponivel + (
    SELECT COUNT(*)
    FROM emprestimos e
    WHERE e.livro_id = l.id
      AND e.status   <> 'DEVOLVIDO'
);

-- 3. Agora que todos os valores estão preenchidos, torna NOT NULL
ALTER TABLE livros
    MODIFY COLUMN quantidade_total INT NOT NULL;

-- 4. Restrições para garantir integridade
--    (disponivel >= 0 e disponivel <= total)
ALTER TABLE livros
    ADD CONSTRAINT chk_disponivel_nao_negativo
        CHECK (quantidade_disponivel >= 0),
    ADD CONSTRAINT chk_disponivel_ate_total
        CHECK (quantidade_disponivel <= quantidade_total);
