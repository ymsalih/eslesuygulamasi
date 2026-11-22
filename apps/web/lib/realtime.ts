"use client";
import { io, type Socket } from "socket.io-client";
import type { ClientToServer, ServerToClient } from "@sark/shared";

export type AppSocket = Socket<ServerToClient, ClientToServer>;

export const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4000";

let socket: AppSocket | null = null;

/** Tek bir paylaşılan bağlantı. Onay çerezi tarayıcı tarafından otomatik gönderilir. */
export function getSocket(): AppSocket {
  socket ??= io(REALTIME_URL, { withCredentials: true, transports: ["websocket", "polling"], autoConnect: true });
  return socket;
}

/** Ack'li bir olayı Promise olarak gönderir. */
export function call<E extends keyof ClientToServer>(
  s: AppSocket,
  event: E,
  payload: Parameters<ClientToServer[E]>[0],
): Promise<Parameters<Extract<Parameters<ClientToServer[E]>[1], (...a: never[]) => unknown>>[0]> {
  return new Promise((resolve) => {
    (s.emit as unknown as (e: string, p: unknown, cb: (r: unknown) => void) => void)(event, payload, (r) => resolve(r as never));
  });
}
