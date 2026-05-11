 // share carts
// let orders = [];

// PLACE ORDER
import { supabase } from "../config/supabase.js";

export const placeOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 🛒 fetch cart
    const { data: cartItems, error: cartError } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", userId);

    if (cartError) {
      return res.status(400).json({
        message: cartError.message,
      });
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    // 🔍 get product prices
    const productIds = cartItems.map((item) => item.product_id);

    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, price")
      .in("id", productIds);

    if (productError) {
      return res.status(400).json({
        message: productError.message,
      });
    }

    // 🧠 create map
    const priceMap = {};
    products.forEach((p) => {
      priceMap[p.id] = p.price;
    });

    // 💰 calculate total securely
    let totalAmount = 0;

    for (const item of cartItems) {
      const price = priceMap[item.product_id];

      if (!price) {
        return res.status(400).json({
          message: `Invalid product: ${item.product_id}`,
        });
      }

      totalAmount += price * item.quantity;
    }

    // 📦 create order logic - FIXED for Lowercase Payment Status
    req.body.payment_status = "pending";
    const payment_status = "pending";
    const payment_method = req.body.payment_method || "COD";
    
    console.log("PAYMENT STATUS:", payment_status);
    console.log("USER:", req.user);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: userId,
          buyer_id: userId,
          total_amount: totalAmount,
          status: "placed",
          payment_method: payment_method,
          payment_status: payment_status,
          address_id: req.body.address_id
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error("Order Insert Error:", orderError);
      return res.status(400).json({ message: orderError.message });
    }

    // 📝 create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      quantity: item.quantity
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order Items Insert Error:", itemsError);
      // We still keep the order, but items failed. In production, use a transaction.
    }

    // 🧹 clear cart
    await supabase.from("cart").delete().eq("user_id", userId);

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });

  } catch (error) {
    next(error);
  }
};


// GET ORDERS
export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: userOrders, error } = await supabase
      .from("orders")
      .select(`
        *,
        addresses ( full_name, address_line1, city, pincode ),
        order_items ( id, product_name, quantity, price )
      `)
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch Orders Error:", error);
      return res.status(500).json({ message: error.message });
    }

    res.json({ orders: userOrders });
  } catch (error) {
    console.error("Get Orders Exception:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// TRACK ORDER
export const trackOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Parse the ID (assuming it's an integer based on the schema seen)
    // If users can search by shortened IDs, we just check the exact match on ID
    // Note: We don't require authentication here so anyone with the ID can track it
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id, buyer_id, created_at, total_amount, status, payment_method, payment_status,
        addresses ( full_name, address_line1, city, state, pincode ),
        order_items ( id, product_name, quantity, price )
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({ message: "Order not found or invalid Order ID" });
    }

    // Security: Check if user is the owner
    const isOwner = req.user && req.user.id === order.buyer_id;
    
    // If not owner, mask/remove sensitive delivery address
    let deliveryAddress = null;
    if (isOwner) {
      deliveryAddress = order.addresses;
    } else {
      deliveryAddress = {
        city: order.addresses?.city,
        state: order.addresses?.state,
        pincode: order.addresses?.pincode ? order.addresses.pincode.substring(0, 3) + "***" : null,
        note: "Full address hidden for privacy"
      };
    }

    // Generate dynamic timeline based on status
    const statuses = ['placed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
    const statusLabels = {
      placed: 'Order Placed',
      processing: 'Packed',
      shipped: 'Shipped',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered'
    };
    const statusDescriptions = {
      placed: 'Your order has been placed successfully',
      processing: 'Your order has been packed and is ready to ship',
      shipped: 'Your order has been shipped',
      out_for_delivery: 'Your order is out for delivery',
      delivered: 'Your order has been delivered successfully'
    };

    let currentStatusIndex = statuses.indexOf(order.status?.toLowerCase());
    if (currentStatusIndex === -1) currentStatusIndex = 0; // Default to placed

    const timeline = [];
    const createdDate = new Date(order.created_at);
    
    for (let i = 0; i <= currentStatusIndex; i++) {
      const statusKey = statuses[i];
      // Add fake time increments for demonstration based on created_at
      const stepDate = new Date(createdDate.getTime() + (i * 24 * 60 * 60 * 1000));
      
      timeline.push({
        status: statusKey,
        label: statusLabels[statusKey],
        description: statusDescriptions[statusKey],
        date: stepDate.toISOString(),
        completed: true
      });
    }

    // Add remaining steps as pending
    for (let i = currentStatusIndex + 1; i < statuses.length; i++) {
      const statusKey = statuses[i];
      // Estimated future dates
      const stepDate = new Date(createdDate.getTime() + (i * 24 * 60 * 60 * 1000));
      timeline.push({
        status: statusKey,
        label: statusLabels[statusKey],
        description: '',
        date: stepDate.toISOString(),
        completed: false
      });
    }

    res.json({
      orderId: order.id,
      orderDate: order.created_at,
      paymentMethod: order.payment_method === 'cod' ? 'COD' : 'UPI',
      totalAmount: order.total_amount,
      status: order.status || 'placed',
      deliveryAddress: deliveryAddress,
      orderItems: order.order_items,
      timeline
    });

  } catch (error) {
    next(error);
  }
};
// UPDATE PAYMENT STATUS - Enhanced with Transaction ID and Payments record
export const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { transaction_id, payment_method } = req.body;

    if (!transaction_id) {
      return res.status(400).json({ message: "Transaction ID required" });
    }

    const userId = req.user?.id;
    if (!userId) {
       return res.status(401).json({ message: "Authentication required" });
    }

    // 🔍 Verify order ownership
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("buyer_id, payment_status")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.buyer_id !== userId) {
      return res.status(403).json({ message: "Access denied: You do not own this order" });
    }

    if (order.payment_status === "paid") {
       return res.status(400).json({ message: "Order is already paid" });
    }

    // update orders
    const { data: updatedOrder, error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "confirmed",
        payment_method: payment_method || "UPI",
        transaction_id: transaction_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (orderError) {
      console.error("Order Update Error:", orderError);
      return res.status(500).json({ message: orderError.message });
    }

    // insert into payments table
    const { error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          order_id: orderId,
          transaction_id,
          payment_method: "UPI",
          payment_status: "paid",
        },
      ]);

    if (paymentError) {
      console.error("Payment Insert Error:", paymentError);
      // We don't necessarily want to fail the whole request if only the log fails, 
      // but the user wants success verification.
    }

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Update Payment Status Exception:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
