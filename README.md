# RAEN Skills — Operational Knowledge from a Live x402 Fleet

Practical, battle-tested skills from operating **12 x402-payable services on Base**, a settlement collector, and a daily self-healing fleet sweep (the Steward). Every procedure here is what we actually run — real commands, real incident post-mortems, honest numbers.

## For Claude Code users

These skills ship as [Agent Skills](skills.html) (`SKILL.md` format) - install them straight into `.claude/skills/` with curl: **[install guide ->](skills.html)**

## The Skills

| Skill | What you get | Price |
|---|---|---|
| [The Steward Pattern — Self-Healing Fly.io Fleet Operations](steward-pattern-flyio.md) | The exact daily sweep: liveness checks, crash-loop diagnosis (with a real post-mortem), Vercel prod repair, manifest drift checks, run-log format | **$29** |
| [Charge-and-Rebate — Net-$0 First-Call Funnels for x402 APIs](charge-and-rebate-funnel.md) | Build "first call genuinely free": charge rail + on-chain rebate rail, anti-abuse by wallet, trust artifacts, copy that converts | **$29** |
| [x402 Production Deployment — Manifest, Facilitator, Telemetry, Drift Guard](x402-production-deployment.md) | Manifest invariants, the three-surface verification, settle-path telemetry, daily drift guard, discoverability (llms.txt, agents.json, awesome-x402) | **$29** |

## The Bundle

**All three for $149** — the complete operating manual for a production x402 fleet: deploy it, heal it, and grow it.

## Why buy from us

- **It's what we run.** Not theory: real run logs, real incidents (a crash-loop caused by a config invariant, repaired and verified), real telemetry patterns.
- **TRUTH law.** We publish our zeros. 2,900+ challenge requests/day, and we tell you exactly how many settled.
- **Machine-readable web.** Our fleet serves llms.txt, agents.json, and a public stats page — we practice what the skills preach.

## Contact / proof

- Fleet directory: https://bshelby88.github.io/raen-agent-directory/
- Live stats: https://bshelby88.github.io/raen-agent-directory/stats/
- First-call-free funnel: https://bshelby88.github.io/raen-first-call-free/
- Operator: RAEN · github.com/bshelby88

## License

Personal/team use. No redistribution or resale.


## Install as a Claude Code plugin marketplace

One command inside Claude Code:

```
/plugin marketplace add bshelby88/raen-skills
```

Then install a skill: `/plugin install steward-pattern-flyio@raen-skills` (also: charge-and-rebate-funnel, x402-production-deployment). Manifest: [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) - 3 plugins, each a self-contained `skills/<name>/SKILL.md`. Same content as the $29 individual listings; the bundle stays $149 with storefront fulfillment.

Audience: Claude Code / MCP agent developers who pay for proven ops patterns.
