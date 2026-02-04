import { Server, Socket } from "socket.io";

const onlineUsers = new Map<string, string>();

export function setupSocket(server: any) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket: Socket) => {
    console.log("🟢 Connected:", socket.id);

    // ============================
    // User Join
    // ============================
    socket.on("user:join", (userId: string) => {
      socket.data.userId = userId; // ✅ attach user to socket
      onlineUsers.set(userId, socket.id);

      console.log(`✅ User online: ${userId}`);
    });

    // ============================
    // Join Room
    // ============================
    socket.on("chat:join", ({ roomId }) => {
      socket.join(roomId);
      console.log(`📥 Joined room: ${roomId}`);
    });

    // ============================
    // Message Handler
    // ============================
    socket.on("chat:message", ({ roomId, message }) => {
      const msgData = {
        message,
        userId: socket.data.userId,
        time: Date.now(),
      };

      // Send to ALL users in room (including sender)
      io.to(roomId).emit("chat:message", msgData);
    });

    // ============================
    // Disconnect
    // ============================
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
