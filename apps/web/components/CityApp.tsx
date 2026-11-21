"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, Member, RoomState, RoomSummary } from "@sark/shared";
import { call, getSocket } from "@/lib/realtime";
import { Ambience } from "@/lib/ambience";
import { CreateRoomModal } from "./Modals";
import RoomView, { type LogItem } from "./RoomView";

interface Props {
  city: string;
  cityName: string;
  genitive: string;
}

export function remaining(expiresAt: number | null): string {
  if (!expiresAt) return "Sürekli açık";
  const ms = expiresAt - Date.now();
  if (ms <= 0) return "Kapanıyor";
  const h = Math.floor(ms / 3600000);
  return h >= 1 ? `${h} sa kaldı` : `${Math.max(1, Math.floor(ms / 60000))} dk kaldı`;
}

export default function CityApp({ city, cityName, genitive }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"connecting" | "ready" | "error">("connecting");
  const [fatal, setFatal] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [online, setOnline] = useState(0);
  const [state, setState] = useState<RoomState | null>(null);
  const [log, setLog] = useState<LogItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const ambience = useRef<Ambience | null>(null);
  const stateRef = useRef<RoomState | null>(null);
  stateRef.current = state;

  const socket = getSocket();
  ambience.current ??= typeof window !== "undefined" ? new Ambience() : null;

  const setUrlRoom = (roomId: string | null) => {
    const url = new URL(window.location.href);
    if (roomId) url.searchParams.set("kose", roomId);
    else url.searchParams.delete("kose");
    window.history.replaceState(null, "", url);
  };

  const enter = useCallback((s: RoomState, note?: string) => {
    setState(s);
    const items: LogItem[] = s.messages.map((m) => ({ kind: "msg", msg: m }));
    items.push({ kind: "sys", text: `"${s.room.title}" köşesine oturdun. Adın burada: ${s.you.nickname}. Kurallara uymayı unutma 🙂` });
    if (note) items.push({ kind: "sys", text: note });
    setLog(items);
    setUrlRoom(s.room.id);
  }, []);

  const backToLobby = useCallback((note?: string) => {
    setState(null);
    setLog([]);
    setUrlRoom(null);
    ambience.current?.stop();
    if (note) setLobbyError(note);
  }, []);

  /* ---------------- Bağlantı ve olaylar ---------------- */
  useEffect(() => {
    const watch = async () => {
      const r = await call(socket, "lobby:watch", { city });
      if (r.ok) {
        setRooms(r.rooms);
        setOnline(r.online);
        setStatus("ready");
        const wanted = new URL(window.location.href).searchParams.get("kose");
        if (wanted && !stateRef.current) {
          const j = await call(socket, "room:join", { roomId: wanted });
          if (j.ok) enter(j.state);
          else {
            setUrlRoom(null);
            setLobbyError(j.error);
          }
        }
      }
    };
    const onConnect = () => watch();
    const onError = (err: Error & { data?: { reason?: string; until?: string | null } }) => {
      if (err.message === "consent_required") {
        router.replace("/");
        return;
      }
      if (err.message === "banned") {
        const until = err.data?.until ? new Date(err.data.until).toLocaleString("tr-TR") : null;
        setFatal(`Topluluk kurallarını ihlal ettiğin için geçici olarak uzaklaştırıldın.${until ? ` Bitiş: ${until}.` : ""} İtiraz için İletişim sayfasını kullanabilirsin.`);
        setStatus("error");
        return;
      }
      setStatus("error");
    };
    const onLobby = (p: { city: string; rooms: RoomSummary[]; online: number }) => {
      if (p.city !== city) return;
      setRooms(p.rooms);
      setOnline(p.online);
    };
    const onJoined = (m: Member) => {
      setState((s) => (s ? { ...s, members: [...s.members.filter((x) => x.nickname !== m.nickname), m] } : s));
      setLog((l) => [...l, { kind: "sys", text: `${m.nickname} köşeye oturdu.` }]);
    };
    const onLeft = (p: { nickname: string }) => {
      setState((s) => (s ? { ...s, members: s.members.filter((x) => x.nickname !== p.nickname) } : s));
      setLog((l) => [...l, { kind: "sys", text: `${p.nickname} köşeden kalktı.` }]);
    };
    const onMoved = (p: { nickname: string; seat: number }) => {
      setState((s) =>
        s
          ? {
              ...s,
              you: s.you.nickname === p.nickname ? { ...s.you, seat: p.seat } : s.you,
              members: s.members.map((x) => (x.nickname === p.nickname ? { ...x, seat: p.seat } : x)),
            }
          : s,
      );
    };
    const onMessage = (m: ChatMessage) => setLog((l) => [...l, { kind: "msg", msg: m }]);
    const onHidden = (p: { id: string }) =>
      setLog((l) => l.map((x) => (x.kind === "msg" && x.msg.id === p.id ? { ...x, msg: { ...x.msg, hidden: true, text: "" } } : x)));
    const onTea = (p: { from: string; to: string }) => {
      setLog((l) => [...l, { kind: "sys", text: `☕ ${p.from}, ${p.to} için çay koydu.` }]);
      ambience.current?.clink(0.06);
    };
    const onClosed = (p: { reason: string }) => {
      const text =
        p.reason === "expired" ? "Bu köşenin 24 saatlik süresi doldu." : p.reason === "idle" ? "Köşe uzun süre sessiz kaldığı için kapandı." : "Köşe moderasyon nedeniyle kapatıldı.";
      backToLobby(text);
    };
    const onNotice = (p: { text: string }) => setLog((l) => [...l, { kind: "warn", text: p.text }]);

    socket.on("connect", onConnect);
    socket.on("connect_error", onError);
    socket.on("lobby:rooms", onLobby);
    socket.on("member:joined", onJoined);
    socket.on("member:left", onLeft);
    socket.on("member:moved", onMoved);
    socket.on("message:new", onMessage);
    socket.on("message:hidden", onHidden);
    socket.on("tea:offered", onTea);
    socket.on("room:closed", onClosed);
    socket.on("notice", onNotice);
    if (socket.connected) watch();
    else socket.connect();
    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
      socket.off("lobby:rooms", onLobby);
      socket.off("member:joined", onJoined);
      socket.off("member:left", onLeft);
      socket.off("member:moved", onMoved);
      socket.off("message:new", onMessage);
      socket.off("message:hidden", onHidden);
      socket.off("tea:offered", onTea);
      socket.off("room:closed", onClosed);
      socket.off("notice", onNotice);
      if (stateRef.current) socket.emit("room:leave");
      ambience.current?.stop();
    };
  }, [city, socket, router, enter, backToLobby]);

  /* ---------------- Eylemler ---------------- */
  const join = async (roomId: string) => {
    setLobbyError(null);
    const r = await call(socket, "room:join", { roomId });
    if (r.ok) enter(r.state, r.state.room.id !== roomId ? "Köşe doluydu, aynı konudaki bir sonraki köşeye oturdun." : undefined);
    else setLobbyError(r.error);
  };
  const random = async (excludeRoomId?: string) => {
    setLobbyError(null);
    const r = await call(socket, "room:random", { city, excludeRoomId });
    if (r.ok) enter(r.state);
    else (stateRef.current ? setLog((l) => [...l, { kind: "warn", text: r.error }]) : setLobbyError(r.error));
  };
  const leave = () => {
    socket.emit("room:leave");
    backToLobby();
  };

  if (fatal) {
    return (
      <div className="container">
        <p className="error">{fatal}</p>
        <Link href="/sehir">Şehir seçimine dön</Link>
      </div>
    );
  }

  if (state) {
    return (
      <RoomView
        city={city}
        cityName={cityName}
        state={state}
        log={log}
        setLog={setLog}
        ambience={ambience.current}
        onLeave={leave}
        onRandom={() => random(state.room.id)}
      />
    );
  }

  return (
    <div className="container">
      <div className="lobby-top">
        <h1>{genitive} köşeleri</h1>
        <span className="muted small">🟢 {online} kişi burada</span>
        <div className="spacer" />
        <Link href="/sehir" className="pill">Şehir değiştir</Link>
        <button onClick={() => setCreating(true)} disabled={status !== "ready"}>+ Köşe aç</button>
        <button className="primary" onClick={() => random()} disabled={status !== "ready"}>🎲 Rastgele bir köşeye otur</button>
      </div>
      {status === "connecting" && <p className="muted">Bağlanıyor...</p>}
      {status === "error" && <p className="error">Sohbet sunucusuna bağlanılamadı. Birazdan otomatik olarak tekrar denenecek.</p>}
      {lobbyError && <p className="error">{lobbyError}</p>}
      <div className="room-grid">
        {rooms.map((r) => (
          <button key={r.id} className="room-card" onClick={() => join(r.id)} disabled={status !== "ready"}>
            <div className="cat">{r.category}{r.system ? " · ⭐ Sabit köşe" : ""}</div>
            <div className="topic">{r.title}</div>
            <div className="seats" aria-label={`${r.count} / ${r.capacity} kişi`}>
              {Array.from({ length: r.capacity }, (_, i) => <div key={i} className={`seat ${i < r.count ? "full" : ""}`} />)}
            </div>
            <div className="meta">
              <span>{r.count}/{r.capacity} kişi</span>
              <span>{remaining(r.expiresAt)}</span>
            </div>
          </button>
        ))}
      </div>
      {creating && (
        <CreateRoomModal
          cityName={cityName}
          onClose={() => setCreating(false)}
          onCreate={async (title, category) => {
            const r = await call(socket, "room:create", { city, title, category });
            if (r.ok) {
              setCreating(false);
              enter(r.state);
              return null;
            }
            return r.error;
          }}
        />
      )}
    </div>
  );
}
