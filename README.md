# VelvetBazzar

UK marketplace for buying and selling pre-loved fashion, vintage, and handmade items.

- **Live site:** https://velvetbazzar.co.uk
- **Backend:** Supabase (`kwyegfqyjfuvxtdkgldb`)
- **Payments:** Stripe Connect
- **Deploy:** GitHub Actions → GitHub Pages

## Local development

```sh
npm ci
cp .env.example .env   # fill Supabase keys
npm run dev
```

Open http://localhost:8080

## Deploy

Push to `main` — GitHub Actions builds and publishes to GitHub Pages automatically.

See `KONFIGURACJA-TWOJ-SUPABASE.md`, `FASTHOSTS-DNS.txt`, and `STATUS.md` for setup details.
