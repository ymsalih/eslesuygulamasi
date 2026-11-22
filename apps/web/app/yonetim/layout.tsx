import type { Metadata } from "next";
import Link from "next/link";
import { getAdmin } from "@/lib/admin/auth";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s · Yönetim · Şark Köşesi" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  return (
    <div className="admin">
      {admin && (
        <nav className="admin-nav">
          <Link href="/yonetim">Özet</Link>
          <Link href="/yonetim/bildirimler">Bildirimler</Link>
          <Link href="/yonetim/kaldirma-talepleri">Kaldırma talepleri</Link>
          <Link href="/yonetim/banlar">Banlar</Link>
          <Link href="/yonetim/kelimeler">Yasaklı kelimeler</Link>
          <Link href="/yonetim/gunluk">Denetim günlüğü</Link>
          <span className="spacer" />
          <span className="muted small">👤 {admin.username}</span>
          <form action={logoutAction}><button className="link small">Çıkış</button></form>
        </nav>
      )}
      <div className="container">{children}</div>
    </div>
  );
}
