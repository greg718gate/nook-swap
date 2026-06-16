AKTUALNE ZADANIE: Odcięcie od Lovable — jednorazowy setup deploy
STATUS: CI/CD gotowe w repo — wymaga konfiguracji Vercel + GitHub Secret

GOTOWE:
- Produkcja: https://velvetbazzar.co.uk (obecnie Lovable — do przeniesienia)
- Auth, messaging, Stripe — działają
- GitHub Actions: frontend, edge functions, migracje (DEPLOY.md)

NASTĘPNY KROK (15 min, 0 zł):
1. Vercel.com → import GitHub repo → env vars z .env → deploy
2. Domena velvetbazzar.co.uk → DNS na Vercel (zamiast Lovable)
3. GitHub Secret: SUPABASE_ACCESS_TOKEN (darmowe konto supabase.com, jednorazowo)
4. Koniec z Lovable — push na main = auto deploy

Szczegóły: DEPLOY.md
