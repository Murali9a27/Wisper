"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  status: "sent" | "delivered" | "seen";
}

function parseJwt(token: string) {
  const decoded = JSON.parse(atob(token.split(".")[1]));
  return { id: decoded.userId };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [text, setText] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const user = token ? parseJwt(token) : null;
  const userId = user?.id;

  const receiverId = onlineUsers.find((id) => id !== userId);

  // CONNECT
  useEffect(() => {
    if (!token) return;

    socket.auth = { token };
    socket.connect();

    socket.on("users:online", setOnlineUsers);

    socket.on("chat:message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("chat:history", (msgs: Message[]) => {
      setMessages(msgs);
    });

    socket.on(
      "message:status:update",
      ({ messageId, status }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId ? { ...m, status } : m
          )
        );
      }
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  // LOAD HISTORY
  useEffect(() => {
    if (!receiverId) return;
    socket.emit("chat:history", {
      otherUserId: receiverId,
    });
  }, [receiverId]);

  // AUTO SEEN
  useEffect(() => {
    messages.forEach((msg) => {
      if (
        msg.receiver === userId &&
        msg.status === "delivered"
      ) {
        socket.emit("message:seen", {
          messageId: msg._id,
        });
      }
    });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !receiverId) return;

    socket.emit("chat:message", {
      receiverId,
      content: text,
    });

    setText("");
  };

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
          border: "1px solid #ccc",
          height: 300,
          overflowY: "auto",
          padding: 10,
          marginBottom: 10,
        }}
      >
        {messages.map((msg) => (
          <div key={msg._id}>
            <b>
              {msg.sender === userId ? "Me" : msg.sender}
            </b>
            : {msg.content}
            <span style={{ fontSize: 12, marginLeft: 6 }}>
              ({msg.status})
            </span>
          </div>
        ))}
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        style={{ width: "75%" }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}