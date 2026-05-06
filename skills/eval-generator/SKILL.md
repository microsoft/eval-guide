---
name: eval-generator
description: Stage 2 standalone — turns an eval plan (output of `/eval-suite-planner`) into concrete test cases grouped by quality signal. Methods live at the signal level (one or many per signal); each criterion shares the signal's method set. Outputs one CSV per signal (2 columns: Question + Expected response, one row per case) plus a customer-ready `.docx` test-case report and an `eval-setup-guide.docx` that walks the customer through assigning testing methods per row manually in Copilot Studio's Evaluate tab. Use after planning, before running.
---

## Purpose

This skill produces the **Stage 2** artifact of the `/eval-guide` lifecycle: importable test cases for Copilot Studio's Evaluation tab plus a `.docx` test-case report for human review. It is the standalone form of `/eval-guide` Stage 2.

**Primary mode** — the conversation already contains an `/eval-suite-planner` output (an eval plan with acceptance criteria on the Value × Risk matrix). Generate one set of cases per criterion, grouped by quality signal.

**Fallback mode** — no plan in conversation. Accept a plain-English agent description and generate test cases from scratch (6–8 cases minimum), using the same data model.

This skill covers **Stage 2 (Set Baseline & Iterate)** of the MS Learn 4-stage framework. After Stage 2, run the cases (Stage 3) and interpret results with `/eval-result-interpreter` (Stage 4).

**Maturity callout — Pillar 2 (Build your eval sets):** Stage 2 advances Pillar 2 from `L100 Initial` ("no established eval set") to `L300 Systematic` ("versioned eval set with coverage purposefully targeted"). The CSV files you generate ARE the Pillar 2 artifact.

## Instructions

When invoked as `/eval-generator` (with or without input):

### Step 0 — Detect input mode

Scan the conversation for a planner output (acceptance criteria with quadrants, methods, pass/fail conditions, quality dimensions).

- **Plan found** → *"Generating test cases from your eval plan (X criteria across Y quality signals)."* Generate from the plan.
- **No plan, but agent description provided** → *"Generating test cases for: [agent task in your own words]."* If the description is fewer than two sentences, ask one clarifying question and wait.
- **No plan, no description** → *"I need either an agent description or a plan from `/eval-suite-planner`. Run `/eval-suite-planner <description>` first for the best results."*

---

### Step 1 — Choose evaluation mode (Single Response vs. Conversation)

**Default to Single Response.** ~80% of agents are single-response Q&A. Conversation mode only fits agents that do real multi-step workflows.

| Mode | Best for | Limits | Supported methods |
|---|---|---|---|
| **Single response** *(default)* | Factual Q&A, tool routing, specific answers, safety tests | Up to 100 cases per set | All 7 methods |
| **Conversation (multi-turn)** | Multi-step workflows, context retention, clarification flows | Up to 20 cases, max 12 messages (6 Q&A pairs) per case | General quality, Keyword match, Capability use, Custom (Classification) |

**Switch to conversation mode only when:**
- The agent walks users through multi-step processes (troubleshooting, onboarding, form completion).
- Context retention matters — later answers depend on earlier ones.
- The agent needs to ask clarifying questions before answering.

