-- Şark Köşesi: yönetim paneli
-- Her moderatör işlemi denetim günlüğüne yazılır: "haberdar olunca kaldırdık" (5651 md. 5) ispatı.

CREATE TABLE IF NOT EXISTS moderation_actions (
  id          BIGSERIAL PRIMARY KEY,
  actor       TEXT        NOT NULL,           -- işlemi yapan yönetici (kullanıcı adı)
  action      TEXT        NOT NULL,           -- ör. report_dismiss, ban_add, removal_resolve
  target_type TEXT,                           -- report, ban, removal_request, banned_word, session
  target_id   TEXT,
  details     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS moderation_actions_created_idx ON moderation_actions (created_at DESC);
CREATE INDEX IF NOT EXISTS moderation_actions_target_idx ON moderation_actions (target_type, target_id);

-- Ban kaldırma: satır silinmez, süresi o an biter ve kimin kaldırdığı saklanır
ALTER TABLE bans ADD COLUMN IF NOT EXISTS lifted_at TIMESTAMPTZ;
ALTER TABLE bans ADD COLUMN IF NOT EXISTS lifted_by TEXT;
CREATE INDEX IF NOT EXISTS bans_created_idx ON bans (created_at DESC);

-- İçerik kaldırma taleplerinin sonucu
ALTER TABLE removal_requests ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE removal_requests ADD COLUMN IF NOT EXISTS resolution_note TEXT;
ALTER TABLE removal_requests ADD COLUMN IF NOT EXISTS resolved_by TEXT;
CREATE INDEX IF NOT EXISTS removal_requests_status_idx ON removal_requests (status, created_at);

-- Bildirimlerde aynı mesaj/köşe için açık kayıtları birlikte kapatmak için
CREATE INDEX IF NOT EXISTS reports_message_idx ON reports (message_id) WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS reports_room_idx ON reports (room_id);
