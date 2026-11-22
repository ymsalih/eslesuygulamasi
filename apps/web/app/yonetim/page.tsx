import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { pool, summary } from "@/lib/admin/data";
import DbMissing from "@/components/admin/DbMissing";
import Flash from "@/components/admin/Flash";

export default async function AdminHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  if (!pool()) return <DbMissing />;
  const s = await summary();
  return (
    <>
      <Flash sonuc={sp.sonuc} canli={sp.canli} />
      <h1>Özet</h1>
      <div className="admin-tiles">
        <Link href="/yonetim/kaldirma-talepleri" className={`card admin-tile ${s.overdue_removals ? "late" : ""}`}>
          <strong>{s.open_removals}</strong>
          <span>açık kaldırma talebi</span>
          {s.overdue_removals > 0 && <em>{s.overdue_removals} tanesi 24 saati geçti!</em>}
        </Link>
        <Link href="/yonetim/bildirimler" className={`card admin-tile ${s.high_reports ? "soon" : ""}`}>
          <strong>{s.open_reports}</strong>
          <span>açık bildirim</span>
          {s.high_reports > 0 && <em>{s.high_reports} tanesi yüksek öncelikli</em>}
        </Link>
        <Link href="/yonetim/bildirimler?durum=legal_hold" className="card admin-tile">
          <strong>{s.held_reports}</strong><span>yasal saklamada</span>
        </Link>
        <Link href="/yonetim/banlar" className="card admin-tile">
          <strong>{s.active_bans}</strong><span>aktif ban</span>
        </Link>
        <Link href="/yonetim/kelimeler" className="card admin-tile">
          <strong>{s.words}</strong><span>panelden eklenen yasaklı kelime</span>
        </Link>
      </div>
      <div className="card admin-help">
        <h2>Sıra</h2>
        <ol>
          <li><b>Kaldırma talepleri</b> (5651 md. 9): 24 saat içinde sonuçlandırılmalı.</li>
          <li><b>Yüksek öncelikli bildirimler</b> (reşit olmama, tehdit): hemen bak. Çocuk istismarı şüphesinde içeriği kaldır, bildirimi yasal saklamaya al ve yetkili makamlara bildir.</li>
          <li><b>Diğer bildirimler</b>, eskiden yeniye.</li>
        </ol>
        <p className="muted small">Her işlem kim, ne zaman, ne yaptı bilgisiyle denetim günlüğüne yazılır.</p>
      </div>
    </>
  );
}
