---
name: x402-production-deployment
description: Production deployment playbook for x402 paid APIs on Fly.io: manifests, live 402 challenge verification, middleware telemetry, and deploy-path fallbacks.
---

# Skill: x402 Production Deployment — Manifest, Facilitator, Telemetry, Drift Guard

**Price:** $29 · **Part of the RAEN Operations Bundle ($149)** · Author: RAEN (bshelby88)

## Role
You are taking an x402-payable HTTP service from "works locally" to production on Fly.io with Base (eip155:8453) USDC settlement — and keeping it from drifting. RAEN runs 12 x402 services this way; this is the checklist we wish we'd had before the first crash-loop.

## When to use
- Deploying a new x402 service, or auditing an existing one.
- You're seeing 402s served but zero settles, or a manifest that stopped matching what's actually deployed.

## Procedure

### 1. Manifest
Serve `/.well-known/x402.json` from the app itself. Required: exact scheme name, `network: "eip155:8453"`, `payTo` = your canonical receive address (lowercase-checksummed, compare case-insensitively).
```bash
curl -s https://<app>.fly.dev/.well-known/x402.json
```
Keep the source-of-truth manifest in the repo; the served one must match it byte-for-byte on the invariant fields.

### 2. Payment-route invariant
If your app generates API docs or route tables from configured payment routes, enforce the invariant explicitly and make the validator match reality. Real incident: a validator demanded *exactly one* configured route; adding a second route for a probe change crash-looped the machine on boot (`api-docs.js:15`). Fix the validator (`>=1`, document from the first entry), not the route list. **Lesson: any config invariant that can crash-loop on boot must tolerate legitimate variation or be checked in CI before deploy.**

### 3. Deploy + verify all three surfaces
```bash
fly deploy -a <app>
curl -s -o /dev/null -w '%{http_code}' https://<app>.fly.dev/health            # 200
curl -s -o /dev/null -w '%{http_code}' https://<app>.fly.dev/.well-known/x402.json  # 200
curl -s https://<app>.fly.dev/<paid-endpoint>                                  # 402 with decodable challenge
```
Decode the 402 challenge and check `payTo` matches canonical. A service is not "live" until all three pass.

### 4. Facilitator + settle path
- Wire settlement through a facilitator; verify the facilitator's settle callback is exercised at least once with a real wallet before declaring production-ready.
- Monitor: challenges served vs settled vs failed. Pattern reading: thousands of challenges + 0 settles + small failed count = scanner traffic (normal at launch); rising failed count = payment-path incident.
- Scan the receive address periodically: `eth_getLogs` for `Transfer` events to your payTo over recent blocks (we scan ~24h of blocks per run). Re-baseline the balance every run; never trust memory for the number.

### 5. Telemetry collector
Run one collector service for the whole fleet (ours: settlement-collector on Fly) exposing `/stats` and a public proof page + stats.json. Publish zeros honestly — it's your trust artifact and your incident detector in one.

### 6. Drift guard (daily)
Sweep every service: health 200, manifest matches canonical payTo, paid endpoint still 402-challenges correctly. Any mismatch → fix source → redeploy → re-verify. Write a dated run log with numbers only.

### 7. Discoverability (make agents find you)
Publish an llms.txt + agents.json directory listing all endpoints, price tiers, and manifest URLs; submit PRs to awesome-x402; register in the MCP Registry. Expect PRs to sit unmerged for weeks — don't count on them.

## Failure modes
- **Serving a manifest different from the deployed app** — the classic drift. Sweep daily, compare field-by-field.
- **Validator invariants that crash-loop on boot** — see §2; check in CI.
- **DNS negative-caching false alarms** on bare names — probe FQDNs.
- **Stale treasury numbers in scheduled content** — automated posts will happily quote last week's balance. Re-verify numbers at send time or strip them.
- **Registering success from a 200 on /health alone** — the money endpoint can still be broken.

## Verification
- All 3 surfaces green on every service, twice in a row.
- One real end-to-end settle observed (or honestly reported as zero-settle).
- Manifest diff vs repo source-of-truth: empty.
