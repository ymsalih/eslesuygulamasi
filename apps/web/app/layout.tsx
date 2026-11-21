import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Şark Köşesi: Gel otur, bir çay iç", template: "%s · Şark Köşesi" },
  description: "Şehrinin şark köşelerinde kayıt olmadan, takma adla, konulu anlık sohbet. 81 il ve Tüm Türkiye.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fffaf2" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <header className="topbar">
          <Link href="/" className="logo">şark<span>köşesi</span></Link>
          <div className="spacer" />
          <Link href="/sehir" className="pill">📍 Şehir seç</Link>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <Link href="/yasal/kullanim-kosullari">Kullanım Koşulları</Link>
          <Link href="/yasal/topluluk-kurallari">Topluluk Kuralları</Link>
          <Link href="/yasal/aydinlatma-metni">KVKK Aydınlatma Metni</Link>
          <Link href="/yasal/cerez-politikasi">Çerez Politikası</Link>
          <Link href="/yasal/icerik-kaldirma">İçerik Kaldırma Talebi</Link>
          <Link href="/yasal/kunye">İletişim / Künye</Link>
        </footer>
      </body>
    </html>
  );
}
