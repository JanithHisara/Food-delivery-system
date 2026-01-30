import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js"; // ✅ Fix: correctly import cartRouter
import 'dotenv/config';
import orderRouter from "./routes/orderRoute.js";

// App configuration
const app = express();
const port = 4000;

// Middleware
app.use(express.json());
app.use(cors());

// Serve static images
app.use("/images", express.static("uploads"));

// Connect to MongoDB
connectDB();

// API routes
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

// Test route
app.get("/", (req, res) => {
    res.send("API working");
});

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
