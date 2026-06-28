# VelvetBazzar — Twój Supabase (bez Lovable)

**Twój projekt:** `kwyegfqyjfuvxtdkgldb`  
**Adres:** https://kwyegfqyjfuvxtdkgldb.supabase.co

---

## KROK A — Token na GitHub (jeśli jeszcze nie zrobiłeś)

1. Supabase → ikona profilu → **Access Tokens** → **Generate** → skopiuj
2. https://github.com/greg718gate/nook-swap/settings/secrets/actions
3. **New secret** → nazwa: `SUPABASE_ACCESS_TOKEN` → wklej token

Po pushu na GitHub baza i funkcje wdrażają się same.

---

## KROK B — Logowanie na stronie (Supabase)

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL:** `https://velvetbazzar.co.uk`
3. **Redirect URLs:** dodaj `https://velvetbazzar.co.uk/**`
4. Zapisz

---

## KROK C — Klucze płatności (Stripe)

1. **stripe.com** → Developers → API keys → skopiuj **Secret key**
2. Developers → Webhooks → **Add endpoint** (lub edytuj stary):

   Adres webhooka:
   ```
   https://kwyegfqyjfuvxtdkgldb.supabase.co/functions/v1/stripe-webhook
   ```

   Zaznacz event: `checkout.session.completed`, `charge.dispute.created`

3. Skopiuj **Signing secret** (`whsec_...`)

---

## KROK D — Wklej secrety w Supabase

1. Supabase → **Edge Functions** → **Secrets** (lub Project Settings → Edge Functions)
2. Dodaj każdy osobno:

| Nazwa | Skąd |
|-------|------|
| `STRIPE_SECRET_KEY` | stripe.com → API keys |
| `STRIPE_WEBHOOK_SECRET` | stripe.com → Webhooks → signing secret |
| `RESEND_API_KEY` | resend.com (jeśli masz) |
| `SHIPPING_WEBHOOK_SECRET` | wymyśl długie hasło lub wygeneruj |
| `ORDER_AUTOMATION_SECRET` | to samo — inne niż shipping |
| `PHASE_SHIELD_SKIP_PROVISION` | wpisz: `true` |
| `OPENAI_API_KEY` | opcjonalnie — AI chat i auto-tag (OpenAI, bez Lovable) |

---

## KROK E — Sprawdź

Wejdź na https://velvetbazzar.co.uk → zarejestruj się → wystaw produkt.

---

**Lovable nie jest już potrzebne.**
