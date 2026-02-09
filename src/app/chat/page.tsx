"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

/* Message Type */
interface ChatMessage {
  message: string;
  userId: string;
  time: string;
}

export default function ChatPage() {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);


  const roomId = "chat_demo";
  const userId = "user_1"; // Later we will make this dynamic

  useEffect(() => {
    // Connect once
    if (!socket.connected) {
      socket.connect();
    }

    // Join user + room
    socket.emit("user:join", userId);
    socket.emit("chat:join", { roomId });

    /* Receive messages */
    const handleMessage = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("chat:message", handleMessage);

    /* Receive online users */
    socket.on("users:online", (users: string[]) => {
      setOnlineUsers(users);
    });

    // Someone is typing
    socket.on("chat:typing", (user: string) => {
      setTypingUser(user);
    });

    // Someone stopped typing
    socket.on("chat:stop", () => {
      setTypingUser(null);
    });


    // Cleanup
    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("users:online");
      socket.off("chat:typing");
      socket.off("chat:stop");

    };
  }, []);

  /* Send message */
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("chat:message", {
      roomId,
      message,
      userId,
    });

    setMessage("");
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "auto" }}>
      <h2>Wisper Chat</h2>

      {/* Online Users */}
      <div style={{ marginBottom: 15 }}>
        <strong>Online Users:</strong>

        {onlineUsers.map((user) => (
          <span
            key={user}
            style={{
              marginLeft: 8,
              padding: "2px 6px",
              background: "#2ecc71",
              color: "white",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            {user}
          </span>
        ))}
      </div>
        


      {typingUser && typingUser !== userId && (
        <div style={{ fontStyle: "italic", color: "#666", marginBottom: 5 }}>
          {typingUser} is typing...
        </div>
      )}

      {/* Chat Messages */}
      <div
        style={{
          minHeight: 300,
          border: "1px solid #ccc",
          marginBottom: 15,
          padding: 10,
          overflowY: "auto",
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <strong>{msg.userId}</strong>: {msg.message}

            <div style={{ fontSize: 12, color: "#888" }}>
              {new Date(msg.time).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          style={{ flex: 1, padding: 8 }}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);

            socket.emit("chat:typing", {
              roomId,
              userId,
            });

            // Stop typing after 1s
            setTimeout(() => {
              socket.emit("chat:stop", {
                roomId,
                userId,
              });
            }, 1000);
          }}
          placeholder="Type message..."
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />


        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
