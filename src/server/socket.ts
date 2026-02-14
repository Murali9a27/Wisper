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
    // Message Handler (FIXED)
    // ============================
    socket.on("chat:message", (data) => {
      const { id, from, to, message, time } = data;

      const payload = {
        id,
        from,
        to,
        message,
        time,
        status: "delivered",
      };

      const receiverSocket = onlineUsers.get(to);

      if (receiverSocket) {
        // Send to receiver
        io.to(receiverSocket).emit("chat:message", payload);

        // Send back to sender
        socket.emit("chat:message", {
          ...payload,
          status: "sent",
        });

        // Delivered
        socket.emit("message:delivered", {
          messageId: id,
        });
      }
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

    // ============================
    // Seen
    // ============================
    socket.on("message:seen", (data) => {
      const { messageId, from, to } = data;

      const senderSocket = onlineUsers.get(from);

      if (senderSocket) {
        io.to(senderSocket).emit("message:seen", {
          messageId,
        });
      }
    });
    


  });
}
