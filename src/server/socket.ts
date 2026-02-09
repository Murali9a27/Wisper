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
      onlineUsers.set(userId, socket.id);

      console.log(`✅ User online: ${userId}`);

      io.emit("users:online", Array.from(onlineUsers.keys()));
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
    socket.on("chat:message", ({ roomId, message, userId }) => {
      const payload = {
        message,
        userId,
        time: new Date().toISOString(),
      };

      io.to(roomId).emit("chat:message", payload);
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

          io.emit("users:online", Array.from(onlineUsers.keys()));
          break;
        }
      }
    });

    // Typing start
    socket.on("chat:typing", ({ roomId, userId }) => {
      socket.to(roomId).emit("chat:typing", userId);
    });

    // Typing stop
    socket.on("chat:stop", ({ roomId, userId }) => {
      socket.to(roomId).emit("chat:stop", userId);
    });


  });
}
