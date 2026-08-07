# Design - ProofRank

A locked visual system for the ProofRank reviewer app. Every UI pass should keep
the product feeling like an evidence instrument: quiet, dense, source-led, and
plain about what is still gated.

## Genre
modern-minimal

## Macrostructure family
- App pages: Map / Diagram for evidence routing, with Workbench panels for task execution.
- Marketing/submission pages: Workbench, using real product captures rather than fake UI chrome.
- Content pages: Long Document, typography only.

## Theme
- `--color-paper`   oklch(97% 0.009 245)
- `--color-paper-2` oklch(94% 0.012 245)
- `--color-paper-3` oklch(90% 0.014 245)
- `--color-ink`     oklch(18% 0.018 245)
- `--color-ink-2`   oklch(38% 0.016 245)
- `--color-rule`    oklch(83% 0.018 245)
- `--color-accent`  oklch(48% 0.18 245)
- `--color-focus`   oklch(58% 0.19 245)

## Typography
- Display: IBM Plex Sans, weight 700, style normal
- Body: IBM Plex Sans, weight 400
- Mono: JetBrains Mono, weight 500-700
- Display tracking: 0
- Type scale anchor: `--text-2xl = clamp(2rem, 4vw, 3.4rem)`

## Spacing
4-point named scale in `tokens.css`. Pages use `var(--space-*)`, not raw values.

## Motion
- Easings: `--ease-out`, `--ease-in`, `--ease-in-out`
- Reveal pattern: one page-load reveal only
- Reduced-motion fallback: spatial motion removed, duration capped at 150 ms

## Microinteractions stance
- Silent success
- Visible focus rings with no focus-ring animation
- Hover lift is limited to actionable controls and rows
- Error and warning states name the missing proof

## CTA voice
- Primary CTA: ink fill, compact rectangle, verb-first label
- Secondary CTA: outlined rectangle, same height as inputs

## Per-page allowances
- App pages must not use decorative enrichment. Function and source state carry the interface.
- Screenshots and deck assets may use real product captures only.

## What pages MUST share
- ProofRank wordmark treatment
- Ink-blue accent, below 5% of the viewport
- IBM Plex Sans and JetBrains Mono
- 8px-or-less radius system
- Evidence-first headings and labels

## What pages MAY differ on
- App pages may move between Map / Diagram and Workbench layouts.
- Submission or pitch pages may use real screenshots and deck montage images.

## Exports

### tokens.css
See `tokens.css` at the project root for portability and `app/tokens.css` for the static app runtime.