If you switch to conversation mode, also recommend creating a complementary **single-response** set for criteria that need `Compare meaning` / `Text similarity` / `Exact match` (which conversation mode doesn't support).

---

### Step 2 — Data model: methods at the signal level

This is the most important departure from older versions of this skill.

**Methods live on the quality signal (the test set), not on the criterion.** Every criterion in a signal inherits the same method set. A signal can have one method (most common) or several (e.g., a compliance signal that needs both `Compare meaning` for content correctness AND `Keyword match` for required disclaimers).

The internal data structure:

```json
{
  "agent_name": "...",
  "test_sets": [
    {
      "quality_dimension": "Policy Accuracy",
      "methods": ["Compare meaning", "Keyword match"],
      "criteria": [
        {
          "criterion_id": 1,
          "statement": "The agent should return the correct PTO days for the employee's office and tenure, citing the Time Off Policy.",
          "quadrant": "critical",
          "pass_condition": "Response contains the correct PTO number for the user's office/tenure AND cites the Time Off Policy.",
          "fail_condition": "Incorrect number, missing citation, or cites the wrong policy.",
          "custom_rubric": "",
          "cases": [
            {
              "id": 1,
              "question": "How many PTO days do LA employees get?",
              "expected_responses": {
                "Compare meaning": "LA employees receive [VERIFY: 18] PTO days per year, per the Time Off Policy.",
                "Keyword match": "Time Off Policy, PTO, [VERIFY: 18]"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

**Rules:**
- Each test set carries `methods: []` — the method set for the whole signal. Pick one when one fits; pick multiple only when the signal genuinely needs them.
- Criteria carry `statement`, `quadrant`, `pass_condition`, `fail_condition`, optional `custom_rubric`. **No per-criterion `method` field.**
- Each case has `expected_responses: { method → value }` — one entry per method in the signal's method set that needs a per-case reference. Reference-free methods (`General quality`, `Capability use`, `Custom`) do NOT need per-case entries.
- Wrap AI-generated factual content in `[VERIFY: ...]` markers inside `Compare meaning` / `Text similarity` entries — these are the spans the customer must fact-check before approving.

---

### Step 3 — Method behavior in the data

| Method | Per-case data | Where the grading rule lives |
|---|---|---|
| **Compare meaning** | `expected_responses["Compare meaning"]` = canonical answer (paraphrase OK; wrap facts in `[VERIFY: …]`) | LLM judge compares semantic equivalence of agent response vs. canonical |
| **Text similarity** | `expected_responses["Text similarity"]` = expected text | String similarity (0–1); default Pass ≥ 0.7 |
| **Exact match** | `expected_responses["Exact match"]` = exact string | Byte-equal (after normalization) |
| **Keyword match** | `expected_responses["Keyword match"]` = comma-separated keyword list (`"escalate, manager, callback"`) | All keywords present (default) or any-keyword mode |
| **General quality** | none | LLM judge grades against `criterion.pass_condition` / `fail_condition` |
| **Capability use** | none | Pass if the agent invoked the right tool/topic (named in the criterion's pass condition) |
| **Custom** | none per case; `criterion.custom_rubric` carries the rubric | LLM judge follows the rubric verbatim |

For criteria with `method` = `Custom` in the signal's method set, draft a `custom_rubric` from the criterion's pass/fail conditions — e.g., *"Rate the response Pass / Fail. Pass = [pass_condition]. Fail = [fail_condition]. Output PASS or FAIL with a one-sentence reason."* Don't leave Custom criteria without a rubric.

---

### Step 4 — Generate single-response cases

**From a plan:** for each criterion, write 1+ cases. Match the criterion's quadrant to case count:
- **High Value · High Risk** — 3–5 cases per criterion (variations of the highest-stakes scenarios).
- **High Value · Low Risk** — 2–3 cases per criterion.
- **Low Value · High Risk** — 2–3 cases per criterion (focused on adversarial / boundary-violation patterns).
- **Low Value · Low Risk** — 1–2 cases per criterion.

For each case:
- `question` — a realistic input the agent would receive in production. Specific, not a placeholder. Include names, dates, IDs, context a real user would provide.
- `expected_responses` — one entry per reference-needing method in the signal's method set. Wrap factual content in `[VERIFY: …]`.

**From scratch (no plan):**
- 6–8 total cases.
- At least 2 happy-path cases.
- At least 2 edge cases (empty input, long input, ambiguous, malformed).
- At least 1 adversarial case (prompt injection, out-of-scope request, policy violation attempt).

---

### Step 5 — Generate conversation (multi-turn) cases

Use this only when Step 1 selected Conversation mode.

**Conversation test set constraints:**
- Up to 20 cases per set; up to 12 total messages (6 user-agent pairs) per case.
- Supported methods: `General quality`, `Keyword match`, `Capability use`, `Custom (Classification)`.
- NOT supported: `Compare meaning`, `Text similarity`, `Exact match`.

**Format per case:**

```
Conversation Test Case #N: [Scenario Name]

Turn 1 — User: [realistic user message]
Turn 1 — Agent (expected): [expected response or behavior description]

Turn 2 — User: [follow-up that depends on Turn 1 context]
Turn 2 — Agent (expected): [expected response maintaining context]

Turn 3 — User: [further follow-up]
Turn 3 — Agent (expected): [expected response]

Method: [General quality / Keyword match / Capability use / Custom]
Keywords (if Keyword match): [comma-separated list]
What this tests: [one sentence on the multi-turn capability being evaluated]
Critical turn: [which turn is most likely to fail and why]
```

**Rules:**
- Each turn must build on the previous — turns that could stand alone don't belong in a conversation case.
- Agent expected responses describe behavior, not exact wording (the LLM judge handles paraphrasing).
- Include at least one case where the user's intent shifts or expands across turns.
- Flag the **critical turn** — the one most likely to fail (e.g., Turn 3 where context from Turn 1 must be retained).

**Conversation test sets cannot be CSV-imported.** They must be created in Copilot Studio via Quick conversation set, Full conversation set, Test chat → test set, or Manual entry. The output of this skill in conversation mode serves as a **planning blueprint** the customer uses to drive manual entry — call this out explicitly.

---

### Step 6 — VERIFY discipline (review-only, stripped on export)

The most common cause of false failures in eval results is **wrong expected responses**, not wrong agent answers. Defend against this with `[VERIFY: …]` markers — but only as a review aid, not as final output.

- Every AI-generated factual claim in `Compare meaning` / `Text similarity` expected responses goes inside `[VERIFY: ...]` — e.g., *"LA employees receive [VERIFY: 18] PTO days per year, per the [VERIFY: Time Off Policy v3.2]."*
- Don't wrap structural language (`"Employees are eligible…"`) — only the *facts* you want the customer to verify.
- Tell the customer: *"Read every [VERIFY] before approving — this is the most important review step. Wrong expected responses cause correct agent answers to fail."*

In `Keyword match` lists, you can wrap individual keywords in `[VERIFY: …]` if they're factual (e.g., URLs, version numbers, exact policy names).

**At export time, strip every `[VERIFY: …]` wrapper.** By the time the customer has clicked Approve, every span has been confirmed or edited — the brackets have served their purpose. Apply the regex `\[VERIFY:\s*([^\]]*)\]` → `$1` to every value before writing it to the CSV or the customer-facing `.docx` test-case report. The internal `stage-2-data.json` may keep them for traceability if you re-launch the dashboard, but no customer-facing artifact should contain them.

---

### Step 7 — Output: one CSV per signal + `.docx` report

#### A. CSV files — one per quality signal

For each `test_set`, write **one CSV** named `eval-<signal-slug>-<YYYY-MM-DD>.csv`. **Exactly two columns:**

```csv
"Question","Expected response"
```

**No `Testing method` column.** Copilot Studio's Evaluate tab assigns the method per row in its own UI after import — it is not pre-encoded in the CSV. The companion `eval-setup-guide-<agent>-<date>.docx` walks the customer through the manual method-assignment step.

**Row generation rule.** One row per active case per criterion (no case × method explosion). Per row:
- `Question` = the case's question.
- `Expected response` = whichever of the case's `expected_responses` is most informational, picked by this priority order against the signal's method set:
  1. `Compare meaning` → `case.expected_responses["Compare meaning"]`.
  2. `Text similarity` → `case.expected_responses["Text similarity"]`.
  3. `Exact match` → `case.expected_responses["Exact match"]`.
  4. `Keyword match` → `case.expected_responses["Keyword match"]` (comma-separated keyword list).
  5. None of the above (signal only has reference-free methods like `General quality` / `Custom` / `Capability use`) → leave the cell empty.

**Strip every `[VERIFY: …]` marker from the cell value before writing the row.** Replace `[VERIFY: <content>]` → `<content>`. The CSV is the customer's eval set; it must contain clean expected responses with no review-tooling syntax. See Step 6.

The customer can edit any cell before or after import — the CSV's pre-fills are starting points, not final values. The eval-setup-guide.docx tells them when to edit (e.g., switching a row's cell from canonical-answer to keyword-list when they decide the row should use `Keyword match` in the CPS UI).

A signal with 12 cases produces exactly 12 rows.

**CSV format rules:**
- Two columns in this exact order: `Question`, `Expected response`.
- Every value enclosed in double quotes.
- Inner double quotes escaped as `""`.
- UTF-8 encoded.

**Methods NOT available via CSV import:**
- **Custom** — rubric is configured in the Copilot Studio Evaluation tab at the test-set level. Customer pastes the rubric drafted in the test-case `.docx` report into the CPS Custom configuration.
- **Capability use** — supported in some tenants only. If used, the customer assigns it per row in CPS UI like any other method.

#### B. `.docx` test-case report

Use the `/docx` skill to generate `eval-test-cases-<agent>-<date>.docx`. Structure:

1. **Agent Vision summary** (5–6 lines from Stage 0/Stage 1 if available).
2. **Value × Risk matrix summary** — criteria grouped by quadrant with pass/fail conditions.
3. **Test cases by quality dimension** — for each quality signal:
   - Signal name + signal's method set.
   - Per criterion: quadrant badge, statement, pass/fail conditions, `custom_rubric` if Custom is in the signal's methods.
   - Test cases under each criterion: Question + per-method expected (or note "graded against pass/fail" for reference-free methods).
   - **No `[VERIFY: …]` markers** — they were a review aid in the dashboard, but every span has now been confirmed or edited. The `.docx` ships clean.
4. **Method mapping summary** — count of cases per method, with notes on which methods need manual addition (Custom, sometimes Capability use).
5. **What these tests catch** — 3–4 bullet points naming what the customer would have missed without these tests.
6. **Next steps**: *"Import the CSVs into Copilot Studio's Evaluation tab. Add Custom cases manually using the rubrics below. Run the suite and pass the results to `/eval-result-interpreter`."*
7. **Maturity snapshot**:

   | Pillar | Baseline | After this kit | Next-session target |
   |---|---|---|---|
   | 1 — Define what "good" means | L300 ✓ (from Stage 1) | L300 ✓ | — |
   | 2 — Build your eval sets | L100 Initial | L300 Systematic ✓ | — |
   | 4 — Improve and iterate | L100 Initial | L100 Initial | L300 (after Stage 4 triage) |

Tell the customer: *"One CSV per quality signal — paste directly into Copilot Studio's Evaluation tab. Each test case is repeated once per method in that signal's method set so the Testing method column matches the row's Expected response. Custom cases need to be added manually with their rubrics — those are listed in the .docx report."*

---

### Step 8 — 🔍 Human Review checkpoints

Display before ending. Eval kits are useless without human validation.

| # | Checkpoint | What to verify |
|---|---|---|
| 1 | **Questions are realistic** | Every Question is a real production input — not a placeholder. Check for typos, abbreviations, ambiguity that real users would include. |
| 2 | **Expected responses are correct** | Verify every `[VERIFY: …]` span against the actual knowledge sources. **#1 source of false failures.** |
| 3 | **Method choices match what you're testing** | `Compare meaning` for paraphrasable answers, `Keyword match` for required phrases, `Custom` for nuanced rubrics. Wrong method = wrong signal. |
| 4 | **Custom rubrics are precise** | For Custom criteria, read the `custom_rubric`. Vague rubrics ("Is the response good?") behave like General quality with extra steps. Sharpen until the rubric forces a binary verdict. |
| 5 | **Negative test coverage** | For adversarial / Low Value · High Risk criteria, verify the expected behavior matches policy (refuse / redirect / escalate — pick the right one). |
| 6 | **Coverage spans the full Vision** | Every Vision capability and boundary has at least one case. Gaps surface here, not in production. |
| 7 | **Conversation mode chosen for the right reasons** *(if applicable)* | Multi-turn cases test capabilities users actually exercise. If the agent mostly handles standalone questions, single-response gives better signal. |

**Mandatory reminder:** *"This test set was AI-generated. Before running it against your agent, a domain expert must review every Question, Expected response, and Custom rubric. Wrong expected responses cause correct agent answers to fail."*

---

### Behavior rules

- Each case is independently understandable — no "see previous case" references.
- When generating from a plan, generate exactly the criteria listed. Don't add or remove without flagging why.
- Every criterion in a signal uses the signal's method set — no per-criterion method override.
- Wrap factual claims in `[VERIFY: …]`. Always.
- The CSV must be valid and importable into Copilot Studio without manual editing.
- For conversation mode, recommend whether the customer should also create a complementary single-response set.
- For Custom criteria, the rubric (drafted from pass/fail) is mandatory — the LLM judge consumes it verbatim.

---

### Operational tips for the customer

- **89-day result retention.** Copilot Studio retains run results for 89 days. Always export to CSV after every run.
- **100-case-per-test-set limit.** If a single signal has more than 100 cases, split into multiple test sets (e.g., by sub-topic).
- **Signal as the unit of versioning.** Tag each signal CSV with the agent version it was generated against. When the agent changes, re-run; when the eval set changes, snapshot the old version first.
- **Production failures become test cases.** Every reported bad answer should land here within 24 hours, becoming a regression case for the relevant quality signal.
- **GCC environment caveats:** no user profiles; no `Similarity` test method (replace with `Compare meaning` or `Keyword match`).
- **Real failures > synthetic cases.** Test cases drawn from actual support tickets, user complaints, or known production bugs are higher signal than purely synthetic ones. Prioritize real-failure-sourced cases when available.

---

## Example invocations

```
/eval-suite-planner I'm building an HR policy bot...
[planner outputs eval plan with criteria on Value × Risk matrix]
/eval-generator
<- generates from the plan, one CSV per quality signal (2 cols: Question + Expected response, one row per case)
<- produces .docx test-case report

/eval-generator I'm building a meeting-notes agent that takes a transcript and produces structured action items.
<- generates from scratch, 6-8 cases, single signal, single method (Compare meaning by default)

/eval-generator I'm building a travel-booking agent that handles multi-turn flight search, seat selection, purchase.
<- detects multi-turn behavior, generates 4-6 conversation test cases as a planning blueprint
<- recommends complementary single-response set for standalone queries

/eval-generator
<- no plan, no description provided — asks for input
```

---

## Companion skills

- **`/eval-suite-planner`** — Stage 1: produces the eval plan this skill consumes.
- **`/eval-result-interpreter`** — Stage 4: takes the run results and produces a triage report.
- **`/eval-faq`** — methodology Q&A grounded in Microsoft's eval ecosystem.
- **`/eval-guide`** — the orchestrator. Wraps Stages 0–4 with an interactive dashboard checkpoint at each stage.
