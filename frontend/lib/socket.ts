"use client"

import { io, type Socket } from "socket.io-client"

const BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5000"

let socket: Socket | null = null

/** Shared singleton socket. The httpOnly JWT cookie authenticates the handshake. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    })
  }
  return socket
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}
