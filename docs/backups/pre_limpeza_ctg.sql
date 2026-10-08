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
  `categoria_pai_id` bigint DEFAULT NULL,
  `ordem_exibicao` int NOT NULL DEFAULT '0',
  `cor` varchar(7) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_categorias_pai` (`categoria_pai_id`),
  KEY `idx_categorias_ordem` (`ordem_exibicao`),
  CONSTRAINT `fk_categoria_pai` FOREIGN KEY (`categoria_pai_id`) REFERENCES `categorias` (`id`),
  CONSTRAINT `chk_categoria_estrutura` CHECK ((((`categoria_pai_id` is null) and (`ordem_exibicao` > 0) and (`cor` is not null)) or ((`categoria_pai_id` is not null) and (`ordem_exibicao` = 0) and (`cor` is null)) or ((`categoria_pai_id` is null) and (`ordem_exibicao` = 0) and (`cor` is null))))
) ENGINE=InnoDB AUTO_INCREMENT=197 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Romance',NULL,0,NULL),(2,'Ficção Científica',NULL,0,NULL),(3,'Fantasia',NULL,0,NULL),(4,'Mistério',NULL,0,NULL),(5,'Thriller',NULL,0,NULL),(6,'Terror',NULL,0,NULL),(7,'Aventura',NULL,0,NULL),(8,'Distopia',NULL,0,NULL),(9,'Biografia',NULL,0,NULL),(10,'Autobiografia',NULL,0,NULL),(11,'História',NULL,0,NULL),(12,'Filosofia',NULL,0,NULL),(13,'Psicologia',NULL,0,NULL),(14,'Autoajuda',NULL,0,NULL),(15,'Ciência',NULL,0,NULL),(16,'Tecnologia',NULL,0,NULL),(17,'Economia',NULL,0,NULL),(18,'Política',NULL,0,NULL),(19,'Sociologia',NULL,0,NULL),(20,'Antropologia',NULL,0,NULL),(21,'Literatura Brasileira',NULL,0,NULL),(22,'Literatura Russa',NULL,0,NULL),(23,'Literatura Francesa',NULL,0,NULL),(24,'Literatura Inglesa',NULL,0,NULL),(25,'Literatura Americana',NULL,0,NULL),(26,'Poesia',NULL,0,NULL),(27,'Conto',NULL,0,NULL),(28,'Drama',NULL,0,NULL),(29,'Épico',NULL,0,NULL),(30,'Mitologia',NULL,0,NULL),(31,'Religião',NULL,0,NULL),(32,'Espiritualidade',NULL,0,NULL),(33,'Arte',NULL,0,NULL),(34,'Arquitetura',NULL,0,NULL),(35,'Música',NULL,0,NULL),(36,'Cinema',NULL,0,NULL),(37,'Fotografia',NULL,0,NULL),(38,'Culinária',NULL,0,NULL),(39,'Viagem',NULL,0,NULL),(40,'Natureza',NULL,0,NULL),(41,'Matemática',NULL,0,NULL),(42,'Física',NULL,0,NULL),(43,'Química',NULL,0,NULL),(44,'Biologia',NULL,0,NULL),(45,'Medicina',NULL,0,NULL),(46,'Direito',NULL,0,NULL),(47,'Educação',NULL,0,NULL),(48,'Linguística',NULL,0,NULL),(49,'Jornalismo',NULL,0,NULL),(50,'Humor',NULL,0,NULL),(51,'Romance',NULL,0,NULL),(52,'Ficção Científica',NULL,0,NULL),(53,'Fantasia',NULL,0,NULL),(54,'Mistério',NULL,0,NULL),(55,'Thriller',NULL,0,NULL),(56,'Terror',NULL,0,NULL),(57,'Aventura',NULL,0,NULL),(58,'Distopia',NULL,0,NULL),(59,'Biografia',NULL,0,NULL),(60,'Autobiografia',NULL,0,NULL),(61,'História',NULL,0,NULL),(62,'Filosofia',NULL,0,NULL),(63,'Psicologia',NULL,0,NULL),(64,'Autoajuda',NULL,0,NULL),(65,'Ciência',NULL,0,NULL),(66,'Tecnologia',NULL,0,NULL),(67,'Economia',NULL,0,NULL),(68,'Política',NULL,0,NULL),(69,'Sociologia',NULL,0,NULL),(70,'Antropologia',NULL,0,NULL),(71,'Literatura Brasileira',NULL,0,NULL),(72,'Literatura Russa',NULL,0,NULL),(73,'Literatura Francesa',NULL,0,NULL),(74,'Literatura Inglesa',NULL,0,NULL),(75,'Literatura Americana',NULL,0,NULL),(76,'Poesia',NULL,0,NULL),(77,'Conto',NULL,0,NULL),(78,'Drama',NULL,0,NULL),(79,'Épico',NULL,0,NULL),(80,'Mitologia',NULL,0,NULL),(81,'Religião',NULL,0,NULL),(82,'Espiritualidade',NULL,0,NULL),(83,'Arte',NULL,0,NULL),(84,'Arquitetura',NULL,0,NULL),(85,'Música',NULL,0,NULL),(86,'Cinema',NULL,0,NULL),(87,'Fotografia',NULL,0,NULL),(88,'Culinária',NULL,0,NULL),(89,'Viagem',NULL,0,NULL),(90,'Natureza',NULL,0,NULL),(91,'Matemática',NULL,0,NULL),(92,'Física',NULL,0,NULL),(93,'Química',NULL,0,NULL),(94,'Biologia',NULL,0,NULL),(95,'Medicina',NULL,0,NULL),(96,'Direito',NULL,0,NULL),(97,'Educação',NULL,0,NULL),(98,'Linguística',NULL,0,NULL),(99,'Jornalismo',NULL,0,NULL),(100,'Humor',NULL,0,NULL),(101,'Geografia',NULL,0,NULL),(102,'Programação',NULL,0,NULL),(103,'Algoritmos',NULL,0,NULL),(104,'Engenharia de Software',NULL,0,NULL),(105,'Redes de Computadores',NULL,0,NULL),(106,'Banco de Dados',NULL,0,NULL),(107,'Padrões de Projeto',NULL,0,NULL),(108,'Sistemas de Informação',NULL,0,NULL),(109,'Carreira em Tecnologia',NULL,0,NULL),(110,'Arquitetura de Software',NULL,0,NULL),(111,'Space Opera',NULL,0,NULL),(112,'Astronomia',NULL,0,NULL),(113,'Divulgação Científica',NULL,0,NULL),(114,'Filosofia da Ciência',NULL,0,NULL),(115,'Cosmologia',NULL,0,NULL),(116,'Psicologia Existencial',NULL,0,NULL),(117,'Realismo',NULL,0,NULL),(118,'Fábula',NULL,0,NULL),(119,'Romance Social',NULL,0,NULL),(120,'Modernismo',NULL,0,NULL),(121,'Regionalismo',NULL,0,NULL),(122,'Naturalismo',NULL,0,NULL),(123,'Romantismo',NULL,0,NULL),(124,'Sátira Política',NULL,0,NULL),(125,'Ciência Política',NULL,0,NULL),(126,'Quadrinhos',NULL,0,NULL),(127,'Diário',NULL,0,NULL),(128,'História do Brasil',NULL,0,NULL),(129,'Metodologia Científica',NULL,0,NULL),(130,'Literatura',NULL,1,'#8C2B2B'),(131,'História e Sociedade',NULL,2,'#6B4A3A'),(132,'Ciências',NULL,3,'#2F6B4F'),(133,'Computação e Tecnologia',NULL,4,'#1E3D59'),(134,'Filosofia e Psicologia',NULL,5,'#4A2545'),(135,'Educação e Pesquisa',NULL,6,'#6E5A16'),(136,'Política e Economia',NULL,7,'#9C4A1E'),(137,'Quadrinhos e Artes',NULL,8,'#7A2E5C'),(138,'Biografias e Memórias',NULL,9,'#3F6B7A'),(139,'Infantojuvenil',NULL,10,'#8C6B2B'),(140,'Aventura e Distopia',130,0,NULL),(141,'Crônica Ensaio e Sátira',130,0,NULL),(142,'Fantasia e Mitologia',130,0,NULL),(143,'Ficção Científica',130,0,NULL),(144,'Literaturas Nacionais',130,0,NULL),(145,'Mistério Thriller e Terror',130,0,NULL),(146,'Poesia e Conto',130,0,NULL),(147,'Romance e Realismo',130,0,NULL),(148,'Geografia',131,0,NULL),(149,'História do Brasil',131,0,NULL),(150,'História Geral',131,0,NULL),(151,'Religião e Espiritualidade',131,0,NULL),(152,'Sociologia e Antropologia',131,0,NULL),(153,'Biologia e Evolução',132,0,NULL),(154,'Ciência Geral e Divulgação',132,0,NULL),(155,'Física e Astronomia',132,0,NULL),(156,'Matemática',132,0,NULL),(157,'Medicina e Saúde',132,0,NULL),(158,'Natureza e Meio Ambiente',132,0,NULL),(159,'Química',132,0,NULL),(160,'Banco de Dados',133,0,NULL),(161,'Engenharia de Software',133,0,NULL),(162,'Programação',133,0,NULL),(163,'Redes e Sistemas',133,0,NULL),(164,'Tecnologia e Sociedade',133,0,NULL),(165,'Autoajuda e Desenvolvimento Pessoal',134,0,NULL),(166,'Filosofia',134,0,NULL),(167,'Psicologia',134,0,NULL),(168,'Educação',135,0,NULL),(169,'Jornalismo',135,0,NULL),(170,'Linguística e Comunicação',135,0,NULL),(171,'Metodologia Científica',135,0,NULL),(172,'Direito',136,0,NULL),(173,'Economia',136,0,NULL),(174,'Política',136,0,NULL),(175,'Artes Visuais',137,0,NULL),(176,'Cinema e Audiovisual',137,0,NULL),(177,'Culinária e Viagem',137,0,NULL),(178,'Música',137,0,NULL),(179,'Quadrinhos',137,0,NULL),(180,'Autobiografia e Memórias',138,0,NULL),(181,'Biografia',138,0,NULL),(182,'Diário e Cartas',138,0,NULL),(183,'Contos e Fábulas',139,0,NULL),(184,'Jovem Adulto',139,0,NULL),(185,'Literatura Infantil',139,0,NULL),(186,'Literatura Infantil e Juvenil',139,0,NULL),(187,'Teste',NULL,0,NULL),(188,'TESTE Solto',NULL,0,NULL),(189,'TESTE Filha',130,0,NULL),(194,'TESTE Sub',132,0,NULL);
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_categoria_pai_e_area` BEFORE INSERT ON `categorias` FOR EACH ROW BEGIN
    IF NEW.categoria_pai_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM categorias
            WHERE id = NEW.categoria_pai_id AND categoria_pai_id IS NULL
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'A categoria pai deve ser uma area (sem categoria_pai_id).';
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_categoria_upd_pai_e_area` BEFORE UPDATE ON `categorias` FOR EACH ROW BEGIN
    IF NEW.categoria_pai_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM categorias
            WHERE id = NEW.categoria_pai_id AND categoria_pai_id IS NULL
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'A categoria pai deve ser uma area (sem categoria_pai_id).';
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

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
-- Table structure for table `livro_categoria`
--

DROP TABLE IF EXISTS `livro_categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `livro_categoria` (
  `livro_id` bigint NOT NULL,
  `categoria_id` bigint NOT NULL,
  `principal` tinyint(1) NOT NULL DEFAULT '0',
  `principal_norm` tinyint GENERATED ALWAYS AS (if(`principal`,1,NULL)) STORED,
  PRIMARY KEY (`livro_id`,`categoria_id`),
  UNIQUE KEY `uk_livro_categoria_principal` (`livro_id`,`principal_norm`),
  KEY `idx_lc_livro` (`livro_id`),
  KEY `idx_lc_categoria` (`categoria_id`),
  KEY `idx_lc_categoria_livro` (`categoria_id`,`livro_id`),
  CONSTRAINT `fk_livro_categoria_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`),
  CONSTRAINT `fk_livro_categoria_livro` FOREIGN KEY (`livro_id`) REFERENCES `livros` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `livro_categoria`
