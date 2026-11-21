/** İstemci ile gerçek zamanlı sunucu arasındaki olaylar ve veri tipleri. */
import type { ReportReason } from "./constants";
import type { RejectReason } from "./moderation";

export interface RoomSummary {
  id: string;
  city: string;
  title: string;
  category: string;
  count: number;
  capacity: number;
  system: boolean;
  /** Kapanış zamanı (sistem köşelerinde null) */
  expiresAt: number | null;
  lastMessageAt: number | null;
}

export interface Member {
  nickname: string;
  color: string;
  skin: string;
  seat: number;
  isOwner: boolean;
}

export interface ChatMessage {
  id: string;
  nickname: string;
  color: string;
  text: string;
  ts: number;
  replyTo?: { id: string; nickname: string; text: string };
  hidden?: boolean;
  system?: boolean;
}

export interface RoomState {
  room: RoomSummary;
  you: Member;
  members: Member[];
  messages: ChatMessage[];
}

export type Ack<T = {}> = ({ ok: true } & T) | { ok: false; error: string; reason?: RejectReason | string };

export interface ClientToServer {
  "lobby:watch": (p: { city: string }, ack: (r: Ack<{ rooms: RoomSummary[]; online: number }>) => void) => void;
  "room:create": (p: { city: string; title: string; category: string }, ack: (r: Ack<{ state: RoomState }>) => void) => void;
  "room:join": (p: { roomId: string }, ack: (r: Ack<{ state: RoomState }>) => void) => void;
  "room:random": (p: { city: string; excludeRoomId?: string }, ack: (r: Ack<{ state: RoomState }>) => void) => void;
  "room:leave": () => void;
  "seat:change": (p: { seat: number }) => void;
  "message:send": (p: { text: string; replyToId?: string; clientId: string }, ack: (r: Ack<{ id: string }>) => void) => void;
  typing: (p: { isTyping: boolean }) => void;
  "tea:offer": (p: { to: string }, ack: (r: Ack) => void) => void;
  "report:message": (p: { messageId: string; reason: ReportReason; note?: string }, ack: (r: Ack) => void) => void;
  "report:room": (p: { reason: ReportReason; note?: string }, ack: (r: Ack) => void) => void;
}

export interface ServerToClient {
  "lobby:rooms": (p: { city: string; rooms: RoomSummary[]; online: number }) => void;
  "member:joined": (m: Member) => void;
  "member:left": (p: { nickname: string }) => void;
  "member:moved": (p: { nickname: string; seat: number }) => void;
  "message:new": (m: ChatMessage) => void;
  "message:hidden": (p: { id: string }) => void;
  typing: (p: { nickname: string; isTyping: boolean }) => void;
  "tea:offered": (p: { from: string; to: string }) => void;
  "room:closed": (p: { reason: "expired" | "idle" | "moderation" }) => void;
  notice: (p: { text: string }) => void;
}
