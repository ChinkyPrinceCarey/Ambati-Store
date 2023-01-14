
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(16) NOT NULL,
  `password` varchar(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `mobile_number` varchar(10) NOT NULL,
  `address` text NOT NULL,
  `is_allowed` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `mobile_number` (`mobile_number`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `items` (
  `id` int(3) NOT NULL AUTO_INCREMENT,
  `datetime` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `material` varchar(15) NOT NULL,
  `item` varchar(25) NOT NULL,
  `shortcode` varchar(5) NOT NULL,
  `unit` varchar(15) NOT NULL,
  `type` varchar(15) NOT NULL,
  `counting` varchar(50) DEFAULT NULL,
  `sub_name` varchar(50) DEFAULT NULL,
  `company_name` varchar(50) DEFAULT NULL,
  `flavour` varchar(50) DEFAULT NULL,
  `denomination` varchar(5) DEFAULT NULL,
  `actual_cost` varchar(6) DEFAULT NULL,
  `cost` varchar(6) DEFAULT NULL,
  `level` varchar(15) DEFAULT NULL,
  `in_stock` tinyint(1) NOT NULL DEFAULT 0,
  `priority` varchar(12) DEFAULT 'default',
  `image` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' CHECK (json_valid(`image`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `item` (`item`),
  UNIQUE KEY `shortcode` (`shortcode`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `material`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `material` (
  `id` int(2) NOT NULL AUTO_INCREMENT,
  `material` varchar(15) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unit` (`material`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales` (
  `id` int(4) NOT NULL AUTO_INCREMENT,
  `date` timestamp NOT NULL DEFAULT current_timestamp(),
  `invoice_id` float NOT NULL,
  `sale_type` varchar(15) NOT NULL,
  `seller_id` varchar(4) DEFAULT NULL,
  `seller_name` varchar(16) DEFAULT NULL,
  `custom_id` varchar(10) DEFAULT NULL,
  `custom_name` varchar(16) DEFAULT NULL,
  `customer_name` varchar(16) DEFAULT NULL,
  `customer_village` varchar(16) DEFAULT NULL,
  `customer_details` varchar(20) DEFAULT NULL,
  `vehicle_id` varchar(15) DEFAULT NULL,
  `vehicle_name` varchar(25) DEFAULT NULL,
  `no_of_items` int(3) NOT NULL,
  `no_of_units` int(4) NOT NULL,
  `making_cost` int(6) NOT NULL,
  `sub_total` int(6) NOT NULL,
  `total_price` int(6) NOT NULL,
  `offer_percentage` int(2) DEFAULT 0,
  `offer_amount` int(6) DEFAULT 0,
  `items_details` longtext NOT NULL CHECK (json_valid(`items_details`)),
  `is_updated` tinyint(1) NOT NULL DEFAULT 0,
  `is_finished` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_id` (`invoice_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1370 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sellers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sellers` (
  `id` int(3) NOT NULL AUTO_INCREMENT,
  `seller_id` varchar(4) NOT NULL,
  `seller_name` varchar(16) NOT NULL,
  `seller_mobile_number` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seller_id` (`seller_id`),
  UNIQUE KEY `seller_name` (`seller_name`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock` (
  `id` int(5) NOT NULL AUTO_INCREMENT,
  `generate_id` varchar(14) NOT NULL,
  `date` date NOT NULL DEFAULT current_timestamp(),
  `material` varchar(15) NOT NULL,
  `item` varchar(25) NOT NULL,
  `shortcode` varchar(5) NOT NULL,
  `type` varchar(15) NOT NULL,
  `unit` varchar(15) NOT NULL,
  `quantity` int(10) NOT NULL,
  `making_cost` varchar(6) NOT NULL,
  `retailer_cost` varchar(6) NOT NULL,
  `wholesale_cost` varchar(6) NOT NULL,
  `profit` varchar(6) NOT NULL DEFAULT '0',
  `item_number` int(5) NOT NULL,
  `barcode` varchar(30) NOT NULL,
  `custom_data` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `barcode` (`barcode`)
) ENGINE=InnoDB AUTO_INCREMENT=162235 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stock_deleted`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_deleted` (
  `id` int(5) NOT NULL AUTO_INCREMENT,
  `generate_id` varchar(14) NOT NULL,
  `date` date NOT NULL DEFAULT current_timestamp(),
  `material` varchar(15) NOT NULL,
  `item` varchar(25) NOT NULL,
  `shortcode` varchar(5) NOT NULL,
  `type` varchar(15) NOT NULL,
  `unit` varchar(15) NOT NULL,
  `quantity` int(10) NOT NULL,
  `making_cost` varchar(6) NOT NULL,
  `retailer_cost` varchar(6) NOT NULL,
  `wholesale_cost` varchar(6) NOT NULL,
  `profit` varchar(6) NOT NULL DEFAULT '0',
  `item_number` int(5) NOT NULL,
  `barcode` varchar(30) NOT NULL,
  `details` longtext NOT NULL DEFAULT '{}',
  `is_sold` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `barcode` (`barcode`)
) ENGINE=InnoDB AUTO_INCREMENT=82049 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stock_dump`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_dump` (
  `row_id` int(5) NOT NULL AUTO_INCREMENT,
  `row_date` date NOT NULL DEFAULT current_timestamp(),
  `id` int(5) NOT NULL,
  `generate_id` varchar(14) NOT NULL,
  `date` date NOT NULL,
  `material` varchar(15) NOT NULL,
  `item` varchar(25) NOT NULL,
  `shortcode` varchar(5) NOT NULL,
  `type` varchar(15) NOT NULL,
  `unit` varchar(15) NOT NULL,
  `quantity` int(10) NOT NULL,
  `making_cost` varchar(6) NOT NULL,
  `retailer_cost` varchar(6) NOT NULL,
  `wholesale_cost` varchar(6) NOT NULL,
  `profit` varchar(6) NOT NULL DEFAULT '0',
  `item_number` int(5) NOT NULL,
  `barcode` varchar(30) NOT NULL,
  `custom_data` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`row_id`),
  UNIQUE KEY `barcode` (`barcode`)
) ENGINE=InnoDB AUTO_INCREMENT=13808 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stock_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_history` (
  `id` int(5) NOT NULL AUTO_INCREMENT,
  `generate_id` varchar(14) NOT NULL,
  `date` date NOT NULL DEFAULT current_timestamp(),
  `material` varchar(15) NOT NULL,
  `item` varchar(25) NOT NULL,
  `shortcode` varchar(5) NOT NULL,
  `type` varchar(15) NOT NULL,
  `unit` varchar(15) NOT NULL,
  `quantity` int(10) NOT NULL,
  `making_cost` varchar(6) NOT NULL,
  `retailer_cost` varchar(6) NOT NULL,
  `wholesale_cost` varchar(6) NOT NULL,
  `profit` varchar(6) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=819 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stock_nouse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_nouse` (
  `row_id` int(5) NOT NULL AUTO_INCREMENT,
  `id` int(5) NOT NULL,
  `generate_id` varchar(14) NOT NULL,
  `date` date NOT NULL DEFAULT current_timestamp(),
  `material` varchar(15) NOT NULL,
  `item` varchar(25) NOT NULL,
  `shortcode` varchar(5) NOT NULL,
  `type` varchar(15) NOT NULL,
  `unit` varchar(15) NOT NULL,
  `quantity` int(10) NOT NULL,
  `making_cost` varchar(6) NOT NULL,
  `retailer_cost` varchar(6) NOT NULL,
  `wholesale_cost` varchar(6) NOT NULL,
  `profit` varchar(6) NOT NULL DEFAULT '0',
  `item_number` int(5) NOT NULL,
  `barcode` varchar(30) NOT NULL,
  `custom_data` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`row_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `types` (
  `id` int(2) NOT NULL AUTO_INCREMENT,
  `type` varchar(15) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unit` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `units` (
  `id` int(2) NOT NULL AUTO_INCREMENT,
  `unit` varchar(15) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unit` (`unit`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(2) NOT NULL AUTO_INCREMENT,
  `username` varchar(16) NOT NULL,
  `password` varchar(8) NOT NULL,
  `role` varchar(20) NOT NULL,
  `mobile_number` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `mobile_number` (`mobile_number`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vehicles` (
  `id` int(3) NOT NULL AUTO_INCREMENT,
  `vehicle_id` varchar(15) NOT NULL,
  `vehicle_name` varchar(25) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_id` (`vehicle_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

