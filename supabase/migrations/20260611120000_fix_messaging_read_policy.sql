-- Fix infinite recursion in conversation_participants SELECT policy
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;

CREATE POLICY "Users can view participants in their conversations"
ON public.conversation_participants
FOR SELECT
USING (public.is_conversation_participant(conversation_id));

-- Tighten conversation_participants INSERT (idempotent if already applied)
DROP POLICY IF EXISTS "Users can add participants to conversations" ON public.conversation_participants;

CREATE POLICY "Users can add participants to conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
  )
);

-- Allow conversation participants to mark received messages as read
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;

CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
USING (
  sender_id <> auth.uid()
  AND public.is_conversation_participant(conversation_id)
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
