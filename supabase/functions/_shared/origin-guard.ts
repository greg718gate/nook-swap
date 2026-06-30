const ALLOWED_ORIGINS = [
  "https://velvetbazzar.co.uk",
  "https://www.velvetbazzar.co.uk",
  "https://greg718gate.github.io",
  "http://localhost:8080",
  "http://localhost:5173",
];

/** CSRF mitigation: reject browser requests from unknown origins. */
export function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("Origin");
  const referer = req.headers.get("Referer");

  if (!origin && !referer) return true;

  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    if (origin.startsWith("https://greg718gate.github.io/")) return true;
  }

  if (referer) {
    for (const allowed of ALLOWED_ORIGINS) {
      if (referer.startsWith(allowed + "/") || referer === allowed) return true;
    }
    if (referer.startsWith("https://greg718gate.github.io/")) return true;
  }

  return false;
}

export function originForbiddenResponse(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: "Forbidden origin", code: "ORIGIN_FORBIDDEN" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
