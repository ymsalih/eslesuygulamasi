import type { Metadata } from "next";
import Link from "next/link";
import { BAN_DURATIONS, REPORT_REASONS, getCity, ALL_TURKEY_SLUG } from "@sark/shared";
import { requireAdmin } from "@/lib/admin/auth";
import { listReports, pool, type ReportRow, type ReportView } from "@/lib/admin/data";
import DbMissing from "@/components/admin/DbMissing";
import Flash from "@/components/admin/Flash";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { fmtDate, fmtTime, shortSid } from "@/components/admin/format";
import { reportAction } from "../actions";

export const metadata: Metadata = { title: "Bildirimler" };

const VIEWS: Record<ReportView, string> = { open: "Açık", legal_hold: "Yasal saklamada", closed: "Kapatılanlar" };

const ACTION_LABELS: Record<string, string> = {
  dismissed: "Kapatıldı (işlem yok)",
  message_removed: "Mesaj kaldırıldı",
  room_closed: "Köşe kapatıldı",
};
const actionLabel = (a: string | null) => {
  if (!a) return "—";
  if (a.startsWith("banned:")) return `Banlandı (${BAN_DURATIONS[a.slice(7) as keyof typeof BAN_DURATIONS]?.label ?? a.slice(7)})`;
  return ACTION_LABELS[a] ?? a;
};

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  if (!pool()) return <DbMissing />;
  const view: ReportView = typeof sp.durum === "string" && sp.durum in VIEWS ? (sp.durum as ReportView) : "open";
  const reports = await listReports(view);
  return (
    <>
      <Flash sonuc={sp.sonuc} canli={sp.canli} />
      <h1>Bildirimler</h1>
      <div className="admin-tabs">
        {(Object.keys(VIEWS) as ReportView[]).map((v) => (
          <Link key={v} href={`/yonetim/bildirimler?durum=${v}`} className={v === view ? "active" : ""}>{VIEWS[v]}</Link>
        ))}
      </div>
      {view === "open" && <p className="muted small">Önce yüksek öncelikli olanlar (reşit olmama, tehdit), sonra eskiden yeniye.</p>}
      {reports.length === 0 && <p className="card">Bu listede bildirim yok. 🎉</p>}
      {reports.map((r) => <ReportCard key={r.id} r={r} view={view} />)}
    </>
  );
}

function ReportCard({ r, view }: { r: ReportRow; view: ReportView }) {
  const city = getCity(r.city)?.name ?? (r.city === ALL_TURKEY_SLUG ? "Tüm Türkiye" : r.city);
  const reason = REPORT_REASONS[r.reason as keyof typeof REPORT_REASONS] ?? r.reason;
  const snapshot = Array.isArray(r.snapshot) ? r.snapshot : [];
  return (
    <article id={`b${r.id}`} className={`card admin-report ${r.priority === "high" ? "high" : ""}`}>
      <header>
        <div>
          {r.priority === "high" && <span className="admin-badge late">YÜKSEK ÖNCELİK</span>}
          {r.auto && <span className="admin-badge">Otomatik işaretleme</span>}
          <span className="admin-badge">{r.message_id ? "Mesaj bildirimi" : "Köşe bildirimi"}</span>
          <h2>{reason}</h2>
          <p className="muted small">
            #{r.id} · {city} · &quot;{r.room_title}&quot; · {fmtDate(r.created_at)}
            {r.reviewed_by && <> · İnceleyen: {r.reviewed_by} ({fmtDate(r.reviewed_at)}) · {actionLabel(r.action)}</>}
          </p>
        </div>
      </header>
      {r.note && <p className="admin-note"><b>Not:</b> {r.note}</p>}
      <p className="small">
        Bildirilen oturum: <code title={r.reported_sid ?? ""}>{r.reported_sid ?? "— (sistem köşesi)"}</code>
        {" · "}Bildiren: <code title={r.reporter_sid ?? ""}>{r.reporter_sid ? shortSid(r.reporter_sid) : "sistem"}</code>
      </p>

      <details open={r.priority === "high" || view === "open"}>
        <summary>Son {snapshot.length} mesaj (bildirim anındaki kesit)</summary>
        <ol className="admin-snapshot">
          {snapshot.map((m) => {
            const reported = m.id === r.message_id;
            const byTarget = r.reported_sid && m.sid === r.reported_sid;
            return (
              <li key={m.id} className={`${reported ? "reported" : ""} ${byTarget ? "by-target" : ""}`}>
                <time>{fmtTime(m.ts)}</time>
                <b>{m.nickname}</b>
                <span className="text">{m.text}</span>
                {m.hidden && <em className="muted small"> (o an gizliydi)</em>}
                {reported && <span className="admin-badge late">bildirilen</span>}
              </li>
            );
          })}
        </ol>
        <p className="muted small">Kalın çerçeveli satır bildirilen mesaj; sarı zeminliler bildirilen kişinin mesajları.</p>
      </details>

      <div className="admin-actions">
        {view !== "closed" && (
          <>
            <form action={reportAction}>
              <Hidden r={r} view={view} op="dismiss" />
              <button>Kapat (işlem yok)</button>
            </form>
            {r.message_id && (
              <form action={reportAction}>
                <Hidden r={r} view={view} op="hide_message" />
                <ConfirmButton message="Mesaj canlı köşeden kaldırılsın mı?">Mesajı kaldır</ConfirmButton>
              </form>
            )}
            <form action={reportAction}>
              <Hidden r={r} view={view} op="close_room" />
              <ConfirmButton message="Köşe kapatılsın mı? İçindekiler meydana döner.">Köşeyi kapat</ConfirmButton>
            </form>
          </>
        )}
        {view === "legal_hold" ? (
          <form action={reportAction}>
            <Hidden r={r} view={view} op="release" />
            <ConfirmButton message="Yasal saklama kaldırılsın mı? Saklama süresi dolmuşsa kayıt silinir.">Saklamayı kaldır</ConfirmButton>
          </form>
        ) : (
          <form action={reportAction}>
            <Hidden r={r} view={view} op="hold" />
            <ConfirmButton message="Bildirim yasal saklamaya alınsın mı? (Resmi talep veya suç şüphesi: süre dolsa da silinmez.)">Yasal saklamaya al</ConfirmButton>
          </form>
        )}
      </div>

      {view !== "closed" && r.reported_sid && (
        <form action={reportAction} className="admin-ban">
          <Hidden r={r} view={view} op="ban" />
          <b>Kullanıcıyı banla:</b>
          <select name="sure" defaultValue="24h" aria-label="Ban süresi">
            {Object.entries(BAN_DURATIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <input type="text" name="gerekce" required minLength={3} maxLength={300} placeholder="Gerekçe (ör. tekrarlayan taciz)" defaultValue={reason} aria-label="Gerekçe" />
          <label className="small" title="Mobil hatlarda aynı IP'yi birçok kişi paylaşabilir; sadece ağır durumlarda kullan.">
            <input type="checkbox" name="ip" value="1" /> IP ile de banla
          </label>
          <ConfirmButton className="danger" message="Kullanıcı banlansın mı? Bağlıysa hemen köşeden çıkarılır.">Banla</ConfirmButton>
        </form>
      )}
    </article>
  );
}

function Hidden({ r, view, op }: { r: ReportRow; view: ReportView; op: string }) {
  return (
    <>
      <input type="hidden" name="id" value={r.id} />
      <input type="hidden" name="durum" value={view} />
      <input type="hidden" name="islem" value={op} />
    </>
  );
}