--

LOCK TABLES `livro_categoria` WRITE;
/*!40000 ALTER TABLE `livro_categoria` DISABLE KEYS */;
INSERT INTO `livro_categoria` (`livro_id`, `categoria_id`, `principal`) VALUES (2,143,1),(2,150,0),(3,141,0),(3,142,1),(5,145,1),(5,147,0),(6,143,0),(6,145,1),(7,140,1),(7,143,0),(8,140,1),(8,143,0),(8,145,0),(10,150,0),(10,180,1),(14,165,1),(14,167,0),(15,154,1),(15,155,0),(16,158,0),(16,164,1),(27,145,0),(27,146,1),(29,141,0),(29,146,1),(30,142,1),(30,146,0),(31,142,1),(31,151,0),(45,153,0),(45,157,1),(45,181,0),(47,152,0),(47,168,1),(50,141,0),(50,183,1),(101,149,0),(101,173,1),(102,150,0),(102,166,1),(110,150,0),(110,166,1),(151,149,0),(151,150,1),(151,152,0),(152,144,1),(152,147,0),(153,161,0),(153,162,1),(154,156,0),(154,161,0),(154,162,1),(155,161,1),(155,162,0),(156,162,0),(156,163,1),(157,160,1),(157,161,0),(158,161,1),(158,162,0),(159,144,0),(159,146,1),(160,144,0),(160,147,1),(161,142,0),(161,185,1),(162,144,1),(162,147,0),(163,144,1),(163,147,0),(164,160,1),(164,161,0),(165,161,0),(165,162,1),(166,161,1),(166,162,0),(167,183,0),(167,186,1),(168,140,0),(168,143,1),(169,154,0),(169,155,1),(170,153,1),(170,166,0),(171,150,0),(171,179,1),(172,166,0),(172,167,1),(173,149,0),(173,152,1),(174,152,0),(174,180,1),(175,149,1),(175,152,0),(176,154,0),(176,168,0),(176,171,1),(177,154,0),(177,155,1),(178,154,1),(178,171,0),(179,154,0),(179,155,1),(180,151,0),(180,166,0),(180,167,1),(181,144,1),(181,147,0),(182,144,0),(182,147,1),(183,166,0),(183,174,1);
/*!40000 ALTER TABLE `livro_categoria` ENABLE KEYS */;
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
  `categoria_legada` varchar(255) DEFAULT NULL,
  `quantidade_total` int NOT NULL,
  `capa_arquivo` varchar(255) DEFAULT NULL,
  `capa_atualizada_em` datetime(6) DEFAULT NULL,
  `capa_origem` enum('BRASILAPI','GOOGLE_BOOKS','MANUAL','OPEN_LIBRARY') DEFAULT NULL,
  `capa_status` enum('ENCONTRADA','REVISAR','SEM_CAPA') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_bm02y40a3t3ambvf91804i3kv` (`isbn`),
  KEY `FKmjvs91l0cqtg1hy9kfj3b40fy` (`autor_id`),
  CONSTRAINT `FKmjvs91l0cqtg1hy9kfj3b40fy` FOREIGN KEY (`autor_id`) REFERENCES `autores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=190 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `livros`
