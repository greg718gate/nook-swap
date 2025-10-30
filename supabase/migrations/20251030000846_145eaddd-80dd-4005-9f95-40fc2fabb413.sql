-- Fix security issues: Update functions to set search_path

-- Update update_product_rating function with search_path
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(r.rating), 0)
      FROM public.reviews r
      JOIN public.products p ON p.id = r.product_id
      WHERE p.seller_id = (
        SELECT seller_id FROM public.products WHERE id = NEW.product_id
      )
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews r
      JOIN public.products p ON p.id = r.product_id
      WHERE p.seller_id = (
        SELECT seller_id FROM public.products WHERE id = NEW.product_id
      )
    )
  WHERE id = (SELECT seller_id FROM public.products WHERE id = NEW.product_id);
  RETURN NEW;
END;
$function$;

-- Note: handle_new_user already has SET search_path = 'public' set, so it should be fine