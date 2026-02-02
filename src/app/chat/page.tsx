"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  const roomId = "chat_demo";

  useEffect(() => {
    socket.connect();
    socket.emit("user:join", "user_1");
    socket.emit("chat:join", { roomId });

    socket.on("chat:message", (data) => {
      setMessages((prev) => [...prev, data.message]);
    });

    return () => {
      socket.off("chat:message");
    };
  }, []);

  const sendMessage = () => {
    socket.emit("chat:message", {
      roomId,
      message,
    });
    setMessages((prev) => [...prev, message]);
    setMessage("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Wisper Chat</h2>

      <div>
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
