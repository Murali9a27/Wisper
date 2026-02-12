"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

/* Message Type */
interface ChatMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  time: string;
  status: "sent" | "delivered" | "seen";
}

// Generate random user id
function generateUserId() {
  return "user_" + Math.floor(Math.random() * 10000);
}

export default function ChatPage() {
  const [userId] = useState(generateUserId);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const roomId = "chat_demo";

  // TEMP: for demo (first online user except me)
  const receiver = onlineUsers.find((u) => u !== userId);

  // ============================
  // Connect Socket
  // ============================
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("user:join", userId);
    socket.emit("chat:join", { roomId });

    // Receive messages
    socket.on("chat:message", (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);

      // Mark as seen
      socket.emit("message:seen", {
        messageId: data.id,
        to: data.from,
      });
    });

    // Online users
    socket.on("users:online", (users: string[]) => {
      setOnlineUsers(users);
    });

    // Delivered
    socket.on("message:delivered", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status: "delivered" } : m
        )
      );
    });

    // Seen
    socket.on("message:seen", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status: "seen" } : m
        )
      );
    });

    return () => {
      socket.off();
    };
  }, [userId]);

  // ============================
  // Send Message
  // ============================
  const sendMessage = () => {
    if (!message.trim() || !receiver) return;

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      from: userId,
      to: receiver,
      message,
      time: new Date().toISOString(),
      status: "sent",
    };

    // Optimistic UI
    // setMessages((prev) => [...prev, msg]);

    socket.emit("chat:message", {
      ...msg,
      roomId,
    });

    setMessage("");
  };

  // Enter key support
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // ============================
  // UI
  // ============================
  return (
    <div style={{ padding: 20, maxWidth: 500 }}>

      <h2>Wisper Chat</h2>

      <p>
        <b>You:</b> {userId}
      </p>

      <p>
        <b>Online:</b> {onlineUsers.join(", ")}
      </p>

      <div
        style={{
          minHeight: 300,
          border: "1px solid #ccc",
          padding: 10,
          marginBottom: 10,
          overflowY: "auto",
        }}
      >
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: 8 }}>
            <b>{msg.from === userId ? "Me" : msg.from}</b>:{" "}
            {msg.message}

            <span style={{ fontSize: 12, marginLeft: 6 }}>
              ({msg.status})
            </span>
          </div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Type message..."
        style={{ width: "75%" }}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
