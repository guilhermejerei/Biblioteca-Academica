-- ============================================================================
--  3 de 3  ·  ACERVO
--  Os livros, seus autores e as categorias de cada um.
-- ============================================================================
--
--  Como usar
--    mysql -u root -p < 03-acervo.sql
--
--  Roda depois do 01-esquema.sql e do 02-base.sql. Precisa dos dois: os
--  autores não têm chave estrangeira nenhuma, mas os livros exigem um autor e
--  as ligações exigem categorias que já estejam cadastradas.
--
--  ── O acervo ──
--
--  53 títulos, 45 autores, 112 classificações. Cada livro tem de 2 a 3
--  subcategorias, e exatamente uma delas é a principal.
--
--  A principal não é decoração: é ela que define a cor da lombada na tela de
--  livros, e o que aparece primeiro na etiqueta da capa. Trocar qual é a
--  principal muda como o livro aparece na estante.
--
--  ── A regra de uma principal por livro ──
--
--  Não é uma regra que este arquivo segue por disciplina: o banco garante.
--  A coluna principal_norm vale 1 na principal e NULL nas demais, e o índice
--  UNIQUE (livro_id, principal_norm) deixa passar N NULLs mas recusa dois 1 no
--  mesmo livro. Tentar marcar duas principais aqui dá erro e a transação
--  inteira é recusada.
--
--  ── Nenhuma classificação é feita por nome ──
--
--  Os IDs aqui batem com os do 02-base.sql. Se algum dia a taxonomia mudar,
--  os dois arquivos precisam mudar juntos, senão a ligação aponta para a
--  categoria errada sem o banco reclamar.
--
-- ============================================================================

SET NAMES utf8mb4;
USE biblioteca;
USE biblioteca;

-- --- autores ---
INSERT INTO autores (id, nome) VALUES (1, 'Abraham Silberschatz');
INSERT INTO autores (id, nome) VALUES (2, 'Alu├¡sio Azevedo');
INSERT INTO autores (id, nome) VALUES (3, 'Andrew S. Tanenbaum');
INSERT INTO autores (id, nome) VALUES (4, 'Anne Frank');
INSERT INTO autores (id, nome) VALUES (5, 'Antoine de Saint-Exup├®ry');
INSERT INTO autores (id, nome) VALUES (6, 'Art Spiegelman');
INSERT INTO autores (id, nome) VALUES (7, 'Bill Gates');
INSERT INTO autores (id, nome) VALUES (8, 'C. S. Lewis');
INSERT INTO autores (id, nome) VALUES (9, 'Carl Sagan');
INSERT INTO autores (id, nome) VALUES (10, 'Carolina Maria de Jesus');
INSERT INTO autores (id, nome) VALUES (11, 'Celso Furtado');
INSERT INTO autores (id, nome) VALUES (12, 'Clarice Lispector');
INSERT INTO autores (id, nome) VALUES (13, 'Dale Carnegie');
INSERT INTO autores (id, nome) VALUES (14, 'Daniel Kahneman');
INSERT INTO autores (id, nome) VALUES (15, 'Danilo Marcondes');
INSERT INTO autores (id, nome) VALUES (16, 'Edgar Allan Poe');
INSERT INTO autores (id, nome) VALUES (17, 'Erich Gamma');
INSERT INTO autores (id, nome) VALUES (18, 'Frank Herbert');
INSERT INTO autores (id, nome) VALUES (19, 'George Orwell');
INSERT INTO autores (id, nome) VALUES (20, 'Gilberto Freyre');
INSERT INTO autores (id, nome) VALUES (21, 'Gillian Flynn');
INSERT INTO autores (id, nome) VALUES (22, 'Graciliano Ramos');
INSERT INTO autores (id, nome) VALUES (23, 'Homero');
INSERT INTO autores (id, nome) VALUES (24, 'Ian Sommerville');
INSERT INTO autores (id, nome) VALUES (25, 'Isaac Asimov');
INSERT INTO autores (id, nome) VALUES (26, 'J. R. R. Tolkien');
INSERT INTO autores (id, nome) VALUES (27, 'Jo├úo Guimar├úes Rosa');
INSERT INTO autores (id, nome) VALUES (28, 'Jos├® de Alencar');
INSERT INTO autores (id, nome) VALUES (29, 'J├║lio Verne');
INSERT INTO autores (id, nome) VALUES (30, 'Machado de Assis');
INSERT INTO autores (id, nome) VALUES (31, 'Marina de Andrade Marconi');
INSERT INTO autores (id, nome) VALUES (32, 'Monteiro Lobato');
INSERT INTO autores (id, nome) VALUES (33, 'Neil Gaiman');
INSERT INTO autores (id, nome) VALUES (34, 'Nicolau Maquiavel');
INSERT INTO autores (id, nome) VALUES (35, 'Oliver Sacks');
INSERT INTO autores (id, nome) VALUES (36, 'Paulo Freire');
INSERT INTO autores (id, nome) VALUES (37, 'Ramez Elmasri');
INSERT INTO autores (id, nome) VALUES (38, 'Richard Dawkins');
INSERT INTO autores (id, nome) VALUES (39, 'Robert C. Martin');
INSERT INTO autores (id, nome) VALUES (40, 'S├®rgio Buarque de Holanda');
INSERT INTO autores (id, nome) VALUES (41, 'Stephen Hawking');
INSERT INTO autores (id, nome) VALUES (42, 'Stephen King');
INSERT INTO autores (id, nome) VALUES (43, 'Thomas H. Cormen');
INSERT INTO autores (id, nome) VALUES (44, 'Viktor Frankl');
INSERT INTO autores (id, nome) VALUES (45, 'Yuval Noah Harari');

