import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  placeOrder,
  verrifyOrder,
  userOrders,
  listOrders,
  updateStatus,
  deleteOrder, // ✅ import this
} from "../controllers/orderController.js";

const orderRouter = express.Router();

// Place order — protected
orderRouter.post("/place", authMiddleware, placeOrder);

// Verify order — public
orderRouter.post("/verify", verrifyOrder);

// Get user's orders — protected
orderRouter.post("/userorders", authMiddleware, userOrders);

// Get all orders — admin
orderRouter.get("/list", listOrders);

// Update status — admin
orderRouter.post("/status", updateStatus);

// ✅ Delete order — admin
orderRouter.post("/delete", deleteOrder);

export default orderRouter;
