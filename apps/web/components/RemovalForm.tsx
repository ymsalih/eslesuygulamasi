"use client";
import { useState } from "react";

export default function RemovalForm() {
  const [form, setForm] = useState({ name: "", contact: "", contentRef: "", description: "" });
  const [status, setStatus] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("busy");
    setError(null);
    const res = await fetch("/api/removal-request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) setStatus("done");
    else {
      setError((await res.json().catch(() => ({}))).error ?? "Gönderilemedi.");
      setStatus("idle");
    }
  }

  if (status === "done") return <p className="card">Talebin alındı. En geç 24 saat içinde verdiğin iletişim adresinden dönüş yapılacak.</p>;
  return (
    <form className="card" onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      <label>Adın soyadın<input type="text" required maxLength={120} value={form.name} onChange={set("name")} /></label>
      <label>İletişim (e-posta veya telefon)<input type="text" required maxLength={200} value={form.contact} onChange={set("contact")} /></label>
      <label>İçeriğin yeri (şehir, köşe başlığı, yaklaşık saat veya bağlantı)<input type="text" required maxLength={500} value={form.contentRef} onChange={set("contentRef")} /></label>
      <label>Açıklama: içerik hangi hakkını, nasıl ihlal ediyor?<textarea required rows={5} maxLength={3000} value={form.description} onChange={set("description")} /></label>
      {error && <p className="error">{error}</p>}
      <button className="primary" disabled={status === "busy"}>Talebi gönder</button>
      <p className="muted small">Bu formdaki bilgiler yalnızca talebin değerlendirilmesi için kullanılır (KVKK md. 5/2-ç, e).</p>
    </form>
  );
}
