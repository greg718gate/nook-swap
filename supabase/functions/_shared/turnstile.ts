/** Cloudflare Turnstile — optional when TURNSTILE_SECRET_KEY is set. */
export async function verifyTurnstileToken(token: string | undefined): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return true;
  if (!token || typeof token !== "string") return false;

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });

  if (!res.ok) return false;
  const data = await res.json();
  return data?.success === true;
}
