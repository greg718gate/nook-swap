
-- Unique: one review per buyer per product
CREATE UNIQUE INDEX IF NOT EXISTS reviews_reviewer_product_unique
  ON public.reviews (reviewer_id, product_id);

-- Validation function: only verified buyers (delivered/completed) can review, not their own product
CREATE OR REPLACE FUNCTION public.validate_review_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller uuid;
  v_has_order boolean;
BEGIN
  SELECT seller_id INTO v_seller FROM public.products WHERE id = NEW.product_id;
  IF v_seller IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  IF v_seller = NEW.reviewer_id THEN
    RAISE EXCEPTION 'You cannot review your own product';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.product_id = NEW.product_id
      AND o.buyer_id = NEW.reviewer_id
      AND o.status IN ('delivered', 'completed')
  ) INTO v_has_order;

  IF NOT v_has_order THEN
    RAISE EXCEPTION 'You can only review products you have purchased and received';
  END IF;

  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_review_eligibility_trigger ON public.reviews;
CREATE TRIGGER validate_review_eligibility_trigger
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_review_eligibility();

-- Make sure the rating-recompute trigger exists on reviews
DROP TRIGGER IF EXISTS update_product_rating_trigger ON public.reviews;
CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_rating();

-- Notification trigger on new review
DROP TRIGGER IF EXISTS notify_on_new_review_trigger ON public.reviews;
CREATE TRIGGER notify_on_new_review_trigger
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_review();
