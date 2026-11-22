"use client";
import { useEffect, useState } from "react";
import { removalDeadline } from "@sark/shared";

/** İçerik kaldırma talebinin 24 saat sayacı; her 30 saniyede güncellenir. */
export default function Countdown({ createdAt }: { createdAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const d = removalDeadline(createdAt, now);
  return <span className={`admin-badge ${d.overdue ? "late" : d.urgent ? "soon" : "fine"}`}>⏱ {d.label}</span>;
}
