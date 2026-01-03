-- Add digital product support to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'physical' CHECK (product_type IN ('physical', 'digital')),
ADD COLUMN IF NOT EXISTS digital_file_url text,
ADD COLUMN IF NOT EXISTS digital_file_name text;

-- Create storage bucket for digital product files (private - only accessible after purchase)
INSERT INTO storage.buckets (id, name, public)
VALUES ('digital-products', 'digital-products', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Only sellers can upload their digital files
CREATE POLICY "Sellers can upload digital files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: Sellers can view their own files
CREATE POLICY "Sellers can view their digital files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: Sellers can delete their own files
CREATE POLICY "Sellers can delete their digital files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add Stripe fields to profiles for Connect
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarded boolean DEFAULT false;

-- Add Stripe payment fields to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS stripe_session_id text,
ADD COLUMN IF NOT EXISTS platform_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS seller_payout numeric DEFAULT 0;

-- Create purchases table for tracking digital product access
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  seller_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  download_count integer DEFAULT 0,
  max_downloads integer DEFAULT 5
);

-- Enable RLS on purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Buyers can view their purchases
CREATE POLICY "Buyers can view their purchases"
ON public.purchases FOR SELECT
USING (auth.uid() = buyer_id);

-- Sellers can view purchases of their products
CREATE POLICY "Sellers can view sales of their products"
ON public.purchases FOR SELECT
USING (auth.uid() = seller_id);

-- System can insert purchases (via edge function)
CREATE POLICY "Authenticated users can insert purchases"
ON public.purchases FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Buyers can update their own purchases (for download count)
CREATE POLICY "Buyers can update their purchases"
ON public.purchases FOR UPDATE
USING (auth.uid() = buyer_id);

-- Add policy for buyers to access digital files they purchased
CREATE POLICY "Buyers can access purchased digital files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'digital-products' 
  AND EXISTS (
    SELECT 1 FROM public.purchases p
    JOIN public.products prod ON prod.id = p.product_id
    WHERE p.buyer_id = auth.uid()
    AND prod.digital_file_url LIKE '%' || name
  )
);