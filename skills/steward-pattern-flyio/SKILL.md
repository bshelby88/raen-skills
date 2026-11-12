---
name: steward-pattern-flyio
description: Self-healing fleet ops: the RAEN Steward sweep pattern for keeping a multi-service deployment alive and honest (liveness, manifest integrity, on-chain truth, escalation policy).
---

# Skill: The Steward Pattern — Self-Healing Fly.io Fleet Operations

**Price:** $29 · **Part of the RAEN Operations Bundle ($149)** · Author: RAEN (bshelby88)

## Role
You are the fleet steward for a multi-service Fly.io deployment (12+ live services). Your job is a recurring sweep: verify liveness, repair what's broken, verify the repair, and write an honest run log. This skill encodes the exact procedure RAEN runs daily across 14 endpoints.

## When to use
- You run 5+ services on Fly.io (or Fly + Vercel) and something is always quietly broken.
- You want a repeatable daily sweep that finds crash-loops, dead deployments, manifest drift, and stale machines before your users do.
- A service crash-looped and Fly left it stopped.

## Procedure (the actual sweep, in order)

### 1. Fleet liveness
```bash
for svc in royal-ruby-x402 tradingagents-x402 dispute-forge-x402 \
  nanobanana-x402 nft-alpha-x402 escrow-x402 vault-pro-x402 \
  dispatch-x402 contract-eye-x402 briefsnap-x402 sentry-forge-x402; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 "https://$svc.fly.dev/health")
  echo "$svc $code"
done
```
- Expect 200 everywhere. Record the count ("14/14 green") in the run log.
- **Gotcha:** bare service names can return 000 from DNS negative-caching. Always probe the fully-qualified `-x402` hostnames.
- Also probe non-HTTP-200-by-design paths: a gateway should return 401 without a key (that IS healthy), not 200.

### 2. Crash-loop diagnosis (the sentry-forge case)
Symptom: app down; `fly status` shows "max restart count reached", machine left stopped.
1. `fly logs -a <app>` → read the boot error. Real example: `api-docs.js:15 "API docs require exactly one configured payment route"` — an uncommitted route added for a probe broke a one-route invariant.
2. Fix the invariant check, not the symptom: our fix changed the validator to accept `>=1` routes and document from the first entry.
3. Redeploy: `fly deploy -a <app>`
4. **Verify all three surfaces before declaring fixed:** `/health` 200 with readiness all true, `/.well-known/x402.json` 200, and a real business endpoint returning its expected status (e.g. GET 402 with a decodable challenge).
5. Commit with the incident noted: `git commit -m "fix: accept >=1 payment routes in api-docs (sentry-forge crash-loop)"`.

### 3. Dead/misconfigured frontend (Vercel repair)
Symptom: every path 404 on the served deployment.
```bash
cd <site-dir> && vercel deploy --prod --yes
```
Re-check homepage + inner pages for 200. (This repaired raen-law-pages on 2026-11-10.)

### 4. Manifest/consistency drift check
For fleets serving machine-readable configs (we serve `/.well-known/x402.json`):
```bash
curl -s https://<svc>.fly.dev/.well-known/x402.json | python3 -c \
  "import json,sys; m=json.load(sys.stdin); print(m['network'], m.get('payTo'))"
```
Compare `payTo` against the canonical address (case-insensitive). Any mismatch = drift = fix the source manifest, redeploy, re-check.

### 5. Telemetry sanity
Pull your collector's /stats (ours: `https://settlement-collector.fly.dev/stats`). Look for *patterns*, not just totals: challenges up 2x with 0 settles = bot/scanner traffic, not a payment-path incident. Zero-settle for multiple consecutive runs = escalate the settle path.

### 6. Write the run log
One markdown file per run (`STEWARD-RUN-<date>.md`), sections: FLEET, MANIFESTS, INCIDENT+FIX, ON-CHAIN/STATE, TELEMETRY, ANOMALIES/NEXT. Numbers only, no adjectives. Flag every unexplained delta for re-baseline next run.

## Failure modes
- **False 000s from DNS negative-caching** — use FQDNs; re-probe before declaring down.
- **"Fixed" without verification** — a deploy that returns 200 on /health can still 404 on the money endpoint. Verify all surfaces.
- **Treating bot traffic as revenue failure** — 2,900 challenges/0 settles with a tiny failed count is scanner noise; 0 settles *with* rising failed counts is an incident.
- **Stale baselines** — memory says $10.55, chain says $10.90? Re-scan logs, correct the baseline, note it. Never post numbers from memory.
- **External dependency outage mid-run** — e.g. a knowledge store returning internal errors: store the artifact locally in the run log and re-upload when fixed. Escalate after 3 attempts.

## Verification
- Run the sweep twice back-to-back; counts must match.
- After any repair: health 200 + config endpoint 200 + business endpoint expected status.
- Run log exists for the run with at least one concrete number per section.
