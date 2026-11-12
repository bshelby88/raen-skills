---
name: charge-and-rebate-funnel
description: Charge-and-rebate funnel design for x402 APIs: why zero-value challenges cannot settle and how the charge-then-rebate pattern preserves free-tier conversion with honest bookkeeping.
---

# Skill: Charge-and-Rebate — Net-$0 First-Call Funnels for x402 APIs

**Price:** $29 · **Part of the RAEN Operations Bundle ($149)** · Author: RAEN (bshelby88)

## Role
You are designing a developer-acquisition funnel for paid HTTP APIs that use the x402 payment protocol (HTTP-native 402 → USDC settlement on Base). The funnel's promise: *the first call is genuinely free* — the buyer pays, then gets refunded on-chain. Net $0, provably, not "free tier".

## When to use
- Your x402 service gets thousands of probe requests and zero settles because agents won't pay to try.
- You want conversion without giving away unauthenticated API access or maintaing demo keys.
- You need an on-chain-verifiable "we actually refunded you" trust artifact.

## Procedure

### 1. Charge rail (you already have this)
Service returns `402` with a payment challenge; buyer settles USDC on Base (eip155:8453) via a facilitator; service verifies and serves. Nothing changes here.

### 2. Rebate rail
Build a small rebater service that:
1. Accepts `(buyer wallet, service, tx hash of the settled payment)`.
2. Verifies the settlement exists on-chain (eth_getLogs `Transfer` → your payTo address over recent blocks).
3. Sends USDC back to the buyer, ≥ the amount charged.
4. Records the rebate so the same wallet can't claim twice inside the window (30 days for us).

Live reference implementation: https://bshelby88.github.io/raen-first-call-free/

### 3. Anti-abuse
- One free call per wallet per 30 days — enforce on-chain by wallet address, not IP.
- Cap total rebate spend and **alert when the rebate wallet runs low** — a funnel that dies silently when rebates run out looks identical to a broken product. (This bit us: AgentCash low-treasury alert.)
- Verify the settlement tx actually paid YOUR payTo address, canonical form, before rebating.

### 4. Trust artifact
Publish a proof page (ours: `settlement-collector.fly.dev/proof`) showing settlements, rebates, and a live stats JSON. Under a TRUTH policy: publish your zeros too. "2,853 challenges / 0 settled / $0" is a trust signal, not an embarrassment.

### 5. Copy that converts
The one-liner that works:
> Not a demo key. Call a paid x402 API on Base for net $0: a real 402 challenge, a real USDC settlement, then our rebater refunds it on-chain.

Differentiators to lead with: real settlement (not sandbox), refund is on-chain and checkable, no signup.

## Failure modes
- **Rebate wallet drains** → funnel dead with no error anywhere. Monitor balance; alert below N calls' worth of buffer.
- **Rebating before settlement confirms** → you fund attackers. Wait for the transfer to appear in a block you scanned yourself.
- **Claiming revenue you can't substantiate** — if the collector shows 0 settled, don't post revenue numbers. Rewrite the post, keep the slot.
- **Double claims** — key the 30-day window on wallet address.

## Verification
- End-to-end once yourself: call the paid endpoint → confirm 402 → settle → request rebate → see USDC back at your wallet.
- Stats page reflects the settle + rebate within one refresh cycle.
- Duplicate rebate attempt for same wallet inside window is rejected.
