-- MySQL dump 10.13  Distrib 9.5.0, for Win64 (x86_64)
--
-- Host: localhost    Database: biblioteca
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `biblioteca`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `biblioteca` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `biblioteca`;

--
-- Table structure for table `autores`
--

DROP TABLE IF EXISTS `autores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `autores` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=137 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `autores`
--

LOCK TABLES `autores` WRITE;
/*!40000 ALTER TABLE `autores` DISABLE KEYS */;
INSERT INTO `autores` VALUES (1,'Gabriel García Márquez'),(2,'Isaac Asimov'),(3,'J. R. R. Tolkien'),(4,'Agatha Christie'),(5,'Gillian Flynn'),(6,'Stephen King'),(7,'Júlio Verne'),(8,'George Orwell'),(9,'Walter Isaacson'),(10,'Anne Frank'),(11,'Yuval Noah Harari'),(12,'Platão'),(13,'Viktor Frankl'),(14,'Dale Carnegie'),(15,'Carl Sagan'),(16,'Bill Gates'),(17,'Adam Smith'),(18,'Hannah Arendt'),(19,'Émile Durkheim'),(20,'Claude Lévi-Strauss'),(21,'Machado de Assis'),(22,'Fiódor Dostoiévski'),(23,'Victor Hugo'),(24,'Jane Austen'),(25,'Ernest Hemingway'),(26,'Fernando Pessoa'),(27,'Edgar Allan Poe'),(28,'William Shakespeare'),(29,'Homero'),(30,'Neil Gaiman'),(31,'C. S. Lewis'),(32,'Paulo Coelho'),(33,'Giorgio Vasari'),(34,'Frank Lloyd Wright'),(35,'Leonard Bernstein'),(36,'Roger Ebert'),(37,'Sebastião Salgado'),(38,'Julia Child'),(39,'Bill Bryson'),(40,'David Attenborough'),(41,'Ian Stewart'),(42,'Richard Feynman'),(43,'Marie Curie'),(44,'Charles Darwin'),(45,'Oliver Sacks'),(46,'Hans Kelsen'),(47,'Paulo Freire'),(48,'Noam Chomsky'),(49,'Tom Wolfe'),(50,'Monteiro Lobato'),(51,'Gabriel García Márquez'),(52,'Isaac Asimov'),(53,'J. R. R. Tolkien'),(54,'Agatha Christie'),(55,'Gillian Flynn'),(56,'Stephen King'),(57,'Júlio Verne'),(58,'George Orwell'),(59,'Walter Isaacson'),(60,'Anne Frank'),(61,'Yuval Noah Harari'),(62,'Platão'),(63,'Viktor Frankl'),(64,'Dale Carnegie'),(65,'Carl Sagan'),(66,'Bill Gates'),(67,'Adam Smith'),(68,'Hannah Arendt'),(69,'Émile Durkheim'),(70,'Claude Lévi-Strauss'),(71,'Machado de Assis'),(72,'Fiódor Dostoiévski'),(73,'Victor Hugo'),(74,'Jane Austen'),(75,'Ernest Hemingway'),(76,'Fernando Pessoa'),(77,'Edgar Allan Poe'),(78,'William Shakespeare'),(79,'Homero'),(80,'Neil Gaiman'),(81,'C. S. Lewis'),(82,'Paulo Coelho'),(83,'Giorgio Vasari'),(84,'Frank Lloyd Wright'),(85,'Leonard Bernstein'),(86,'Roger Ebert'),(87,'Sebastião Salgado'),(88,'Julia Child'),(89,'Bill Bryson'),(90,'David Attenborough'),(91,'Ian Stewart'),(92,'Richard Feynman'),(93,'Marie Curie'),(94,'Charles Darwin'),(95,'Oliver Sacks'),(96,'Hans Kelsen'),(97,'Paulo Freire'),(98,'Noam Chomsky'),(99,'Tom Wolfe'),(100,'Monteiro Lobato'),(101,'Celso Furtado'),(102,'Danilo Marcondes'),(103,'Elias Canetti'),(104,'Mércio Pereira Gomes'),(105,'Silvia Maria de Araújo / Maria Aparecida Bridi'),(106,'Jaime Pinsky'),(107,'Adhemar Marques / Flávio Berutti'),(108,'Gilberto Velho'),(109,'Rolf Dobelli'),(110,'Jaime Pinsky / Carla Bassanezi Pinsky'),(111,'Diversos'),(112,'Beth Brait'),(113,'Antonio Rezende'),(114,'Robert C. Martin'),(115,'Thomas H. Cormen'),(116,'Ian Sommerville'),(117,'Andrew S. Tanenbaum'),(118,'Ramez Elmasri'),(119,'Erich Gamma'),(120,'João Guimarães Rosa'),(121,'Antoine de Saint-Exupéry'),(122,'Graciliano Ramos'),(123,'Clarice Lispector'),(124,'Abraham Silberschatz'),(125,'Frank Herbert'),(126,'Stephen Hawking'),(127,'Richard Dawkins'),(128,'Art Spiegelman'),(129,'Daniel Kahneman'),(130,'Gilberto Freyre'),(131,'Carolina Maria de Jesus'),(132,'Sérgio Buarque de Holanda'),(133,'Marina de Andrade Marconi'),(134,'José de Alencar'),(135,'Aluísio Azevedo'),(136,'Nicolau Maquiavel');
/*!40000 ALTER TABLE `autores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Romance'),(2,'Ficção Científica'),(3,'Fantasia'),(4,'Mistério'),(5,'Thriller'),(6,'Terror'),(7,'Aventura'),(8,'Distopia'),(9,'Biografia'),(10,'Autobiografia'),(11,'História'),(12,'Filosofia'),(13,'Psicologia'),(14,'Autoajuda'),(15,'Ciência'),(16,'Tecnologia'),(17,'Economia'),(18,'Política'),(19,'Sociologia'),(20,'Antropologia'),(21,'Literatura Brasileira'),(22,'Literatura Russa'),(23,'Literatura Francesa'),(24,'Literatura Inglesa'),(25,'Literatura Americana'),(26,'Poesia'),(27,'Conto'),(28,'Drama'),(29,'Épico'),(30,'Mitologia'),(31,'Religião'),(32,'Espiritualidade'),(33,'Arte'),(34,'Arquitetura'),(35,'Música'),(36,'Cinema'),(37,'Fotografia'),(38,'Culinária'),(39,'Viagem'),(40,'Natureza'),(41,'Matemática'),(42,'Física'),(43,'Química'),(44,'Biologia'),(45,'Medicina'),(46,'Direito'),(47,'Educação'),(48,'Linguística'),(49,'Jornalismo'),(50,'Humor'),(51,'Romance'),(52,'Ficção Científica'),(53,'Fantasia'),(54,'Mistério'),(55,'Thriller'),(56,'Terror'),(57,'Aventura'),(58,'Distopia'),(59,'Biografia'),(60,'Autobiografia'),(61,'História'),(62,'Filosofia'),(63,'Psicologia'),(64,'Autoajuda'),(65,'Ciência'),(66,'Tecnologia'),(67,'Economia'),(68,'Política'),(69,'Sociologia'),(70,'Antropologia'),(71,'Literatura Brasileira'),(72,'Literatura Russa'),(73,'Literatura Francesa'),(74,'Literatura Inglesa'),(75,'Literatura Americana'),(76,'Poesia'),(77,'Conto'),(78,'Drama'),(79,'Épico'),(80,'Mitologia'),(81,'Religião'),(82,'Espiritualidade'),(83,'Arte'),(84,'Arquitetura'),(85,'Música'),(86,'Cinema'),(87,'Fotografia'),(88,'Culinária'),(89,'Viagem'),(90,'Natureza'),(91,'Matemática'),(92,'Física'),(93,'Química'),(94,'Biologia'),(95,'Medicina'),(96,'Direito'),(97,'Educação'),(98,'Linguística'),(99,'Jornalismo'),(100,'Humor'),(101,'Geografia'),(102,'Programação'),(103,'Algoritmos'),(104,'Engenharia de Software'),(105,'Redes de Computadores'),(106,'Banco de Dados'),(107,'Padrões de Projeto'),(108,'Sistemas de Informação'),(109,'Carreira em Tecnologia'),(110,'Arquitetura de Software'),(111,'Space Opera'),(112,'Astronomia'),(113,'Divulgação Científica'),(114,'Filosofia da Ciência'),(115,'Cosmologia'),(116,'Psicologia Existencial'),(117,'Realismo'),(118,'Fábula'),(119,'Romance Social'),(120,'Modernismo'),(121,'Regionalismo'),(122,'Naturalismo'),(123,'Romantismo'),(124,'Sátira Política'),(125,'Ciência Política'),(126,'Quadrinhos'),(127,'Diário'),(128,'História do Brasil'),(129,'Metodologia Científica');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emprestimos`
--

