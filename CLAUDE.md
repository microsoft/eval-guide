# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is a **content/plugin repository**, not an application. It ships an AI-agent evaluation toolkit for Copilot Studio in two parallel forms:

- **Claude Code plugin** — skills under `skills/*/SKILL.md`, registered via `.claude-plugin/plugin.json` and `marketplace.json`.
- **GitHub Copilot prompts** — equivalent prompts under `.github/prompts/*.prompt.md`, with always-on instructions in `.github/copilot-instructions.md`.

There is no build, no test runner, no lint step. Changes are validated by running the skills end-to-end against an agent description.

`AGENTS.md` is the master cross-tool instruction file. `README.md` is the canonical user-facing docs. When changing user-visible behavior, keep all three (`README.md`, `AGENTS.md`, `.github/copilot-instructions.md`) in sync — they each describe the same routing table for a different audience.

## High-level architecture

### The 6 skills form a pipeline, not a flat catalog

`/eval-guide` is the orchestrator that walks the customer through Microsoft's 4-stage evaluation lifecycle (Discover → Plan → Generate → Run → Interpret). The other 5 skills are extracted stages that can be invoked directly:

| Skill | Role |
|---|---|
| `eval-guide` | Orchestrator. Owns the dashboard workflow and stage transitions. |
| `eval-suite-planner` | Stage 1 standalone. Produces eval plan. |
| `eval-generator` | Stage 2 standalone. Produces test-case CSVs / conversation blueprints. |
| `eval-result-interpreter` | Stage 4 standalone. SHIP/ITERATE/BLOCK verdict from results. |
| `eval-triage-and-improvement` | Stage 4 deep-dive. Interactive remediation. |
| `eval-faq` | Methodology Q&A grounded in Microsoft's eval ecosystem. |

When editing one stage's behavior, check whether the corresponding standalone skill needs the same change. The orchestrator and standalones share methodology but have separate SKILL.md files.

### The dashboard is the review checkpoint

Stages 0, 1, 2, and 4 of `/eval-guide` produce **interactive HTML dashboards** instead of asking "does this look right?" in chat. The flow is:

1. Skill writes stage data to `stage-N-data.json`.
2. Skill launches `python skills/eval-guide/dashboard/serve.py --stage <name> --data stage-N-data.json`.
3. `serve.py` injects the JSON into a template (`dashboard/templates/<stage>.html` composed into `base.html`), writes a standalone HTML file next to the data file, and opens it in the browser.
4. The user edits inline; on Confirm/Request Changes, a feedback JSON downloads. They save it next to the data file.
5. `serve.py` detects `<stage>-feedback.json` on disk and exits.
6. Skill reads the feedback file. **No `.docx` or `.csv` is generated until the user confirms via the dashboard.**

Stage names map to file names: `discover` (0), `plan` (1), `generate` (2), `interpret` (4). Stage 3 (Run) executes tests directly with no dashboard. Templates live in `dashboard/templates/`; example stage data is in `dashboard/examples/`.

### Eval execution path (Stage 3)

`skills/eval-guide/scripts/eval-runner.js` is a Node script that talks to a live Copilot Studio agent over DirectLine, runs CSV test cases, and uses the Anthropic SDK as an LLM judge for `Compare meaning` / `General quality` methods. It requires `ANTHROPIC_API_KEY` and either `--token-endpoint` or `--directline-secret`.

```bash
node skills/eval-guide/scripts/eval-runner.js --token-endpoint <url> --csv-dir <dir>
```

This is the only stage that requires a running agent.

### Versioning and self-upgrade

Every `/eval-guide` invocation runs `bin/eval-guide-update-check` from the SKILL.md `preamble:` block. The script compares `VERSION` against `microsoft/eval-guide@main` on GitHub and prints `UPGRADE_AVAILABLE <old> <new>` / `JUST_UPGRADED <old> <new>` / nothing. The skill body has explicit handling instructions for each output. State (config, snooze, just-upgraded marker) lives in `~/.eval-guide/`.

When bumping a release: edit `VERSION`, update `.claude-plugin/plugin.json` and `marketplace.json` versions, and merge to `main` so the remote check picks up the new version.

## Conventions to preserve

These are non-obvious invariants enforced across all 6 skills — keep them consistent when editing:

- **CSV format for Copilot Studio import**: exactly 3 columns — `Question`, `Expected response`, `Testing method`. Group test cases by quality signal into separate CSV files.
- **Valid testing methods**: `General quality`, `Compare meaning`, `Similarity`, `Exact match`, `Keyword match`, `Capability use`, `Custom`. The first five are the Copilot Studio core set; the last two extend it.
- **Stages 0–2 must work without a running agent.** Description-based mode is the default; live-agent mode is an enhancement when the Copilot Studio plugin is also installed. Don't introduce code paths that require live agent connectivity in those stages.
- **Architecture-aware scoping**: planner output should change based on whether the agent is prompt-level / RAG / agentic. Don't generate tool-routing tests for a simple FAQ bot.
- **Every eval plan must include at least one adversarial / safety scenario.**
- **Explain reasoning, don't just produce artifacts.** The skills are pitched as enablement accelerators — the user should learn the methodology, not just receive output. Calibrate verbosity accordingly.
- **The Per-Agent Eval Maturity Model** (5 pillars × 5 levels, L100→L500) frames a `/eval-guide` session as moving Pillars 1, 2, and 5 from L100 to L300. Pillars 3 and 4 are explicitly out of scope for a single session — keep them out.
