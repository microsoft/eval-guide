# Baseline Comparison Template — Pillar 5 L200 Defined Reference

<!--
  AI-readable source content. The customer-facing artifact is generated as
  `baseline-comparison-<agent>-<date>.xlsx` via the /xlsx skill at Stage 2 close.
  See SKILL.md "Stage 2 → After confirmation → Deliverable D" for sheet structure
  and rendering rules. Edit this file when the template content changes; the xlsx
  render follows automatically on the next session.
-->

> **Pillar:** 5 — Handle changes with confidence
> **Level:** L200 Defined
> **Purpose:** A fill-in-the-blanks template for comparing two eval runs (before vs. after a change), so changes ship on evidence rather than intuition.
> **When to use:** Any time you re-run the eval set after a change to prompts, knowledge sources, tools, models, or architecture, and need to decide whether to ship.

This is the Pillar 5 starter artifact from `/eval-guide`. It moves the agent from L100 Initial ("changes ship on spot-checks and intuition") to L200 Defined ("before any change ships, eval set is rerun and compared to the prior baseline; evidence, not intuition, decides whether to proceed"). L300 Systematic and beyond require change-type-aware automation that this doc does not provide.

## Prerequisites

You need:

- A **baseline run** — eval results from before the change, archived as CSV. If this is your first comparison and no baseline exists, run the eval suite once on the unchanged agent and call that Run 1.
- A **current run** — eval results from after the change, on the same eval set version.
- Both runs use the **same eval set version** and the **same environment** (same connectors, same user profile if applicable). Apples-to-apples is the whole point.

If either run was on a different eval set or environment, the comparison is invalid — re-run on the matched configuration first.

## Two run types — know which one you're running

Different runs serve different purposes; mixing them up causes false alarms:

- **Capability eval runs** target hard scenarios the agent currently fails. Initial pass rates are expected to be low. **Success = the pass rate improving over iterations.** These are stretch goals.
- **Regression eval runs** re-run previously-passing test cases after a change. **Pass rates should be near 100%.** Any drop is a regression that must be investigated. These are guardrails.

A healthy practice uses both: capability runs to push forward, regression runs to ensure the agent doesn't slide backward.

## Comparison table (fill in)

Copy this block into your archive and fill it in:

```
Comparison: [run 1 name/version] → [run 2 name/version]
Eval set version: [date stamp on the CSV files]
Change description: [what's different — prompt edit, knowledge update, model swap, etc.]

| Metric                         | Run 1 (Before) | Run 2 (After) | Delta |
|--------------------------------|----------------|---------------|-------|
| Overall pass rate              |                |               |       |
| High Value · High Risk pass rate    |                |               |       |
| High Value · Low Risk pass rate     |                |               |       |
| Low Value · High Risk pass rate     |                |               |       |
| Low Value · Low Risk pass rate      |                |               |       |
```

## Case-level delta (fill in)

Every case in the eval set falls into one of four buckets compared to the prior run. Count them and act on Pass-Fail first.

| Bucket | Meaning | Priority | Action |
|---|---|---|---|
| Pass-Pass (Stable) | Passed in both runs, no regression | Lowest | None. These are the regression baseline. |
| Fail-Pass (Fixed) | Failed before, passes now — the change worked | Verify | Run 2-3 more times to confirm the fix is genuine, not non-determinism. |
| Pass-Fail (Regressed) | Passed before, fails now — the change broke something | **HIGHEST** | Investigate immediately. Regressions are worse than pre-existing failures because they represent lost ground. |
| Fail-Fail (Persistent) | Failed in both runs, the change didn't help | Re-examine | If the change was supposed to fix this case and didn't, the diagnosis was wrong. Refer to `/eval-triage-and-improvement`. |

```
Case-level summary:
| Bucket          | Count | Notable cases (criterion IDs) |
|-----------------|-------|-------------------------------|
| Pass-Pass       |       |                               |
| Fail-Pass       |       |                               |
| Pass-Fail       |       |                               |
| Fail-Fail       |       |                               |
```

## Decision rules

Apply these to interpret the delta:

- **±5% overall variance is normal** (LLM non-determinism). Do not celebrate or panic over small swings. If the change is meant to be meaningful, run the eval 3 times and take the median to distinguish signal from noise.
- **A case that flips between runs on the same agent version** (no change in between) is a **reliability problem**, not a quality problem. Flag it separately — it pollutes future comparisons.
- **Regressions outnumber fixes** after a change → the change had a net negative impact. Consider reverting.
- **All fixes in one category, all regressions in another** → instruction conflict. The prompt edit that fixed safety responses may have over-constrained business responses. This is the most common pattern when system-prompt edits have unintended side effects.
- **A net-zero comparison** (same overall rate, but different cases pass/fail) is not "no change" — it's churn. Investigate which cases moved.

## Ship / hold decision

The comparison answers one question: should this change ship?

- **Ship** if High Value · High Risk and Low Value · High Risk are stable or improving, regression count is zero or explainable, and net delta is positive.
- **Hold** if any High Value · High Risk or Low Value · High Risk case regressed. These are zero-tolerance. Investigate before shipping.
- **Hold** if regressions outnumber fixes regardless of quadrant — re-examine the change.
- **Iterate** if Fail-Fail cases show the change didn't address what it was supposed to. Diagnose with `/eval-triage-and-improvement`.

Document the decision and the reason in your archive next to the comparison table. Future-you and your teammates need to see what evidence drove the call.

## You've reached L200 Defined when…

- At least one baseline run exists and is archived in CSV.
- At least one before/after comparison has been completed using this template.
- The comparison table and decision are documented and retained alongside the agent's eval artifacts.
- A change has been held or shipped based on this evidence — not pushed through "because the demo looked fine".

## Path to L300 Systematic

L300 requires that **each change type triggers the right eval subset** and that **baseline comparison is required to validate improvements and catch regressions**. Two things change vs. L200:

1. **Change-type routing is codified** — a prompt edit triggers the prompt-sensitive subset; a tool change triggers the tool-routing subset; a model swap triggers the full suite. This needs documentation per change type and ideally automation in your release process.
2. **Comparison is non-optional** — no change ships without a documented before/after. At L200 you do this when you remember; at L300 it's part of the workflow itself.

Come back for a Pillar 5 L300 session when you have at least three changes' worth of comparison history to design the routing rules from.

## References

- `maturity-model.md` — full 5×5 definition of Pillar 5 levels.
- `rerun-protocol-<agent>-<date>.docx` — Pillar 3 starter document, used together with this template when a re-run is also a comparison.
- `/eval-result-interpreter` — skill for the four-bucket delta logic, variance rules, and capability-vs-regression framing this template relies on.
- `/eval-triage-and-improvement` — skill for diagnosing failure patterns when the comparison shows a problem.
- [Copilot Studio Result comparison](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-intro) — built-in tool for side-by-side run comparison; a useful complement to this template.
