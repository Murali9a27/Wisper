import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import next from "next";
import { setupSocket } from "./socket";
import { connectDB } from "./config/db";


const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();



app.prepare().then(async () => {

  await connectDB();
  const server = createServer((req, res) => {
    handler(req, res);
  });

  setupSocket(server);

  server.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
  });
});
