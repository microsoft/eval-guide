# Eval Plan: `/eval-guide` (the skill itself)

> Stage 1 output, applied to `/eval-guide`. Built using `/eval-guide`'s own methodology — Agent Vision, acceptance criteria, Value × Cost matrix, methods.

---

## Agent Vision: `/eval-guide`

| | |
|---|---|
| **Purpose** | An eval enablement accelerator: takes a customer from "I don't know where to start" to a written eval plan, importable test cases, and a triage vocabulary — in one session, without requiring a running agent for Stages 0–2. |
| **Users** | (a) Agent builders / devs at Copilot Studio customer organizations; (b) PMs and business owners on those teams; (c) Microsoft CS / FTE / TPM facilitators running the skill alongside customers. Two-headed audience. |
| **Knowledge & Data** | `SKILL.md`, `USAGE.md`, `maturity-model.md`, `rerun-protocol.md`, `baseline-comparison-template.md`, dashboard templates, the Microsoft eval ecosystem (Eval Scenario Library, Triage Playbook, MS Learn agent eval docs). |
| **Core Capabilities** | Pre-extract Agent Vision from kickoff; show maturity-model orientation; produce 10–15 acceptance criteria placed on Value × Cost matrix; default to consolidated quality dimensions; generate test case CSVs + .docx + .xlsx + Pillar 3/5 starter artifacts; triage results with 20% rule + ship-readiness thresholds. |
| **Boundaries (must NOT)** | Replace stakeholder workshops; replace responsible-AI / safety review; activate when the customer already has a mature eval suite (route to `/eval-triage-and-improvement`); generate test cases for aspirational-language capabilities; recommend shipping when Guardrails < 95%; use legacy quadrant names ("Core" for HVHC); ship customer artifacts that violate the file naming convention. |
| **Success Criteria** | Customer leaves with .docx + .xlsx eval plan signed-off by their PM; CSVs paste into Copilot Studio; Pillars 1, 2, 4 reach L300 Systematic; Pillars 3, 5 reach L200 Defined; the customer can run the next eval cycle without re-invoking the skill. |
| **Role-Based Access** | No (the skill itself isn't role-gated; the agents *it evaluates* may have role-based access — that's a Stage 2 personalization branch). |
| **Risk Profile** | **HIGH** — customers depend on this skill for production-eval design across regulated domains (HR, healthcare, financial). A bad eval plan ships an agent that passes evals but leaks data in production. Doubled adversarial coverage minimum applies. |

---

## Acceptance Criteria — Value × Cost Matrix

|  | **Low cost of failure** | **High cost of failure** |
|---|---|---|
| **High value** | **Valuable** (7 criteria) | **Critical** (8 criteria) |
| **Low value** | **Deprioritize** (1 criterion) | **Guardrails** (14 criteria) |

Total: **30 criteria** across 7 quality signals. HIGH-risk distribution check: Critical 27%, Valuable 23%, Guardrails 47%, Deprioritize 3% — within targets.

### Quality signals (eval set splits)

Each signal becomes one CSV / test-set in `test-cases.json`:

1. **Triggers** — when the skill should fire vs. not
2. **Vision Extraction** — Stage 0 pre-extraction + domain defaults + concreteness check
3. **Plan Quality** — Stage 1 criteria writing, dimension consolidation, coverage check, distribution sanity
4. **Test Generation** — Stage 2 mode default, [VERIFY] discipline, four-artifact kit
5. **Run Guidance** — Stage 3 path selection + expectations setting
6. **Triage Discipline** — Stage 4 20% rule, quadrant-aware reading, ship-readiness thresholds
7. **Skill Integrity** — cross-cutting invariants: pillar numbering, quadrant naming, payoff-led callouts, --serve mode

---

## Criteria

### Critical (8) — product-defining, failure hurts

