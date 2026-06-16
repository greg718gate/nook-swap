AKTUALNE ZADANIE: Naprawa auth — czeka na republish Lovable
STATUS: fix w GitHub — wymaga publish + redeploy auth-signup

PROBLEM (zdiagnozowany):
- API auth DZIAŁA (signup + login OK z serwera)
- Frontend pokazywał "non-2xx" zamiast prawdziwego błędu
- Zajęta nazwa użytkownika = "Database error" przy rejestracji
- Logowanie: złe hasło / konto nie istnieje = "Invalid login credentials"

FIX (w GitHub main):
- Auth.tsx: czytelne błędy PL + sprawdzanie zajętej nazwy
- auth-signup: walidacja username przed utworzeniem konta

LOVABLE (1 wiadomość):
"Zsynchronizuj z GitHub main, wdróż auth-signup, opublikuj frontend"

TEST PO DEPLOY:
- Rejestracja: unikalna nazwa użytkownika + nowy email
- Logowanie: to samo konto
