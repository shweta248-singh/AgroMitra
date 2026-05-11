import { generateQR } from "../utils/qrGenerator.js";
import { orders } from "./orderController.js";
import { callDeliveryAPI } from "../services/deliveryService.js";
import { supabase } from "../config/supabase.js";
//create payment

export const createPayment = async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.body;

  const order = orders.find((o) => o.id === orderId);

  //  security checks
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.userId !== userId) {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  if (order.status === "PAID") {
    return res.status(400).json({ message: "Already paid" });
  }

  const qr = await generateQR("merchant@upi", order.totalAmount);

  res.json({
    message: "Scan QR to pay",
    qr,
    amount: order.totalAmount,
  });
};

//verify payment

export const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, transactionId } = req.body;

    // 🔒 basic validation
    if (!orderId || !transactionId) {
      return res.status(400).json({
        message: "orderId and transactionId required",
      });
    }

    if (!transactionId.startsWith("TXN")) {
      return res.status(400).json({
        message: "Invalid transaction format",
      });
    }

    // 🔍 fetch order from DB
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // 🔐 ownership check
    if (order.user_id !== userId) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    // 🚫 already paid check
    if (order.status === "PAID") {
      return res.status(400).json({
        message: "Already verified",
      });
    }

    // 🔁 duplicate transaction check
    const { data: existingTxn } = await supabase
      .from("orders")
      .select("id")
      .eq("transaction_id", transactionId)
      .single();

    if (existingTxn) {
      return res.status(400).json({
        message: "Duplicate transaction",
      });
    }

    // 💳 update order
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        transaction_id: transactionId,
      })
      .eq("id", orderId);

    if (updateError) {
      return res.status(400).json({
        message: updateError.message,
      });
    }

    // 🚚 call delivery (mock but structured)
    const updatedOrder = {
      ...order,
      status: "PAID",
      transaction_id: transactionId,
    };

    await callDeliveryAPI(updatedOrder);

    res.json({
      message: "Payment verified & order confirmed",
      order: updatedOrder,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};