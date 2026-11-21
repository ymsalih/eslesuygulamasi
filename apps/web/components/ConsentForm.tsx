"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ConsentForm() {
  const router = useRouter();
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = age && terms && privacy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ age, terms, privacy, analytics }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Bir hata oluştu.");
      router.push("/sehir");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Sohbete başlamadan önce</h2>
      <p className="muted small">Kutucuklar önceden işaretli değildir. İlk üçü zorunludur.</p>
      <label>
        <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} />
        <span>18 yaşından büyük olduğumu beyan ederim.<span className="req">(zorunlu)</span></span>
      </label>
      <label>
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        <span>
          <Link href="/yasal/kullanim-kosullari" target="_blank">Kullanım Koşulları</Link>&apos;nı ve{" "}
          <Link href="/yasal/topluluk-kurallari" target="_blank">Topluluk Kuralları</Link>&apos;nı okudum, kabul ediyorum.
          <span className="req">(zorunlu)</span>
        </span>
      </label>
      <label>
        <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
        <span>
          <Link href="/yasal/aydinlatma-metni" target="_blank">KVKK Aydınlatma Metni</Link>&apos;ni okudum.
          <span className="req">(zorunlu, bilgilendirme)</span>
        </span>
      </label>
      <label>
        <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
        <span>
          Siteyi geliştirmek için analitik çerezlere izin veriyorum. (<Link href="/yasal/cerez-politikasi" target="_blank">Çerez Politikası</Link>)
          <span className="req">(isteğe bağlı)</span>
        </span>
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="primary" disabled={!ready || busy}>
        {busy ? "Hazırlanıyor..." : "☕ Köşelere geç"}
      </button>
    </form>
  );
}
