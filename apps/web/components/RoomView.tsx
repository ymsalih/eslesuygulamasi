"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAKAMS, SCENE_H, SCENE_W, SEATS, USULS, buildSceneSvg, moderateMessage, themeFor,
  type ChatMessage, type Member, type ReportReason, type RoomState,
} from "@sark/shared";
import { call, getSocket } from "@/lib/realtime";
import { seedFromId, type Ambience, type TrackInfo } from "@/lib/ambience";
import { remaining } from "./CityApp";
import { ReportModal } from "./Modals";

export type LogItem = { kind: "msg"; msg: ChatMessage } | { kind: "sys"; text: string } | { kind: "warn"; text: string };

interface Props {
  city: string;
  cityName: string;
  state: RoomState;
  log: LogItem[];
  setLog: React.Dispatch<React.SetStateAction<LogItem[]>>;
  ambience: Ambience | null;
  onLeave: () => void;
  onRandom: () => void;
}

const pct = (v: number, total: number) => `${(v / total) * 100}%`;
const BUBBLE_MS = 4500;
const MAX_BUBBLES = 4;

export default function RoomView({ city, cityName, state, log, setLog, ambience, onLeave, onRandom }: Props) {
  const socket = getSocket();
  const theme = useMemo(() => themeFor(city), [city]);
  const sceneSvg = useMemo(() => buildSceneSvg(theme), [theme]);
  const [bubbles, setBubbles] = useState<Record<string, { text: string; typing: boolean; at: number }>>({});
  const [menuFor, setMenuFor] = useState<Member | null>(null);
  const [report, setReport] = useState<{ kind: "message"; msg: ChatMessage } | { kind: "room" } | null>(null);
  const [hiddenPeople, setHiddenPeople] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [text, setText] = useState("");
  const [teaFlights, setTeaFlights] = useState<{ id: number; from: number; to: number; go: boolean }[]>([]);
  const [musicOn, setMusicOn] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number | null>(null);
  const typingSent = useRef(false);

  const you = state.you;
  const members = state.members;
  const bySeat = new Map(members.map((m) => [m.seat, m]));
  const seatOf = (nickname: string) => members.find((m) => m.nickname === nickname)?.seat;

  /* ---------------- Konuşma balonları, yazıyor ve çay animasyonu ---------------- */
  useEffect(() => {
    const show = (nickname: string, text: string, typing: boolean) =>
      setBubbles((b) => {
        const next = { ...b, [nickname]: { text, typing, at: Date.now() } };
        // Aynı anda en fazla 4 balon: en eskiler kaybolur
        const keys = Object.keys(next).sort((a, z) => next[z].at - next[a].at);
        for (const k of keys.slice(MAX_BUBBLES)) delete next[k];
        return next;
      });
    const onMessage = (m: ChatMessage) => {
      show(m.nickname, m.text, false);
      window.setTimeout(() => setBubbles((b) => (b[m.nickname] && !b[m.nickname].typing && Date.now() - b[m.nickname].at >= BUBBLE_MS - 50 ? (({ [m.nickname]: _, ...rest }) => rest)(b) : b)), BUBBLE_MS);
    };
    const onTyping = (p: { nickname: string; isTyping: boolean }) => {
      if (p.isTyping) show(p.nickname, "", true);
      else setBubbles((b) => (b[p.nickname]?.typing ? (({ [p.nickname]: _, ...rest }) => rest)(b) : b));
    };
    const onTea = (p: { from: string; to: string }) => {
      const from = seatOf(p.from), to = seatOf(p.to);
      if (from === undefined || to === undefined) return;
      const id = Math.random();
      setTeaFlights((f) => [...f, { id, from, to, go: false }]);
      requestAnimationFrame(() => requestAnimationFrame(() => setTeaFlights((f) => f.map((x) => (x.id === id ? { ...x, go: true } : x)))));
      window.setTimeout(() => setTeaFlights((f) => f.filter((x) => x.id !== id)), 1100);
    };
    socket.on("message:new", onMessage);
    socket.on("typing", onTyping);
    socket.on("tea:offered", onTea);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("typing", onTyping);
      socket.off("tea:offered", onTea);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, members]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  /* ---------------- Fon müziği ---------------- */
  useEffect(() => {
    const pref = localStorage.getItem("sk_music");
    const vol = Number(localStorage.getItem("sk_volume") ?? "0.6");
    if (!Number.isNaN(vol)) setVolume(vol);
    if (pref === "on") setMusicOn(true);
  }, []);

  useEffect(() => {
    if (!ambience) return;
    ambience.setVolume(volume);
    if (!musicOn) {
      ambience.stop();
      setTrack(null);
      return;
    }
    let cancelled = false;
    ambience.start(theme.music, seedFromId(state.room.id)).then((t) => !cancelled && setTrack(t)).catch(() => setMusicOn(false));
    return () => {
      cancelled = true;
      ambience.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicOn, state.room.id, ambience, theme]);

  useEffect(() => {
    ambience?.setVolume(volume);
    localStorage.setItem("sk_volume", String(volume));
  }, [volume, ambience]);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    localStorage.setItem("sk_music", next ? "on" : "off");
  };

  /* ---------------- Eylemler ---------------- */
  const stopTyping = () => {
    if (typingSent.current) socket.emit("typing", { isTyping: false });
    typingSent.current = false;
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
  };
  const onType = (v: string) => {
    setText(v);
    if (!typingSent.current && v.trim()) {
      socket.emit("typing", { isTyping: true });
      typingSent.current = true;
    }
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(stopTyping, 3000);
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t) return;
    const pre = moderateMessage(t);
    if (!pre.ok) {
      setLog((l) => [...l, { kind: "warn", text: `⚠️ ${pre.message}` }]);
      return;
    }
    stopTyping();
    const r = await call(socket, "message:send", { text: t, replyToId: replyTo?.id, clientId: String(Date.now()) });
    if (r.ok) {
      setText("");
      setReplyTo(null);
    } else setLog((l) => [...l, { kind: "warn", text: `⚠️ ${r.error}` }]);
  };

  const offerTea = async (m: Member) => {
    setMenuFor(null);
    const r = await call(socket, "tea:offer", { to: m.nickname });
    if (!r.ok) setLog((l) => [...l, { kind: "warn", text: r.error }]);
  };

  const submitReport = async (reason: ReportReason, note: string) => {
    if (!report) return null;
    const r =
      report.kind === "message"
        ? await call(socket, "report:message", { messageId: report.msg.id, reason, note })
        : await call(socket, "report:room", { reason, note });
    if (!r.ok) return r.error;
    setReport(null);
    setLog((l) => [...l, { kind: "sys", text: "Bildirimin alındı, teşekkürler. Moderatörler inceleyecek." }]);
    return null;
  };

  /* ---------------- Görünüm ---------------- */
  const bubbleClass = (x: number) => (x < 200 ? " left" : x > 600 ? " right" : "");

  return (
    <div className="room-layout" onClick={() => setMenuFor(null)}>
      <div className="scene-wrap">
        <div className="room-head">
          <button onClick={onLeave}>← Köşeler</button>
          <div>
            <h2>{state.room.title}</h2>
            <div className="tag">{state.room.category} · {cityName} · sinide {theme.trayName} · {remaining(state.room.expiresAt)}</div>
          </div>
          <div className="spacer" />
          <button onClick={onRandom} title="Başka bir köşeye geç">🎲 Başka köşe</button>
          <button onClick={() => setReport({ kind: "room" })} title="Bu köşeyi bildir">🚩 Bildir</button>
        </div>

        <div className="scene">
          {/* Sabit sahne çizimi: kodda tanımlı, kullanıcı içeriği içermez */}
          <div className="bg" dangerouslySetInnerHTML={{ __html: sceneSvg }} />
          <svg className="people" viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} aria-hidden>
            {members.map((m) => <Avatar key={m.nickname} m={m} me={m.nickname === you.nickname} />)}
          </svg>
          <div className="overlay">
            {SEATS.map((s, i) =>
              bySeat.has(i) ? null : (
                <button key={i} className="empty-seat" aria-label={`${i + 1}. mindere geç`} style={{ left: pct(s.x, SCENE_W), top: pct(s.y + 22, SCENE_H) }}
                  onClick={(e) => { e.stopPropagation(); socket.emit("seat:change", { seat: i }); }} />
              ),
            )}
            {members.map((m) => {
              const s = SEATS[m.seat];
              const me = m.nickname === you.nickname;
              return (
                <button key={m.nickname} className={`nametag${me ? " me" : ""}`} style={{ left: pct(s.x, SCENE_W), top: pct(s.y + s.tag, SCENE_H), borderColor: m.color }}
                  title={m.nickname} onClick={(e) => { e.stopPropagation(); if (!me) setMenuFor(m); }}>
                  {m.isOwner ? "👑 " : ""}{m.nickname}{me ? " (sen)" : ""}
                </button>
              );
            })}
            {Object.entries(bubbles).map(([nick, b]) => {
              const seat = seatOf(nick);
              if (seat === undefined || hiddenPeople.has(nick)) return null;
              const s = SEATS[seat];
              return (
                <div key={nick + b.at} className={`bubble${b.typing ? " typing" : ""}${bubbleClass(s.x)}`} style={{ left: pct(s.x, SCENE_W), top: pct(s.y - 44, SCENE_H) }}>
                  {b.typing ? "•••" : b.text}
                </div>
              );
            })}
            {teaFlights.map((f) => {
              const at = SEATS[f.go ? f.to : f.from];
              return <div key={f.id} className="tea-fly" style={{ left: pct(at.x, SCENE_W), top: pct(at.y - 20, SCENE_H) }}>🍵</div>;
            })}
            {menuFor && (
              <div className="menu" style={{ left: pct(SEATS[menuFor.seat].x, SCENE_W), top: pct(SEATS[menuFor.seat].y + 50, SCENE_H) }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => offerTea(menuFor)}>☕ Çay ikram et</button>
                <button onClick={() => { setHiddenPeople((h) => new Set(h).add(menuFor.nickname)); setMenuFor(null); setLog((l) => [...l, { kind: "sys", text: `${menuFor.nickname} senin ekranında gizlendi.` }]); }}>🙈 Bu kişiyi gizle</button>
                <button onClick={() => {
                  const last = [...log].reverse().find((x) => x.kind === "msg" && x.msg.nickname === menuFor.nickname);
                  setMenuFor(null);
                  if (last && last.kind === "msg") setReport({ kind: "message", msg: last.msg });
                  else setLog((l) => [...l, { kind: "sys", text: "Bu kişinin bildirilecek bir mesajı yok. Köşeyi bildirebilirsin." }]);
                }}>🚩 Son mesajını bildir</button>
              </div>
            )}
          </div>
        </div>

        <div className="music">
          <button onClick={toggleMusic} aria-pressed={musicOn}>{musicOn ? "🔊 Fon müziği açık" : "🔈 Fon müziğini aç"}</button>
          {musicOn && (
            <>
              <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Ses düzeyi" />
              <span>🎵 {track ? `${track.title} · ${track.usul} usulü` : `${MAKAMS[theme.music.makam].label} · ${USULS[theme.music.usul].label}`}</span>
            </>
          )}
        </div>
      </div>

      <aside className="chat">
        <div className="chat-head">Sohbet <span>{members.length}/{state.room.capacity} kişi</span></div>
        <div className="log" ref={logRef} aria-live="polite">
          {log.map((item, i) => {
            if (item.kind === "sys") return <div key={i} className="msg sys">{item.text}</div>;
            if (item.kind === "warn") return <div key={i} className="msg warn">{item.text}</div>;
            const m = item.msg;
            if (m.hidden) return <div key={m.id} className="msg hidden">Bu mesaj bildirimler nedeniyle gizlendi.</div>;
            if (hiddenPeople.has(m.nickname)) return <div key={m.id} className="msg hidden">Gizlediğin bir kişinin mesajı.</div>;
            const mine = m.nickname === you.nickname;
            return (
              <div key={m.id} className="msg">
                {m.replyTo && <div className="reply">↪ {m.replyTo.nickname}: {m.replyTo.text}</div>}
                <b style={{ color: m.color }}>{m.nickname}{mine ? " (sen)" : ""}</b>
                {m.text}
                <span className="actions">
                  <button onClick={() => setReplyTo(m)} title="Yanıtla">↩</button>
                  {!mine && <button onClick={() => setReport({ kind: "message", msg: m })} title="Bildir">🚩</button>}
                </span>
              </div>
            );
          })}
        </div>
        {replyTo && (
          <div className="replying">
            <span>↪ {replyTo.nickname}: {replyTo.text.slice(0, 60)}</span>
            <button className="link" onClick={() => setReplyTo(null)}>İptal</button>
          </div>
        )}
        <form className="composer" onSubmit={send}>
          <input type="text" maxLength={300} placeholder="Bir şey yaz..." value={text} onChange={(e) => onType(e.target.value)} aria-label="Mesaj" autoComplete="off" />
          <button type="submit" className="primary">Gönder</button>
        </form>
        <div className="me-line">Bu köşede adın: <b>{you.nickname}</b>. Bir kişinin adına dokunup ona çay ikram edebilirsin.</div>
      </aside>

      {report && (
        <ReportModal
          target={report.kind === "room" ? "Bu köşeyi" : `${report.msg.nickname} kişisinin mesajını`}
          onClose={() => setReport(null)}
          onSubmit={submitReport}
        />
      )}
    </div>
  );
}

function Avatar({ m, me }: { m: Member; me: boolean }) {
  const s = SEATS[m.seat];
  const stroke = me ? { stroke: "#fff", strokeWidth: 3 } : {};
  return (
    <g transform={`translate(${s.x} ${s.y})`}>
      <ellipse cx="0" cy="20" rx="26" ry="6" fill="#000" opacity=".18" />
      <path d="M-22 18 Q-24 -8 0 -10 Q24 -8 22 18 Z" fill={m.color} {...stroke} />
      <circle cx="0" cy="-24" r="15" fill={m.skin} {...stroke} />
      <path d="M-15 -27 Q0 -46 15 -27 Q8 -34 0 -34 Q-8 -34 -15 -27 Z" fill="#3b2a1e" opacity=".85" />
      <circle cx="-5" cy="-23" r="1.8" fill="#3b2a1e" />
      <circle cx="5" cy="-23" r="1.8" fill="#3b2a1e" />
      <path d="M-5 -17 Q0 -13 5 -17" stroke="#3b2a1e" strokeWidth="1.6" fill="none" />
    </g>
  );
}
