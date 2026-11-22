import type { Metadata } from "next";
import { MODERATION_ACTION_LABELS } from "@sark/shared";
import { requireAdmin } from "@/lib/admin/auth";
import { listAudit, pool } from "@/lib/admin/data";
import DbMissing from "@/components/admin/DbMissing";
import { fmtDate } from "@/components/admin/format";

export const metadata: Metadata = { title: "Denetim günlüğü" };

const TARGETS: Record<string, string> = {
  report: "Bildirim", ban: "Ban", removal_request: "Kaldırma talebi", banned_word: "Kelime", session: "Oturum",
};

export default async function AuditPage() {
  await requireAdmin();
  if (!pool()) return <DbMissing />;
  const rows = await listAudit();
  return (
    <>
      <h1>Denetim günlüğü</h1>
      <p className="muted small">
        Her moderatör işlemi burada kim, ne zaman, ne yaptı bilgisiyle saklanır (5651: &quot;haberdar olunca kaldırdık&quot; ispatı).
        Kayıtlar panelden silinemez. Son 200 işlem gösterilir.
      </p>
      {rows.length === 0 ? <p className="card">Henüz işlem yok.</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Zaman</th><th>Kim</th><th>İşlem</th><th>Hedef</th><th>Ayrıntı</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{fmtDate(r.created_at)}</td>
                  <td>{r.actor}</td>
                  <td>{MODERATION_ACTION_LABELS[r.action] ?? r.action}</td>
                  <td>{r.target_type ? `${TARGETS[r.target_type] ?? r.target_type} #${r.target_id}` : "—"}</td>
                  <td><code className="admin-json">{Object.keys(r.details ?? {}).length ? JSON.stringify(r.details) : ""}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
