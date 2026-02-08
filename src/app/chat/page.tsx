"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

export default function ChatPage() {
  interface ChatMessage {
    message: string;
    userId: string;
    time: string;
  }

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);


  const roomId = "chat_demo";

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("user:join", "user_1");
    socket.emit("chat:join", { roomId });

    const handleMessage = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("chat:message", handleMessage);

    return () => {
      socket.off("chat:message", handleMessage);
    };
  }, []);


  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("chat:message", {
      roomId,
      message,
      userId: "user_1",
    });

    setMessage("");
  };


  return (
    <div style={{ padding: 20 }}>
      <h2>Wisper Chat</h2>

      <div style={{ minHeight: 200, border: "1px solid #ccc", marginBottom: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <strong>{msg.userId}</strong>: {msg.message}
            <div style={{ fontSize: 12, color: "#666" }}>
              {new Date(msg.time).toLocaleTimeString()}
            </div>
          </div>
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