--

LOCK TABLES `livros` WRITE;
/*!40000 ALTER TABLE `livros` DISABLE KEYS */;
INSERT INTO `livros` VALUES (2,1951,'9788576574835',4,'Fundação',2,'Ficção Científica',4,'capa_livro_2.jpg','2026-10-07 16:58:32.711107','OPEN_LIBRARY','ENCONTRADA'),(3,1954,'9788595084759',6,'O Senhor dos Anéis',3,'Fantasia',6,'capa_livro_3.jpg','2026-10-07 16:58:34.335678','OPEN_LIBRARY','ENCONTRADA'),(5,2012,'9788580572902',3,'Garota Exemplar',5,'Thriller',3,'capa_livro_5.jpg','2026-10-07 16:58:38.468989','OPEN_LIBRARY','ENCONTRADA'),(6,1986,'9788560280940',5,'It — A Coisa',6,'Terror',5,'capa_livro_6.jpg','2026-10-07 16:58:41.279113','OPEN_LIBRARY','ENCONTRADA'),(7,1870,'9788582850022',4,'Vinte Mil Léguas Submarinas',7,'Aventura',4,'capa_livro_7.jpg','2026-10-07 16:58:44.020114','OPEN_LIBRARY','ENCONTRADA'),(8,1949,'9788535914849',7,'1984',8,'Distopia',7,'capa_livro_8.jpg','2026-10-07 16:58:46.291405','OPEN_LIBRARY','ENCONTRADA'),(10,1947,'9788501044457',5,'O Diário de Anne Frank',10,'Autobiografia',5,'capa_livro_10.jpg','2026-10-07 16:58:50.735972','OPEN_LIBRARY','ENCONTRADA'),(14,1936,'9788543108681',8,'Como Fazer Amigos e Influenciar Pessoas',14,'Autoajuda',8,'capa_livro_14.jpg','2026-10-07 16:58:58.300828','OPEN_LIBRARY','ENCONTRADA'),(15,1980,'9788535929881',4,'Cosmos',15,'Ciência',4,'capa_livro_15.jpg','2026-10-07 16:59:01.207493','OPEN_LIBRARY','ENCONTRADA'),(16,2021,'9786555602760',3,'Como Evitar um Desastre Climático',16,'Tecnologia',3,'capa_livro_16.jpg','2026-10-07 16:59:03.945550','OPEN_LIBRARY','ENCONTRADA'),(27,1845,'9788573263770',3,'O Corvo e Outros Poemas',27,'Conto',3,'capa_livro_27.jpg','2026-10-07 16:59:23.894343','OPEN_LIBRARY','ENCONTRADA'),(29,-800,'9788550410593',3,'Ilíada',29,'Épico',3,'capa_livro_29.jpg','2026-10-07 16:59:28.568950','OPEN_LIBRARY','ENCONTRADA'),(30,2001,'9788551000724',4,'Deuses Americanos',30,'Mitologia',4,'capa_livro_30.jpg','2026-10-07 16:59:30.805824','OPEN_LIBRARY','ENCONTRADA'),(31,1950,'9788578270698',5,'As Crônicas de Nárnia',31,'Religião',5,'capa_livro_31.jpg','2026-10-07 16:59:33.539685','OPEN_LIBRARY','ENCONTRADA'),(45,1985,'9788571646896',3,'O Homem que Confundiu sua Mulher com um Chapéu',45,'Medicina',3,'capa_livro_45.jpg','2026-10-07 16:59:56.501266','OPEN_LIBRARY','ENCONTRADA'),(47,1968,'9788577531646',5,'Pedagogia do Oprimido',47,'Educação',5,'capa_livro_47.jpg','2026-10-07 17:00:00.756885','OPEN_LIBRARY','ENCONTRADA'),(50,1931,'9788574068329',6,'Reinações de Narizinho',50,'Humor',6,'capa_livro_50.jpg','2026-10-07 17:00:07.726041','OPEN_LIBRARY','ENCONTRADA'),(101,1959,'9788535909524',3,'Formação Econômica do Brasil',101,'Economia',3,'capa_livro_101.jpg','2026-10-07 17:41:19.388172','OPEN_LIBRARY','ENCONTRADA'),(102,1997,'9788571104051',3,'Iniciação à História da Filosofia',102,'Filosofia',3,'capa_livro_102.jpg','2026-10-07 17:41:22.730555','OPEN_LIBRARY','ENCONTRADA'),(110,2015,'9788537815236',3,'Textos Básicos de Filosofia e História das Ciências',102,'Filosofia',3,'capa_livro_110.jpg','2026-10-07 17:41:37.174031','BRASILAPI','ENCONTRADA'),(151,2011,'9788525432186',3,'Sapiens: Uma Breve Historia da Humanidade',11,NULL,3,'capa_livro_151.jpg','2026-10-07 20:19:37.996188','OPEN_LIBRARY','ENCONTRADA'),(152,1899,'9788520920411',7,'Dom Casmurro',21,NULL,7,NULL,'2026-10-07 21:02:43.806900',NULL,'SEM_CAPA'),(153,2008,'9788576082675',10,'Codigo Limpo',114,NULL,10,'capa_livro_153.jpg','2026-10-07 20:19:41.475137','OPEN_LIBRARY','ENCONTRADA'),(154,1990,'9788535236996',10,'Algoritmos: Teoria e Pratica',115,NULL,10,NULL,'2026-10-07 21:02:45.849500',NULL,'SEM_CAPA'),(155,1982,'9788579361081',3,'Engenharia de Software',116,NULL,3,NULL,'2026-10-07 21:02:47.162892',NULL,'SEM_CAPA'),(156,1981,'9788576059240',5,'Redes de Computadores',117,NULL,5,NULL,'2026-10-07 21:02:48.553006',NULL,'SEM_CAPA'),(157,1989,'9788579360855',10,'Sistemas de Banco de Dados',118,NULL,10,NULL,'2026-10-07 21:02:49.942102',NULL,'SEM_CAPA'),(158,1994,'9788573076103',8,'Padroes de Projeto',119,NULL,8,NULL,'2026-10-07 21:02:52.008381',NULL,'SEM_CAPA'),(159,1881,'9788582850015',10,'Memorias Postumas de Bras Cubas',21,NULL,10,'capa_livro_159.jpg','2026-10-07 20:19:52.912683','OPEN_LIBRARY','ENCONTRADA'),(160,1956,'9788520922675',9,'Grande Sertao: Veredas',120,NULL,9,NULL,'2026-10-07 21:02:54.173236',NULL,'SEM_CAPA'),(161,1943,'9788522031443',9,'O Pequeno Principe',121,NULL,9,NULL,'2026-10-07 21:02:55.749236',NULL,'SEM_CAPA'),(162,1938,'9788501114785',5,'Vidas Secas',122,NULL,5,'capa_livro_162.jpg','2026-10-07 20:19:59.836363','OPEN_LIBRARY','ENCONTRADA'),(163,1977,'9788532508126',2,'A Hora da Estrela',123,NULL,2,'capa_livro_163.jpg','2026-10-07 20:20:01.953202','OPEN_LIBRARY','ENCONTRADA'),(164,1986,'9788535245356',3,'Sistema de Banco de Dados',124,NULL,3,NULL,'2026-10-07 21:02:57.923356',NULL,'SEM_CAPA'),(165,2011,'9788576086475',3,'O Codificador Limpo',114,NULL,3,NULL,'2026-10-07 21:02:59.401988',NULL,'SEM_CAPA'),(166,2017,'9788550804606',6,'Arquitetura Limpa',114,NULL,6,'capa_livro_166.jpg','2026-10-07 20:20:08.397889','OPEN_LIBRARY','ENCONTRADA'),(167,1945,'9788535909555',9,'A Revolucao dos Bichos',8,NULL,9,NULL,'2026-10-07 21:03:01.681448',NULL,'SEM_CAPA'),(168,1965,'9788576573135',2,'Duna',125,NULL,2,'capa_livro_168.jpg','2026-10-07 20:20:12.728410','OPEN_LIBRARY','ENCONTRADA'),(169,1988,'9788580576467',9,'Uma Breve Historia do Tempo',126,NULL,9,'capa_livro_169.jpg','2026-10-07 20:20:15.006398','OPEN_LIBRARY','ENCONTRADA'),(170,1976,'9788535911299',7,'O Gene Egoista',127,NULL,7,NULL,'2026-10-07 21:03:03.666686',NULL,'SEM_CAPA'),(171,1986,'9788535906288',5,'Maus: A Historia de um Sobrevivente',128,NULL,5,'capa_livro_171.jpg','2026-10-07 20:20:19.217318','OPEN_LIBRARY','ENCONTRADA'),(172,2011,'9788539003839',8,'Rapido e Devagar: Duas Formas de Pensar',129,NULL,8,'capa_livro_172.jpg','2026-10-07 20:20:21.492030','OPEN_LIBRARY','ENCONTRADA'),(173,1933,'9788526008694',6,'Casa-Grande e Senzala',130,NULL,6,'capa_livro_173.jpg','2026-10-07 20:20:24.777262','OPEN_LIBRARY','ENCONTRADA'),(174,1960,'9788508171279',7,'Quarto de Despejo: Diario de uma Favelada',131,NULL,7,'capa_livro_174.jpg','2026-10-07 20:20:27.146274','OPEN_LIBRARY','ENCONTRADA'),(175,1936,'9788535927610',7,'Raizes do Brasil',132,NULL,7,NULL,'2026-10-07 21:03:06.052179',NULL,'SEM_CAPA'),(176,1985,'9788597010121',10,'Fundamentos de Metodologia Cientifica',133,NULL,10,NULL,'2026-10-07 21:03:08.031274',NULL,'SEM_CAPA'),(177,1994,'9788535931938',3,'Palido Ponto Azul',15,NULL,3,'capa_livro_177.jpg','2026-10-07 20:20:34.867400','OPEN_LIBRARY','ENCONTRADA'),(178,2006,'9788535911329',7,'Variedades da Experiencia Cientifica',15,NULL,7,'capa_livro_178.jpg','2026-10-07 20:20:36.832464','OPEN_LIBRARY','ENCONTRADA'),(179,2001,'9788580578881',3,'O Universo numa Casca de Noz',126,NULL,3,'capa_livro_179.jpg','2026-10-07 20:20:38.844508','OPEN_LIBRARY','ENCONTRADA'),(180,1946,'9788523308865',10,'Em Busca de Sentido',13,NULL,10,NULL,'2026-10-07 21:03:10.009761',NULL,'SEM_CAPA'),(181,1865,'9788525406835',10,'Iracema',134,NULL,10,NULL,'2026-10-07 21:03:14.896169',NULL,'SEM_CAPA'),(182,1890,'9788572323604',6,'O Cortico',135,NULL,6,'capa_livro_182.jpg','2026-10-07 20:20:45.061096','OPEN_LIBRARY','ENCONTRADA'),(183,1532,'9788563560032',6,'O Principe',136,NULL,6,'capa_livro_183.jpg','2026-10-07 20:20:46.883068','OPEN_LIBRARY','ENCONTRADA');
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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-08  0:26:14
