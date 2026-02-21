import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Message from "./model/Message";
import Group from "./model/Group";

const onlineUsers = new Map<string, string>();

export function setupSocket(server: any) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  // ============================
  // 🔐 JWT AUTH MIDDLEWARE
  // ============================
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    try {
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      );

      socket.data.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  // ============================
  // CONNECTION
  // ============================
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;

    console.log("🟢 Connected:", userId);

    onlineUsers.set(userId, socket.id);

    io.emit("users:online", Array.from(onlineUsers.keys()));

    // ============================
    // PRIVATE MESSAGE
    // ============================
    socket.on("chat:message", async ({ receiverId, content }) => {
      try {
        const senderId = userId;

        const savedMsg = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content,
          status: "sent",
        });

        const receiverSocket = onlineUsers.get(receiverId);

        if (receiverSocket) {
          savedMsg.status = "delivered";
          await savedMsg.save();

          io.to(receiverSocket).emit("chat:message", savedMsg);

          socket.emit("message:status:update", {
            messageId: savedMsg._id,
            status: "delivered",
          });
        } else {
          socket.emit("chat:message", savedMsg);
        }
      } catch (err) {
        console.error("Message error:", err);
      }
    });

    // ============================
    // PRIVATE CHAT HISTORY
    // ============================
    socket.on("chat:history", async ({ otherUserId }) => {
      try {
        const messages = await Message.find({
          $or: [
            { sender: userId, receiver: otherUserId },
            { sender: otherUserId, receiver: userId },
          ],
        })
          .sort({ createdAt: 1 })
          .limit(100);

        socket.emit("chat:history", messages);
      } catch (err) {
        console.error("History error:", err);
      }
    });

    // ============================
    // READ RECEIPT (PRIVATE)
    // ============================
    socket.on("message:seen", async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);

        if (!message) return;

        if (message.receiver?.toString() !== userId) return;

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
      } catch (err) {
        console.error("Seen error:", err);
      }
    });

    // ============================
    // GROUP JOIN
    // ============================
    socket.on("group:join", async (groupId: string) => {
      try {
        const group = await Group.findById(groupId);

        if (!group) return;

        const isMember = group.members.some(
          (member: mongoose.Types.ObjectId) =>
            member.toString() === userId
        );

        if (!isMember) {
          return socket.emit("error", "Not authorized");
        }

        socket.join(groupId);

        console.log(`📥 User ${userId} joined group ${groupId}`);
      } catch (err) {
        console.error("Group join error:", err);
      }
    });

    // ============================
    // GROUP MESSAGE
    // ============================
    socket.on("group:message", async ({ groupId, content }) => {
      try {
        const group = await Group.findById(groupId);

        if (!group) return;

        const isMember = group.members.some(
          (member: mongoose.Types.ObjectId) =>
            member.toString() === userId
        );

        if (!isMember) return;

        const message = await Message.create({
          sender: userId,
          group: groupId,
          content,
          status: "sent",
        });

        io.to(groupId).emit("group:message", message);
      } catch (err) {
        console.error("Group message error:", err);
      }
    });

    // ============================
    // DISCONNECT
    // ============================
    socket.on("disconnect", () => {
      console.log("🔴 Disconnected:", userId);

      onlineUsers.delete(userId);

      io.emit("users:online", Array.from(onlineUsers.keys()));
    });
  });
}