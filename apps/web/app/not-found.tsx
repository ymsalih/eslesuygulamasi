import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container">
      <h1>Bu köşe bulunamadı</h1>
      <p className="muted">Aradığın sayfa yok ya da kaldırılmış.</p>
      <Link href="/sehir">Şehir seçimine dön</Link>
    </div>
  );
}
