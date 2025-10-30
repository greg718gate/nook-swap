-- Remove all existing categories to avoid duplicates
DELETE FROM public.categories;

-- Insert clean set of categories with emojis
INSERT INTO public.categories (name, slug, icon, description) VALUES
('Electronics', 'electronics', '💻', 'Phones, laptops, tablets, and gadgets'),
('Fashion & Clothing', 'fashion', '👕', 'Clothing, shoes, bags, and accessories'),
('Home & Garden', 'home-garden', '🏡', 'Furniture, decor, kitchen, and garden'),
('Sports & Outdoors', 'sports-outdoors', '⚽', 'Sports equipment, camping, and outdoor gear'),
('Books & Media', 'books-media', '📚', 'Books, music, movies, and games'),
('Toys & Hobbies', 'toys-hobbies', '🎮', 'Toys, board games, collectibles, and crafts'),
('Health & Beauty', 'health-beauty', '💄', 'Cosmetics, skincare, and wellness products'),
('Automotive', 'automotive', '🚗', 'Car parts, accessories, and tools'),
('Baby & Kids', 'baby-kids', '👶', 'Baby gear, kids clothing, and toys'),
('Pet Supplies', 'pet-supplies', '🐾', 'Pet food, toys, and accessories'),
('Jewelry & Watches', 'jewelry-watches', '💍', 'Jewelry, watches, and accessories'),
('Music & Instruments', 'music-instruments', '🎸', 'Musical instruments and equipment'),
('Office & Business', 'office-business', '💼', 'Office supplies, furniture, and equipment'),
('Art & Collectibles', 'art-collectibles', '🎨', 'Artwork, antiques, and collectibles');