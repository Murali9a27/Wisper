"use client";

import { useEffect } from "react";
import { useSocket } from "@/providers/SocketProvider";

import Link from "next/link";

export default function Navbar() {
  const socket = useSocket();

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    return () => {
      socket.off("connect");
    };
  }, [socket]);
  
  return (
    <nav style={{ padding: "16px", borderBottom: "1px solid #ddd" }}>
      <Link href="/" style={{ marginRight: "16px" }}>Wisper</Link>
      <Link href="/login" style={{ marginRight: "16px" }}>Login</Link>
      <Link href="/register" style={{ marginRight: "16px" }}>Register</Link>
      <Link href="/chat">Chat</Link>
    </nav>
  );
}
