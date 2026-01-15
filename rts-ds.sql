-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: rts_digitalsignage
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `contents`
--

DROP TABLE IF EXISTS `contents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `user_id` int NOT NULL,
  `type` enum('image','video','text') NOT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `size` int DEFAULT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `duration_sec` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `contents_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contents_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contents`
--

LOCK TABLES `contents` WRITE;
/*!40000 ALTER TABLE `contents` DISABLE KEYS */;
INSERT INTO `contents` VALUES (2,1,3,'video','testdigitalsignage.mp4','/uploads/testdigitalsignage.mp4',4407950,'2025-07-30 08:05:54',NULL),(3,1,1,'text','welcome_message.html',NULL,500,'2025-08-05 02:50:57',NULL),(5,1,3,'video','tes123.mp4','/uploads/tes123.mp4',17839845,'2025-08-05 08:29:05',NULL),(6,1,3,'video','37443-414024648.mp4','/uploads/37443-414024648.mp4',54116853,'2025-08-05 08:29:12',NULL),(7,1,3,'image','gojek.png','/uploads/gojek.png',1448067,'2025-08-05 15:02:38',NULL),(8,1,3,'image','promo kuliner.jpg','/uploads/promo kuliner.jpg',723370,'2025-08-06 04:39:24',NULL),(10,1,3,'image','gojekgocar.jpg','/uploads/gojekgocar.jpg',97492,'2025-08-06 04:41:03',NULL);
/*!40000 ALTER TABLE `contents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `device_playlists`
--

DROP TABLE IF EXISTS `device_playlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `device_playlists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `device_id` int NOT NULL,
  `playlist_id` int NOT NULL,
  `assigned_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `device_id` (`device_id`),
  KEY `playlist_id` (`playlist_id`),
  CONSTRAINT `device_playlists_ibfk_1` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `device_playlists_ibfk_2` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `device_playlists`
--

LOCK TABLES `device_playlists` WRITE;
/*!40000 ALTER TABLE `device_playlists` DISABLE KEYS */;
INSERT INTO `device_playlists` VALUES (30,15,1,'2025-08-13 07:23:39'),(39,16,1,'2026-01-13 03:39:55');
/*!40000 ALTER TABLE `device_playlists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devices`
--

DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `token` varchar(100) NOT NULL,
  `status` enum('active','inactive','online','offline','suspended') DEFAULT 'inactive',
  `last_seen` datetime DEFAULT NULL,
  `registered_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `device_type` enum('tv','display','tablet') DEFAULT 'tv',
  `location` varchar(255) DEFAULT 'Not specified',
  `resolution` varchar(255) DEFAULT '1920x1080',
  `updated_at` datetime DEFAULT NULL,
  `device_id` varchar(255) DEFAULT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `license_key` varchar(255) DEFAULT NULL,
  `last_heartbeat` datetime DEFAULT NULL,
  `player_info` text,
  `package_id` int DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `layout_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  UNIQUE KEY `device_id` (`device_id`),
  UNIQUE KEY `license_key` (`license_key`),
  KEY `tenant_id` (`tenant_id`),
  KEY `devices_layout_id` (`layout_id`),
  CONSTRAINT `devices_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `devices_layout_id_foreign_idx` FOREIGN KEY (`layout_id`) REFERENCES `layouts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devices`
--

