-- ============================================================================
--  2 de 3  ·  DADOS BASE
--  Taxonomia de categorias e os usuários que entram no sistema.
-- ============================================================================
--
--  Como usar
--    mysql -u root -p < 02-base.sql
--
--  Roda depois do 01-esquema.sql. Não pode rodar sozinho: as duas categorias
--  dependem das tabelas e o trigger exige que o pai já exista como área.
--
--  ── O que entra aqui, e por quê ──
--
--  As 10 áreas e 47 subcategorias são o que o filtro do acervo precisa para
--  existir: sem elas a tela de livros mostra dez caixas vazias. Os dois
--  usuários existem porque sem eles não há como entrar no sistema.
--
--  Os IDs são fixos de propósito. Eles tornam o arquivo legível (dá para
--  conferir que a subcategoria 11 é "Aventura e Distopia") e previsível, e
--  03-acervo.sql depende deles.
--
--  ── Os dois usuários ──
--
--  bibliotecario@biblioteca.com  ·  senha: biblio123   perfil BIBLIOTECARIO
--  aluno@biblioteca.com          ·  senha: aluno123    perfil ALUNO
--
--  As senhas estão no hash BCrypt. Troque as duas antes de qualquer uso que
--  não seja local, e troque o e-mail do bibliotecário também: esses são os
--  mesmas credenciais de demonstração em qualquer cópia deste projeto.
--
-- ============================================================================

SET NAMES utf8mb4;
USE biblioteca;
USE biblioteca;

-- --- areas ---
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (1, 'Literatura', NULL, 1, '#8C2B2B');
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (2, 'Hist├│ria e Sociedade', NULL, 2, '#6B4A3A');
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (3, 'Ci├¬ncias', NULL, 3, '#2F6B4F');
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (4, 'Computa├º├úo e Tecnologia', NULL, 4, '#1E3D59');
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (5, 'Filosofia e Psicologia', NULL, 5, '#4A2545');
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (6, 'Educa├º├úo e Pesquisa', NULL, 6, '#6E5A16');
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (7, 'Pol├¡tica e Economia', NULL, 7, '#9C4A1E');
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (8, 'Quadrinhos e Artes', NULL, 8, '#7A2E5C');
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (9, 'Biografias e Mem├│rias', NULL, 9, '#3F6B7A');
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (10, 'Infantojuvenil', NULL, 10, '#8C6B2B');

-- --- subcategorias ---

--   Literatura
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (11, 'Aventura e Distopia', 1, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (12, 'Cr├┤nica Ensaio e S├ítira', 1, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (13, 'Fantasia e Mitologia', 1, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (14, 'Fic├º├úo Cient├¡fica', 1, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (15, 'Literaturas Nacionais', 1, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (16, 'Mist├®rio Thriller e Terror', 1, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (17, 'Poesia e Conto', 1, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (18, 'Romance e Realismo', 1, 0, NULL);

--   Hist├│ria e Sociedade
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (19, 'Geografia', 2, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (20, 'Hist├│ria do Brasil', 2, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (21, 'Hist├│ria Geral', 2, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (22, 'Religi├úo e Espiritualidade', 2, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (23, 'Sociologia e Antropologia', 2, 0, NULL);

--   Ci├¬ncias
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (24, 'Biologia e Evolu├º├úo', 3, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (25, 'Ci├¬ncia Geral e Divulga├º├úo', 3, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (26, 'F├¡sica e Astronomia', 3, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (27, 'Matem├ítica', 3, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (28, 'Medicina e Sa├║de', 3, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (29, 'Natureza e Meio Ambiente', 3, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (30, 'Qu├¡mica', 3, 0, NULL);

--   Computa├º├úo e Tecnologia
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (31, 'Banco de Dados', 4, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (32, 'Engenharia de Software', 4, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (33, 'Programa├º├úo', 4, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (34, 'Redes e Sistemas', 4, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (35, 'Tecnologia e Sociedade', 4, 0, NULL);

--   Filosofia e Psicologia
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (36, 'Autoajuda e Desenvolvimento Pessoal', 5, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (37, 'Filosofia', 5, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (38, 'Psicologia', 5, 0, NULL);

--   Educa├º├úo e Pesquisa
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (39, 'Educa├º├úo', 6, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (40, 'Jornalismo', 6, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (41, 'Lingu├¡stica e Comunica├º├úo', 6, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (42, 'Metodologia Cient├¡fica', 6, 0, NULL);

--   Pol├¡tica e Economia
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (43, 'Direito', 7, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (44, 'Economia', 7, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (45, 'Pol├¡tica', 7, 0, NULL);

--   Quadrinhos e Artes
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (46, 'Artes Visuais', 8, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (47, 'Cinema e Audiovisual', 8, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (48, 'Culin├íria e Viagem', 8, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (49, 'M├║sica', 8, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (50, 'Quadrinhos', 8, 0, NULL);

--   Biografias e Mem├│rias
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (51, 'Autobiografia e Mem├│rias', 9, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (52, 'Biografia', 9, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (53, 'Di├írio e Cartas', 9, 0, NULL);

--   Infantojuvenil
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (54, 'Contos e F├íbulas', 10, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (55, 'Jovem Adulto', 10, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (56, 'Literatura Infantil', 10, 0, NULL);
INSERT INTO categorias (id, nome, categoria_pai_id, ordem_exibicao, cor) VALUES
  (57, 'Literatura Infantil e Juvenil', 10, 0, NULL);

-- ---------------------------------------------------------------------------
--  Usuários
--
--  As senhas abaixo são hash BCrypt, não o texto. Os valores em claro são os
--  mesmos que o README documenta.
-- ---------------------------------------------------------------------------

INSERT INTO usuarios (id, nome, cpf, email, telefone, senha, tipo) VALUES
  (1, 'Bibliotecário', '11111111111', 'bibliotecario@biblioteca.com', '(11) 91111-1111',
   '$2a$10$af0eQ1hAFSIyN8MCzSjGEuBQWlJnnPm/UlcCXTUdaIFuzUiDTei9K', 'BIBLIOTECARIO'),
  (2, 'Aluno', '22222222222', 'aluno@biblioteca.com', '(11) 92222-2222',
   '$2a$10$3QIgvwpfZVRuc9dwqzCiqufh93VQIaW1e53DlluvXEB07Cos1BT2W', 'ALUNO');

-- ---------------------------------------------------------------------------
--  Conferindo
-- ---------------------------------------------------------------------------

SELECT 'áreas' AS o, COUNT(*) AS total FROM categorias WHERE categoria_pai_id IS NULL AND cor IS NOT NULL
UNION ALL SELECT 'subcategorias', COUNT(*) FROM categorias WHERE categoria_pai_id IS NOT NULL
UNION ALL SELECT 'usuários', COUNT(*) FROM usuarios;

-- Deve dar 10, 47 e 2.