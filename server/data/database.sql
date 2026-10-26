-- Kampüs Masa: 100 kurgusal demo öğrenci hesabı
-- MySQL 8.0+
-- İlk demo parolası öğrenci numarasıdır. Bu basit parolalar yalnızca prototip içindir.

CREATE DATABASE IF NOT EXISTS kampus_masa CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci;
USE kampus_masa;

CREATE TABLE IF NOT EXISTS Users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  student_no CHAR(3) NOT NULL UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  password_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO Users (student_no, first_name, last_name, password_hash) VALUES
('359', 'Ada', 'Yılmaz', SHA2('359', 256)),
('370', 'Mert', 'Öztürk', SHA2('370', 256)),
('897', 'Zeynep', 'Çetin', SHA2('897', 256)),
('306', 'Ege', 'Acar', SHA2('306', 256)),
('646', 'Elif', 'Erdoğan', SHA2('646', 256)),
('461', 'Arda', 'Taş', SHA2('461', 256)),
('346', 'Defne', 'Ergin', SHA2('346', 256)),
('686', 'Kerem', 'Ergin', SHA2('686', 256)),
('475', 'Eylül', 'Yıldırım', SHA2('475', 256)),
('123', 'Emir', 'Aslan', SHA2('123', 256)),
('516', 'Duru', 'Polat', SHA2('516', 256)),
('178', 'Can', 'Bozkurt', SHA2('178', 256)),
('508', 'İrem', 'Avcı', SHA2('508', 256)),
('911', 'Berk', 'Çakır', SHA2('911', 256)),
('309', 'Yağmur', 'Demirtaş', SHA2('309', 256)),
('419', 'Deniz', 'Yıldız', SHA2('419', 256)),
('454', 'Eren', 'Kılıç', SHA2('454', 256)),
('403', 'Melis', 'Şimşek', SHA2('403', 256)),
('703', 'Kaan', 'Yavuz', SHA2('703', 256)),
('365', 'Ceren', 'Turan', SHA2('365', 256)),
('690', 'Umut', 'Işık', SHA2('690', 256)),
('463', 'Azra', 'Aksoy', SHA2('463', 256)),
('144', 'Baran', 'Şahin', SHA2('144', 256)),
('680', 'İpek', 'Doğan', SHA2('680', 256)),
('512', 'Yiğit', 'Özkan', SHA2('512', 256)),
('120', 'Nehir', 'Güler', SHA2('120', 256)),
('247', 'Ozan', 'Korkmaz', SHA2('247', 256)),
('567', 'Sude', 'Kaplan', SHA2('567', 256)),
('710', 'Bora', 'Karaca', SHA2('710', 256)),
('932', 'Lara', 'Çelik', SHA2('932', 256)),
('485', 'Ali', 'Arslan', SHA2('485', 256)),
('251', 'Mina', 'Kurt', SHA2('251', 256)),
('398', 'Efe', 'Keskin', SHA2('398', 256)),
('855', 'Selin', 'Güneş', SHA2('855', 256)),
('155', 'Onur', 'Ateş', SHA2('155', 256)),
('391', 'Buse', 'Yüksel', SHA2('391', 256)),
('330', 'Emre', 'Demir', SHA2('330', 256)),
('688', 'Asya', 'Özdemir', SHA2('688', 256)),
('517', 'Furkan', 'Koç', SHA2('517', 256)),
('366', 'Naz', 'Aktaş', SHA2('366', 256)),
('997', 'Tolga', 'Tekin', SHA2('997', 256)),
('482', 'Nisa', 'Sarı', SHA2('482', 256)),
('827', 'Burak', 'Özer', SHA2('827', 256)),
('436', 'Ece', 'Kaya', SHA2('436', 256)),
('140', 'Ahmet', 'Aydın', SHA2('140', 256)),
('681', 'İlayda', 'Kara', SHA2('681', 256)),
('131', 'Kuzey', 'Yalçın', SHA2('131', 256)),
('832', 'Esra', 'Bulut', SHA2('832', 256)),
('379', 'Doruk', 'Köse', SHA2('379', 256)),
('357', 'Gizem', 'Tunç', SHA2('357', 256)),
('943', 'Ada', 'Yılmaz', SHA2('943', 256)),
('878', 'Mert', 'Öztürk', SHA2('878', 256)),
('798', 'Zeynep', 'Çetin', SHA2('798', 256)),
('256', 'Ege', 'Acar', SHA2('256', 256)),
('839', 'Elif', 'Erdoğan', SHA2('839', 256)),
('630', 'Arda', 'Taş', SHA2('630', 256)),
('740', 'Defne', 'Ergin', SHA2('740', 256)),
('814', 'Kerem', 'Ergin', SHA2('814', 256)),
('615', 'Eylül', 'Yıldırım', SHA2('615', 256)),
('723', 'Emir', 'Aslan', SHA2('723', 256)),
('833', 'Duru', 'Polat', SHA2('833', 256)),
('693', 'Can', 'Bozkurt', SHA2('693', 256)),
('786', 'İrem', 'Avcı', SHA2('786', 256)),
('345', 'Berk', 'Çakır', SHA2('345', 256)),
('429', 'Yağmur', 'Demirtaş', SHA2('429', 256)),
('642', 'Deniz', 'Yıldız', SHA2('642', 256)),
('862', 'Eren', 'Kılıç', SHA2('862', 256)),
('377', 'Melis', 'Şimşek', SHA2('377', 256)),
('408', 'Kaan', 'Yavuz', SHA2('408', 256)),
('882', 'Ceren', 'Turan', SHA2('882', 256)),
('822', 'Umut', 'Işık', SHA2('822', 256)),
('994', 'Azra', 'Aksoy', SHA2('994', 256)),
('121', 'Baran', 'Şahin', SHA2('121', 256)),
('386', 'İpek', 'Doğan', SHA2('386', 256)),
('891', 'Yiğit', 'Özkan', SHA2('891', 256)),
('817', 'Nehir', 'Güler', SHA2('817', 256)),
('253', 'Ozan', 'Korkmaz', SHA2('253', 256)),
('376', 'Sude', 'Kaplan', SHA2('376', 256)),
('332', 'Bora', 'Karaca', SHA2('332', 256)),
('298', 'Lara', 'Çelik', SHA2('298', 256)),
('198', 'Ali', 'Arslan', SHA2('198', 256)),
('137', 'Mina', 'Kurt', SHA2('137', 256)),
('423', 'Efe', 'Keskin', SHA2('423', 256)),
('718', 'Selin', 'Güneş', SHA2('718', 256)),
('719', 'Onur', 'Ateş', SHA2('719', 256)),
('829', 'Buse', 'Yüksel', SHA2('829', 256)),
('258', 'Emre', 'Demir', SHA2('258', 256)),
('762', 'Asya', 'Özdemir', SHA2('762', 256)),
('714', 'Furkan', 'Koç', SHA2('714', 256)),
('141', 'Naz', 'Aktaş', SHA2('141', 256)),
('843', 'Tolga', 'Tekin', SHA2('843', 256)),
('663', 'Nisa', 'Sarı', SHA2('663', 256)),
('286', 'Burak', 'Özer', SHA2('286', 256)),
('109', 'Ece', 'Kaya', SHA2('109', 256)),
('341', 'Ahmet', 'Aydın', SHA2('341', 256)),
('912', 'İlayda', 'Kara', SHA2('912', 256)),
('792', 'Kuzey', 'Yalçın', SHA2('792', 256)),
('185', 'Esra', 'Bulut', SHA2('185', 256)),
('771', 'Doruk', 'Köse', SHA2('771', 256)),
('239', 'Gizem', 'Tunç', SHA2('239', 256))
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  password_hash = VALUES(password_hash);

DROP PROCEDURE IF EXISTS LoginStudent;
DELIMITER $$
CREATE PROCEDURE LoginStudent(IN p_student_no CHAR(3), IN p_password VARCHAR(255))
BEGIN
  SELECT id, student_no, first_name, last_name
  FROM Users
  WHERE student_no = p_student_no
    AND password_hash = SHA2(p_password, 256)
  LIMIT 1;
END$$
DELIMITER ;
