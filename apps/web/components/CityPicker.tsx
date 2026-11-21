"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { slugify } from "@sark/shared";
import { REALTIME_URL } from "@/lib/realtime";

interface C { plate: number; slug: string; name: string; region: string }
const REGIONS = ["Tümü", "Marmara", "Ege", "Akdeniz", "İç Anadolu", "Karadeniz", "Doğu Anadolu", "Güneydoğu Anadolu"];

export default function CityPicker({ cities }: { cities: C[] }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("Tümü");
  const [stats, setStats] = useState<{ total: number; byCity: Record<string, number> } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(`${REALTIME_URL}/stats`).then((r) => r.json()).then((s) => alive && setStats(s)).catch(() => {});
    load();
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const list = useMemo(() => {
    const query = q.trim();
    const qs = slugify(query);
    return cities.filter((c) => {
      if (region !== "Tümü" && c.region !== region) return false;
      if (!query) return true;
      if (/^\d+$/.test(query)) return String(c.plate).padStart(2, "0").startsWith(query.padStart(Math.min(2, query.length), "0")) || String(c.plate) === query;
      return c.slug.includes(qs);
    });
  }, [cities, q, region]);

  return (
    <>
      <div className="city-head">
        <h1>Şehrini seç</h1>
        {stats && <span className="muted small">🟢 Şu an {stats.total} kişi çevrimiçi</span>}
        <div className="spacer" />
        <input type="search" placeholder="İl adı veya plaka (ör. 35)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="İl ara" />
      </div>
      <div className="regions">
        {REGIONS.map((r) => (
          <button key={r} className={r === region ? "active" : ""} onClick={() => setRegion(r)}>{r}</button>
        ))}
      </div>
      <Link href="/sehir/turkiye" className="all-turkey">
        <span style={{ fontSize: 28 }}>🇹🇷</span>
        <span style={{ flex: 1 }}>
          <strong>Tüm Türkiye</strong>
          <br />
          <span className="muted small">81 ilden herkesle karışık köşeler. Takma adın rastgele bir ilden gelir.</span>
        </span>
        {stats?.byCity.turkiye ? <span className="online-dot">● {stats.byCity.turkiye}</span> : null}
      </Link>
      <div className="city-grid">
        {list.map((c) => (
          <Link key={c.slug} href={`/sehir/${c.slug}`} className="city-card">
            <span className="plate">{String(c.plate).padStart(2, "0")}</span>
            <span className="name">{c.name}</span>
            {stats?.byCity[c.slug] ? <span className="online-dot">● {stats.byCity[c.slug]}</span> : null}
          </Link>
        ))}
        {!list.length && <p className="muted">Eşleşen il bulunamadı.</p>}
      </div>
    </>
  );
}
