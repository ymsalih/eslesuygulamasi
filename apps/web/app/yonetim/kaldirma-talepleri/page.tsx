import type { Metadata } from "next";
import { REMOVAL_OUTCOMES, removalDeadline } from "@sark/shared";
import { requireAdmin } from "@/lib/admin/auth";
import { listRemovals, pool } from "@/lib/admin/data";
import DbMissing from "@/components/admin/DbMissing";
import Flash from "@/components/admin/Flash";
import Countdown from "@/components/admin/Countdown";
import { fmtDate } from "@/components/admin/format";
import { resolveRemovalAction } from "../actions";

export const metadata: Metadata = { title: "Kaldırma talepleri" };

export default async function RemovalsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  if (!pool()) return <DbMissing />;
  const { open, resolved } = await listRemovals();
  return (
    <>
      <Flash sonuc={sp.sonuc} canli={sp.canli} />
      <h1>İçerik kaldırma talepleri</h1>
      <p className="muted small">
        5651 sayılı Kanun md. 9: kişilik hakkı ihlali başvuruları <b>24 saat</b> içinde sonuçlandırılır. Süresi geçenler kırmızı görünür.
        İçeriği kaldırmak için ilgili bildirimi bul (şehir, köşe, saat) ya da köşeyi bildirimler sayfasından kapat.
      </p>

      <h2>Açık talepler ({open.length})</h2>
      {open.length === 0 && <p className="card">Açık talep yok.</p>}
      {open.map((r) => {
        const d = removalDeadline(r.created_at);
        return (
          <article key={r.id} className={`card admin-report ${d.overdue ? "high" : ""}`}>
            <header>
              <div>
                <Countdown createdAt={new Date(r.created_at).toISOString()} />
                <h2>#{r.id} · {r.name}</h2>
                <p className="muted small">Geliş: {fmtDate(r.created_at)} · Son an: {fmtDate(d.dueAt)} · İletişim: {r.contact}</p>
              </div>
            </header>
            <p><b>İçeriğin yeri:</b> {r.content_ref}</p>
            <p className="admin-note">{r.description}</p>
            <form action={resolveRemovalAction} className="admin-form">
              <input type="hidden" name="id" value={r.id} />
              <div className="admin-row">
                <label>Sonuç
                  <select name="sonuc" defaultValue="removed">
                    {Object.entries(REMOVAL_OUTCOMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
                <label className="grow">Not (ne yapıldı, başvurana ne bildirildi)
                  <input type="text" name="not" required minLength={3} maxLength={2000} />
                </label>
                <button className="primary">Sonuçlandır</button>
              </div>
            </form>
          </article>
        );
      })}

      <h2>Sonuçlananlar (son 50)</h2>
      {resolved.length === 0 ? <p className="muted">Kayıt yok.</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>#</th><th>Başvuran</th><th>Geliş</th><th>Sonuç</th><th>Not</th><th>Sonuçlandıran</th><th>Süre</th></tr></thead>
            <tbody>
              {resolved.map((r) => {
                const hours = r.resolved_at ? (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / 3600000 : null;
                return (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.name}</td>
                    <td>{fmtDate(r.created_at)}</td>
                    <td>{REMOVAL_OUTCOMES[r.outcome as keyof typeof REMOVAL_OUTCOMES] ?? r.status}</td>
                    <td>{r.resolution_note}</td>
                    <td>{r.resolved_by ?? "—"}</td>
                    <td className={hours !== null && hours > 24 ? "late" : ""}>{hours === null ? "—" : `${hours.toFixed(1)} sa`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
