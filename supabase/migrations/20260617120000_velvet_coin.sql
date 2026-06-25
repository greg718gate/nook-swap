-- Velvet Coin: internal platform currency (not crypto)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS velvet_coins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS velvet_coins_auto_apply integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_sale_rewarded boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_idx
  ON public.profiles (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.velvet_coin_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  reference_id text,
  balance_after integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.velvet_coin_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own velvet coin ledger" ON public.velvet_coin_ledger;
CREATE POLICY "Users can view own velvet coin ledger"
  ON public.velvet_coin_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
BEGIN
  LOOP
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code);
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_profile_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_profile_referral_code_trg ON public.profiles;
CREATE TRIGGER ensure_profile_referral_code_trg
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_profile_referral_code();

CREATE OR REPLACE FUNCTION public.grant_velvet_coins(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_id text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
  IF p_amount = 0 THEN
    SELECT velvet_coins INTO new_balance FROM public.profiles WHERE id = p_user_id;
    RETURN COALESCE(new_balance, 0);
  END IF;

  UPDATE public.profiles
  SET velvet_coins = GREATEST(0, velvet_coins + p_amount)
  WHERE id = p_user_id
  RETURNING velvet_coins INTO new_balance;

  INSERT INTO public.velvet_coin_ledger (user_id, amount, reason, reference_id, balance_after)
  VALUES (p_user_id, p_amount, p_reason, p_reference_id, new_balance);

  RETURN new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_velvet_coins(uuid, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_velvet_coins(uuid, integer, text, text) TO service_role;

-- Backfill referral codes for existing profiles
UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL OR referral_code = '';
