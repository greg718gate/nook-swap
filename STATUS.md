STATUS: VelvetBazzar — stan na 28.06.2026

## Domena
- Docelowo: https://velvetbazzar.co.uk (GitHub Pages + Fasthosts DNS)
- **Blokada HTTPS:** www.velvetbazzar.co.uk wskazuje na stary serwer (213.171.195.105) — patrz FASTHOSTS-DNS.txt

## Backend (100% bez Lovable)
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
| STRIPE_SECRET_KEY | użytkownik dodał |
| STRIPE_WEBHOOK_SECRET | użytkownik dodał |
| RESEND_API_KEY | opcjonalnie (maile) |
| OPENAI_API_KEY | opcjonalnie (AI chat) |

## Bezpieczeństwo (28.06)
- Rate limiting na edge functions — patrz `docs/SECURITY_ROADMAP.md`
- Hasła: min 10 znaków + litera + cyfra
- Storage: MIME whitelist na bucketach
- CSP w index.html

## Auth Supabase
Site URL: https://velvetbazzar.co.uk
Redirect: https://velvetbazzar.co.uk/**
