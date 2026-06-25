# Deploy bez Lovable

Od teraz **nie musisz płacić Lovable** za każdy publish. Wystarczy jednorazowa konfiguracja (~15 min, **0 zł**).

## Co robi co

| Zmiana | Co się dzieje automatycznie |
|--------|----------------------------|
| Frontend (`src/`, `public/`) | GitHub Actions → Cloudflare Pages **lub** Vercel |
| Edge functions (`supabase/functions/`) | GitHub Actions → Supabase |
| Migracje SQL (`supabase/migrations/`) | GitHub Actions → Supabase |

**Push na `main` = deploy.** Bez wiadomości do Lovable.

---

## Krok 1: Frontend (wybierz jedną opcję)

### Opcja A — Vercel (najprostsza, polecana)

1. Wejdź na [vercel.com](https://vercel.com) → **Sign up with GitHub**
2. **Add New Project** → importuj repo `greg718gate/nook-swap`
3. Framework: **Vite** (wykryje sam)
4. Dodaj zmienne środowiskowe (Settings → Environment Variables):
   - `VITE_SUPABASE_URL` = `https://kwyegfqyjfuvxtdkgldb.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = (z pliku `.env` w projekcie)
5. **Deploy**
6. **Domains** → dodaj `velvetbazzar.co.uk`
7. U rejestratora domeny zmień DNS na to, co poda Vercel (usuń stare rekordy Lovable)

Od teraz każdy `git push` na `main` = automatyczny deploy na Vercel. **Za darmo.**

### Opcja B — Cloudflare Pages (przez GitHub Actions)

1. Konto na [cloudflare.com](https://cloudflare.com) (darmowe)
2. **Workers & Pages** → **Create** → **Pages** → nazwa: `velvetbazzar`
3. **My Profile** → **API Tokens** → Create Token → szablon **Edit Cloudflare Workers**
4. Skopiuj **Account ID** z dashboardu Cloudflare
5. W GitHub repo → **Settings** → **Secrets and variables** → **Actions** → dodaj:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
6. **Pages** → Custom domain → `velvetbazzar.co.uk`

---

## Krok 2: Backend (edge functions + migracje)

Potrzebujesz **jednorazowo** tokenu Supabase (darmowe konto — **to nie jest płatne jak Lovable**):

1. Wejdź na [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
2. Załóż darmowe konto (ten sam email co przy Lovable, jeśli możesz)
3. **Generate new token** → skopiuj
4. W GitHub repo → **Settings** → **Secrets** → dodaj:
   - `SUPABASE_ACCESS_TOKEN` = wklej token

Po tym każdy push z funkcjami lub migracjami wdraża się sam przez GitHub Actions.

> Jeśli projekt Supabase jest tylko pod Lovable i nie masz do niego dostępu — napisz, wtedy trzeba będzie przenieść projekt lub użyć kluczy z Lovable (ostatnia deska ratunku).

---

## Krok 3: Koniec z Lovable

Gdy Vercel/Cloudflare działa z domeną `velvetbazzar.co.uk`:

- **Nie odnawiaj** pakietu Lovable
- **Nie pisz** do Lovable przy zmianach w kodzie
- Pracujesz w Cursor → `git push` → gotowe

Lovable zostaje tylko jako historyczne źródło projektu (opcjonalnie możesz odłączyć repo).

---

## Ręczny deploy (awaryjnie)

```bash
npm run build
npx wrangler pages deploy dist --project-name=velvetbazzar   # Cloudflare
# lub: vercel --prod                                          # Vercel CLI
```

```bash
npx supabase functions deploy auth-signup --project-ref kwyegfqyjfuvxtdkgldb
```

---

## Koszty

| Usługa | Koszt |
|--------|-------|
| Vercel / Cloudflare Pages | **0 zł** (plan darmowy) |
| Supabase (baza + auth) | **0 zł** (plan darmowy Lovable/Supabase) |
| GitHub Actions | **0 zł** (limit wystarczy) |
| Cursor | Twój obecny plan |
| ~~Lovable~~ | **Nie potrzebny** |
