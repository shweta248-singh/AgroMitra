// let products = []; // mock DB

// ADD PRODUCT (Farmer only)
import { supabase } from "../config/supabase.js";

export const addProduct = async (req, res) => {
  try {
    const { 
      name, 
      price, 
      description, 
      category_id, 
      unit, 
      stock_quantity, 
      min_order_quantity, 
      image_url 
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        message: "Product name and price are required",
      });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") + "-" + Date.now();

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name,
          slug,
          price: parseFloat(price),
          description: description || "",
          category_id: category_id || null,
          unit: unit || "kg",
          stock_quantity: parseInt(stock_quantity) || 0,
          min_order_quantity: parseInt(min_order_quantity) || 1,
          image_url: image_url || "",
          farmer_id: req.user.id, // Correct owner column
          is_active: true,
          is_approved: false,
        },
      ])
      .select();

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: data[0],
    });

  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).json({ message: "Server error while adding product" });
  }
};


// GET PRODUCTS (Public)
export const getProducts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(name),
        product_images(image_url)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({
      success: true,
      products: data,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET PRODUCT BY ID (Public)
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Requested ID:", id); // Console Debugging

    const { data: product, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(name),
        product_images(image_url, is_primary)
      `)
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({ message: "Product not found", error: error.message });
    }

    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};