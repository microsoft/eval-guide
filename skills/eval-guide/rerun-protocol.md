# Rerun Protocol — Pillar 3 L200 Defined Reference

<!--
  AI-readable source content. The customer-facing artifact is generated as
  `rerun-protocol-<agent>-<date>.docx` via the /docx skill at Stage 2 close.
  See SKILL.md "Stage 2 → After confirmation → Deliverable C" for rendering rules.
  Edit this file when the protocol structure or content changes; the docx render
  follows automatically on the next session.
-->

> **Pillar:** 3 — Run evals across the lifecycle
> **Level:** L200 Defined
> **Purpose:** A starter protocol for re-running evals when the agent changes, so eval execution is documented and triggered consistently — not skipped, not improvised.
> **When to use:** After any change to the agent's prompt, knowledge sources, tools, models, or topics. Before any release.

This is the Pillar 3 starter artifact from `/eval-guide`. It moves the agent from L100 Initial ("no routine evals") to L200 Defined ("evals run on changes; results are logged"). L300 Systematic and beyond require automation that this doc does not provide.

## Prerequisites

You need:

- An eval set built (Stage 2 deliverable: the `eval-<signal>-<date>.csv` files).
- A way to run it — Copilot Studio's Evaluation tab, the eval-runner script, or another runner.
- A place to archive results — local `.csv` exports work fine for L200; Copilot Studio retains run results for only 89 days, so always export.

## When to re-run

Use the trigger as the prompt; the scope column tells you what subset to run, not just whether to run.

| What changed | What to re-run | Priority order |
|---|---|---|
| Single test case (eval bug fix) | Only the affected test case | Run the one case |
| Agent config change (instructions, settings) | Affected test cases + spot-check one unrelated set | High Value · High Risk + Low Value · High Risk first, then targeted |
| System prompt change | Full eval suite | High Value · High Risk + Low Value · High Risk first, then full |
| Knowledge source update | All knowledge-grounding and factual-accuracy cases | High Value · High Risk + Low Value · High Risk first, then knowledge cases |
| Tool / connector change | All cases that exercise the tool, plus capability-routing cases | High Value · High Risk + Low Value · High Risk first, then tool cases |
| Model upgrade | Full eval suite | High Value · High Risk + Low Value · High Risk first, then full |
| New feature added | New cases for the feature + full High Value · High Risk + Low Value · High Risk to catch regressions | New + High Value · High Risk + Low Value · High Risk minimum |
| Scheduled cadence (no change) | Full suite at a defined interval (weekly + pre-release minimum) | Full suite |

## Run order rule

Run **High Value · High Risk** and **Low Value · High Risk** quadrant cases first, regardless of trigger. Two reasons: (1) if High Value · High Risk or Low Value · High Risk fail, the rest is noise — fix those before interpreting High Value · Low Risk or Low Value · Low Risk results; (2) Low Value · High Risk cases are short and run fast, so you get a fast signal on whether the change broke anything safety-related.

Never re-run only the failing cases from a previous run. Always include the previously-passing set so regressions surface. A "fix" that breaks two unrelated cases is worse than the original failure.

## Logging discipline

For every re-run, capture in your archive:

- **Run date** (timestamp).
- **Agent version or change description** — what's different from last run? "Updated PTO knowledge source", "switched to gpt-4o", "added empathy instruction".
- **Eval set version** — which CSV files were used, with their date stamps.
- **Pass rate per quadrant** — High Value · High Risk, High Value · Low Risk, Low Value · High Risk, Low Value · Low Risk.
- **Pass/fail status per case** — exported from Copilot Studio's Evaluation tab as CSV.

A spreadsheet, a markdown file in the repo, or `eval-results-<YYYY-MM-DD>.csv` per run is enough at L200. The discipline is logging, not tooling.

## Interpreting re-run results

Use the four-bucket case-level delta from your baseline-comparison workbook (Pillar 5 starter, `baseline-comparison-<agent>-<date>.xlsx`): every case is Pass-Pass, Fail-Pass, Pass-Fail, or Fail-Fail compared to the prior run. Pass-Fail (regression) is the highest priority. Open the workbook for the full comparison template and decision rules.

For root-cause analysis on failures, use `/eval-result-interpreter` and `/eval-triage-and-improvement` — those skills handle the LLM-judge calibration and root-cause classification that L300 expects.

## You've reached L200 Defined when…

- A trigger from the table above has fired and you ran the prescribed scope (not skipped, not improvised).
- The run is logged with date, version, eval set version, and per-quadrant pass rates.
- Results are exported to CSV before the 89-day Copilot Studio retention window.
- A documented re-run happens at least once per release cycle, not only when "something feels off".

## Path to L300 Systematic

L300 requires that **offline evals run at defined trigger points** (pre-deploy, post-change, regular cadence) **and that production quality is tracked across multiple eval dimensions on a defined cadence**. Two things change vs. L200:

1. **Triggers are codified** — a CI hook, a release-checklist item, or a scheduled job — not "I remembered to run it." This needs automation that lives outside the skill (build pipeline, scheduled runner).
2. **Production signal is tracked alongside offline runs** — sample real conversations into a production-eval set, score them on the same dimensions, and watch quality trend over time. Most agents need at least a few weeks of production traffic before L300 is achievable.

Come back for a Pillar 3 L300 session when both are in place.

## References

- `maturity-model.md` — full 5×5 definition of Pillar 3 levels.
- `baseline-comparison-<agent>-<date>.xlsx` — Pillar 5 starter workbook, used together with this protocol when a re-run is also a baseline comparison.
- `/eval-result-interpreter` — skill for interpreting individual run results.
- `/eval-triage-and-improvement` — skill for diagnosing failure patterns and remediating.
- [Copilot Studio Result comparison](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-intro) — built-in tool for comparing two runs side by side.