| ID | Criterion | Quality Signal | Method | Pass condition | Fail condition |
|---|---|---|---|---|---|
| C-01 | The skill should pre-extract the Agent Vision from the customer's 1–4 sentence kickoff and apply domain-keyed safe defaults (HR/ESS, customer support, IT, knowledge, agentic) before asking any questions. | Vision Extraction | Custom rubric | After kickoff, AI shows a 5–6 line Vision summary with extracted Purpose / Users / Capabilities and domain-default Boundaries / Success Criteria / Risk Profile filled in. AI does NOT ask the legacy 7-question batch. | AI asks "What problem does the agent solve?" / "Who are the users?" sequentially; OR Vision is missing domain defaults; OR AI gates on customer confirmation before proceeding. |
| C-02 | The skill should produce 10–15 acceptance criteria phrased as "The agent should…" (or "should NOT…"), each tied to a method and placed on a Value × Cost matrix with explicit pass/fail conditions. | Plan Quality | Capability use + Compare meaning | Stage 1 output contains 10–15 criteria; every criterion starts with "The agent should"; every criterion has quadrant + method + pass_condition + fail_condition. | < 10 or > 15 criteria; OR any criterion lacks one of {quadrant, method, pass_condition, fail_condition}; OR criteria phrased as goals/values instead of behaviors. |
| C-03 | The skill should consolidate quality dimensions to 4–6 broad ones (e.g., "Accuracy", "Grounding", "Boundaries / Safety", "Tone") rather than fragmenting per-source/per-topic. | Plan Quality | Custom rubric | Stage 1 output has 4–6 dimensions. "Accuracy" covers multiple knowledge sources. No "Policy Accuracy" + "Benefits Accuracy" + "Training Accuracy" pattern. | ≥ 7 dimensions; OR per-source naming visible (e.g., "X Accuracy" + "Y Accuracy"); OR per-topic naming (e.g., "PTO Accuracy", "Onboarding Accuracy"). |
| C-04 | The skill should use the canonical quadrant names exactly: Critical / Valuable / Guardrails / Deprioritize. | Skill Integrity | Keyword match | All four canonical names appear in Stage 1 output. None of {"Core" used for HVHC, "Standard", "Practitioner", legacy aliases} appear. | Any quadrant uses a non-canonical name; OR "Core" is used for the high-value-high-cost quadrant. |
| C-05 | The skill should default to Single Response evaluation mode for ~80% of agents (Q&A-shaped) and only suggest Conversation mode when the agent does multi-step workflows with context retention. | Test Generation | Compare meaning | Stage 2 narrates "defaulting to Single Response" with the explicit rationale tying back to the agent's structure. Conversation mode is only suggested when the Agent Vision describes multi-step / slot-filling / clarification flows. | Conversation mode chosen for a single-response Q&A agent; OR mode choice presented as 50/50 with no opinionated default. |
| C-06 | The skill should mandate the [VERIFY] discipline — every AI-generated factual claim in expected responses gets wrapped in `[VERIFY: ...]` markers, and the customer is told this is the most important review step. | Test Generation | Keyword match (negative + positive) | Stage 2 output contains `[VERIFY:` markers on every factual claim AND chat narration includes a sentence equivalent to "read every [VERIFY] before approving — this is the most important review step." | Factual claims appear as plain text without `[VERIFY:` wrapping; OR no narration about the VERIFY discipline. |
| C-07 | The skill should generate four artifacts at Stage 2 close: per-signal CSV pairs, the test-case `.docx` report, `rerun-protocol-<agent>-<date>.docx`, and `baseline-comparison-<agent>-<date>.xlsx`. | Test Generation | Capability use | All four artifact types are listed and named with the correct filename pattern. The four-artifact kit is described as a coherent deliverable, not a folder dump. | Any of the four artifacts is missing; OR filename pattern is wrong (e.g., generic name without `<agent>` and `<date>`); OR rerun-protocol / baseline-comparison are described as `.md` (the source files) rather than the customer-facing `.docx` / `.xlsx`. |
| C-08 | The skill should apply the "20% rule" in triage — at least 20% of failures in a new eval are eval setup bugs, not agent bugs — and check each failure for setup issues before classifying as agent error. | Triage Discipline | Compare meaning | Stage 4 narration includes the explicit "20% rule" callout AND the failure-classification table contains an "Eval Setup Issue" column with non-zero entries. | All failures classified as Agent Configuration with no Eval Setup category; OR no narrated 20% rule; OR triage proceeds to Top 3 actions without per-failure classification. |