DROP TABLE IF EXISTS `emprestimos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emprestimos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `data_devolucao` date DEFAULT NULL,
  `data_emprestimo` date NOT NULL,
  `data_prevista_devolucao` date NOT NULL,
  `status` enum('ATIVO','DEVOLVIDO','ATRASADO') NOT NULL,
  `livro_id` bigint NOT NULL,
  `usuario_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKljc60fwmihjgdsn2ee23yka0k` (`livro_id`),
  KEY `FKnsu63kkykk3m1894dfem3uruu` (`usuario_id`),
  CONSTRAINT `FKljc60fwmihjgdsn2ee23yka0k` FOREIGN KEY (`livro_id`) REFERENCES `livros` (`id`),
  CONSTRAINT `FKnsu63kkykk3m1894dfem3uruu` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emprestimos`
--

LOCK TABLES `emprestimos` WRITE;
/*!40000 ALTER TABLE `emprestimos` DISABLE KEYS */;
/*!40000 ALTER TABLE `emprestimos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `livros`
--

DROP TABLE IF EXISTS `livros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `livros` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ano_publicacao` int DEFAULT NULL,
  `isbn` varchar(255) NOT NULL,
  `quantidade_disponivel` int NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `autor_id` bigint NOT NULL,
  `quantidade_total` int NOT NULL,
  `capa_arquivo` varchar(255) DEFAULT NULL,
  `capa_atualizada_em` datetime(6) DEFAULT NULL,
  `capa_origem` enum('BRASILAPI','GOOGLE_BOOKS','MANUAL','OPEN_LIBRARY') DEFAULT NULL,
  `capa_status` enum('ENCONTRADA','REVISAR','SEM_CAPA') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_bm02y40a3t3ambvf91804i3kv` (`isbn`),
  KEY `FKmjvs91l0cqtg1hy9kfj3b40fy` (`autor_id`),
  CONSTRAINT `FKmjvs91l0cqtg1hy9kfj3b40fy` FOREIGN KEY (`autor_id`) REFERENCES `autores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=184 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `livros`
--

LOCK TABLES `livros` WRITE;
/*!40000 ALTER TABLE `livros` DISABLE KEYS */;
INSERT INTO `livros` VALUES (2,1951,'9788576574835',4,'Fundação',2,4,'capa_livro_2.jpg','2026-10-07 16:58:32.711107','OPEN_LIBRARY','ENCONTRADA'),(3,1954,'9788595084759',6,'O Senhor dos Anéis',3,6,'capa_livro_3.jpg','2026-10-07 16:58:34.335678','OPEN_LIBRARY','ENCONTRADA'),(5,2012,'9788580572902',3,'Garota Exemplar',5,3,'capa_livro_5.jpg','2026-10-07 16:58:38.468989','OPEN_LIBRARY','ENCONTRADA'),(6,1986,'9788560280940',5,'It — A Coisa',6,5,'capa_livro_6.jpg','2026-10-07 16:58:41.279113','OPEN_LIBRARY','ENCONTRADA'),(7,1870,'9788582850022',4,'Vinte Mil Léguas Submarinas',7,4,'capa_livro_7.jpg','2026-10-07 16:58:44.020114','OPEN_LIBRARY','ENCONTRADA'),(8,1949,'9788535914849',7,'1984',8,7,'capa_livro_8.jpg','2026-10-07 16:58:46.291405','OPEN_LIBRARY','ENCONTRADA'),(10,1947,'9788501044457',5,'O Diário de Anne Frank',10,5,'capa_livro_10.jpg','2026-10-07 16:58:50.735972','OPEN_LIBRARY','ENCONTRADA'),(14,1936,'9788543108681',8,'Como Fazer Amigos e Influenciar Pessoas',14,8,'capa_livro_14.jpg','2026-10-07 16:58:58.300828','OPEN_LIBRARY','ENCONTRADA'),(15,1980,'9788535929881',4,'Cosmos',15,4,'capa_livro_15.jpg','2026-10-07 16:59:01.207493','OPEN_LIBRARY','ENCONTRADA'),(16,2021,'9786555602760',3,'Como Evitar um Desastre Climático',16,3,'capa_livro_16.jpg','2026-10-07 16:59:03.945550','OPEN_LIBRARY','ENCONTRADA'),(27,1845,'9788573263770',3,'O Corvo e Outros Poemas',27,3,'capa_livro_27.jpg','2026-10-07 16:59:23.894343','OPEN_LIBRARY','ENCONTRADA'),(29,-800,'9788550410593',3,'Ilíada',29,3,'capa_livro_29.jpg','2026-10-07 16:59:28.568950','OPEN_LIBRARY','ENCONTRADA'),(30,2001,'9788551000724',4,'Deuses Americanos',30,4,'capa_livro_30.jpg','2026-10-07 16:59:30.805824','OPEN_LIBRARY','ENCONTRADA'),(31,1950,'9788578270698',5,'As Crônicas de Nárnia',31,5,'capa_livro_31.jpg','2026-10-07 16:59:33.539685','OPEN_LIBRARY','ENCONTRADA'),(45,1985,'9788571646896',3,'O Homem que Confundiu sua Mulher com um Chapéu',45,3,'capa_livro_45.jpg','2026-10-07 16:59:56.501266','OPEN_LIBRARY','ENCONTRADA'),(47,1968,'9788577531646',5,'Pedagogia do Oprimido',47,5,'capa_livro_47.jpg','2026-10-07 17:00:00.756885','OPEN_LIBRARY','ENCONTRADA'),(50,1931,'9788574068329',6,'Reinações de Narizinho',50,6,'capa_livro_50.jpg','2026-10-07 17:00:07.726041','OPEN_LIBRARY','ENCONTRADA'),(101,1959,'9788535909524',3,'Formação Econômica do Brasil',101,3,'capa_livro_101.jpg','2026-10-07 17:41:19.388172','OPEN_LIBRARY','ENCONTRADA'),(102,1997,'9788571104051',3,'Iniciação à História da Filosofia',102,3,'capa_livro_102.jpg','2026-10-07 17:41:22.730555','OPEN_LIBRARY','ENCONTRADA'),(110,2015,'9788537815236',3,'Textos Básicos de Filosofia e História das Ciências',102,3,'capa_livro_110.jpg','2026-10-07 17:41:37.174031','BRASILAPI','ENCONTRADA'),(151,2011,'9788525432186',3,'Sapiens: Uma Breve Historia da Humanidade',11,3,'capa_livro_151.jpg','2026-10-07 20:19:37.996188','OPEN_LIBRARY','ENCONTRADA'),(152,1899,'9788520920411',7,'Dom Casmurro',21,7,NULL,'2026-10-07 20:19:39.346315',NULL,'SEM_CAPA'),(153,2008,'9788576082675',10,'Codigo Limpo',114,10,'capa_livro_153.jpg','2026-10-07 20:19:41.475137','OPEN_LIBRARY','ENCONTRADA'),(154,1990,'9788535236996',10,'Algoritmos: Teoria e Pratica',115,10,NULL,'2026-10-07 20:19:43.429572',NULL,'SEM_CAPA'),(155,1982,'9788579361081',3,'Engenharia de Software',116,3,NULL,'2026-10-07 20:19:44.973200',NULL,'SEM_CAPA'),(156,1981,'9788576059240',5,'Redes de Computadores',117,5,NULL,'2026-10-07 20:19:46.926873',NULL,'SEM_CAPA'),(157,1989,'9788579360855',10,'Sistemas de Banco de Dados',118,10,NULL,'2026-10-07 20:19:48.876260',NULL,'SEM_CAPA'),(158,1994,'9788573076103',8,'Padroes de Projeto',119,8,NULL,'2026-10-07 20:19:50.323274',NULL,'SEM_CAPA'),(159,1881,'9788582850015',10,'Memorias Postumas de Bras Cubas',21,10,'capa_livro_159.jpg','2026-10-07 20:19:52.912683','OPEN_LIBRARY','ENCONTRADA'),(160,1956,'9788520922675',9,'Grande Sertao: Veredas',120,9,NULL,'2026-10-07 20:19:54.866636',NULL,'SEM_CAPA'),(161,1943,'9788522031443',9,'O Pequeno Principe',121,9,NULL,'2026-10-07 20:19:56.959663',NULL,'SEM_CAPA'),(162,1938,'9788501114785',5,'Vidas Secas',122,5,'capa_livro_162.jpg','2026-10-07 20:19:59.836363','OPEN_LIBRARY','ENCONTRADA'),(163,1977,'9788532508126',2,'A Hora da Estrela',123,2,'capa_livro_163.jpg','2026-10-07 20:20:01.953202','OPEN_LIBRARY','ENCONTRADA'),(164,1986,'9788535245356',3,'Sistema de Banco de Dados',124,3,NULL,'2026-10-07 20:20:04.061172',NULL,'SEM_CAPA'),(165,2011,'9788576086475',3,'O Codificador Limpo',114,3,NULL,'2026-10-07 20:20:05.474428',NULL,'SEM_CAPA'),(166,2017,'9788550804606',6,'Arquitetura Limpa',114,6,'capa_livro_166.jpg','2026-10-07 20:20:08.397889','OPEN_LIBRARY','ENCONTRADA'),(167,1945,'9788535909555',9,'A Revolucao dos Bichos',8,9,NULL,'2026-10-07 20:20:09.919478',NULL,'SEM_CAPA'),(168,1965,'9788576573135',2,'Duna',125,2,'capa_livro_168.jpg','2026-10-07 20:20:12.728410','OPEN_LIBRARY','ENCONTRADA'),(169,1988,'9788580576467',9,'Uma Breve Historia do Tempo',126,9,'capa_livro_169.jpg','2026-10-07 20:20:15.006398','OPEN_LIBRARY','ENCONTRADA'),(170,1976,'9788535911299',7,'O Gene Egoista',127,7,NULL,'2026-10-07 20:20:17.048677',NULL,'SEM_CAPA'),(171,1986,'9788535906288',5,'Maus: A Historia de um Sobrevivente',128,5,'capa_livro_171.jpg','2026-10-07 20:20:19.217318','OPEN_LIBRARY','ENCONTRADA'),(172,2011,'9788539003839',8,'Rapido e Devagar: Duas Formas de Pensar',129,8,'capa_livro_172.jpg','2026-10-07 20:20:21.492030','OPEN_LIBRARY','ENCONTRADA'),(173,1933,'9788526008694',6,'Casa-Grande e Senzala',130,6,'capa_livro_173.jpg','2026-10-07 20:20:24.777262','OPEN_LIBRARY','ENCONTRADA'),(174,1960,'9788508171279',7,'Quarto de Despejo: Diario de uma Favelada',131,7,'capa_livro_174.jpg','2026-10-07 20:20:27.146274','OPEN_LIBRARY','ENCONTRADA'),(175,1936,'9788535927610',7,'Raizes do Brasil',132,7,NULL,'2026-10-07 20:20:29.471899',NULL,'SEM_CAPA'),(176,1985,'9788597010121',10,'Fundamentos de Metodologia Cientifica',133,10,NULL,'2026-10-07 20:20:31.580963',NULL,'SEM_CAPA'),(177,1994,'9788535931938',3,'Palido Ponto Azul',15,3,'capa_livro_177.jpg','2026-10-07 20:20:34.867400','OPEN_LIBRARY','ENCONTRADA'),(178,2006,'9788535911329',7,'Variedades da Experiencia Cientifica',15,7,'capa_livro_178.jpg','2026-10-07 20:20:36.832464','OPEN_LIBRARY','ENCONTRADA'),(179,2001,'9788580578881',3,'O Universo numa Casca de Noz',126,3,'capa_livro_179.jpg','2026-10-07 20:20:38.844508','OPEN_LIBRARY','ENCONTRADA'),(180,1946,'9788523308865',10,'Em Busca de Sentido',13,10,NULL,'2026-10-07 20:20:40.909077',NULL,'SEM_CAPA'),(181,1865,'9788525406835',10,'Iracema',134,10,NULL,'2026-10-07 20:20:42.245430',NULL,'SEM_CAPA'),(182,1890,'9788572323604',6,'O Cortico',135,6,'capa_livro_182.jpg','2026-10-07 20:20:45.061096','OPEN_LIBRARY','ENCONTRADA'),(183,1532,'9788563560032',6,'O Principe',136,6,'capa_livro_183.jpg','2026-10-07 20:20:46.883068','OPEN_LIBRARY','ENCONTRADA');
/*!40000 ALTER TABLE `livros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `livros_categorias`
--

DROP TABLE IF EXISTS `livros_categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `livros_categorias` (
  `livro_id` bigint NOT NULL,
  `categoria_id` bigint NOT NULL,
  PRIMARY KEY (`livro_id`,`categoria_id`),
  KEY `fk_lc_categoria` (`categoria_id`),
  CONSTRAINT `fk_lc_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`),
  CONSTRAINT `fk_lc_livro` FOREIGN KEY (`livro_id`) REFERENCES `livros` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `livros_categorias`
--

LOCK TABLES `livros_categorias` WRITE;
/*!40000 ALTER TABLE `livros_categorias` DISABLE KEYS */;
INSERT INTO `livros_categorias` VALUES (2,2),(3,3),(5,5),(6,6),(7,7),(8,8),(10,10),(102,12),(110,12),(14,14),(15,15),(16,16),(101,17),(27,27),(29,29),(30,30),(31,31),(45,45),(47,47),(50,50);
/*!40000 ALTER TABLE `livros_categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cpf` varchar(14) NOT NULL,
  `email` varchar(255) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `telefone` varchar(255) DEFAULT NULL,
  `senha` varchar(255) NOT NULL,
  `tipo` enum('ALUNO','BIBLIOTECARIO') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_2et2smpfrtsohr7w9fe1v8a5e` (`cpf`),
  UNIQUE KEY `UK_kfsp0s1tflm1cwlj8idhqsad0` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'11111111111','bibliotecario@biblioteca.com','Bibliotecario Teste','(11) 91111-1111','$2a$10$af0eQ1hAFSIyN8MCzSjGEuBQWlJnnPm/UlcCXTUdaIFuzUiDTei9K','BIBLIOTECARIO'),(2,'22222222222','aluno@biblioteca.com','Aluno Teste','(11) 92222-2222','$2a$10$3QIgvwpfZVRuc9dwqzCiqufh93VQIaW1e53DlluvXEB07Cos1BT2W','ALUNO');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'biblioteca'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-07 20:40:23
