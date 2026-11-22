"use client";
import { useActionState } from "react";
import { addWordAction } from "@/app/yonetim/actions";

export default function WordForm() {
  const [state, action, pending] = useActionState(addWordAction, undefined);
  return (
    <form action={action} className="card admin-form">
      <h2>Kelime ekle</h2>
      <div className="admin-row">
        <label className="grow">Kelime<input key={`k-${state?.kelime ?? ""}`} type="text" name="kelime" required maxLength={40} placeholder="ör. bahisçi" defaultValue={state?.kelime ?? ""} /></label>
        <label>Eşleşme
          <select key={`t-${state?.tur ?? ""}`} name="tur" defaultValue={state?.tur === "prefix" ? "prefix" : "exact"}>
            <option value="exact">Kelimenin tamamı</option>
            <option value="prefix">Bu kökle başlayan kelimeler</option>
          </select>
        </label>
        <button className="primary" disabled={pending}>Ekle</button>
      </div>
      <p className="muted small">
        Kelime filtrenin kullandığı biçime çevrilir (küçük harf, Türkçe harfler sadeleşir: &quot;Şişko&quot; → &quot;sisko&quot;).
        &quot;Kökle başlayan&quot; seçeneği ekleri de yakalar (&quot;bahis&quot; → &quot;bahisçi&quot;, &quot;bahise&quot;) ama masum kelimeleri de engelleyebilir.
      </p>
      {state?.error && <p className="error">{state.error}</p>}
      {state?.ok && <p className="admin-flash ok">{state.ok}</p>}
    </form>
  );
}