### Valuable (7) — expected behavior, occasional misses tolerable

| ID | Criterion | Quality Signal | Method | Pass condition | Fail condition |
|---|---|---|---|---|---|
| V-01 | The skill should fire on phrases like "evaluate my agent", "what should we test", "how do we know if our bot is good", "build an eval plan". | Triggers | Keyword match | When given any of those phrases as the first user message, `/eval-guide` activates and starts the kickoff. | Skill stays silent / defers to a different skill / requires explicit `/eval-guide` invocation. |
| V-02 | The skill should auto-detect agent domain from kickoff keywords (HR/ESS, customer support, IT, knowledge, agentic) and apply that domain's default boundary set. | Vision Extraction | Custom rubric | Domain detected correctly given a clear kickoff (e.g., "HR policy bot" → HR/ESS; "customer support bot" → customer support). Default boundaries match the domain table in SKILL.md. | Domain misclassified; OR boundaries don't match the domain default set; OR domain not detected when keywords were obvious. |
| V-03 | The skill should disambiguate borderline RAG vs. Agentic capabilities ("update info", "submit", "approve") with a one-sentence clarifier before locking the architecture call. | Plan Quality | Compare meaning | When the Agent Vision contains a borderline phrase, AI asks the disambiguation question (route-only vs. write-action) before classifying. | AI silently picks an architecture without asking; OR misclassifies a write-action agent as RAG. |
| V-04 | The skill should generate two CSV variants per quality signal: `eval-<signal>-<date>-for-import.csv` (2 columns) and `eval-<signal>-<date>-with-methods.csv` (3 columns). | Test Generation | Capability use | Two CSVs per signal exist with the correct column counts and the correct filename suffixes. | Single CSV per signal; OR wrong columns; OR wrong filenames; OR `Testing method` column appears in the `-for-import` variant. |
| V-05 | The skill should warn the customer to export Stage 3 results immediately because Copilot Studio retains run results for only 89 days. | Run Guidance | Keyword match | Stage 3 narration mentions "89 days" / "89-day retention" / equivalent. | No mention of the retention window; OR the customer is told to leave results in Copilot Studio without export. |
| V-06 | The skill should run a pre-triage symptom-pattern check before classifying any Stage 4 failure as an agent bug (empty responses → auth/timeout, source clusters → connectivity). | Triage Discipline | Compare meaning | Stage 4 narration explicitly addresses pre-triage; the symptom-pattern table from SKILL.md is applied to the customer's failure set. | Skill jumps straight to Top 3 actions without verifying infrastructure; OR pre-triage is mentioned only as boilerplate without applying it. |
| V-07 | The skill should narrate edits made via the dashboard back to the customer with counts (e.g., "8 [VERIFY] corrections, 2 new test cases"). | Plan Quality | General quality | After dashboard confirm, AI's chat output names *which* edits were applied (not just "applied"); includes counts and updated distribution if applicable. | AI says "Got it, applied" with no read-back; OR narration is generic ("changes saved") without counts. |

### Guardrails (14) — zero tolerance for failure

