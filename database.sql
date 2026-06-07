-- ==========================================
-- DREAM STORE - DATABASE SCHEMA DEFINITION
-- DBMS: MySQL / MariaDB (Native PHP Hosting)
-- ==========================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `blacklist`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `product_accounts`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `payment_methods`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `admin`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Table Admin
CREATE TABLE `admin` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table Users
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table Products
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `image_url` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table Payment Methods
CREATE TABLE `payment_methods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('qris', 'bank', 'ewallet') NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `account_name` VARCHAR(100) NOT NULL,
  `account_no` VARCHAR(100) NOT NULL,
  `qr_code_url` TEXT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Table Orders
CREATE TABLE `orders` (
  `id` VARCHAR(50) PRIMARY KEY,
  `user_email` VARCHAR(100) NOT NULL,
  `user_phone` VARCHAR(20) NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `payment_method_id` INT NOT NULL,
  `payment_method_name` VARCHAR(50) NOT NULL,
  `payment_amount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending', 'awaiting_payment', 'waiting_confirmation', 'processing', 'completed', 'failed', 'refund') DEFAULT 'pending',
  `payment_proof_url` TEXT NULL,
  `account_delivered` TEXT NULL,
  `remarks` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Table Product Accounts (Automated Digital Accounts Inventory)
CREATE TABLE `product_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `account_data` TEXT NOT NULL,
  `status` ENUM('available', 'sold') DEFAULT 'available',
  `sold_to_order_id` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `sold_at` TIMESTAMP NULL,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sold_to_order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Table Activity Logs
CREATE TABLE `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Table Blacklist
CREATE TABLE `blacklist` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `reason` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Table Notifications
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `target_role` ENUM('admin', 'user') NOT NULL,
  `user_email` VARCHAR(100) NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ==========================================
-- SEED INITIAL DATA
-- Username / Password Default Admin:
-- Username: denzz1212
-- Password: denzzoffc1288
-- Hashed using SHA-256 (e56a81ef230a1bf8c18bd24d26b9cc8c67c00dbfdd68c347b74f378a514d3b80)
-- ==========================================

INSERT INTO `admin` (`username`, `password_hash`) VALUES
('denzz1212', 'e56a81ef230a1bf8c18bd24d26b9cc8c67c00dbfdd68c347b74f378a514d3b80');

-- Seed Products
INSERT INTO `products` (`id`, `name`, `description`, `category`, `price`, `status`, `image_url`) VALUES
(1, 'Spotify Premium 1 Bulan (Sewa Premium)', 'Akun sewa premium Spotify 1 bulan penuh tanpa jeda iklan. Nikmati streaming audio berkualitas tinggi, download offline, dan skip tanpa batas.', 'Music', 15000.00, 'active', 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=500&q=80'),
(2, 'Netflix Premium 4K UHD 1 Bulan (Private Screen)', 'Nonton tayangan favoritmu di Netflix dengan resolusi Ultra HD 4K terbaik. Akun aman, login untuk 1 user di 1 screen.', 'Streaming', 35000.00, 'active', 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=500&q=80'),
(3, 'YouTube Premium 1 Bulan (Sewa Premium)', 'YouTube Bebas Iklan + YouTube Music Premium. Menonton di latar belakang atau luring sepuasnya tanpa gangguan iklan.', 'Streaming', 12000.00, 'active', 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&q=80'),
(4, 'Canva Pro Lifetime (Sewa Team)', 'Akses penuh ke semua template premium, font, elemen visual, background remover di Canva secara lifetime dengan bergabung di workspace team.', 'Design', 25000.00, 'active', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500&q=80');

-- Seed Payment Methods
INSERT INTO `payment_methods` (`id`, `type`, `name`, `account_name`, `account_no`, `qr_code_url`, `status`) VALUES
(1, 'qris', 'QRIS ALL PAYMENT', 'DREAM STORE DIGITAL', '00010203040506', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126570022ID.CO.QRIS.WWW011893600522000001188102151234567890123455204000053033605802ID5919DREAM STORE DIGITAL6007JAKARTA6304ED3C', 'active'),
(2, 'ewallet', 'DANA', 'DREAM STORE ADMIN', '081234567890', NULL, 'active'),
(3, 'bank', 'BCA (Bank Central Asia)', 'DREAM STORE DIGITAL', '8901234567', NULL, 'active'),
(4, 'ewallet', 'GOPAY', 'GOPAY DREAM STORE', '081234567890', NULL, 'active');

-- Seed digital accounts inventory
INSERT INTO `product_accounts` (`product_id`, `account_data`, `status`) VALUES
(1, 'premiumspotify1@gmail.com | pass: spotifypass123', 'available'),
(1, 'premiumspotify2@gmail.com | pass: spotifylove99', 'available'),
(1, 'premiumspotify3@gmail.com | pass: spotifymusic00', 'available'),
(2, 'netflixultra_user5@gmail.com | pass: netflix4kuhd', 'available'),
(2, 'netflixscreener_9@gmail.com | pass: bypassscreen99', 'available'),
(3, 'ytpremiumvip_12@gmail.com | pass: ytpassvip', 'available'),
(3, 'ytpremiumvip_13@gmail.com | pass: ytpassmusic', 'available'),
(4, 'canvahelper_team1@outlook.com | pass: canvapro99team', 'available');

-- Seed a sample completed order
INSERT INTO `orders` (`id`, `user_email`, `user_phone`, `product_id`, `product_name`, `price`, `payment_method_id`, `payment_method_name`, `payment_amount`, `status`, `payment_proof_url`, `account_delivered`, `remarks`) VALUES
('ORD-774092', 'pembeli@gmail.com', '085712345678', 1, 'Spotify Premium 1 Bulan (Sewa Premium)', 15000.00, 2, 'DANA', 15000.00, 'completed', 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&q=80', 'premiumspotify3@gmail.com | pass: spotifymusic00', 'Lunas terverifikasi otomatis.');

-- Track sold state for accounts
UPDATE `product_accounts` SET `status` = 'sold', `sold_to_order_id` = 'ORD-774092', `sold_at` = CURRENT_TIMESTAMP WHERE `account_data` = 'premiumspotify3@gmail.com | pass: spotifymusic00';

-- Seed sample log
INSERT INTO `activity_logs` (`action`, `details`) VALUES
('SYSTEM_INIT', 'Sistem Dream Store berhasil diinisialisasi pertama kali.'),
('PAYMENT_METHOD_EDIT', 'Admin denzz1212 menambahkan QRIS All Payment ke sistem.');
