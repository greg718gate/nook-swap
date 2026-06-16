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
2. Register / checkout / message → responses include `X-Phase-Token`
3. Replay stale token → expect HTTP 403
4. Script rapid-fire requests with fixed interval → `harmonic_bot_signature` drop in logs
5. Query `phase_shield_jitter_log` for dropped=true rows

## Optional env

`PHASE_SHIELD_SECRET` — HMAC key (defaults to service role key)
