# Evals for `/eval-guide`

This folder contains the **eval set for the `/eval-guide` skill itself** — built by applying `/eval-guide`'s own Stage 1 + Stage 2 methodology to `/eval-guide`. Eat the dogfood.

## Why this exists

`/eval-guide` is an eval-authoring skill that customers depend on for production-eval design. If the skill drifts (e.g., produces 12 fragmented quality dimensions instead of 4–6 consolidated ones; quietly accepts aspirational-language capabilities; forgets to apply the 20% rule in triage; resists adversarial inputs poorly), customers get bad eval plans and won't know it. These evals codify the invariants the skill commits to so we can detect regressions.

## Structure

```
evals/
├── README.md              ← this file
├── eval-plan.md           ← the Stage 1 output applied to /eval-guide itself:
│                            Agent Vision, ~28 acceptance criteria placed on the
│                            Value × Cost matrix, methods, pass/fail conditions
└── test-cases.json        ← the Stage 2 output: concrete test prompts + expected
                             behaviors per criterion, structured for an LLM-judge
                             or human-grader workflow
```

## How to run

There are two execution modes — pick by your bandwidth.

### Mode 1 — Human-grader (gold standard)

For each test case in `test-cases.json`:

1. Open a **fresh** Claude Code session (no prior `/eval-guide` context).
2. Paste the `trigger_input` into chat.
3. Observe the AI's full response through whatever stage the test exercises.
4. Score against `pass_conditions` and `fail_conditions` — both must hold to pass.
5. Record verdict (pass / fail / unsure) + notes per case.

This is gold-standard but slow. Use it for the **Critical** and **Guardrails** quadrant cases at minimum.

### Mode 2 — LLM-judge (scalable)

For each test case, run a 3-step pipeline:

1. **Capture transcript** — invoke `/eval-guide` with the `trigger_input` (manually or via [`copilot-studio:run-eval`](../skills/eval-guide/) if available). Save the AI's full response.
2. **Run judge** — pass the transcript + `pass_conditions` + `fail_conditions` to an LLM judge (Claude Sonnet works). Use a Custom rubric with explicit Pass/Fail/Unclear labels.
3. **Calibrate** — for the first run, **also human-grade ~10–15% of cases** and compare to judge verdicts. If agreement < 80% (Cohen's κ < 0.6), the rubric needs sharpening before trusting the judge.

LLM-judge is fast but non-deterministic (±5% variance per run). For borderline cases, run twice and take the median.

## Coverage

The plan covers `/eval-guide`'s six stages plus cross-cutting invariants:

| Stage / Group | Test count | Critical | Valuable | Guardrails | Deprioritize |
|---|---|---|---|---|---|
| Triggers | 4 | 1 | 1 | 2 | 0 |
| Stage 0 — Discover | 4 | 2 | 1 | 1 | 0 |
| Stage 1 — Plan | 7 | 2 | 1 | 4 | 0 |
| Stage 2 — Generate | 5 | 2 | 1 | 2 | 0 |
| Stage 3 — Run | 2 | 0 | 1 | 0 | 1 |
| Stage 4 — Interpret | 4 | 1 | 1 | 2 | 0 |
| Cross-cutting | 4 | 0 | 1 | 3 | 0 |
| **Total** | **30** | **8 (27%)** | **7 (23%)** | **14 (47%)** | **1 (3%)** |

Distribution roughly matches `/eval-guide`'s own targets for HIGH-risk agents (25–40% Critical, 15–30% Valuable, 30–50% Guardrails, 0–10% Deprioritize). The Guardrails-heavy bias is intentional — most of the friction the skill addresses lives in failure modes (boundary skips, aspirational-language sneaks, adversarial inputs, rule violations).

## When to re-run

- **Pre-merge** — every PR that touches `skills/eval-guide/SKILL.md`, `dashboard/templates/*.html`, `dashboard/serve.py`, or any reference doc. Run **all Critical + Guardrails cases**.
- **Post-deploy / pre-release** — full eval set on the published plugin version.
- **After model upgrade** (Sonnet 4.5 → 4.6, etc.) — full eval set, expect a 5–10% pass-rate swing while re-grounding.
- **On customer report** — if a customer says "the skill produced X weird behavior," add a regression test to the relevant quality signal before fixing.

## Calibration baseline

A green run on this eval set means:
- **Critical ≥ 90%** (the skill does its core job correctly across kickoff styles)
- **Valuable ≥ 80%**
- **Guardrails ≥ 95%** — refusals, anti-patterns, and adversarial resistance hold
- **Deprioritize** — not a release gate

Below those, **don't ship**. Diagnose with `/eval-result-interpreter` (or just read the failure column in the test results CSV) and remediate.

## What this eval set deliberately does NOT test

- **Dashboard UI rendering** — visual layout, color contrast, button placement. A real browser-test framework (Playwright, etc.) would cover this; we don't have one wired up. The eval-set tests the *behavior* the dashboard exposes, not its appearance.
- **Plugin install / version-check / upgrade flow** — that's a separate concern; the dashboard `bin/eval-guide-update-check` script has its own integration tests path.
- **End-to-end against a live Copilot Studio agent** — Stage 3 execution evals require a running agent and DirectLine endpoint, which is per-customer and not codifiable here. We test the *guidance* the skill produces around Stage 3, not the run itself.

## Updating these evals

The eval-plan and test cases are themselves the output of running `/eval-guide` with `/eval-guide` as the agent under test. When the skill's behavior intentionally changes:

1. Update the relevant criterion in `eval-plan.md`
2. Update the matching test cases in `test-cases.json`
3. Re-run the affected quadrant
4. Note the change in the commit message (which criterion changed and why)

Don't update tests to make them pass — investigate the behavior change first.
