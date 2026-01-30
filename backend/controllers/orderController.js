import orderModel from "../models/orderModel.js";
import userModal from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
  const frontend_url = "http://localhost:5174";
  try {
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });

    await newOrder.save();
    await userModal.findByIdAndUpdate(req.body.userId, { cartData: {} });

    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: { name: item.name },
        unit_amount: item.price * 100 * 80,
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: "inr",
        product_data: { name: "Delivery charges" },
        unit_amount: 2 * 100 * 80,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log("Place Order Error:", error);
    res.json({ success: false, message: "Error placing order." });
  }
};

const verrifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Paid." });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid." });
    }
  } catch (error) {
    console.log("Verify Order Error:", error);
    res.json({ success: false, message: "Error verifying order." });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log("User Orders Error:", error);
    res.json({ success: false, message: "Error fetching user orders." });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error." });
  }
};

const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, {
      status: req.body.status,
    });
    res.json({ success: true, message: "Status updated." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error." });
  }
};

const deleteOrder = async (req, res) => {
  try {
    await orderModel.findByIdAndDelete(req.body.orderId);
    res.json({ success: true, message: "Order deleted." });
  } catch (error) {
    console.log("Delete Order Error:", error);
    res.json({ success: false, message: "Error deleting order." });
  }
};

export {
  placeOrder,
  verrifyOrder,
  userOrders,
  listOrders,
  updateStatus,
  deleteOrder, // ✅ include deleteOrder in export
};