LOCK TABLES `devices` WRITE;
/*!40000 ALTER TABLE `devices` DISABLE KEYS */;
INSERT INTO `devices` VALUES (15,1,'TV Lobby','TV001','offline',NULL,'2025-08-10 07:45:18','tablet','Lantai 1','1920x1080','2025-08-10 07:45:18','TABLET001','TV Lobby','TABLET001-L4WSH7HH5',NULL,NULL,10,'2026-08-10 07:45:18',NULL),(16,1,'TV TES','TV0034','online',NULL,'2026-01-12 12:28:12','tv','Lantai 1','1920x1080','2026-01-13 03:40:58','TV001','TV TES','TV001-HXCS2BX6S','2026-01-13 03:40:58','{\"sessionId\":\"session_1768274499390_ie557aqyg\",\"lastAccess\":\"2026-01-13T03:40:58.102Z\",\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0\",\"ip\":\"::1\",\"connectedAt\":\"2026-01-13T03:40:58.103Z\"}',11,'2027-01-12 12:28:12',NULL);
/*!40000 ALTER TABLE `devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `layout_zones`
--

DROP TABLE IF EXISTS `layout_zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `layout_zones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `layout_id` int NOT NULL,
  `zone_name` varchar(255) NOT NULL,
  `position` json NOT NULL,
  `content_type` enum('video','image','text','webpage','playlist','ticker','clock','weather','qr_code','logo') NOT NULL,
  `content_id` int DEFAULT NULL,
  `playlist_id` int DEFAULT NULL,
  `settings` json NOT NULL,
  `z_index` int DEFAULT '1',
  `is_visible` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `display_id` int DEFAULT '1' COMMENT 'Display ID for multi-display layouts',
  PRIMARY KEY (`id`),
  KEY `content_id` (`content_id`),
  KEY `playlist_id` (`playlist_id`),
  KEY `layout_zones_layout_id` (`layout_id`),
  KEY `layout_zones_content_type` (`content_type`),
  CONSTRAINT `layout_zones_ibfk_1` FOREIGN KEY (`layout_id`) REFERENCES `layouts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `layout_zones_ibfk_2` FOREIGN KEY (`content_id`) REFERENCES `contents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `layout_zones_ibfk_3` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `layout_zones`
--

LOCK TABLES `layout_zones` WRITE;
/*!40000 ALTER TABLE `layout_zones` DISABLE KEYS */;
INSERT INTO `layout_zones` VALUES (5,4,'Top Left','{\"x\": 0, \"y\": 0, \"width\": 50, \"height\": 50}','video',NULL,NULL,'{\"autoplay\": true}',1,1,'2025-08-06 13:36:12','2025-08-06 13:36:12',1),(6,4,'Top Right','{\"x\": 50, \"y\": 0, \"width\": 50, \"height\": 50}','image',NULL,NULL,'{\"autoplay\": true}',1,1,'2025-08-06 13:36:12','2025-08-06 13:36:12',1),(7,4,'Bottom Left','{\"x\": 0, \"y\": 50, \"width\": 50, \"height\": 50}','text',NULL,NULL,'{\"autoplay\": true}',1,1,'2025-08-06 13:36:12','2025-08-06 13:36:12',1),(8,4,'Bottom Right','{\"x\": 50, \"y\": 50, \"width\": 50, \"height\": 50}','clock',NULL,NULL,'{\"autoplay\": true}',1,1,'2025-08-06 13:36:12','2025-08-06 13:36:12',1),(9,5,'Main Content','{\"x\": 0, \"y\": 0, \"width\": 70, \"height\": 70}','video',NULL,NULL,'{\"autoplay\": true}',1,1,'2025-08-06 13:36:12','2025-08-06 13:36:12',1),(10,5,'Side Panel','{\"x\": 70, \"y\": 0, \"width\": 30, \"height\": 100}','ticker',NULL,NULL,'{\"scrollSpeed\": \"medium\"}',1,1,'2025-08-06 13:36:12','2025-08-06 13:36:12',1),(11,5,'Bottom Bar','{\"x\": 0, \"y\": 70, \"width\": 70, \"height\": 30}','clock',NULL,NULL,'{\"format\": \"24h\", \"showDate\": true}',1,1,'2025-08-06 13:36:12','2025-08-06 13:36:12',1),(12,6,'Carousel Zone','{\"x\": 0, \"y\": 0, \"width\": 75, \"height\": 100}','playlist',NULL,NULL,'{\"autoplay\": true, \"interval\": 5000, \"transition\": \"slide\"}',1,1,'2025-08-06 13:36:12','2025-08-06 13:36:12',1),(13,6,'Info Sidebar','{\"x\": 75, \"y\": 0, \"width\": 25, \"height\": 100}','weather',NULL,NULL,'{\"showForecast\": true, \"updateInterval\": 300000}',1,1,'2025-08-06 13:36:12','2025-08-06 13:36:12',1),(14,7,'Webpage Zone','{\"x\": 0, \"y\": 0, \"width\": 100, \"height\": 85}','qr_code',NULL,NULL,'{\"size\": 180, \"text\": \"https://www.instagram.com/rtssignage\", \"color\": \"#1a1a1a\", \"opacity\": 1, \"background\": \"#ffffff\"}',1,1,'2025-08-06 13:36:12','2025-08-09 07:20:40',1),(15,7,'Ticker Overlay','{\"x\": 0, \"y\": 85, \"width\": 100, \"height\": 15}','ticker',NULL,NULL,'{\"background\": \"rgba(0,0,0,0.8)\", \"scrollSpeed\": \"slow\"}',2,1,'2025-08-06 13:36:12','2025-08-06 13:36:12',1),(101,2,'Left Zone','{\"x\": 0, \"y\": 0, \"width\": 50, \"height\": 100}','video',2,NULL,'{\"autoplay\": true, \"content_id\": 2, \"playlist_id\": null}',1,1,'2025-08-07 07:10:38','2025-08-07 07:10:38',1),(102,2,'Right Zone','{\"x\": 49.98497788477015, \"y\": 0, \"width\": 50.01502211522985, \"height\": 100}','image',NULL,NULL,'{\"autoplay\": true, \"duration\": 5, \"content_id\": null, \"playlist_id\": null, \"content_list\": [10, 8], \"content_duration\": 10, \"multiple_content\": true}',1,1,'2025-08-07 07:10:38','2025-08-07 07:10:38',1),(110,3,'Top Zone','{\"x\": 0.000000000000003580469254416131, \"y\": 92.6243945398503, \"width\": 100, \"height\": 7.375605460149693}','text',2,NULL,'{\"autoplay\": true, \"content_id\": 2, \"text_color\": \"#ca4949\", \"playlist_id\": null, \"running_text\": true, \"text_content\": \"tesssttiiiinnnggggg\", \"running_speed\": 15, \"background_color\": \"#fef734\"}',1,1,'2025-08-07 08:19:21','2025-08-07 08:19:21',1),(111,3,'zone_3','{\"x\": 71.4398910365281, \"y\": 63.836779038006384, \"unit\": \"percentage\", \"width\": 27.926023458542872, \"height\": 28.102157639806265}','clock',NULL,NULL,'{\"format\": \"HH:mm:ss\", \"timezone\": \"Asia/Jakarta\", \"show_date\": true, \"clock_style\": \"modern\", \"time_format\": \"24h\", \"show_seconds\": true}',3,1,'2025-08-07 08:19:21','2025-08-07 08:19:21',1),(112,3,'zone_2','{\"x\": 0.10567990964217078, \"y\": 0.07632108996586501, \"unit\": \"percentage\", \"width\": 70.76618388021274, \"height\": 93.2716864817261}','playlist',NULL,6,'{\"loop\": true, \"autoplay\": true, \"transition\": \"fade\", \"playlist_id\": 6}',2,1,'2025-08-07 08:19:21','2025-08-07 08:19:21',1),(113,3,'zone_4','{\"x\": 75.20475217933596, \"y\": 20.273007485689124, \"unit\": \"percentage\", \"width\": 20, \"height\": 20}','playlist',NULL,6,'{\"loop\": true, \"autoplay\": true, \"transition\": \"fade\", \"playlist_id\": 6}',4,1,'2025-08-07 08:19:21','2025-08-07 08:19:21',1),(154,11,'zone_1','{\"x\": 0, \"y\": 8.881784197001252e-16, \"unit\": \"percentage\", \"width\": 51.902244420635085, \"height\": 99.8062527520916}','webpage',NULL,NULL,'{\"url\": \"https://www.msn.com/id-id/berita/other/byd-atto-3-disambar-petir-tiga-kali-saat-dikendarai-begini-nasib-penumpang-dan-mobilnya/ar-AA1K9kGf?ocid=msedgntp&pc=LCTS&cvid=6e8d9eaa45674439b391a91be3cbfb8e&ei=10\", \"zoom\": 1, \"background\": \"#ffffff\", \"content_id\": null, \"playlist_id\": null, \"refresh_interval\": 60000}',1,1,'2025-08-10 07:26:49','2025-08-10 07:26:49',1),(155,11,'zone_2','{\"x\": 51.82298297663446, \"y\": 0, \"unit\": \"percentage\", \"width\": 48.17701702336554, \"height\": 44.30647291941876}','image',NULL,NULL,'{\"scale\": \"cover\", \"duration\": 10, \"content_id\": null, \"playlist_id\": null, \"content_list\": [7, 8, 10], \"multiple_content\": true}',2,1,'2025-08-10 07:26:49','2025-08-10 07:26:49',1),(156,11,'zone_3','{\"x\": 52.2192841495616, \"y\": 44.10978652369551, \"unit\": \"percentage\", \"width\": 47.38441467751127, \"height\": 21.761338617349185}','text',NULL,NULL,'{\"color\": \"#000000\", \"font_size\": 24, \"background\": \"#ffffff\", \"content_id\": null, \"playlist_id\": null, \"text_content\": \"tessss\"}',3,1,'2025-08-10 07:26:49','2025-08-10 07:26:49',1),(157,11,'zone_4','{\"x\": 52.21928414956159, \"y\": 66.6549208257651, \"unit\": \"percentage\", \"width\": 28.560108963471905, \"height\": 33.3450791742349}','logo',8,NULL,'{\"scale\": \"contain\", \"opacity\": 1, \"max_width\": \"80%\", \"background\": \"transparent\", \"content_id\": 8, \"max_height\": \"80%\", \"playlist_id\": null}',4,1,'2025-08-10 07:26:49','2025-08-10 07:26:49',1),(158,11,'zone_5','{\"x\": 80, \"y\": 65.83295922088287, \"unit\": \"percentage\", \"width\": 20, \"height\": 34.0907089387935}','clock',NULL,NULL,'{\"format\": \"HH:mm:ss\", \"timezone\": \"Asia/Jakarta\", \"show_date\": true, \"clock_style\": \"modern\", \"time_format\": \"24h\", \"show_seconds\": true}',5,1,'2025-08-10 07:26:49','2025-08-10 07:26:49',1),(159,12,'main','{\"x\": 0, \"y\": 0, \"unit\": \"percentage\", \"width\": 100, \"height\": 75}','video',NULL,NULL,'{\"loop\": true, \"autoplay\": true}',1,1,'2025-08-11 04:51:32','2025-08-11 04:51:32',1),(160,12,'bottom_ticker','{\"x\": 0, \"y\": 75, \"unit\": \"percentage\", \"width\": 100, \"height\": 25}','ticker',NULL,NULL,'{\"font_size\": \"24px\", \"scroll_speed\": 3}',1,1,'2025-08-11 04:51:32','2025-08-11 04:51:32',1);
/*!40000 ALTER TABLE `layout_zones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `layouts`
--

DROP TABLE IF EXISTS `layouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `layouts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `type` enum('split_vertical','split_horizontal','multi_zone','l_shape','carousel','webpage_embed','custom','picture_in_picture') NOT NULL,
  `configuration` json NOT NULL,
  `preview_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `layouts_tenant_id` (`tenant_id`),
  KEY `layouts_type` (`type`),
  CONSTRAINT `layouts_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `layouts_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `layouts`
--

LOCK TABLES `layouts` WRITE;
/*!40000 ALTER TABLE `layouts` DISABLE KEYS */;
INSERT INTO `layouts` VALUES (1,1,'Split Screen Vertical','Two vertical zones side by side','split_vertical','{\"zones\": 2, \"template\": \"split_vertical\", \"orientation\": \"vertical\"}',NULL,1,1,'2025-08-06 13:34:33','2025-08-06 13:34:33'),(2,1,'Split Screen Vertical','Two vertical zones side by side','split_vertical','{\"zones\": [{\"id\": 99, \"content\": {\"id\": 2, \"url\": \"/uploads/testdigitalsignage.mp4\", \"size\": 4407950, \"type\": \"video\", \"user_id\": 3, \"filename\": \"testdigitalsignage.mp4\", \"tenant_id\": 1, \"uploaded_at\": \"2025-07-30T08:05:54.000Z\", \"duration_sec\": null}, \"z_index\": 1, \"playlist\": null, \"position\": {\"x\": 0, \"y\": 0, \"width\": 50, \"height\": 100}, \"settings\": {\"autoplay\": true, \"content_id\": 2, \"playlist_id\": null}, \"layout_id\": 2, \"zone_name\": \"Left Zone\", \"content_id\": 2, \"created_at\": \"2025-08-07T07:09:18.000Z\", \"display_id\": 1, \"is_visible\": true, \"updated_at\": \"2025-08-07T07:09:18.000Z\", \"playlist_id\": null, \"content_type\": \"video\"}, {\"id\": 100, \"content\": null, \"z_index\": 1, \"playlist\": null, \"position\": {\"x\": 49.98497788477015, \"y\": 0, \"width\": 50.01502211522985, \"height\": 100}, \"settings\": {\"autoplay\": true, \"duration\": 5, \"content_id\": null, \"playlist_id\": null, \"content_list\": [10, 8], \"content_duration\": 10, \"multiple_content\": true}, \"layout_id\": 2, \"zone_name\": \"Right Zone\", \"content_id\": null, \"created_at\": \"2025-08-07T07:09:18.000Z\", \"display_id\": 1, \"is_visible\": true, \"updated_at\": \"2025-08-07T07:09:18.000Z\", \"playlist_id\": null, \"content_type\": \"image\"}], \"displays\": [{\"id\": 1, \"name\": \"Display 1\", \"primary\": true, \"orientation\": \"landscape\"}]}',NULL,1,1,'2025-08-06 13:36:12','2025-08-07 07:10:38'),(3,1,'Split Screen Horizontal','Two horizontal zones stacked','split_horizontal','{\"zones\": [{\"id\": 106, \"content\": {\"id\": 2, \"url\": \"/uploads/testdigitalsignage.mp4\", \"size\": 4407950, \"type\": \"video\", \"user_id\": 3, \"filename\": \"testdigitalsignage.mp4\", \"tenant_id\": 1, \"uploaded_at\": \"2025-07-30T08:05:54.000Z\", \"duration_sec\": null}, \"z_index\": 1, \"playlist\": null, \"position\": {\"x\": 0.000000000000003580469254416131, \"y\": 92.6243945398503, \"width\": 100, \"height\": 7.375605460149693}, \"settings\": {\"autoplay\": true, \"content_id\": 2, \"text_color\": \"#ca4949\", \"playlist_id\": null, \"running_text\": true, \"text_content\": \"tesssttiiiinnnggggg\", \"running_speed\": 15, \"background_color\": \"#fef734\"}, \"layout_id\": 3, \"zone_name\": \"Top Zone\", \"content_id\": 2, \"created_at\": \"2025-08-07T08:14:31.000Z\", \"display_id\": 1, \"is_visible\": true, \"updated_at\": \"2025-08-07T08:14:31.000Z\", \"playlist_id\": null, \"content_type\": \"text\"}, {\"id\": 107, \"content\": null, \"z_index\": 3, \"playlist\": null, \"position\": {\"x\": 71.4398910365281, \"y\": 63.836779038006384, \"unit\": \"percentage\", \"width\": 27.926023458542872, \"height\": 28.102157639806265}, \"settings\": {\"format\": \"HH:mm:ss\", \"timezone\": \"Asia/Jakarta\", \"show_date\": true, \"clock_style\": \"modern\", \"time_format\": \"24h\", \"show_seconds\": true}, \"layout_id\": 3, \"zone_name\": \"zone_3\", \"content_id\": null, \"created_at\": \"2025-08-07T08:14:31.000Z\", \"display_id\": 1, \"is_visible\": true, \"updated_at\": \"2025-08-07T08:14:31.000Z\", \"playlist_id\": null, \"content_type\": \"clock\"}, {\"id\": 108, \"content\": null, \"z_index\": 2, \"playlist\": {\"id\": 6, \"name\": \"Sampletest\", \"items\": [{\"id\": 9, \"order\": 1, \"content\": {\"id\": 8, \"url\": \"/uploads/promo kuliner.jpg\", \"size\": 723370, \"type\": \"image\", \"user_id\": 3, \"filename\": \"promo kuliner.jpg\", \"tenant_id\": 1, \"uploaded_at\": \"2025-08-06T04:39:24.000Z\", \"duration_sec\": null}, \"content_id\": 8, \"transition\": \"zoom\", \"orientation\": \"landscape\", \"playlist_id\": 6, \"duration_sec\": 5}, {\"id\": 8, \"order\": 2, \"content\": {\"id\": 7, \"url\": \"/uploads/gojek.png\", \"size\": 1448067, \"type\": \"image\", \"user_id\": 3, \"filename\": \"gojek.png\", \"tenant_id\": 1, \"uploaded_at\": \"2025-08-05T15:02:38.000Z\", \"duration_sec\": null}, \"content_id\": 7, \"transition\": \"fade\", \"orientation\": \"landscape\", \"playlist_id\": 6, \"duration_sec\": 5}, {\"id\": 11, \"order\": 3, \"content\": {\"id\": 10, \"url\": \"/uploads/gojekgocar.jpg\", \"size\": 97492, \"type\": \"image\", \"user_id\": 3, \"filename\": \"gojekgocar.jpg\", \"tenant_id\": 1, \"uploaded_at\": \"2025-08-06T04:41:03.000Z\", \"duration_sec\": null}, \"content_id\": 10, \"transition\": \"slide\", \"orientation\": \"landscape\", \"playlist_id\": 6, \"duration_sec\": 5}, {\"id\": 6, \"order\": 4, \"content\": {\"id\": 5, \"url\": \"/uploads/tes123.mp4\", \"size\": 17839845, \"type\": \"video\", \"user_id\": 3, \"filename\": \"tes123.mp4\", \"tenant_id\": 1, \"uploaded_at\": \"2025-08-05T08:29:05.000Z\", \"duration_sec\": null}, \"content_id\": 5, \"transition\": \"zoom\", \"orientation\": \"landscape\", \"playlist_id\": 6, \"duration_sec\": 5}, {\"id\": 7, \"order\": 5, \"content\": {\"id\": 6, \"url\": \"/uploads/37443-414024648.mp4\", \"size\": 54116853, \"type\": \"video\", \"user_id\": 3, \"filename\": \"37443-414024648.mp4\", \"tenant_id\": 1, \"uploaded_at\": \"2025-08-05T08:29:12.000Z\", \"duration_sec\": null}, \"content_id\": 6, \"transition\": \"fade\", \"orientation\": \"landscape\", \"playlist_id\": 6, \"duration_sec\": 5}], \"status\": \"active\", \"layout_id\": 3, \"tenant_id\": 1, \"created_at\": \"2025-08-05T08:28:54.000Z\", \"created_by\": 3}, \"position\": {\"x\": 0.10567990964217078, \"y\": 0.07632108996586501, \"unit\": \"percentage\", \"width\": 70.76618388021274, \"height\": 93.2716864817261}, \"settings\": {\"loop\": true, \"autoplay\": true, \"transition\": \"fade\", \"playlist_id\": 6}, \"layout_id\": 3, \"zone_name\": \"zone_2\", \"content_id\": null, \"created_at\": \"2025-08-07T08:14:31.000Z\", \"display_id\": 1, \"is_visible\": true, \"updated_at\": \"2025-08-07T08:14:31.000Z\", \"playlist_id\": 6, \"content_type\": \"playlist\"}, {\"id\": 1754554725027, \"z_index\": 4, \"position\": {\"x\": 75.20475217933596, \"y\": 20.273007485689124, \"unit\": \"percentage\", \"width\": 20, \"height\": 20}, \"settings\": {\"loop\": true, \"autoplay\": true, \"transition\": \"fade\", \"playlist_id\": 6}, \"zone_name\": \"zone_4\", \"display_id\": 1, \"is_visible\": true, \"playlist_id\": 6, \"content_type\": \"playlist\"}], \"displays\": [{\"id\": 1, \"name\": \"Display 1\", \"primary\": true, \"orientation\": \"landscape\"}]}',NULL,1,1,'2025-08-06 13:36:12','2025-08-07 08:19:21'),(4,1,'Multi-Zone Layout','Four zones in grid layout','multi_zone','{\"grid\": \"2x2\", \"zones\": 4, \"template\": \"multi_zone\"}',NULL,1,1,'2025-08-06 13:36:12','2025-08-06 13:36:12'),(5,1,'L-Shape Layout','L-shaped layout with main content and sidebar','l_shape','{\"shape\": \"L\", \"zones\": 3, \"template\": \"l_shape\"}',NULL,1,1,'2025-08-06 13:36:12','2025-08-06 13:36:12'),(6,1,'Carousel with Sidebar','Main carousel with information sidebar','carousel','{\"zones\": 2, \"template\": \"carousel\", \"hasCarousel\": true}',NULL,1,1,'2025-08-06 13:36:12','2025-08-06 13:36:12'),(7,1,'Webpage Embed Layout','Layout with embedded webpage and overlay','webpage_embed','{\"zones\": 2, \"template\": \"webpage_embed\", \"hasWebpage\": true}',NULL,1,1,'2025-08-06 13:36:12','2025-08-06 13:36:12'),(11,1,'testing','','custom','{\"zones\": [{\"id\": 149, \"content\": null, \"z_index\": 1, \"playlist\": null, \"position\": {\"x\": 0, \"y\": 8.881784197001252e-16, \"unit\": \"percentage\", \"width\": 51.902244420635085, \"height\": 99.8062527520916}, \"settings\": {\"url\": \"https://www.msn.com/id-id/berita/other/byd-atto-3-disambar-petir-tiga-kali-saat-dikendarai-begini-nasib-penumpang-dan-mobilnya/ar-AA1K9kGf?ocid=msedgntp&pc=LCTS&cvid=6e8d9eaa45674439b391a91be3cbfb8e&ei=10\", \"zoom\": 1, \"background\": \"#ffffff\", \"content_id\": null, \"playlist_id\": null, \"refresh_interval\": 60000}, \"layout_id\": 11, \"zone_name\": \"zone_1\", \"content_id\": null, \"created_at\": \"2025-08-10T07:07:39.000Z\", \"display_id\": 1, \"is_visible\": true, \"updated_at\": \"2025-08-10T07:07:39.000Z\", \"playlist_id\": null, \"content_type\": \"webpage\"}, {\"id\": 150, \"content\": null, \"z_index\": 2, \"playlist\": null, \"position\": {\"x\": 51.82298297663446, \"y\": 0, \"unit\": \"percentage\", \"width\": 48.17701702336554, \"height\": 44.30647291941876}, \"settings\": {\"scale\": \"cover\", \"duration\": 10, \"content_id\": null, \"playlist_id\": null, \"content_list\": [7, 8, 10], \"multiple_content\": true}, \"layout_id\": 11, \"zone_name\": \"zone_2\", \"content_id\": null, \"created_at\": \"2025-08-10T07:07:39.000Z\", \"display_id\": 1, \"is_visible\": true, \"updated_at\": \"2025-08-10T07:07:39.000Z\", \"playlist_id\": null, \"content_type\": \"image\"}, {\"id\": 151, \"content\": null, \"z_index\": 3, \"playlist\": null, \"position\": {\"x\": 52.2192841495616, \"y\": 44.10978652369551, \"unit\": \"percentage\", \"width\": 47.38441467751127, \"height\": 21.761338617349185}, \"settings\": {\"color\": \"#000000\", \"font_size\": 24, \"background\": \"#ffffff\", \"content_id\": null, \"playlist_id\": null, \"text_content\": \"tessss\"}, \"layout_id\": 11, \"zone_name\": \"zone_3\", \"content_id\": null, \"created_at\": \"2025-08-10T07:07:39.000Z\", \"display_id\": 1, \"is_visible\": true, \"updated_at\": \"2025-08-10T07:07:39.000Z\", \"playlist_id\": null, \"content_type\": \"text\"}, {\"id\": 152, \"content\": {\"id\": 8, \"url\": \"/uploads/promo kuliner.jpg\", \"size\": 723370, \"type\": \"image\", \"user_id\": 3, \"filename\": \"promo kuliner.jpg\", \"tenant_id\": 1, \"uploaded_at\": \"2025-08-06T04:39:24.000Z\", \"duration_sec\": null}, \"z_index\": 4, \"playlist\": null, \"position\": {\"x\": 52.21928414956159, \"y\": 66.6549208257651, \"unit\": \"percentage\", \"width\": 28.560108963471905, \"height\": 33.3450791742349}, \"settings\": {\"scale\": \"contain\", \"opacity\": 1, \"max_width\": \"80%\", \"background\": \"transparent\", \"content_id\": 8, \"max_height\": \"80%\", \"playlist_id\": null}, \"layout_id\": 11, \"zone_name\": \"zone_4\", \"content_id\": 8, \"created_at\": \"2025-08-10T07:07:39.000Z\", \"display_id\": 1, \"is_visible\": true, \"updated_at\": \"2025-08-10T07:07:39.000Z\", \"playlist_id\": null, \"content_type\": \"logo\"}, {\"id\": 153, \"content\": null, \"z_index\": 5, \"playlist\": null, \"position\": {\"x\": 80, \"y\": 65.83295922088287, \"unit\": \"percentage\", \"width\": 20, \"height\": 34.0907089387935}, \"settings\": {\"format\": \"HH:mm:ss\", \"timezone\": \"Asia/Jakarta\", \"show_date\": true, \"clock_style\": \"modern\", \"time_format\": \"24h\", \"show_seconds\": true}, \"layout_id\": 11, \"zone_name\": \"zone_5\", \"content_id\": null, \"created_at\": \"2025-08-10T07:07:39.000Z\", \"display_id\": 1, \"is_visible\": true, \"updated_at\": \"2025-08-10T07:07:39.000Z\", \"playlist_id\": null, \"content_type\": \"clock\"}], \"displays\": [{\"id\": 1, \"name\": \"Display 1\", \"primary\": true, \"orientation\": \"landscape\"}]}',NULL,1,3,'2025-08-07 08:39:04','2025-08-10 07:26:49'),(12,1,'Split Screen Horizontal - 8/11/2025','Layar dibagi atas-bawah','split_horizontal','{\"name\": \"Split Screen Horizontal\", \"zones\": [{\"position\": {\"x\": 0, \"y\": 0, \"unit\": \"percentage\", \"width\": 100, \"height\": 75}, \"settings\": {\"loop\": true, \"autoplay\": true}, \"zone_name\": \"main\", \"content_type\": \"video\"}, {\"position\": {\"x\": 0, \"y\": 75, \"unit\": \"percentage\", \"width\": 100, \"height\": 25}, \"settings\": {\"font_size\": \"24px\", \"scroll_speed\": 3}, \"zone_name\": \"bottom_ticker\", \"content_type\": \"ticker\"}], \"description\": \"Layar dibagi atas-bawah\"}',NULL,1,3,'2025-08-11 04:51:31','2025-08-11 04:51:31');
/*!40000 ALTER TABLE `layouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `packages`
--

DROP TABLE IF EXISTS `packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `max_devices` int NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `duration_month` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `storage_gb` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `packages`
--

LOCK TABLES `packages` WRITE;
/*!40000 ALTER TABLE `packages` DISABLE KEYS */;
INSERT INTO `packages` VALUES (10,'Starter',2,200000.00,1,1,1),(11,'Premium',4,350000.00,1,1,2),(12,'Business',8,600000.00,1,1,4),(13,'Custom',999,0.00,1,1,999);
/*!40000 ALTER TABLE `packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `package_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `status` enum('pending','paid','failed','expired','cancel') DEFAULT 'pending',
  `invoice_url` varchar(255) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `expired_at` datetime DEFAULT NULL,
  `payment_method` enum('bank_transfer','credit_card','e_wallet','manual','midtrans') DEFAULT 'manual',
  `invoice_number` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `midtrans_order_id` varchar(255) DEFAULT NULL,
  `midtrans_transaction_id` varchar(255) DEFAULT NULL,
  `midtrans_token` varchar(255) DEFAULT NULL,
  `midtrans_redirect_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  UNIQUE KEY `midtrans_order_id` (`midtrans_order_id`),
  KEY `tenant_id` (`tenant_id`),
  KEY `package_id` (`package_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (3,1,11,350000.00,'pending',NULL,NULL,'2025-08-11 07:27:56','midtrans','INV-2025-001','Payment for Premium package','2025-08-10 07:27:56','2025-08-10 07:27:57','ORDER-1754810876000-1',NULL,'6d8b3b8f-9b98-4cae-ad60-eda1bab1e2f4','https://app.sandbox.midtrans.com/snap/v4/redirection/6d8b3b8f-9b98-4cae-ad60-eda1bab1e2f4'),(4,1,11,350000.00,'pending',NULL,NULL,NULL,'manual',NULL,'Upgrade to Premium plan','2025-08-10 07:46:31','2025-08-10 07:46:31',NULL,NULL,NULL,NULL),(5,1,11,350000.00,'pending',NULL,NULL,NULL,'manual',NULL,'Upgrade to Premium plan','2025-08-10 07:54:38','2025-08-10 07:54:38',NULL,NULL,NULL,NULL),(6,1,11,350000.00,'pending',NULL,NULL,'2025-08-10 08:11:30','midtrans','INV-2025-004','Payment for Premium package','2025-08-10 08:01:30','2025-08-10 08:01:31','ORDER-1754812890865-1',NULL,'e81ff3b3-3054-40a4-bf3e-e43dfc466403','https://app.sandbox.midtrans.com/snap/v4/redirection/e81ff3b3-3054-40a4-bf3e-e43dfc466403'),(7,1,11,350000.00,'paid',NULL,'2025-08-10 08:11:02','2025-08-10 08:12:45','midtrans','INV-2025-005','Payment for Premium package','2025-08-10 08:02:45','2025-08-10 08:02:46','ORDER-1754812965654-1',NULL,'a3838a39-073e-4763-a217-f8e94955fab5','https://app.sandbox.midtrans.com/snap/v4/redirection/a3838a39-073e-4763-a217-f8e94955fab5');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player_stats`
--

DROP TABLE IF EXISTS `player_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_stats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `device_id` int NOT NULL,
  `content_id` int NOT NULL,
  `played_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `duration_sec` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  KEY `device_id` (`device_id`),
  KEY `content_id` (`content_id`),
  CONSTRAINT `player_stats_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_stats_ibfk_2` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_stats_ibfk_3` FOREIGN KEY (`content_id`) REFERENCES `contents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_stats`
--

LOCK TABLES `player_stats` WRITE;
/*!40000 ALTER TABLE `player_stats` DISABLE KEYS */;
/*!40000 ALTER TABLE `player_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `playlist_items`
--

DROP TABLE IF EXISTS `playlist_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playlist_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `playlist_id` int NOT NULL,
  `content_id` int NOT NULL,
  `order` int NOT NULL,
  `duration_sec` int DEFAULT NULL,
  `orientation` enum('landscape','portrait','auto') DEFAULT 'landscape',
  `transition` enum('fade','slide','zoom','none') DEFAULT 'fade',
  PRIMARY KEY (`id`),
  KEY `playlist_id` (`playlist_id`),
  KEY `content_id` (`content_id`),
  CONSTRAINT `playlist_items_ibfk_1` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `playlist_items_ibfk_2` FOREIGN KEY (`content_id`) REFERENCES `contents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `playlist_items`
--

LOCK TABLES `playlist_items` WRITE;
/*!40000 ALTER TABLE `playlist_items` DISABLE KEYS */;
INSERT INTO `playlist_items` VALUES (2,1,2,1,15,'landscape','fade'),(6,6,5,4,5,'landscape','zoom'),(7,6,6,5,5,'landscape','fade'),(8,6,7,2,5,'landscape','fade'),(9,6,8,1,5,'landscape','zoom'),(11,6,10,3,5,'landscape','slide'),(13,1,5,2,15,'landscape','fade'),(14,9,5,1,30,'landscape','fade'),(15,9,7,2,5,'landscape','fade');
/*!40000 ALTER TABLE `playlist_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `playlists`
--

DROP TABLE IF EXISTS `playlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playlists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `layout_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  KEY `created_by` (`created_by`),
  KEY `playlists_layout_id` (`layout_id`),
  CONSTRAINT `playlists_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `playlists_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `playlists_layout_id_foreign_idx` FOREIGN KEY (`layout_id`) REFERENCES `layouts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `playlists`
--

LOCK TABLES `playlists` WRITE;
/*!40000 ALTER TABLE `playlists` DISABLE KEYS */;
INSERT INTO `playlists` VALUES (1,1,'Promosi Weekend diskon',3,'2025-07-30 07:41:09','active',NULL),(6,1,'Sampletest',3,'2025-08-05 08:28:54','active',3),(8,1,'tes ile',3,'2026-01-12 12:33:40','active',12),(9,1,'tesss',3,'2026-01-12 12:46:53','active',2);
/*!40000 ALTER TABLE `playlists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedules`
--

DROP TABLE IF EXISTS `schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `playlist_id` int NOT NULL,
  `device_id` int NOT NULL,
  `day_of_week` varchar(20) DEFAULT NULL,
  `time_start` time DEFAULT NULL,
  `time_end` time DEFAULT NULL,
  `is_loop` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  KEY `playlist_id` (`playlist_id`),
  KEY `device_id` (`device_id`),
  CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schedules_ibfk_2` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schedules_ibfk_3` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedules`
--

LOCK TABLES `schedules` WRITE;
/*!40000 ALTER TABLE `schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sequelizemeta`
--

DROP TABLE IF EXISTS `sequelizemeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sequelizemeta` (
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sequelizemeta`
--

LOCK TABLES `sequelizemeta` WRITE;
/*!40000 ALTER TABLE `sequelizemeta` DISABLE KEYS */;
INSERT INTO `sequelizemeta` VALUES ('20250105000001-add-storage-to-packages.js'),('20250106000001-create-layout-system.js'),('20250107000001-add-layout-id-to-devices.js'),('20250108000001-add-display-id-to-layout-zones.js'),('20250110000001-add-midtrans-payment.js'),('20250729164648-add-email-to-tenant.js'),('20250730000001-add-playlist-item-features.js'),('20250730000001-update-devices-and-payments.js'),('20250730000002-update-devices-for-display.js'),('20250731044825-update-devices-for-display-v2.js'),('20250731090000-create-device-playlists.js'),('20250805000001-make-duration-nullable.js'),('20250805000002-add-duration-to-contents.js'),('20250806000001-add-status-to-playlists.js'),('20250806135511-add-layout-id-to-playlists.js');
/*!40000 ALTER TABLE `sequelizemeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `subdomain` varchar(100) NOT NULL,
  `status` enum('active','suspended','expired') DEFAULT 'active',
  `package_id` int DEFAULT NULL,
  `expired_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `email` varchar(255) NOT NULL DEFAULT '',
  `package_expires_at` datetime DEFAULT NULL,
  `custom_max_devices` int DEFAULT NULL COMMENT 'Custom device limit for custom packages',
  `custom_storage_gb` int DEFAULT NULL COMMENT 'Custom storage limit in GB for custom packages',
  `duration_months` int DEFAULT NULL COMMENT 'Duration in months for display purposes',
  PRIMARY KEY (`id`),
  UNIQUE KEY `subdomain` (`subdomain`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES (1,'Test Tenant','test-tenant','active',10,'2026-02-12 18:14:35','2025-07-29 16:34:24','central@rts.com','2025-09-09 08:11:02',NULL,NULL,1),(3,'Sambal Bakar','sambal-bakar','active',10,'2026-02-12 17:20:03','2025-07-29 16:58:41','sambak@gmail.com',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('super_admin','tenant_admin') NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `tenant_id` (`tenant_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,'Central Super Admin','central@rts.com','$2b$10$ae7TXBcq2woRI37h.HfpnO9LUbulXYpao9BbovmaIAFo49wun/4l2','super_admin',1,'2025-07-29 15:03:19'),(2,NULL,'Super Admin','admin@rts.com','$2b$10$XHejT900i.1gbe5OXhCB5.mN/lL2G0nWDCwIZrkzD4aZ2/N/3YAv6','super_admin',1,'2025-07-29 16:34:24'),(3,1,'Tenant Admin','tenant@rts.com','$2b$10$lrNQ8ZoJgpXWCPQJ3/I29euebKpYUHy4SqRyURdm8bG.f6glcEjKm','tenant_admin',1,'2025-07-29 16:34:24'),(4,1,'Tenant Admin','admin@test.com','$2b$10$A5/Zm.h0/z5y/vSxIl3hR.9GZX.NINqTyMp5vhWBr9nZ1T9osSdke','tenant_admin',1,'2025-07-31 08:12:16'),(5,1,'Dashboard Test User','test@dashboard.com','$2b$10$/jyeekmh7kkB7ME/caa.QOQQkm./dACSR7FHsAnn/q3PbK7W0AuXS','tenant_admin',1,'2025-08-14 07:42:02');
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

-- Dump completed on 2026-01-13 14:51:06
