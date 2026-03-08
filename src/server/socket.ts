import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "./model/Message";

const onlineUsers = new Map<string, string>();

export function setupSocket(server: any) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  // 🔐 JWT AUTH
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));

    try {
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      );
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;

    onlineUsers.set(userId, socket.id);
    io.emit("users:online", Array.from(onlineUsers.keys()));

    // =====================
    // SEND MESSAGE
    // =====================
    socket.on("chat:message", async ({ receiverId, content }) => {
      try {
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content,
          status: "sent",
        });

        const receiverSocket = onlineUsers.get(receiverId);

        if (receiverSocket) {
          message.status = "delivered";
          await message.save();

          io.to(receiverSocket).emit("chat:message", message);

          socket.emit("message:status:update", {
            messageId: message._id,
            status: "delivered",
          });
        } else {
          socket.emit("chat:message", message);
        }
      } catch (err) {
        console.error(err);
      }
    });

    // =====================
    // CHAT HISTORY
    // =====================
    socket.on("chat:history", async ({ otherUserId }) => {
      const messages = await Message.find({
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId },
        ],
      }).sort({ createdAt: 1 });

      socket.emit("chat:history", messages);
    });

    // =====================
    // SEEN
    // =====================
    socket.on("message:seen", async ({ messageId }) => {
      const message = await Message.findById(messageId);
      if (!message) return;

      if (message.receiver.toString() !== userId) return;

      if (message.status !== "seen") {
        message.status = "seen";
        await message.save();
      }

      const senderSocket = onlineUsers.get(
        message.sender.toString()
      );

      if (senderSocket) {
        io.to(senderSocket).emit("message:status:update", {
          messageId,
          status: "seen",
        });
      }
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });
  });
}