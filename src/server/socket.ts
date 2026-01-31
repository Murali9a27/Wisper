import { Server } from "socket.io";

export function setupSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: "*", // later restrict to your frontend URL
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });

  return io;
}
