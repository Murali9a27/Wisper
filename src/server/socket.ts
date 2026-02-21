import { Server, Socket } from "socket.io";
import Message from "./model/Message";
import Group from "./model/Group"


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
    socket.on("chat:message", async (data) => {
      try {
        const {
          id,
          from,
          to,
          message,
          time,
          roomId,
        } = data;

        // 1️⃣ Save to DB
        const savedMsg = await Message.create({
          from,
          to,
          message,
          roomId,
          status: "sent",
        });

        // 2️⃣ Send to room
        io.to(roomId).emit("chat:message", {
          id: savedMsg._id,
          from,
          to,
          message,
          time,
          roomId,
          status: savedMsg.status,
        });

        // 3️⃣ Mark delivered if online
        const receiverSocket = onlineUsers.get(to);

        if (receiverSocket) {
          await Message.findByIdAndUpdate(savedMsg._id, {
            status: "delivered",
          });

          io.to(receiverSocket).emit("message:delivered", {
            messageId: savedMsg._id,
          });
        }

      } catch (err) {
        console.error("Message save error:", err);
      }
    });

    socket.on("chat:history", async ({ roomId }) => {
      const messages = await Message.find({ roomId })
        .sort({ createdAt: 1 })
        .limit(100);

      socket.emit("chat:history", messages);
    });

    socket.on("message:seen", async ({ messageId }) => {
      await Message.findByIdAndUpdate(messageId, {
        status: "seen",
      });

      io.emit("message:seen", { messageId });
    });

    socket.on("group:join", async (groupId) => {
      const userId = socket.data.userId;

      const group = await Group.findById(groupId);

      if (!group) return;

      const isMember = group.members.includes(userId);

      if (!isMember) {
        return socket.emit("error", "Not authorized");
      }

      socket.join(groupId);
    });

    socket.on("group:message", async ({ groupId, content }) => {
      const userId = socket.data.userId;

      const group = await Group.findById(groupId);

      if (!group) return;

      const isMember = group.members.includes(userId);
      if (!isMember) return;

      const message = await Message.create({
        sender: userId,
        groupId,
        content,
      });

      io.to(groupId).emit("group:message", message);
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
