# VelvetBazzar — plan bezpieczeństwa

## Zrobione (kod wdrożony)

| # | Warstwa | Status |
|---|---------|--------|
| 1 | **Rate limiting** — `api_rate_limits` + RPC `check_rate_limit`, 429 na Phase Shield endpointach | ✅ |
| 2 | **Hasła** — min. 10 znaków, litera + cyfra (`password-policy.ts` + Auth UI) | ✅ |
| 3 | **Uploady** — MIME whitelist + rozmiar na bucketach `product-images` (5 MB) i `digital-products` (100 MB) | ✅ |
| 4 | **CSP** — meta Content-Security-Policy w `index.html` | ✅ |
| — | Phase Shield (jitter, token, network grace) | ✅ (bez zmian — czekamy na Twoje dane o zerach Riemanna) |
| — | Stripe izolacja, webhook HMAC, ceny po stronie serwera | ✅ |
| — | RLS, message-guard, shipping webhook secret | ✅ |

## Następne kroki (kolejność)

| # | Co | Wymaga |
|---|-----|--------|
| 5 | **Cloudflare** przed `velvetbazzar.co.uk` (WAF, DDoS, ukrycie origin) | Fasthosts DNS → Cloudflare |
| 6 | **www** CNAME → `greg718gate.github.io` | Fasthosts (rano) |
| 7 | **MFA / 2FA** w Supabase Auth | Dashboard + opcjonalnie UI |
| 8 | **CAPTCHA** (Turnstile) na rejestracji | Cloudflare konto |
| 9 | **Phase Shield SENTINEL-718 v2.2** — f_exact DNA 718.574441… Hz primary | ✅ wdrożone |
| 10 | **Skan AV** uploadów | opcjonalnie później |

## Nie dotyczy (architektura chmurowa)

- Baza **nie** jest na domowym PC — Supabase w EU.
- Brak „ukrycia domowego IP routera” — nie hostujecie z domu.