-- --- livros ---
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (1, '1984', '9788535914849', 1949, 7, 7, 19, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (2, 'A Hora da Estrela', '9788532508126', 1977, 2, 2, 12, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (3, 'A Revolucao dos Bichos', '9788535909555', 1945, 9, 9, 19, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (4, 'Algoritmos: Teoria e Pratica', '9788535236996', 1990, 10, 10, 43, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (5, 'Arquitetura Limpa', '9788550804606', 2017, 6, 6, 39, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (6, 'As Cr├┤nicas de N├írnia', '9788578270698', 1950, 5, 5, 8, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (7, 'Casa-Grande e Senzala', '9788526008694', 1933, 6, 6, 20, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (8, 'Codigo Limpo', '9788576082675', 2008, 10, 10, 39, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (9, 'Como Evitar um Desastre Clim├ítico', '9786555602760', 2021, 3, 3, 7, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (10, 'Como Fazer Amigos e Influenciar Pessoas', '9788543108681', 1936, 8, 8, 13, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (11, 'Cosmos', '9788535929881', 1980, 4, 4, 9, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (12, 'Deuses Americanos', '9788551000724', 2001, 4, 4, 33, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (13, 'Dom Casmurro', '9788520920411', 1899, 7, 7, 30, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (14, 'Duna', '9788576573135', 1965, 2, 2, 18, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (15, 'Em Busca de Sentido', '9788523308865', 1946, 10, 10, 44, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (16, 'Engenharia de Software', '9788579361081', 1982, 3, 3, 24, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (17, 'Forma├º├úo Econ├┤mica do Brasil', '9788535909524', 1959, 3, 3, 11, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (18, 'Funda├º├úo', '9788576574835', 1951, 4, 4, 25, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (19, 'Fundamentos de Metodologia Cientifica', '9788597010121', 1985, 10, 10, 31, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (20, 'Garota Exemplar', '9788580572902', 2012, 3, 3, 21, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (21, 'Grande Sertao: Veredas', '9788520922675', 1956, 9, 9, 27, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (22, 'Il├¡ada', '9788550410593', -800, 3, 3, 23, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (23, 'Inicia├º├úo ├á Hist├│ria da Filosofia', '9788571104051', 1997, 3, 3, 15, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (24, 'Iracema', '9788525406835', 1865, 10, 10, 28, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (25, 'It ÔÇö A Coisa', '9788560280940', 1986, 5, 5, 42, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (26, 'Maus: A Historia de um Sobrevivente', '9788535906288', 1986, 5, 5, 6, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (27, 'Memorias Postumas de Bras Cubas', '9788582850015', 1881, 10, 10, 30, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (28, 'O Codificador Limpo', '9788576086475', 2011, 3, 3, 39, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (29, 'O Cortico', '9788572323604', 1890, 6, 6, 2, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (30, 'O Corvo e Outros Poemas', '9788573263770', 1845, 3, 3, 16, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (31, 'O Di├írio de Anne Frank', '9788501044457', 1947, 5, 5, 4, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (32, 'O Gene Egoista', '9788535911299', 1976, 7, 7, 38, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (33, 'O Homem que Confundiu sua Mulher com um Chap├®u', '9788571646896', 1985, 3, 3, 35, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (34, 'O Pequeno Principe', '9788522031443', 1943, 9, 9, 5, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (35, 'O Principe', '9788563560032', 1532, 6, 6, 34, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (36, 'O Senhor dos An├®is', '9788595084759', 1954, 6, 6, 26, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (37, 'O Universo numa Casca de Noz', '9788580578881', 2001, 3, 3, 41, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (38, 'Padroes de Projeto', '9788573076103', 1994, 8, 8, 17, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (39, 'Palido Ponto Azul', '9788535931938', 1994, 3, 3, 9, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (40, 'Pedagogia do Oprimido', '9788577531646', 1968, 5, 5, 36, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (41, 'Quarto de Despejo: Diario de uma Favelada', '9788508171279', 1960, 7, 7, 10, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (42, 'Raizes do Brasil', '9788535927610', 1936, 7, 7, 40, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (43, 'Rapido e Devagar: Duas Formas de Pensar', '9788539003839', 2011, 8, 8, 14, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (44, 'Redes de Computadores', '9788576059240', 1981, 5, 5, 3, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (45, 'Reina├º├Áes de Narizinho', '9788574068329', 1931, 6, 6, 32, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (46, 'Sapiens: Uma Breve Historia da Humanidade', '9788525432186', 2011, 3, 3, 45, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (47, 'Sistema de Banco de Dados', '9788535245356', 1986, 3, 3, 1, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (48, 'Sistemas de Banco de Dados', '9788579360855', 1989, 10, 10, 37, NULL, NULL, NULL, NULL, 'SEM_CAPA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (49, 'Textos B├ísicos de Filosofia e Hist├│ria das Ci├¬ncias', '9788537815236', 2015, 3, 3, 15, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (50, 'Uma Breve Historia do Tempo', '9788580576467', 1988, 9, 9, 41, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (51, 'Variedades da Experiencia Cientifica', '9788535911329', 2006, 7, 7, 9, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (52, 'Vidas Secas', '9788501114785', 1938, 5, 5, 22, NULL, NULL, NULL, NULL, 'ENCONTRADA');
INSERT INTO livros (id, titulo, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, autor_id, categoria_legada, capa_arquivo, capa_atualizada_em, capa_origem, capa_status) VALUES
  (53, 'Vinte Mil L├®guas Submarinas', '9788582850022', 1870, 4, 4, 29, NULL, NULL, NULL, NULL, 'ENCONTRADA');

-- --- livro_categoria ---
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (1, 11, TRUE),    (1, 14, FALSE),    (1, 16, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (2, 15, TRUE),    (2, 18, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (3, 57, TRUE),    (3, 54, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (4, 33, TRUE),    (4, 32, FALSE),    (4, 27, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (5, 32, TRUE),    (5, 33, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (6, 13, TRUE),    (6, 22, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (7, 23, TRUE),    (7, 20, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (8, 33, TRUE),    (8, 32, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (9, 35, TRUE),    (9, 29, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (10, 36, TRUE),    (10, 38, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (11, 25, TRUE),    (11, 26, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (12, 13, TRUE),    (12, 17, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (13, 15, TRUE),    (13, 18, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (14, 14, TRUE),    (14, 11, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (15, 38, TRUE),    (15, 37, FALSE),    (15, 22, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (16, 32, TRUE),    (16, 33, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (17, 44, TRUE),    (17, 20, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (18, 14, TRUE),    (18, 21, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (19, 42, TRUE),    (19, 25, FALSE),    (19, 39, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (20, 16, TRUE),    (20, 18, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (21, 18, TRUE),    (21, 15, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (22, 17, TRUE),    (22, 12, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (23, 37, TRUE),    (23, 21, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (24, 15, TRUE),    (24, 18, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (25, 16, TRUE),    (25, 14, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (26, 50, TRUE),    (26, 21, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (27, 17, TRUE),    (27, 15, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (28, 33, TRUE),    (28, 32, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (29, 18, TRUE),    (29, 15, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (30, 17, TRUE),    (30, 16, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (31, 51, TRUE),    (31, 21, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (32, 24, TRUE),    (32, 37, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (33, 28, TRUE),    (33, 52, FALSE),    (33, 24, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (34, 56, TRUE),    (34, 13, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (35, 45, TRUE),    (35, 37, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (36, 13, TRUE),    (36, 12, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (37, 26, TRUE),    (37, 25, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (38, 32, TRUE),    (38, 33, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (39, 26, TRUE),    (39, 25, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (40, 39, TRUE),    (40, 23, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (41, 51, TRUE),    (41, 23, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (42, 20, TRUE),    (42, 23, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (43, 38, TRUE),    (43, 37, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (44, 34, TRUE),    (44, 33, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (45, 54, TRUE),    (45, 12, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (46, 21, TRUE),    (46, 20, FALSE),    (46, 23, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (47, 31, TRUE),    (47, 32, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (48, 31, TRUE),    (48, 32, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (49, 37, TRUE),    (49, 21, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (50, 26, TRUE),    (50, 25, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (51, 25, TRUE),    (51, 42, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (52, 15, TRUE),    (52, 18, FALSE);
INSERT INTO livro_categoria (livro_id, categoria_id, principal) VALUES
    (53, 11, TRUE),    (53, 14, FALSE);

-- ---------------------------------------------------------------------------
--  Conferindo
-- ---------------------------------------------------------------------------

SELECT 'autores' AS o, COUNT(*) AS total FROM autores
UNION ALL SELECT 'livros', COUNT(*) FROM livros
UNION ALL SELECT 'classificações', COUNT(*) FROM livro_categoria;

-- Nenhuma destas linhas devem vir diferente de zero:
SELECT
    (SELECT COUNT(*) FROM livro_categoria GROUP BY livro_id
      HAVING SUM(principal) <> 1 LIMIT 1) IS NULL   AS todo_livro_tem_uma_principal,
    (SELECT COUNT(*) FROM (SELECT livro_id FROM livro_categoria
                            GROUP BY livro_id HAVING COUNT(*) > 4) x
      LIMIT 1) IS NULL                                AS nenhum_livro_acima_de_4,
    (SELECT COUNT(*) FROM livros l WHERE NOT EXISTS
      (SELECT 1 FROM livro_categoria lc WHERE lc.livro_id = l.id)) AS livro_sem_categoria;