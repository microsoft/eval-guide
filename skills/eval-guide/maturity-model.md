# Per-Agent Eval Maturity Model — Canonical Reference

This is the source of truth for the maturity model used across the eval-guide skill. The `orient` dashboard, the per-stage maturity callouts in `SKILL.md`, the maturity snapshot tables in generated reports, and `USAGE.md` all reference this file. When level definitions or pillar wording change, update this file first, then propagate to consumers.

## Levels

Five levels per pillar, from `L100` (initial state, no practice) to `L500` (continuous improvement built into operations).

| Code | Name | Definition |
|---|---|---|
| L100 | Initial | No practice in place. Outcomes depend on individual judgment. |
| L200 | Defined | A practice is documented and executed when triggered, but not consistent across versions, teams, or change types. |
| L300 | Systematic | Practice is consistent: tied to metrics, applied across versions, reviewed by humans. The level a session of `/eval-guide` targets for in-session pillars. |
| L400 | Managed | Practice is embedded in the deployment workflow itself. Evidence governs ship decisions. |
| L500 | Optimized | Practice evolves from production signal. Improvement is continuous, not event-driven. |

## Pillars

Five pillars covering definition, content, execution, learning, and change management.

| # | Pillar | What it measures |
|---|---|---|
| 1 | Define what "good" means | Acceptance criteria quality |
| 2 | Build your eval sets | Coverage, versioning, breadth |
| 3 | Run evals across the lifecycle | Where and when evals execute (offline, pre-deploy, in production) |
| 4 | Improve and iterate | How improvements are validated |
| 5 | Handle changes with confidence | How changes (prompts, tools, models, architecture) get tested before shipping |

## Full 5×5

### Pillar 1 — Define what "good" means

| Level | State |
|---|---|
| L100 Initial | No written criteria. "Good" lives in the builder's head or stakeholder opinion. |
| L200 Defined | Initial criteria drafted, typically cover basic capabilities, not tied to eval metrics. |
| L300 Systematic | Written acceptance criteria covered capabilities and output quality, tied to eval metrics with thresholds. Reviewed by human experts. |
| L400 Managed | Criteria embedded in the release workflow — ship decisions can't proceed without referencing them. Used consistently across versions. |
| L500 Optimized | Criteria evolve based on production signals — user complaints, new failure modes, shifting context feed back into updates. |

### Pillar 2 — Build your eval sets

| Level | State |
|---|---|
| L100 Initial | No established eval set. Quality checks are informal — demos, spot-checks, occasional manual review. |
| L200 Defined | A handful of test cases, written once based on key scenarios and what came to mind. Used occasionally. |
| L300 Systematic | Versioned eval set, coverage purposefully targeted at what matters — quality dimensions, edge cases, failure modes. Mapped to risk and value. |
| L400 Managed | Eval set maintained as an artifact — new cases added when production issues surface, scope expands, or new failure modes emerge. |
| L500 Optimized | Eval set's coverage itself is measured — gaps hunted, production data mined for missing cases, false pass/fail rates tracked. |

### Pillar 3 — Run evals across the lifecycle

| Level | State |
|---|---|
| L100 Initial | No routine evals. Quality is assessed through demos or occasional manual checks when something seems off. |
| L200 Defined | Evals run on changes. Results are logged. |
| L300 Systematic | Offline evals run at defined trigger points (pre-deploy, post-change, regular cadence). Production quality tracked across multiple eval dimensions on a defined cadence. |
| L400 Managed | Evals embedded in deployment workflow — triggered by change events. Results block deploys or surface clear signals for review. |
| L500 Optimized | Offline and production eval form a single closed loop. Production traces continuously sample into the offline eval set; offline regressions trigger production investigation. |

### Pillar 4 — Improve and iterate

