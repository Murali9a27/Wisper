"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  const roomId = "chat_demo";

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);

      socket.emit("user:join", "user_1");
      socket.emit("chat:join", { roomId });
    });

    socket.on("chat:message", (data) => {
      console.log("📩 Received:", data.message);

      setMessages((prev) => [...prev, data.message]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;

    console.log("📤 Sending:", message);

    socket.emit("chat:message", {
      roomId,
      message,
    });

    setMessage("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Wisper Chat</h2>

      <div style={{ minHeight: 200, border: "1px solid #ccc", marginBottom: 10 }}>
        {messages.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message"
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
