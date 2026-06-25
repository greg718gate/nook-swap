STATUS: LIVE — UK marketplace (June 2026)

Frontend: https://velvetbazzar.co.uk (GitHub Pages, auto deploy on push)
Backend: Supabase nmgiyvauguilbwtqlexj (Lovable Publish)

## Done
- Auth, UK dispatch address, sell/buy flow
- Stripe Connect + checkout (GBP) — **webhook signature verified**
- Velvet Coin, Phase Shield (network grace + audit log), AI Guide
- Full UK English UI (pages, toasts, emails)
- Terms, Privacy, FAQ, Shipping, Returns
- Off-platform message scanning (WhatsApp, phone, email)
- Self-service disputes (48h buyer/seller deadlines)
- Seller ghosting auto-refund (7 days, via `order-automation` cron)
- Business vs private seller declaration on listing
- Shipping webhook shared-secret auth

## Important architecture notes
- **Payments:** Stripe Connect transfers run on checkout completion (not held escrow). Disputes freeze `auto_release_frozen` flag; refunds use `reverse_transfer`.
- **Stripe platform:** Already configured via Lovable. Each seller still needs Connect in Profile.
- **Phase Shield:** Excluded from webhooks (external providers). Network grace for mobile users.

## Optional / user setup
- `SUPABASE_ACCESS_TOKEN` in GitHub → migrations + functions without Lovable
- `ORDER_AUTOMATION_SECRET` in GitHub + Lovable → daily ghosting refunds
- `SHIPPING_WEBHOOK_SECRET` in Lovable → configure Shippo/courier to send `Authorization: Bearer <secret>`
- `PHASE_SHIELD_SKIP_PROVISION=true` in Lovable after CI migrations active
- Shippo API key (auto labels)
- Cloudflare Turnstile (optional CAPTCHA fallback — not wired yet)
- HMRC reporting / Stripe Tax / chargeback evidence automation (future)
- www CNAME, support@ email, real listings, company details in Terms