| Level | State |
|---|---|
| L100 Initial | Improvements are reactive — driven by noticed issues. Fixes are intuition-based; nothing confirms they worked or whether they introduced new problems. |
| L200 Defined | Failing cases are logged, triaged, and prioritized. Fixes tracked to closure. |
| L300 Systematic | Failure categories analyzed for root cause. Fixes validated with before/after eval runs. Regression-proofing built in. |
| L400 Managed | Improvement prioritization is eval-driven — weakest dimensions addressed first. Fix velocity and fix quality both tracked. |
| L500 Optimized | Improvements prioritized, validated, and measured entirely through eval evidence. When alternatives exist, better scores win. Gut feel no longer drives decisions. |

### Pillar 5 — Handle changes with confidence

| Level | State |
|---|---|
| L100 Initial | Changes ship on spot-checks and intuition. Regressions surface via user complaints. All changes — prompts, tools, models, architecture — feel risky. Team delays or pushes through blindly. |
| L200 Defined | Before any change ships, eval set is rerun and compared to the prior baseline. Evidence, not intuition, decides whether to proceed. |
| L300 Systematic | Each change type — prompt tweaks, tool swaps, model upgrades, architecture changes — triggers the right eval subset. Baseline comparison required — both to validate improvements and to catch regressions. |
| L400 Managed | Change workflows are eval-driven: proposed changes trigger the right eval protocol, and evidence decides — block regressions, accept improvements. No change ships unvalidated; good changes aren't held back by caution. |
| L500 Optimized | Eval is used not just to validate changes, but to actively scan for them. Team runs new explorations through the eval set to find improvement opportunities. |

## Session Targets

A `/eval-guide` session targets the following levels per pillar. The session delivers in-session content for Pillars 1, 2, 4 and starter reference docs for Pillars 3 and 5.

| Pillar | Baseline | After session | Mechanism | Next-session target |
|---|---|---|---|---|
| 1 — Define what "good" means | L100 Initial | L300 Systematic ✓ | Stage 0 (Discover) + Stage 1 (Plan) | — |
| 2 — Build your eval sets | L100 Initial | L300 Systematic ✓ | Stage 2 (Generate) | — |
| 3 — Run evals across the lifecycle | L100 Initial | L200 Defined ✓ | `rerun-protocol-<agent>-<date>.docx` (starter artifact, generated from `rerun-protocol.md` source) | L300 Systematic |
| 4 — Improve and iterate | L100 Initial | L300 Systematic ✓ | Stage 4 (Interpret) — only if eval results are available | — |
| 5 — Handle changes with confidence | L100 Initial | L200 Defined ✓ | `baseline-comparison-<agent>-<date>.xlsx` (starter artifact, generated from `baseline-comparison-template.md` source) | L300 Systematic |

Pillars 3 and 5 are not delivered in-session because they require ongoing operating practices — cadence, CI hooks, version-tagged baselines. The session leaves the customer with starter artifacts that get them to L200 Defined: a documented protocol they can execute when triggered. L300 Systematic for those pillars is the next chapter and requires production signal to compare against.

## Layer separation

The maturity model is referenced in three different layers; do not conflate them.

- **Orientation layer** — `orient` dashboard at session start. Read-only 5×5 snapshot. Tells the customer where they are and where this session takes them. Descriptive, not formative.
- **Formative layer** — per-stage maturity callouts in `SKILL.md` (`**Maturity callout — Pillar X (L100 Initial → L300 Systematic):** ...`). Mid-flow coaching that names the advance after each stage's deliverable.
- **Retrospective layer** — maturity snapshot table at the end of generated `.docx` reports. Point-in-time record of where the agent stood before and after this session.

## Sync rule

When this file changes, propagate to:
- `skills/eval-guide/SKILL.md` (Eval Maturity Journey section, per-stage maturity callouts, two snapshot tables)
- `skills/eval-guide/USAGE.md` (Section 3 maturity table, Pillar 3/5 re-engagement section)
- `skills/eval-guide/dashboard/examples/stage-orient-data.json` (pillar definitions)
- `skills/eval-guide/dashboard/templates/orient.html` (only if structural changes — text comes from the data file)

Sync is manual and copy-by-rule. With three to four files updated together, automated sync would cost more than it saves.
