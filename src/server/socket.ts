import { Server, Socket } from "socket.io";

interface User {
  userId: string;
  socketId: string;
}

const onlineUsers = new Map<string, string>();

export function setupSocket(server: any) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket: Socket) => {
    console.log("🟢 Connected:", socket.id);

    // User comes online
    socket.on("user:join", (userId: string) => {
      onlineUsers.set(userId, socket.id);
      console.log(`✅ User online: ${userId}`);
    });

    // Join chat room
    socket.on("chat:join", ({ roomId }) => {
      socket.join(roomId);
      console.log(`📥 Joined room: ${roomId}`);
    });

    // Receive message
    socket.on("chat:message", ({ roomId, message }) => {
      socket.to(roomId).emit("chat:message", {
        message,
        from: socket.id,
      });
    });

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected:", socket.id);

      for (const [userId, sId] of onlineUsers.entries()) {
        if (sId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`❌ User offline: ${userId}`);
          break;
        }
      }
    });
  });
}
