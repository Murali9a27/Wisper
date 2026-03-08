"use client";

import { createContext, useContext } from "react";
import { socket } from "@/lib/socket";

const SocketContext = createContext(socket);

export const useSocket = () => useContext(SocketContext);

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
