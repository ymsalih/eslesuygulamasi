import { LIVE_MESSAGES, RESULT_MESSAGES } from "@/lib/admin/messages";

/** İşlem sonrası mesaj: adres çubuğundaki kod sabit bir Türkçe metne çevrilir (keyfi metin gösterilmez). */
export default function Flash({ sonuc, canli }: { sonuc?: string | string[]; canli?: string | string[] }) {
  const r = typeof sonuc === "string" ? RESULT_MESSAGES[sonuc] : undefined;
  const live = typeof canli === "string" ? LIVE_MESSAGES[canli] : undefined;
  if (!r && !live) return null;
  return (
    <div className="admin-flashes" role="status">
      {r && <p className={`admin-flash ${r.kind}`}>{r.text}</p>}
      {live && <p className="admin-flash warn">{live}</p>}
    </div>
  );
}
