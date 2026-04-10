-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: ration_shop
-- ------------------------------------------------------
-- Server version	8.0.45

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
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `ration_card_no` varchar(50) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `address` text,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `family_members` int DEFAULT '1',
  `avatar_color` varchar(20) DEFAULT '#302b63',
  `avatar_letter` varchar(5) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `language` varchar(20) DEFAULT 'english',
  `notifications` tinyint DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ration_card_no` (`ration_card_no`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'RAVI','RC-001234','900001234','HYDERABAD','$2b$10$yZTyP8OU5.K9XU.EINAIQ.suT/vgWtotkYhPpEIUCJ5VZ6ACCg4WG','2026-03-18 15:34:36',3,'#1565c0','RA','','english',1);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock`
--

DROP TABLE IF EXISTS `stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_name` varchar(100) NOT NULL,
  `total_quantity` decimal(10,2) NOT NULL,
  `distributed_quantity` decimal(10,2) DEFAULT '0.00',
  `unit` varchar(20) NOT NULL,
  `alert_threshold` decimal(10,2) DEFAULT '10.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `per_person_quota` decimal(10,2) DEFAULT '0.00',
  `current_cycle` int DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock`
--

LOCK TABLES `stock` WRITE;
/*!40000 ALTER TABLE `stock` DISABLE KEYS */;
INSERT INTO `stock` VALUES (1,'rice',500.00,425.00,'kg',50.00,'2026-03-18 14:41:07','2026-03-27 15:11:09',0.00,1),(2,'wheat',300.00,270.00,'kg',30.00,'2026-03-18 14:41:24','2026-03-21 08:22:19',0.00,1),(3,'sugar',300.00,150.00,'kg',20.00,'2026-03-18 14:41:37','2026-04-08 17:26:02',0.00,1),(5,'salt',100.00,1.50,'packet',20.00,'2026-03-21 10:25:22','2026-03-21 10:25:57',0.50,1);
/*!40000 ALTER TABLE `stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stock_id` int NOT NULL,
  `beneficiary_name` varchar(100) NOT NULL,
  `ration_card_no` varchar(50) NOT NULL,
  `quantity_issued` decimal(10,2) NOT NULL,
  `issued_by` int NOT NULL,
  `issued_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `cycle_id` int DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `issued_by` (`issued_by`),
  KEY `transactions_ibfk_1` (`stock_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`stock_id`) REFERENCES `stock` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,3,'Ravi Kumar','RC-001234',5.00,1,'2026-03-18 14:42:22',1),(2,2,'Ravi kumar','RC-001234',150.00,1,'2026-03-21 06:34:38',1),(3,3,'Ravi kumar','RC-001234',90.00,1,'2026-03-21 06:36:05',1),(4,2,'Ravi kumar','RC-001234',90.00,1,'2026-03-21 08:21:17',1),(5,2,'Ravi kumar','RC-001234',30.00,1,'2026-03-21 08:22:19',1),(6,3,'Ravi kumar','RC-001234',45.00,1,'2026-03-21 08:43:05',1),(7,1,'Ravi kumar','RC-001234',25.00,1,'2026-03-21 09:52:05',1),(8,5,'Ravi kumar','RC-001234',1.50,1,'2026-03-21 10:25:57',1),(9,1,'ravi kumar','RC-001234',400.00,1,'2026-03-27 15:11:09',1),(10,3,'ravi kumar','RC-001234',10.00,1,'2026-04-08 17:26:02',1);
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','shopkeeper') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `theme` varchar(20) DEFAULT 'light',
  `language` varchar(20) DEFAULT 'english',
  `notifications` tinyint DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin User','admin','$2b$10$MUWmmJhDFGUj68HgaR21fOGLDzrn5HA0FM1ns8PP/TCP2L6wg//be','admin','2026-03-18 14:08:38',NULL,NULL,'light','english',1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-10  1:26:06
