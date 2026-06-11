-- Allow conversation participants to mark received messages as read
CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
USING (
  sender_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
  )
);

-- Point message notifications to the specific conversation
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
      '/profile?tab=messages&conversation=' || NEW.conversation_id::text,
      NEW.conversation_id
    );
  END LOOP;
  RETURN NEW;
END;
$$;
