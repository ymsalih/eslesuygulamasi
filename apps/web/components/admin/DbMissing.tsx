/** Veritabanı tanımlı değilken panel yerine gösterilir. */
export default function DbMissing() {
  return (
    <div className="card admin-warning">
      <h2>DATABASE_URL gerekli</h2>
      <p>
        Yönetim paneli bildirimleri, banları ve kaldırma taleplerini veritabanından okur. Veritabanı olmadan bu kayıtlar
        sadece bellekte tutulur ve panelde görünmez.
      </p>
      <ol>
        <li>Docker Desktop&apos;ı aç, proje klasöründe <code>docker compose -f infra/docker-compose.yml up -d</code> çalıştır.</li>
        <li><code>.env</code> dosyasında <code>DATABASE_URL</code> satırının başındaki <code>#</code> işaretini sil.</li>
        <li><code>npm run db:migrate</code>, sonra <code>npm run dev</code>&apos;i yeniden başlat.</li>
      </ol>
      <p className="muted small">Ayrıntılar: docs/KURULUM.md, &quot;Yönetim paneli&quot; bölümü.</p>
    </div>
  );
}
