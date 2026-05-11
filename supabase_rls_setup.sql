-- AgroMitra Complete RLS Security Setup
-- Run this script in your Supabase SQL Editor

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_aadhaar_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- 2. Clean up any existing public/unsafe policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
-- (Add other drops if they existed to ensure a clean slate)

-- 3. PROFILES
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. PRODUCTS & IMAGES (Public read, Seller manage)
CREATE POLICY "Anyone can view products" 
ON products FOR SELECT USING (true);

CREATE POLICY "Sellers can insert products" 
ON products FOR INSERT WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Sellers can update their own products" 
ON products FOR UPDATE USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Sellers can delete their own products" 
ON products FOR DELETE USING (auth.uid() = farmer_id);

CREATE POLICY "Anyone can view product images" 
ON product_images FOR SELECT USING (true);

CREATE POLICY "Sellers can insert product images" 
ON product_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM products WHERE id = product_images.product_id AND farmer_id = auth.uid())
);

CREATE POLICY "Sellers can delete product images" 
ON product_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM products WHERE id = product_images.product_id AND farmer_id = auth.uid())
);

-- 5. CART ITEMS (Buyer manage)
CREATE POLICY "Users can view their own cart" 
ON cart_items FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can insert into their own cart" 
ON cart_items FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own cart" 
ON cart_items FOR UPDATE USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can delete from their own cart" 
ON cart_items FOR DELETE USING (auth.uid() = buyer_id);

-- 6. ADDRESSES (User manage)
CREATE POLICY "Users can view their own addresses" 
ON addresses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" 
ON addresses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" 
ON addresses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" 
ON addresses FOR DELETE USING (auth.uid() = user_id);

-- 7. ORDERS & ORDER ITEMS (Buyer read/insert)
CREATE POLICY "Buyers can view their own orders" 
ON orders FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can create orders" 
ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can view their own order items" 
ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND buyer_id = auth.uid())
);

CREATE POLICY "Buyers can insert order items" 
ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND buyer_id = auth.uid())
);

-- 8. PAYMENTS (Buyer read/insert)
CREATE POLICY "Buyers can view their own payments" 
ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = payments.order_id AND buyer_id = auth.uid())
);

CREATE POLICY "Buyers can insert payments" 
ON payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = payments.order_id AND buyer_id = auth.uid())
);

-- 9. AUTH INTERNAL TABLES (Service Role Only - No public access)
-- OTPs, Aadhaar verifications, and Login Logs are handled entirely by backend API using supabaseAdmin
-- Therefore, we DO NOT create any policies for these, effectively blocking all public anon access.

-- SUCCESS
