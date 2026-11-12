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

-- Firmen-Einstellungen der Wirtschaftlichkeits-App (Design, Produkte, Förderung, Texte …) – für alle Geräte
CREATE TABLE IF NOT EXISTS company_config (
  id          TINYINT UNSIGNED PRIMARY KEY,
  version     INT UNSIGNED NOT NULL DEFAULT 0,
  data        LONGTEXT NOT NULL,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by  VARCHAR(120) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kunden / Berechnungen der Wirtschaftlichkeits-App (zentral für alle Geräte)
CREATE TABLE IF NOT EXISTS projects (
  id           VARCHAR(40) PRIMARY KEY,
  owner_id     INT UNSIGNED NOT NULL,              -- zuständig
  created_by   INT UNSIGNED NOT NULL,              -- angelegt von (sieht den Kunden weiterhin)
  assigned_by  INT UNSIGNED NULL,
  assigned_at  DATETIME NULL,
  name         VARCHAR(200) NOT NULL DEFAULT '',
  data         LONGTEXT NOT NULL,
  version      INT UNSIGNED NOT NULL DEFAULT 1,
  deleted      TINYINT(1) NOT NULL DEFAULT 0,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by   INT UNSIGNED NULL,
  INDEX (owner_id), INDEX (created_by), INDEX (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
