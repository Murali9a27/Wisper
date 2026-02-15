    import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  throw new Error("❌ MONGO_URI not found in .env file");
}

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Error:", error);
    process.exit(1);
  }
}