| ID | Criterion | Quality Signal | Method | Pass condition | Fail condition |
|---|---|---|---|---|---|
| G-01 | The skill should NOT fire when the customer says they already have a mature eval suite running on cadence — should route to `/eval-triage-and-improvement`. | Triggers | Capability use | Skill responds by naming `/eval-triage-and-improvement` and not starting Stage 0. | Skill starts Stage 0 / proposes a new eval plan / ignores the customer's stated context. |
| G-02 | The skill should NOT fire on requests for AI ethics, responsible AI, or content-safety review — should clarify it measures correctness, not safety posture. | Triggers | Capability use | Skill responds with the boundary statement (eval ≠ safety review) and points to content-safety filters / responsible-AI process. | Skill activates and starts producing eval criteria for safety topics. |
| G-03 | The skill should NOT generate test cases for aspirational-language capabilities ("empower employees", "explore opportunities", "streamline workflows") — should drop them silently with a flagged note. | Vision Extraction | Compare meaning | Aspirational phrases are excluded from Core Capabilities; AI flags the drop with a one-line note inviting the customer to add them back if real. | Aspirational phrases survive into criteria; OR test cases get written for "explore opportunities". |
| G-04 | The skill should NOT use legacy quadrant names ("Core" for the high-value-high-cost quadrant; "Practitioner" / "Beginner" maturity levels). | Skill Integrity | Keyword match (negative) | The strings "Core (high value, high cost)", "Practitioner", "Beginner" do NOT appear in any output. | Any of the legacy strings appear. |
| G-05 | The skill should NOT prescribe percentage-based pass/fail thresholds *per criterion* — pass/fail lives in the criterion's own pass_condition, while quadrants tell you where to invest effort. | Plan Quality | Custom rubric | Criteria pass conditions are behavior-based statements; the quadrant is described as "where to invest" not "the number to clear". | Output says "Critical must pass at 90%" or similar; OR threshold and quadrant are conflated. |
| G-06 | The skill should NOT skip the coverage-against-Vision check before locking criteria — every Vision capability, boundary, knowledge source, and user cohort must have ≥1 criterion. | Plan Quality | Capability use | Coverage check is run; gaps surface explicitly with the customer ("I noticed Capability X has no criterion — add or out-of-scope?"). | Plan locks without coverage check; OR known gaps slide silently. |
| G-07 | The skill should NOT lock a plan distribution that violates the risk-profile rule — for HIGH-risk agents, Guardrails must be 30–50% of criteria. | Plan Quality | Custom rubric | For a HIGH-risk Agent Vision, generated plan has 30–50% Guardrails criteria; if not, AI auto-pushes back before lock. | HIGH-risk agent plan has < 30% Guardrails and AI does not push back. |
| G-08 | The skill should NOT default to Conversation mode for a Q&A agent when Single Response fits. | Test Generation | Compare meaning | Single Response is selected for Q&A criteria; Conversation mode is only chosen with explicit rationale tied to multi-step workflows. | Conversation mode default for clearly single-response Q&A; OR mode chosen without rationale. |
| G-09 | The skill should NOT under-invest in adversarial / red-team criteria for sensitive-data agents — for HIGH-risk + domain keywords (PII / payments / HR / health / legal), the Guardrails minimum auto-doubles to 2. | Plan Quality | Capability use | A HIGH-risk HR agent gets ≥ 2 adversarial / red-team Guardrails criteria; AI narrates the auto-double trigger. | < 2 adversarial criteria for a HIGH-risk + domain-keyword agent; OR no auto-double narration. |
| G-10 | The skill should NOT recommend shipping when Guardrails < 95% (or < 100% on regulated content). | Triage Discipline | Compare meaning | When Stage 4 results show Guardrails < 95%, the Top 3 actions include "Hold ship; fix Guardrails first". | Stage 4 recommends ship despite Guardrails below threshold; OR ship-readiness narrative ignores quadrant breakdown. |
| G-11 | The skill should NOT congratulate a 100% pass rate — it should flag it as a red flag (eval is too easy; add edge cases). | Triage Discipline | Compare meaning | When pass rate = 100%, AI narrates "your eval is likely too easy" and suggests adding adversarial / boundary cases. | AI says "great work, ready to ship" or equivalent for 100%. |
| G-12 | The skill should NOT renumber pillars — Pillar 1 = Define what good means, 2 = Build eval sets, 3 = Run evals across the lifecycle, 4 = Improve and iterate, 5 = Handle changes with confidence. | Skill Integrity | Keyword match | All five pillars appear with their canonical numbers and names. | Any pillar mismatched (e.g., "Pillar 5 = Improve and iterate" — that's the legacy numbering); OR pillar 3 named "Run systematically" instead of "Run evals across the lifecycle". |
| G-13 | The skill should NOT lead maturity callouts with the level transition ("L100 → L300") before naming customer payoff. | Skill Integrity | Custom rubric | Maturity callouts open with a customer-language sentence ("You now have a plan your PM can sign off on") and trail with the L100 → L300 transition. | Callout opens with "Maturity callout: Pillar X (L100 → L300)" with no payoff sentence first. |
| G-14 | The skill should NOT instruct the customer to manually download / move `<stage>-feedback.json` — the dashboard runs in `--serve` mode, browser POSTs feedback, file is written automatically. | Skill Integrity | Compare meaning | Dashboard launch invocations include `--serve`; narration says "browser POSTs feedback to the localhost server" or equivalent; no "save the downloaded file next to your data file" instruction. | Bash invocation lacks `--serve`; OR narration tells customer to download/move feedback files. |

### Deprioritize (1) — light coverage

| ID | Criterion | Quality Signal | Method | Pass condition | Fail condition |
|---|---|---|---|---|---|
| D-01 | The skill should set first-run pass rate expectations (40–70% normal) before showing Stage 3 results. | Run Guidance | Keyword match | Stage 3 narration includes "40–70% on first run is normal" or equivalent. | No expectations-setting narration; OR pass rate framed as failing/surprising when within normal range. |

---

## Distribution sanity check

- Critical: 8 / 30 = **27%** ✓ (HIGH-risk target: 25–40%)
- Valuable: 7 / 30 = **23%** ✓ (target: 15–30%)
- Guardrails: 14 / 30 = **47%** ✓ (target: 30–50%)
- Deprioritize: 1 / 30 = **3%** ✓ (target: 0–10%)
- Adversarial / red-team coverage: G-09 (auto-double mandate) + G-04 (legacy-name resistance) + G-13 (jargon-resistance) = 3 explicit adversarial cases + most other Guardrails are anti-pattern checks. Sensitive-domain auto-double satisfied.

---

## Method distribution

- **Compare meaning** (semantic / behavioral): 9 criteria
- **Custom rubric**: 6 criteria (tone, methodology adherence, distribution checks)
- **Capability use** (topic / tool routing): 7 criteria (e.g., "skill routes to /eval-triage-and-improvement when X")
- **Keyword match** (positive + negative): 7 criteria (presence of canonical strings; absence of legacy strings)
- **General quality**: 1 criterion

No criterion uses Exact Match (no exact-string equality is appropriate here) or Text Similarity (skill outputs are too varied for similarity matching).

---

## What this plan deliberately omits

- **Visual / UX rendering of dashboards** — out of scope; covered by browser-test framework if added.
- **Stage 3 live-agent execution accuracy** — not codifiable per-customer; the eval-runner's own integration tests cover this.
- **Plugin lifecycle** (install / version-check / upgrade) — separate concern; `bin/eval-guide-update-check` has its own integration path.
- **Performance / latency** of the skill — Sonnet/Opus call latency is the main variable; not a behavioral correctness concern.
- **Multi-language support** — the skill claims English + Simplified Chinese; testing CN-language paths requires native-speaker grading not codified here.

---

## Maturity snapshot for `/eval-guide` (the skill itself)

| Pillar | Baseline | After this eval set lands | Next-session target |
|---|---|---|---|
| 1 — Define what "good" means | L100 Initial | **L300 Systematic ✓** (this eval-plan.md is the spec) | — |
| 2 — Build eval sets | L100 Initial | **L300 Systematic ✓** (test-cases.json has versioned coverage mapped to risk and value) | — |
| 3 — Run evals across the lifecycle | L100 Initial | **L200 Defined ✓** (README documents human-grader + LLM-judge protocol; pre-merge / post-deploy / post-model-upgrade triggers) | L300 Systematic (CI hook on PR; auto-run on every change to SKILL.md) |
| 4 — Improve and iterate | L100 Initial | L100 Initial | L300 Systematic (after first real run produces results to triage) |
| 5 — Handle changes with confidence | L100 Initial | **L200 Defined ✓** (README has re-run triggers; comparison protocol implicit via re-runs across PRs) | L300 Systematic (per-change-type subset selection) |
