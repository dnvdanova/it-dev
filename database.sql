-- phpMyAdmin SQL Dump
-- Database: `it_support_kb`

CREATE DATABASE IF NOT EXISTS `it_support_kb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `it_support_kb`;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
-- Default admin: admin / admin123
-- Password hash generated using password_hash('admin123', PASSWORD_DEFAULT)
--

INSERT INTO `admins` (`username`, `password`) VALUES
('admin', '$2y$10$X8C52y.g9dK/YJ4X1.01ue71a5a8qL7.eJ4aL4a0/5X8X8X8X8X8X'); -- Note: replace with real hash if login implemented on backend, using frontend check for now to keep it simple

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `color_hex` varchar(7) DEFAULT '#3b82f6',
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `slug`, `name`, `color_hex`) VALUES
(1, 'konektivitas', 'Konektivitas', '#0ea5e9'),
(2, 'perangkat-keras', 'Perangkat Keras', '#f59e0b'),
(3, 'akun-akses', 'Akun & Akses', '#10b981'),
(4, 'software', 'Software', '#8b5cf6');

-- --------------------------------------------------------

--
-- Table structure for table `articles`
--

CREATE TABLE `articles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `symptoms` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `fk_article_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `article_steps`
--

CREATE TABLE `article_steps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `article_id` int(11) NOT NULL,
  `step_order` int(11) NOT NULL,
  `step_text` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `article_id` (`article_id`),
  CONSTRAINT `fk_step_article` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `article_tags`
--

CREATE TABLE `article_tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `article_id` int(11) NOT NULL,
  `tag_name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `article_id` (`article_id`),
  CONSTRAINT `fk_tag_article` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `device_info` varchar(150) NOT NULL,
  `issue` text NOT NULL,
  `status` enum('Masuk','Proses','Selesai','Batal') DEFAULT 'Masuk',
  `created_at` datetime DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `receipts`
-- Kwitansi pembayaran yang terhubung dengan tiket servis
--

CREATE TABLE `receipts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `receipt_number` varchar(50) NOT NULL,
  `received_from` varchar(100) NOT NULL,
  `amount` decimal(12,0) NOT NULL,
  `amount_in_words` varchar(255) NOT NULL,
  `payment_for` text NOT NULL,
  `receipt_date` date NOT NULL,
  `location` varchar(100) DEFAULT 'Samarinda',
  `cashier_name` varchar(100) DEFAULT 'Defry Danovant',
  `warranty_days` int(11) DEFAULT 30,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `ticket_id` (`ticket_id`),
  CONSTRAINT `fk_receipt_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;
