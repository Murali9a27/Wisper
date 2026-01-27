"use client";

import { useState } from "react";

export default function ChatPreview() {
  const [message, setMessage] = useState("");

  return (
    <div style={{ marginTop: "20px" }}>
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <p>You typed: {message}</p>
    </div>
  );
}
