# Candidate Review Targets

Date: 2026-08-07

Purpose: identify which public `Vishwa-docs` hackathon repos can be used in
ProofRank's "Review a GitHub project" flow once Bright Data live collection is
available.

## Best Target

Use ProofRank itself as the primary actual-review target unless the team wants
to showcase an older project.

```text
Repo: https://github.com/Vishwa-docs/proofrank-ai-factory
Demo: https://vishwa-docs.github.io/proofrank-ai-factory/
Direct-mode score: overall 89 / Bright fit 72 / Bright prize 64
Current verdict: Strong but gated
Remaining risk: needs executed Bright Data provider trace
```

Why: the public repo and demo are reachable, the README and code contain the
strongest Bright Data evidence, and the app is purpose-built for the sponsor
challenge. Once `PROOFRANK_FETCH_MODE=mcp` passes, this should become the first
live Bright Data review run.

## Secondary Candidate

```text
Repo: https://github.com/Vishwa-docs/Meta_PyTorch_Scalar_OpenEnv-Hackathon
Demo: https://huggingface.co/spaces/TheJackBright/polypharmacy-env
Direct-mode score: overall 67 / Bright fit 72 / Bright prize 64
Current verdict: Needs review
Risks: needs native.builder explanation, executed Bright Data trace, sharper originality support
```

Why: public repo and Hugging Face demo are reachable, with enough technical
depth to make a useful external review example. It is less sponsor-aligned than
ProofRank because Bright Data is not central to that project.

## Reachable But Weak For This Prize

```text
Repo: https://github.com/Vishwa-docs/fieldpilot
Demo: https://fieldpilot-three.vercel.app/
Direct-mode score: overall 54 / Bright fit 12 / Bright prize 42
Current verdict: High risk
```

Why: reachable repo/demo, but it has no visible Bright Data role in the public
evidence. Use only as a negative-control example.

## Rejected In Direct Smoke

```text
Repo: https://github.com/Vishwa-docs/mediCaRE-ChainLink-Convergence
Demo: https://medicare-frontend-production.up.railway.app/
Issue: demo returned 404

Repo: https://github.com/Vishwa-docs/WorldWideVibes-UrbanPulse
Demo: https://urbanpulse-api-production.up.railway.app
Issue: demo returned 404
```

These may still be reviewable if the demo URLs are repaired, but they should not
be used for the final Bright Data prize run as-is.

## Commands To Replay

```bash
npm run live:smoke:direct -- https://github.com/Vishwa-docs/proofrank-ai-factory https://vishwa-docs.github.io/proofrank-ai-factory/
npm run live:smoke:direct -- https://github.com/Vishwa-docs/Meta_PyTorch_Scalar_OpenEnv-Hackathon https://huggingface.co/spaces/TheJackBright/polypharmacy-env
npm run live:smoke:direct -- https://github.com/Vishwa-docs/fieldpilot https://fieldpilot-three.vercel.app/
```

After Bright Data auth is fixed, rerun the ProofRank command as:

```bash
PROOFRANK_FETCH_MODE=mcp npm run live:smoke -- https://github.com/Vishwa-docs/proofrank-ai-factory https://vishwa-docs.github.io/proofrank-ai-factory/
```
