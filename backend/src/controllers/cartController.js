//  export let carts = [];
 import { supabase } from "../config/supabase.js";

// ADD TO CART
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let { productId, quantity } = req.body;

    // 🔒 Validation
    if (!productId || quantity === undefined) {
      return res.status(400).json({
        message: "productId and quantity required",
      });
    }

    const qtyNum = parseInt(quantity, 10);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({
        message: "Invalid quantity",
      });
    }

    productId = String(productId).trim();

    // 🔍 Check product exists (IMPORTANT SECURITY)
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // 🔍 Check if already in cart
    const { data: existingItem } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .single();

    if (existingItem) {
      // 🔄 update quantity
      const newQty = existingItem.quantity + qtyNum;

      const { error: updateError } = await supabase
        .from("cart")
        .update({ quantity: newQty })
        .eq("id", existingItem.id);

      if (updateError) {
        return res.status(400).json({
          message: updateError.message,
        });
      }
    } else {
      // ➕ insert new item
      const { error: insertError } = await supabase
        .from("cart")
        .insert([
          {
            user_id: userId,
            product_id: productId,
            quantity: qtyNum,
          },
        ]);

      if (insertError) {
        return res.status(400).json({
          message: insertError.message,
        });
      }
    }

    res.json({
      message: "Added to cart successfully",
    });

  } catch (error) {
    next(error);
  }
};











// 🛒 GET CART (user specific)
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔍 fetch cart with product details (JOIN)
    const { data, error } = await supabase
      .from("cart")
      .select(`
        id,
        quantity,
        products (
          id,
          name,
          price
        )
      `)
      .eq("user_id", userId);

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.json({
      cart: data,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// REMOVE ITEM
export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    next(error);
  }
};
