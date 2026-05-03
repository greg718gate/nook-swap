
-- 1) Hide stripe columns on profiles from anon/authenticated
REVOKE SELECT (stripe_account_id, stripe_onboarded) ON public.profiles FROM anon, authenticated;

-- 2) Tighten conversation_participants INSERT
DROP POLICY IF EXISTS "Users can add participants to conversations" ON public.conversation_participants;

CREATE POLICY "Users can add participants to conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  -- adding yourself to a brand-new conversation that has no participants yet
  (user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
    )
  )
  OR
  -- or you're already a participant and you're adding someone else
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
  )
);

-- 3) Realtime channel authorization
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users subscribe to allowed channels" ON realtime.messages;

CREATE POLICY "Authenticated users subscribe to allowed channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Personal notifications channel: notifications:<uid>
  (realtime.topic() = 'notifications:' || auth.uid()::text)
  OR
  -- Personal cart channel
  (realtime.topic() = 'cart_changes')
  OR
  -- Global messages realtime feed (filtered by RLS on messages table)
  (realtime.topic() = 'messages_realtime')
  OR
  -- Per-conversation channel: conversation_<uuid> — user must be participant
  (
    realtime.topic() LIKE 'conversation\_%' ESCAPE '\'
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.user_id = auth.uid()
        AND cp.conversation_id::text = substring(realtime.topic() from 14)
    )
  )
);
