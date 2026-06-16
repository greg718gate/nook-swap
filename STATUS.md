STATUS: LIVE — frontend + backend zsynchronizowane (16.06.2026)

Strona: https://velvetbazzar.co.uk ✅
Backend: https://nmgiyvauguilbwtqlexj.supabase.co ✅
DNS Fasthosts: OK (4 rekordy A → GitHub)
Auth: logowanie + wylogowanie działa

Deploy:
- Frontend: push na `main` → GitHub Pages (auto)
- Backend: wdrożony przez Lovable (migracje + 12 edge functions)

Wdrożone na produkcji:
- Velvet Coin (profil → Velvet Coins)
- Regulamin UK (/terms) + checkbox przy rejestracji
- Anti-Bot Phase Shield — handshake `tables_ready: true`, warmup 8 req
- UK dispatch address, shipping labels (Shippo — wymaga API key)

Do przetestowania:
- Rejestracja + Velvet Coins w profilu
- Phase Shield (DevTools → Network → X-Phase-Token)
- Wystawienie produktu (/sell)
- Wiadomości + Stripe checkout

Uwaga: www.velvetbazzar.co.uk jeszcze wskazuje na stary serwer — opcjonalnie CNAME www → greg718gate.github.io
