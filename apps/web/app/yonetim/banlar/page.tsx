import type { Metadata } from "next";
import { BAN_DURATIONS } from "@sark/shared";
import { requireAdmin } from "@/lib/admin/auth";
import { listBans, pool, type BanRow } from "@/lib/admin/data";
import DbMissing from "@/components/admin/DbMissing";
import Flash from "@/components/admin/Flash";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { fmtDate } from "@/components/admin/format";
import { addBanAction, liftBanAction } from "../actions";

export const metadata: Metadata = { title: "Banlar" };

export default async function BansPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  if (!pool()) return <DbMissing />;
  const { active, ended } = await listBans();
  return (
    <>
      <Flash sonuc={sp.sonuc} canli={sp.canli} />
      <h1>Banlar</h1>

      <form action={addBanAction} className="card admin-form">
        <h2>Elle ban ekle</h2>
        <div className="admin-row">
          <label className="grow">Oturum kimliği (32 karakter, bildirimlerde görünür)
            <input type="text" name="oturum" required pattern="[a-fA-F0-9]{32}" maxLength={32} placeholder="ör. 3f2a9c…" />
          </label>
          <label>Süre
            <select name="sure" defaultValue="24h">
              {Object.entries(BAN_DURATIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
        </div>
        <label>Gerekçe<input type="text" name="gerekce" required minLength={3} maxLength={300} placeholder="ör. resmi talep, tekrarlayan taciz" /></label>
        <div><ConfirmButton className="danger" message="Bu oturum banlansın mı?">Banla</ConfirmButton></div>
      </form>

      <h2>Aktif banlar ({active.length})</h2>
      {active.length === 0 ? <p className="card">Aktif ban yok.</p> : <BanTable bans={active} active />}

      <h2>Biten / kaldırılan son banlar</h2>
      {ended.length === 0 ? <p className="muted">Kayıt yok.</p> : <BanTable bans={ended} />}
    </>
  );
}

function BanTable({ bans, active }: { bans: BanRow[]; active?: boolean }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr><th>#</th><th>Kime</th><th>Gerekçe</th><th>Ekleyen</th><th>Başlangıç</th><th>Bitiş</th>{active && <th />}</tr>
        </thead>
        <tbody>
          {bans.map((b) => (
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>
                {b.session_id ? <code>{b.session_id}</code> : null}
                {b.ip_hash ? <span className="admin-badge">IP</span> : null}
              </td>
              <td>{b.reason}</td>
              <td>{b.created_by === "system" ? "Otomatik" : b.created_by}</td>
              <td>{fmtDate(b.created_at)}</td>
              <td>
                {b.lifted_at ? <>Kaldırıldı: {fmtDate(b.lifted_at)} ({b.lifted_by})</> : b.expires_at ? fmtDate(b.expires_at) : <b>Süresiz</b>}
              </td>
              {active && (
                <td>
                  <form action={liftBanAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <ConfirmButton message="Ban kaldırılsın mı?">Kaldır</ConfirmButton>
                  </form>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
