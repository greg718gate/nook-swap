# VelvetBazzar — plan bezpieczeństwa

## Zrobione (kod wdrożony)

| # | Warstwa | Status |
|---|---------|--------|
| 1 | **Rate limiting** — `api_rate_limits` + RPC `check_rate_limit` | ✅ |
| 2 | **Hasła** — min. 10 znaków, litera + cyfra | ✅ |
| 3 | **Uploady** — MIME whitelist + rozmiar na bucketach | ✅ |
| 4 | **CSP** — meta Content-Security-Policy w `index.html` | ✅ |
| 5 | **Origin guard** — blokada nieznanych Origin/Referer na edge functions | ✅ |
| 6 | **Magic bytes** — walidacja nagłówków plików przy uploadzie (Sell/Edit) | ✅ |
| 7 | **XSS** — `sanitizeUserText` w czacie (defence in depth) | ✅ |
| 8 | **MFA / 2FA** — panel w Profil → Edit + logowanie z kodem TOTP | ✅ |
| 9 | **Turnstile** — widget na rejestracji + weryfikacja w `auth-signup` (gdy klucze ustawione) | ✅ |
| — | Phase Shield SENTINEL-718 v2.2 | ✅ |
| — | Stripe izolacja, webhook HMAC, ceny po stronie serwera | ✅ |
| — | RLS, message-guard, shipping webhook secret | ✅ |

## Twoja kolej (Fasthosts)

| # | Co | Plik |
|---|-----|------|
| 1 | **www** CNAME → `greg718gate.github.io` | `FASTHOSTS-DNS.txt` |
| 2 | **Cloudflare** (opcjonalnie) — nameservery + Turnstile klucze | `docs/CLOUDFLARE-SETUP.md` |

## Opcjonalnie później

| # | Co |
|---|-----|
| — | Skan AV uploadów |
| — | DOMPurify jeśli pojawi się rich text |
| — | Pełny CSRF token (obecnie JWT + Origin guard) |

## Nie dotyczy

- Baza na Supabase EU — nie hostujecie z domu.
- Webhooki Stripe idą na Supabase, nie na GitHub Pages.
