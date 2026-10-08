-- =========================================================
-- Migração: adicionar colunas para busca e armazenamento de capas
--
-- Importar via cmd:
--   mysql -u root -p --default-character-set=utf8mb4 biblioteca < V2__adicionar_campos_capa.sql
--
-- Execute no banco antes de reiniciar o backend.
-- Depois, o Hibernate (ddl-auto=update) enxerga as colunas.
-- =========================================================
SET NAMES utf8mb4;

-- 1. Adiciona as colunas de capa na tabela livros
ALTER TABLE livros
    ADD COLUMN capa_arquivo VARCHAR(255) NULL AFTER categoria_id,
    ADD COLUMN capa_origem VARCHAR(50) NULL AFTER capa_arquivo,
    ADD COLUMN capa_status VARCHAR(50) NOT NULL DEFAULT 'SEM_CAPA' AFTER capa_origem,
    ADD COLUMN capa_atualizada_em DATETIME NULL AFTER capa_status;

-- 2. Garante que livros existentes iniciem com status SEM_CAPA
UPDATE livros
SET capa_status = 'SEM_CAPA'
WHERE capa_status IS NULL;
