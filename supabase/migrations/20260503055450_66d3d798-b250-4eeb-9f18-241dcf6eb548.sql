
-- 1. notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'message' | 'order_new' | 'order_shipped' | 'order_delivered' | 'review' | 'system'
  title text NOT NULL,
  body text,
  link text,
  related_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Inserts happen via SECURITY DEFINER triggers; admins can also insert
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 3. Trigger: new message -> notify other participants
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  sender_name text;
BEGIN
  SELECT username INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  FOR r IN
    SELECT user_id FROM public.conversation_participants
    WHERE conversation_id = NEW.conversation_id AND user_id <> NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link, related_id)
    VALUES (
      r.user_id,
      'message',
      'Nowa wiadomość od ' || COALESCE(sender_name, 'użytkownika'),
      LEFT(NEW.content, 120),
      '/profile?tab=messages',
      NEW.conversation_id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_message();

-- 4. Trigger: new paid order -> notify each seller
CREATE OR REPLACE FUNCTION public.notify_on_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  -- Seller notifications when order becomes paid
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid')
     OR (TG_OP = 'INSERT' AND NEW.status = 'paid') THEN
    FOR r IN
      SELECT DISTINCT seller_id FROM public.order_items WHERE order_id = NEW.id
    LOOP
      INSERT INTO public.notifications (user_id, type, title, body, link, related_id)
      VALUES (
        r.seller_id,
        'order_new',
        'Nowe zamówienie!',
        'Otrzymałeś nowe zamówienie do realizacji.',
        '/sales',
        NEW.id
      );
    END LOOP;
  END IF;

  -- Buyer notifications on shipped / delivered
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'shipped' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link, related_id)
      VALUES (
        NEW.buyer_id,
        'order_shipped',
        'Twoje zamówienie zostało wysłane',
        CASE WHEN NEW.tracking_number IS NOT NULL
             THEN 'Numer przesyłki: ' || NEW.tracking_number
             ELSE 'Sprzedawca oznaczył przesyłkę jako wysłaną.' END,
        '/my-orders',
        NEW.id
      );
    ELSIF NEW.status = 'delivered' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link, related_id)
      VALUES (
        NEW.buyer_id,
        'order_delivered',
        'Twoje zamówienie zostało dostarczone',
        'Potwierdź odbiór i zostaw opinię o sprzedawcy.',
        '/my-orders',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_order_status
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_on_order_status();

-- 5. Trigger: new review -> notify seller
CREATE OR REPLACE FUNCTION public.notify_on_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s_id uuid;
BEGIN
  SELECT seller_id INTO s_id FROM public.products WHERE id = NEW.product_id;
  IF s_id IS NOT NULL AND s_id <> NEW.reviewer_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, related_id)
    VALUES (
      s_id,
      'review',
      'Nowa opinia o Twoim produkcie',
      'Otrzymałeś ocenę ' || NEW.rating || '/5.',
      '/profile',
      NEW.product_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_new_review
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_review();
