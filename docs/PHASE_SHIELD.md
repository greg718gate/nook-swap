# Anti-Bot Phase Shield

Closed middleware module protecting critical VelvetBazzar edge functions.

## Architecture

```
supabase/functions/_shared/phase-shield/
  constants.ts          — Riemann 718.5701251542 Hz carrier, FIR kernel
  compensated-phase.ts  — float64 drift compensation (448th-zero eps)
  fir-filter.ts         — zero-phase FIR (forward/backward pass)
  dither.ts             — TPDF response timing mask
  token.ts              — HMAC phase token mint/verify
  jitter-monitor.ts     — perf_counter_ns jitter + DB audit log
  middleware.ts         — withPhaseShield() wrapper (Drop Package Protocol)
```

## Protected endpoints

- `auth-signup`, `create-checkout-session`, `messaging-api`, `velvet-coin-api`
- `create-shipping-label`, `refund-order`, `create-stripe-connect-account`
- `stripe-connect-status`, `notify-new-message`, `auto-tag-product`, `chat-assistant`
- `phase-shield-handshake` (bootstrap — no token required)

**Excluded:** `stripe-webhook`, `shipping-webhook` (external providers).

## Headers

| Header | Direction | Purpose |
|--------|-----------|---------|
| `X-Phase-Token` | both | HMAC token tied to anchor ns |
| `X-Phase-Anchor` | both | Server timestamp (nanoseconds) |
| `X-Phase-Compensation` | response | float64 epsilon correction |
| `X-Phase-Seq` | request | Client sequence counter |
| `X-Request-Time` | request | Client perf_counter ns |
| `X-Phase-Integrity` | response | Zero-phase verification tag |

## Client

`src/lib/phaseShield.ts` wraps Supabase `fetch` and bootstraps via handshake on app load.

## Database

Migration `20260617140000_phase_shield.sql`:
- `phase_shield_state` — per-client delta history
- `phase_shield_jitter_log` — microsecond jitter audit trail

## Staging integrity tests

1. Load site → handshake stores token in sessionStorage
2. Handshake response includes `"tables_ready": true` after first call (auto-provisions DDL via `SUPABASE_DB_URL`)
3. Register / checkout / message → responses include `X-Phase-Token`
4. Replay stale token → expect HTTP 403 after **8 warmup requests** (request 9+)
5. Script rapid-fire requests with fixed interval → `harmonic_bot_signature` drop in logs
6. Query `phase_shield_jitter_log` for dropped=true rows

## Warmup

Jitter analysis and token enforcement begin after **12 requests** per client key (mobile packet-loss safe margin).

## Network grace (public Wi‑Fi / trains)

When inter-request deltas exceed **800ms** (volatile RTT), phase/harmonic drops are softened:
- Up to **6 grace passes per client per 24h** (logged as `network_grace_applied`)
- Authenticated users may receive token grace on unstable connections
- `rigid_timing_loop` (bot scripts) still hard-drops

Set `PHASE_SHIELD_SKIP_PROVISION=true` after CI migrations to skip cold-start DDL.

## Jitter audit log fields

`phase_shield_jitter_log` includes: `drop_reason`, `user_id` (if JWT present), `ip_masked`, `user_agent`, `network_volatile`.

## Production migration status

GitHub Actions migration workflow requires `SUPABASE_ACCESS_TOKEN` (currently **not set** — SQL file was not pushed via CLI).

**Fallback (active):** edge functions auto-run `20260617140000_phase_shield.sql` DDL on first protected request via built-in `SUPABASE_DB_URL`. Handshake returns `tables_ready: true` when verified.

## Optional env

`PHASE_SHIELD_SECRET` — HMAC key (defaults to service role key)
