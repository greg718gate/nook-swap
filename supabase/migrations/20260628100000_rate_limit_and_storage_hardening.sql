-- Rate limiting for edge functions + storage upload hardening

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  bucket_key text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  hit_count integer NOT NULL DEFAULT 0
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only service role (edge functions) may access.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket_key text,
  p_window_seconds integer,
  p_max_hits integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_row public.api_rate_limits%ROWTYPE;
  v_elapsed_sec double precision;
BEGIN
  IF p_window_seconds < 1 OR p_max_hits < 1 THEN
    RETURN jsonb_build_object('allowed', true, 'remaining', p_max_hits);
  END IF;

  SELECT * INTO v_row FROM public.api_rate_limits WHERE bucket_key = p_bucket_key FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.api_rate_limits (bucket_key, window_start, hit_count)
    VALUES (p_bucket_key, v_now, 1);
    RETURN jsonb_build_object('allowed', true, 'remaining', p_max_hits - 1);
  END IF;

  v_elapsed_sec := EXTRACT(EPOCH FROM (v_now - v_row.window_start));

  IF v_elapsed_sec >= p_window_seconds THEN
    UPDATE public.api_rate_limits
    SET window_start = v_now, hit_count = 1
    WHERE bucket_key = p_bucket_key;
    RETURN jsonb_build_object('allowed', true, 'remaining', p_max_hits - 1);
  END IF;

  IF v_row.hit_count >= p_max_hits THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'retry_after_sec', GREATEST(1, CEIL(p_window_seconds - v_elapsed_sec)::integer)
    );
  END IF;

  UPDATE public.api_rate_limits
  SET hit_count = hit_count + 1
  WHERE bucket_key = p_bucket_key;

  RETURN jsonb_build_object('allowed', true, 'remaining', p_max_hits - v_row.hit_count - 1);
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

-- Product images: server-enforced MIME + 5 MB
UPDATE storage.buckets
SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
  ]
WHERE id = 'product-images';

-- Digital downloads: safe formats only, 100 MB
UPDATE storage.buckets
SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/epub+zip',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
WHERE id = 'digital-products';
