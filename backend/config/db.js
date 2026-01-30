import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tomato";
    await mongoose.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ Connected to MongoDB: ${mongoURL}`);
  } catch (err) {
    console.error("❌ DB connection error:", err);
  }
};
