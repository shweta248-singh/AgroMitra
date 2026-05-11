-- AgroMitra Seed Data & Contact Table Setup
-- Run this script in your Supabase SQL Editor

DO $$
DECLARE
    farmer_uid UUID;
    cat_seeds UUID;
    cat_insecticides UUID;
    cat_pesticides UUID;
    cat_tools UUID;
    prod_id UUID;
BEGIN
    -- 1. Create contact_messages table if not exists
    CREATE TABLE IF NOT EXISTS public.contact_messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable RLS for contact_messages
    ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Public can insert contact messages" ON public.contact_messages;
    DROP POLICY IF EXISTS "Only service role can view contact messages" ON public.contact_messages;

    -- Policy: Anyone can insert
    CREATE POLICY "Public can insert contact messages"
    ON public.contact_messages FOR INSERT
    WITH CHECK (true);

    -- Policy: Service role can select (implied by service role bypass, but we can add an explicit policy if we want admins to view it later)
    -- For now, no public select is allowed.

    -- Get a valid farmer ID to attach products to
    SELECT id INTO farmer_uid FROM public.profiles WHERE role = 'farmer' LIMIT 1;
    
    -- If no farmer exists, we can't seed products properly without breaking foreign keys.
    IF farmer_uid IS NULL THEN
        RAISE EXCEPTION 'No farmer profile found. Please register at least one seller (farmer) account before running this seed script.';
    END IF;

    -- 2. Ensure Categories exist
    INSERT INTO public.categories (name, slug, description)
    VALUES 
        ('Seeds', 'seeds', 'High quality agricultural seeds'),
        ('Insecticides', 'insecticides', 'Effective insecticides for crop protection'),
        ('Pesticides', 'pesticides', 'Pesticides and weed control'),
        ('Farming Tools', 'farming-tools', 'Essential tools for modern farming')
    ON CONFLICT (slug) DO NOTHING;

    -- Get category IDs
    SELECT id INTO cat_seeds FROM public.categories WHERE slug = 'seeds';
    SELECT id INTO cat_insecticides FROM public.categories WHERE slug = 'insecticides';
    SELECT id INTO cat_pesticides FROM public.categories WHERE slug = 'pesticides';
    SELECT id INTO cat_tools FROM public.categories WHERE slug = 'farming-tools';

    -- 3. Seed Products (Seeds)
    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_seeds, 'Premium Wheat Seeds', 'premium-wheat-seeds', 'High yield hybrid wheat seeds suitable for all climates.', 450, 100, 'kg', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=600', true);
    
    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_seeds, 'Organic Basmati Rice Seeds', 'basmati-rice-seeds', 'Export quality basmati rice seeds.', 850, 50, 'kg', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=600', true);

    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_seeds, 'Hybrid Tomato Seeds', 'hybrid-tomato-seeds', 'Disease resistant tomato seeds for high yield.', 120, 200, 'packet', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=600', true);

    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_seeds, 'Sweet Corn Seeds', 'sweet-corn-seeds', 'Fast growing sweet corn seeds.', 300, 150, 'kg', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?q=80&w=600', true);

    -- 4. Seed Products (Insecticides)
    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_insecticides, 'Neem Oil Insecticide', 'neem-oil-insecticide', '100% organic cold pressed neem oil for pest control.', 350, 80, 'liter', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?q=80&w=600', true);

    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_insecticides, 'Imidacloprid 17.8% SL', 'imidacloprid-17-8', 'Systemic insecticide for aphid and whitefly control.', 450, 40, 'ml', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?q=80&w=600', true);

    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_insecticides, 'Chlorpyrifos 20% EC', 'chlorpyrifos-20', 'Broad-spectrum insecticide for soil and foliar application.', 500, 50, 'liter', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1584473457406-6240486418e9?q=80&w=600', true);

    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_insecticides, 'Bio-Insecticide Spray', 'bio-insecticide-spray', 'Eco-friendly spray for vegetable gardens.', 250, 100, 'bottle', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?q=80&w=600', true);

    -- 5. Seed Products (Pesticides)
    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_pesticides, 'Glyphosate 41% Herbicide', 'glyphosate-41', 'Non-selective systemic herbicide for weed control.', 600, 60, 'liter', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1628183204899-73e213dc2517?q=80&w=600', true);

    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_pesticides, 'Copper Oxychloride Fungicide', 'copper-oxychloride', 'Broad spectrum contact fungicide.', 300, 80, 'kg', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1601646270682-1d54f5bc9cb8?q=80&w=600', true);

    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_pesticides, 'Mancozeb 75% WP', 'mancozeb-75', 'Protective contact fungicide for crops.', 400, 70, 'kg', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1595805370956-621e25e937d5?q=80&w=600', true);

    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_pesticides, 'Sulphur 80% WDG', 'sulphur-80', 'Fungicide and miticide for powdery mildew.', 250, 100, 'kg', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=600', true);

    -- 6. Seed Products (Farming Tools)
    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_tools, 'Heavy Duty Hoe', 'heavy-duty-hoe', 'Carbon steel hoe with wooden handle for soil digging.', 450, 50, 'piece', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1416879598555-220b8f38d42f?q=80&w=600', true);

    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_tools, 'Manual Sprayer Pump (16L)', 'manual-sprayer-16l', 'Knapsack manual sprayer for pesticides and fertilizers.', 1200, 30, 'piece', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1605377358211-137b011403b2?q=80&w=600', true);

    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_tools, 'Pruning Shears', 'pruning-shears', 'Professional garden pruning scissors.', 350, 100, 'piece', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1416879598555-220b8f38d42f?q=80&w=600', true);

    INSERT INTO public.products (farmer_id, category_id, name, slug, description, price, stock_quantity, unit, is_active, is_approved)
    VALUES (farmer_uid, cat_tools, 'Drip Irrigation Kit', 'drip-irrigation-kit', 'Complete drip irrigation starter kit for 100 plants.', 2500, 20, 'kit', true, true)
    RETURNING id INTO prod_id;
    INSERT INTO public.product_images (product_id, image_url, is_primary) VALUES (prod_id, 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?q=80&w=600', true);

END $$;
