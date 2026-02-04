"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket;

interface ChatMessage {
  message: string;
  userId: string;
  time: number;
}

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const userId = "user_1"; // later make dynamic
  const roomId = "room_1";

  // ============================
  // Connect Socket
  // ============================
  useEffect(() => {
    socket = io("http://localhost:3001"); // your backend url

    socket.emit("user:join", userId);
    socket.emit("chat:join", { roomId });

    socket.on("chat:message", (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ============================
  // Send Message
  // ============================
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("chat:message", {
      roomId,
      message,
    });

    setMessage("");
  };

  // ============================
  // Enter Key Support
  // ============================
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Chat Room</h2>

      {/* Messages */}
      <div
        style={{
          height: "300px",
          border: "1px solid gray",
          padding: "10px",
          overflowY: "auto",
          marginBottom: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.userId}:</strong> {msg.message}
          </div>
        ))}
      </div>

      {/* Input */}
      <input
        type="text"
        placeholder="Type message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        style={{ width: "70%", padding: "5px" }}
      />

      {/* Button */}
      <button
        onClick={sendMessage}
        style={{ marginLeft: "10px", padding: "5px 15px" }}
      >
        Send
      </button>
    </div>
  );
}
