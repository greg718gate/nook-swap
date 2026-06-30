STATUS: VelvetBazzar — stan na 16.06.2026

## Domena
- Docelowo: https://velvetbazzar.co.uk (GitHub Pages + Fasthosts DNS)
- **Do zrobienia przez Ciebie:** www CNAME → `greg718gate.github.io` — patrz `FASTHOSTS-DNS.txt`

## Backend (bez Lovable)
- Supabase: kwyegfqyjfuvxtdkgldb
- Stripe: STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET w Edge Functions secrets
- Webhook: velvetbazzar-webhook → stripe-webhook

## Deploy
- Frontend: push main → GitHub Pages
- Edge functions: push main → deploy-supabase-functions.yml
- Migracje: deploy-migrations.yml

## Secrety Supabase (Edge Functions)
| Secret | Status |
|--------|--------|
| STRIPE_SECRET_KEY | ✅ |
| STRIPE_WEBHOOK_SECRET | ✅ |
| TURNSTILE_SECRET_KEY | opcjonalnie (CAPTCHA) |
| RESEND_API_KEY | opcjonalnie |
| OPENAI_API_KEY | opcjonalnie |

## Bezpieczeństwo
Pełna lista: `docs/SECURITY_ROADMAP.md`

- Rate limiting, hasła 10+, MIME storage, CSP
- Origin guard, magic bytes uploadów, sanitacja czatu
- MFA w Profil → Edit
- Turnstile na rejestracji (gdy klucze w Supabase + `VITE_TURNSTILE_SITE_KEY`)

## Auth Supabase
Site URL: https://velvetbazzar.co.uk
