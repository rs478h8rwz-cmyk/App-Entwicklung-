-- LumbraDesk – Datenbank (MySQL/MariaDB bei IONOS)
-- Wird vom Einrichtungs-Assistenten (install.php) einmalig ausgeführt.

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(190) NOT NULL UNIQUE,
  name          VARCHAR(120) NOT NULL,
  role          ENUM('admin','buero','vertrieb','monteur') NOT NULL DEFAULT 'monteur',
  pw_hash       VARCHAR(255) NOT NULL,
  must_change   TINYINT(1) NOT NULL DEFAULT 1,      -- beim ersten Login neues Passwort setzen
  active        TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login    DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fehlversuche beim Login (Schutz gegen Passwort-Raten)
CREATE TABLE IF NOT EXISTS login_attempts (
  id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email  VARCHAR(190) NOT NULL,
  ip     VARCHAR(64) NOT NULL,
  at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (email, at), INDEX (ip, at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Protokoll: wer hat wann was gemacht
CREATE TABLE IF NOT EXISTS audit_log (
  id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id  INT UNSIGNED NULL,
  action   VARCHAR(60) NOT NULL,
  detail   VARCHAR(500) NOT NULL DEFAULT '',
  ip       VARCHAR(64) NOT NULL DEFAULT '',
  at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (at), INDEX (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
