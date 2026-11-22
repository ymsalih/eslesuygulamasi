"use client";
import { useState } from "react";
import { CATEGORIES, REPORT_REASONS, TOPIC_MAX_LENGTH, moderateTopic, type ReportReason } from "@sark/shared";

export function CreateRoomModal({
  cityName,
  onClose,
  onCreate,
}: {
  cityName: string;
  onClose: () => void;
  onCreate: (title: string, category: string) => Promise<string | null>;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Anında uyarı için istemcide de kontrol; asıl karar sunucuda
    const check = moderateTopic(title);
    if (!check.ok) return setError(check.message!);
    setBusy(true);
    const err = await onCreate(title.trim(), category);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{cityName} için yeni bir köşe aç</h3>
        <p className="muted small">Köşe 24 saat açık kalır. 3 saat boyunca kimse yazmazsa kapanır. Kişileri hedef alan konular açılamaz.</p>
        <div className="field">
          <label htmlFor="t">Konu</label>
          <input id="t" type="text" value={title} maxLength={TOPIC_MAX_LENGTH} onChange={(e) => setTitle(e.target.value)} placeholder="Ör. Bu akşam sahilde ne var?" autoFocus />
          <div className="muted small" style={{ textAlign: "right" }}>{title.trim().length}/{TOPIC_MAX_LENGTH}</div>
        </div>
        <div className="field">
          <label htmlFor="c">Kategori</label>
          <select id="c" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button type="button" onClick={onClose}>Vazgeç</button>
          <button type="submit" className="primary" disabled={busy}>Köşeyi aç</button>
        </div>
      </form>
    </div>
  );
}

export function ReportModal({
  target,
  onClose,
  onSubmit,
}: {
  target: string;
  onClose: () => void;
  onSubmit: (reason: ReportReason, note: string) => Promise<string | null>;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return setError("Bir sebep seç.");
    setBusy(true);
    const err = await onSubmit(reason, note.trim());
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>🚩 {target} bildir</h3>
        {(Object.entries(REPORT_REASONS) as [ReportReason, string][]).map(([k, v]) => (
          <label key={k} className="opt">
            <input type="radio" name="reason" checked={reason === k} onChange={() => setReason(k)} /> {v}
          </label>
        ))}
        <div className="field">
          <label htmlFor="n">Not (isteğe bağlı)</label>
          <textarea id="n" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <p className="muted small">Bildirimde köşedeki son mesajlar incelenmek üzere kaydedilir. Acil bir tehlike varsa 112&apos;yi ara.</p>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button type="button" onClick={onClose}>Vazgeç</button>
          <button type="submit" className="primary" disabled={busy}>Bildir</button>
        </div>
      </form>
    </div>
  );
}
