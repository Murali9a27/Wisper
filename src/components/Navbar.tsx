"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav style={{ padding: "16px", borderBottom: "1px solid #ddd" }}>
      <Link href="/" style={{ marginRight: "16px" }}>Wisper</Link>
      <Link href="/login" style={{ marginRight: "16px" }}>Login</Link>
      <Link href="/register" style={{ marginRight: "16px" }}>Register</Link>
      <Link href="/chat">Chat</Link>
    </nav>
  );
}
