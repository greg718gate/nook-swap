# Cloudflare — VelvetBazzar (opcjonalnie, po Fasthosts)

Cloudflare daje WAF, ochronę DDoS i Turnstile (CAPTCHA). **Najpierw** napraw DNS w Fasthosts (`FASTHOSTS-DNS.txt`), potem możesz dodać Cloudflare.

## Krok 1 — Konto Cloudflare

1. Załóż konto na [cloudflare.com](https://cloudflare.com)
2. **Add site** → `velvetbazzar.co.uk`
3. Wybierz plan **Free**

## Krok 2 — Nameservery w Fasthosts

Cloudflare pokaże 2 nameservery (np. `ada.ns.cloudflare.com`).

W Fasthosts → Domeny → velvetbazzar.co.uk → **Zmień nameservery** na te z Cloudflare.

Propagacja: kilka godzin (czasem do 24 h).

## Krok 3 — DNS w Cloudflare

Po aktywacji domeny w Cloudflare ustaw rekordy:

| Typ | Nazwa | Wartość | Proxy |
|-----|-------|---------|-------|
| A | `@` | `185.199.108.153` | Proxied (pomarańczowa chmura) |
| A | `@` | `185.199.109.153` | Proxied |
| A | `@` | `185.199.110.153` | Proxied |
| A | `@` | `185.199.111.153` | Proxied |
| CNAME | `www` | `greg718gate.github.io` | Proxied |

**SSL/TLS** → **Full** (GitHub Pages ma własny cert).

## Krok 4 — Turnstile (CAPTCHA na rejestracji)

1. Cloudflare → **Turnstile** → **Add widget**
2. Hostnames: `velvetbazzar.co.uk`, `www.velvetbazzar.co.uk`, `greg718gate.github.io`
3. Skopiuj **Site Key** i **Secret Key**

### GitHub Pages (frontend)

W repo → **Settings → Secrets → Actions** (lub zmienna build):

```
VITE_TURNSTILE_SITE_KEY=0x...
```

Albo lokalnie w `.env` przed buildem.

### Supabase (backend)

Dashboard → Edge Functions → **Secrets**:

```
TURNSTILE_SECRET_KEY=0x...
```

Bez tych kluczy rejestracja działa normalnie (CAPTCHA wyłączona).

## Krok 5 — WAF (Free)

**Security** → **WAF** → włącz managed rules (Free bundle).

Opcjonalnie **Bot Fight Mode** w **Security → Bots**.

## Uwagi

- GitHub Pages origin pozostaje publiczny — Cloudflare ukrywa go przed większością ataków, ale nie jest to pełne „origin lock”.
- Webhook Stripe (`stripe-webhook`) idzie bezpośrednio na Supabase — **nie** przez Cloudflare.
- Po zmianie nameserverów sprawdź HTTPS na `velvetbazzar.co.uk` i `www`.
