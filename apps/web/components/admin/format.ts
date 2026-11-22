/** Panelde tarih ve saatler Türkiye saatiyle gösterilir. */
const dt = new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" });
const tm = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Istanbul" });

export const fmtDate = (d: Date | string | number | null | undefined) => (d == null ? "—" : dt.format(new Date(d)));
export const fmtTime = (d: Date | string | number) => tm.format(new Date(d));
/** Oturum kimliğinin kısa hali (tamamı üzerine gelince görünür). */
export const shortSid = (sid: string | null) => (sid ? `${sid.slice(0, 8)}…` : "—");
