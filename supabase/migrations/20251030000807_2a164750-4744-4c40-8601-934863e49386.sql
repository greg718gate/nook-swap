-- Add shipping-related columns to products table
ALTER TABLE public.products
ADD COLUMN shipping_evri numeric DEFAULT 0,
ADD COLUMN shipping_royal_mail numeric DEFAULT 0,
ADD COLUMN shipping_inpost numeric DEFAULT 0;

-- Add shipping information to orders table
ALTER TABLE public.orders
ADD COLUMN shipping_method text,
ADD COLUMN shipping_cost numeric DEFAULT 0;

-- Insert default categories for marketplace
INSERT INTO public.categories (name, slug, icon, description) VALUES
('Electronics', 'electronics', '💻', 'Phones, laptops, tablets, and more'),
('Fashion', 'fashion', '👕', 'Clothing, shoes, and accessories'),
('Home & Garden', 'home-garden', '🏡', 'Furniture, decor, and garden items'),
('Sports & Outdoors', 'sports-outdoors', '⚽', 'Sports equipment and outdoor gear'),
('Books & Media', 'books-media', '📚', 'Books, music, movies, and games'),
('Toys & Games', 'toys-games', '🎮', 'Toys, board games, and collectibles'),
('Health & Beauty', 'health-beauty', '💄', 'Cosmetics, skincare, and wellness'),
('Automotive', 'automotive', '🚗', 'Car parts and accessories')
ON CONFLICT (slug) DO NOTHING;