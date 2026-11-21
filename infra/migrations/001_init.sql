-- Şark Köşesi: ilk şema
-- Mesaj içerikleri veritabanına YAZILMAZ. Sadece bildirilen köşelerin kesitleri saklanır.

-- Onay kayıtları (KVKK: onayın alındığının ispatı)
CREATE TABLE IF NOT EXISTS consent_records (
  id              BIGSERIAL PRIMARY KEY,
  session_id      TEXT        NOT NULL,
  terms_version   TEXT        NOT NULL,
  privacy_version TEXT        NOT NULL,
  age_confirmed   BOOLEAN     NOT NULL,
  analytics_consent BOOLEAN   NOT NULL DEFAULT FALSE,
  ip_hash         TEXT        NOT NULL,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consent_records_session_idx ON consent_records (session_id);

-- 5651 trafik logları: IP şifreli, erişimi kısıtlı, saklama süresi dolunca silinir
CREATE TABLE IF NOT EXISTS traffic_logs (
  id           BIGSERIAL PRIMARY KEY,
  session_id   TEXT        NOT NULL,
  ip_encrypted TEXT        NOT NULL,
  port         INTEGER,
  event        TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS traffic_logs_session_idx ON traffic_logs (session_id, created_at);
CREATE INDEX IF NOT EXISTS traffic_logs_created_idx ON traffic_logs (created_at);

-- Bildirimler ve kesitler
CREATE TABLE IF NOT EXISTS reports (
  id            BIGSERIAL PRIMARY KEY,
  room_id       TEXT        NOT NULL,
  city          TEXT        NOT NULL,
  room_title    TEXT        NOT NULL,
  reporter_sid  TEXT,
  reported_sid  TEXT,
  message_id    TEXT,
  reason        TEXT        NOT NULL,
  note          TEXT,
  auto          BOOLEAN     NOT NULL DEFAULT FALSE,
  priority      TEXT        NOT NULL DEFAULT 'normal',
  status        TEXT        NOT NULL DEFAULT 'open',
  snapshot      JSONB       NOT NULL,
  reviewed_by   TEXT,
  reviewed_at   TIMESTAMPTZ,
  action        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  delete_after  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '180 days')
);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status, priority, created_at);

-- Banlar
CREATE TABLE IF NOT EXISTS bans (
  id          BIGSERIAL PRIMARY KEY,
  session_id  TEXT,
  ip_hash     TEXT,
  reason      TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ,
  created_by  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bans_session_idx ON bans (session_id);
CREATE INDEX IF NOT EXISTS bans_ip_idx ON bans (ip_hash);

-- Yönetim panelinden eklenen yasaklı kelimeler
CREATE TABLE IF NOT EXISTS banned_words (
  id         BIGSERIAL PRIMARY KEY,
  pattern    TEXT        NOT NULL UNIQUE,
  kind       TEXT        NOT NULL CHECK (kind IN ('exact', 'prefix')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- İçerik kaldırma talepleri (5651 md. 9, 24 saat içinde sonuçlandırılır)
CREATE TABLE IF NOT EXISTS removal_requests (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT        NOT NULL,
  contact      TEXT        NOT NULL,
  content_ref  TEXT        NOT NULL,
  description  TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'open',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ
);
