# Eval Guide — How to Use This Skill

Your step-by-step guide to running a `/eval-guide` session. This is written for you, the person running the session — not the AI. It tells you what to bring, what to decide, and what you'll walk away with.

## 1. What this is

`/eval-guide` is an eval enablement accelerator. In one session it takes you from "I don't know where to start" to a written eval plan, a set of test cases you can import into Copilot Studio, and the vocabulary to triage results the next time evals come back.

**This guide is for:**
- **Customers** — Copilot Studio agent builders, product managers, or business owners of an agent — running `/eval-guide` on their own.
- **Internal team members** (CS, FTE, TPM) facilitating a session *alongside* a customer. Use this as a shared script so you both know what's coming at each stage.

**You are the right audience if you are:**
- New to eval, or new to doing eval *systematically*.
- Working on any agent architecture: prompt-level, RAG, or agentic.

**Use this when you:**
- Are planning a new agent.
- Are adding a feature to an existing agent.
- Have an agent but have never written a real eval.
- Got eval results back and don't know what they mean.

**Do not use this when you:**
- Already have a mature eval suite running on cadence — you want `/eval-triage-and-improvement` instead.
- Need ethics, responsible AI, or content-safety review — eval measures correctness, not safety posture. Use content safety filters alongside.

## 2. Before you start

**What you need ready:**
- A description of the agent (idea, draft, spec, or live) — see `workshop/sample-agent.yaml` for a well-formed example.
- A browser. The dashboards open as local HTML files.
- Python 3 on your machine (no dependencies) to launch the dashboards.
- About **30 minutes** of focused time.

**What you do NOT need:**
- A running agent. Stages 0, 1, and 2 work from a description.
- A DirectLine endpoint, tenant ID, or a test environment — nice to have, not required.
- Written requirements or a PRD. The Discover conversation draws these out of you.

## 3. The Eval Maturity Journey

Eval maturity has five pillars. We assume you start at **L100 (beginner)** across all five. Today's session moves three of them to **L300 (practitioner)**.

| Pillar | What it means | Today's session | Where you land |
|---|---|---|---|
| **1. Define what "good" means** | Agent Vision, acceptance criteria ("The agent should…"), Value × Cost matrix, pass/fail conditions | **Delivered (Stage 0 + Stage 1)** | L300 |
| **2. Build eval sets** | Test cases grouped by quality signal, CSVs ready for import | **Delivered (Stage 2)** | L300 |
| **3. Run systematically** | Scheduled runs, CI integration, regression gating | Out of scope today | Stays at L100 |
| **4. Handle changes** | Drift detection, comparative testing across versions | Out of scope today | Stays at L100 |
| **5. Improve and iterate** | Root-cause triage, failure patterns, next-action playbook | **Delivered (Stage 4)** | L300 |

**Why Pillars 3 and 4 are out of scope:** they aren't one-session deliverables — they're ongoing operating practices. Pillar 3 needs a release cadence and CI hooks; Pillar 4 needs drift history and version comparisons to compare *against*. A single session can't build either. Once you have a running agent and a few weeks of production signal, come back to stand those up.

## 4. Stage 0 — Discover *(advances Pillar 1)*

**Stage goal:** Articulate what your agent does and what "good" looks like.

### 0.1 Kick off

- **Goal:** Frame the conversation.
- **What you provide:** One or two sentences: "I'm building / planning / evaluating an agent that does X for Y users."
- **What you get back:** The AI confirms the mode (idea / description / live agent) and begins the Discover questions.

### 0.2 Answer the seven Discover questions

- **Goal:** Produce enough signal to build an Agent Vision.
- **What you provide:** Plain-language answers to:
  1. What problem does the agent solve?
  2. Who are the users?
  3. What knowledge sources will it use?
  4. What must it do — and not do?
  5. What does success look like?
  6. What's the cost of getting it wrong?
  7. Does behavior differ per user role?
- **What you decide:**
  - **Risk profile (low / medium / high).** High-risk raises thresholds in Stage 1 — stricter tests, fewer failures tolerated.
  - **Role-based access (yes / no).** If yes, Stage 2 will generate separate test sets per role using Copilot Studio user profiles. Tradeoff: more coverage vs. more CSVs to maintain. *Note: multi-profile eval doesn't work with connectors and isn't available in GCC.*
- **What you get back:** An **Agent Vision** block (name, purpose, users, knowledge, capabilities, boundaries, success criteria, risk profile).

### 0.3 Confirm the Agent Vision

- **Goal:** Lock in the spec before it drives everything downstream.
- **What you do:** Review the Agent Vision printed in chat. Add anything missing. Say "confirmed" when it reflects reality.
- **What you get back:** A written `stage-0-data.json` on disk. *No dashboard at this stage — the conversation is the checkpoint.*

## 5. Stage 1 — Plan *(advances Pillar 1)*

**Stage goal:** Turn the Agent Vision into a structured eval plan — acceptance criteria with pass/fail conditions, each placed on a Value × Cost-of-Failure matrix.

### 1.1 Confirm the architecture

- **Goal:** Scope eval depth to the agent you actually have.
- **What you decide:** Prompt-level / RAG / Agentic. The AI proposes based on knowledge sources and tools; you confirm.
- **Tradeoff:** Over-scoping wastes effort on criteria that never matter; under-scoping misses real failure modes.
- **What you get back:** Eval layers to apply (e.g., RAG adds grounding + hallucination; Agentic adds tool-selection + task-completion).

### 1.2 Write acceptance criteria

- **Goal:** Produce 10–15 acceptance criteria, each phrased as **"The agent should…"** (or "The agent should NOT…" for negative tests).
- **What you decide:**
  - Which functional families apply (Information Retrieval, Request Submission, Troubleshooting, Process Navigation, Triage & Routing).
  - Which capability families apply (Knowledge Grounding, Tool Invocation, Trigger Routing, Safety, Compliance, Red-Teaming, Graceful Failure, Tone & Quality).
  - Pass/fail conditions for each criterion — explicit enough that a human or LLM judge can decide the outcome from the criterion alone.
- **Coverage target:** ~50–70% focused on core capabilities and guardrails, ~20–30% on expected-but-lower-priority behaviors, ~10–20% on exploratory/edge. Always include at least one adversarial/Red-Teaming criterion.
- **What you get back:** A list of acceptance criteria printed in chat. Examples: "The agent should return the correct PTO days for the employee's office and tenure, with a citation." "The agent should refuse salary queries and direct the user to HR."

### 1.3 Place criteria on the Value × Cost-of-Failure matrix and pick methods

- **Goal:** Assign each criterion to one of four quadrants so effort flows to what matters most, and pick a test method for each.
- **What you decide:**
  - **Quadrant per criterion** — based on two judgments: (a) how much VALUE does getting this right deliver? (b) how much COST does failure cause?
    - **Critical** (high value, high cost): product-defining capabilities and high-harm behaviors. Invest heaviest.
    - **Core** (high value, low cost): expected capabilities; occasional misses tolerable.
    - **Guardrails** (low value, high cost): rarely triggered safety/compliance/refusal criteria. Zero tolerance for failure.
    - **Deprioritize** (low value, low cost): exploratory or rare. Test lightly.
  - **What to verify (per criterion)** — a decision-aid dropdown that captures what the test must actually check. Picking one **sets the test method automatically** so you don't have to reason about method selection separately:

    | What to verify | Test method it sets | When to use |
    |---|---|---|
    | Factual content | Compare meaning | A specific fact or number must appear |
    | Semantic match | Compare meaning | Meaning must match, wording flexible (e.g., a refusal phrased however) |
    | Response quality | General quality | Open-ended LLM judgment on relevance / groundedness / completeness |
    | Custom rubric / style | Custom | Domain-specific criteria (tone, brand voice, compliance wording) — write your rubric in pass/fail conditions |
    | Topic / tool invocation | Capability use | A specific topic or tool must fire (escalation, handoff) — text alone isn't enough |
    | Exact string or format | Exact match | Output must match exactly (codes, IDs, structured formats) |

  The Method itself is not shown in the table — it lives in the saved JSON and flows into Stage 2, where each test case inherits it.
- **No prescribed percentage targets.** Pass/fail lives in each criterion's pass/fail conditions. The quadrant tells you WHERE to invest effort — not a threshold to clear.
- **What you get back:** A plan with each criterion's statement + quadrant + quality dimension + what-to-verify + (derived) method + pass/fail conditions, written to `stage-1-data.json`.

### 1.4 Plan dashboard checkpoint

- **Goal:** Review and edit the plan before any `.docx` is generated.
- **What happens:** The AI runs `python dashboard/serve.py --stage plan --data stage-1-data.json`. Your browser opens `plan-dashboard.html` with a 2×2 matrix view.
- **What you do in the browser:**
  - **Matrix section:** See every acceptance criterion as a draggable card, placed in its starting quadrant on the Value × Cost matrix. **Drag criteria between quadrants** to change their priority (e.g., move a refusal criterion from Core into Guardrails).
  - **Criteria & conditions table:** Edit inline — Statement ("The agent should…"), the "What to verify" dropdown (sets the test method automatically), and the explicit green **Pass =** / red **Fail =** conditions. Edited fields turn blue. No Method column — it's derived from "What to verify" and flows into Stage 2.
  - **Quality Dimensions section:** Drag criterion chips between dimension groups, or add a new dimension.
  - Add new criteria with the per-quadrant "+ The agent should…" input or the "+ Add criterion" button at the bottom of the table. Delete via the per-row × button.
  - Type anything else into the **General Comments** box at the bottom.
  - Click **Approve & Continue to Next Stage** to accept (all your inline edits carry forward to Stage 2), or **Incorporate Changes & Generate New Plan** to send it back to the AI for another pass.
- **What you save:** When you click either button, `plan-feedback.json` downloads. **Save it in the same folder as `stage-1-data.json`.** The AI detects the file and proceeds.
- **What you get back (after Approve) — TWO deliverables:**
  - **`.docx` eval plan** — narrative report: Agent Vision summary, Value × Cost matrix overview, quadrant assignment (visual 2×2 + grouped criterion table), quality dimensions, method mapping. For sharing and team alignment.
  - **`.xlsx` workbook** (`eval-plan-<agent>-<date>.xlsx`) — machine-readable: every field on the dashboard in a filterable/sortable Excel format. Sheets: Criteria (color-coded by quadrant) • Quadrant Summary • Quality Dimensions • Agent Vision. For offline editing or import into other tools.

## 6. Stage 2 — Generate *(advances Pillar 2)*

**Stage goal:** Turn each acceptance criterion into concrete test cases, grouped into CSVs you can import into Copilot Studio.

### 2.1 Choose the evaluation mode per criterion

- **Goal:** Decide single-response vs. conversation mode for each criterion.
- **What you decide:**
  - **Single response** (up to 100 cases, all 7 methods) — use for independent Q&A criteria.
  - **Conversation / multi-turn** (up to 20 cases, max 6 Q&A pairs, limited methods) — use for criteria involving slot-filling, clarification flows, or multi-step workflows.
- **Tradeoff:** Conversation mode matches real user behavior but caps at 20 cases and drops `Compare meaning`, `Text similarity`, and `Exact match`.
- **What you get back:** Mode assignment per criterion.

### 2.2 Review generated test cases

- **Goal:** Validate that the questions, expected responses, and methods satisfy each criterion's pass condition.
- **What you provide:** Nothing new — the AI generates from the plan. If a criterion needs real production phrasing, say so now.
- **What you get back:** Test cases grouped by quality dimension, with each criterion showing its quadrant badge and pass/fail conditions. Factual content is wrapped in `[VERIFY: ...]` markers so you can spot-check it.

### 2.3 Generate dashboard checkpoint

- **Goal:** Edit the test cases before CSVs are written.
- **What happens:** `python dashboard/serve.py --stage generate --data stage-2-data.json` opens `generate-dashboard.html`.
- **What you do in the browser:**
  - Switch between quality dimension tabs (each colored by the most severe quadrant present in that dimension).
  - For each criterion group, review the pass/fail conditions banner and quadrant badge.
  - Edit **Question** and **Expected response** inline. `[VERIFY: ...]` spans are highlighted — these are AI-generated factual claims that you personally need to confirm against your knowledge source.
  - Change methods per test case via the dropdown.
  - Add or delete test cases.
  - Click **Approve & Continue to Next Stage** or **Incorporate Changes & Generate New Plan**.
- **What you save:** `generate-feedback.json` downloads. Save it next to `stage-2-data.json`.
- **What you get back (after Approve):**
  - **Two CSV variants per quality signal** (e.g., `eval-knowledge-accuracy-<date>-for-import.csv` + `eval-knowledge-accuracy-<date>-with-methods.csv`, and same pairing for `safety-compliance`, `hallucination-prevention`, `routing`, `robustness`, `personalization` when applicable):
    - `-for-import.csv` — 2 columns (`Question`, `Expected response`). Paste directly into Copilot Studio's Evaluation tab.
    - `-with-methods.csv` — 3 columns (`Question`, `Expected response`, `Testing method`). Keep as your team's working copy with method suggestions per row.
    - For criteria using `General quality` / `Custom` / `Capability use`, the `Expected response` cell is empty — those methods grade against the criterion's pass/fail conditions, not a reference answer.
  - A customer-ready `.docx` test case report with Value × Cost matrix summary, test cases grouped by quality dimension, and a "What these tests catch" callout.

## 7. Stage 3 — Run *(Pillar 3 preview only)*

**Stage goal:** Execute the CSVs against a live agent.

**Skip this stage if your agent isn't built yet.** Pillar 3 is not in today's L300 scope — it's an ongoing practice, not a single-session deliverable. You can run Stage 3 yourself later, or come back for a Pillar 3 session focused on cadence and automation.

If the agent IS running:

- **What you provide:** DirectLine token endpoint, or access to `/chat-with-agent` via the Copilot Studio plugin.
- **What you decide:** Which CSVs to run now vs. later. Run Critical and Guardrails criteria first — if those fail, the rest is noise.
- **What you get back:** `eval-results-YYYY-MM-DD.csv` and `.json`. **Export immediately** — Copilot Studio only retains results for 89 days.
- **Checkpoint:** None. This stage executes; no dashboard.

## 8. Stage 4 — Interpret *(advances Pillar 5)*

**Stage goal:** Turn raw results into a ranked list of actions.

### 4.1 Provide results

- **Goal:** Give the AI enough data to triage.
- **What you provide:** The `eval-results-*.csv` from Stage 3, *or* a pasted summary, *or* results from a Copilot Studio run you exported.
- **What you get back:** Total / passed / failed counts, pass rate per quality dimension and method, per-quadrant pass rate summary (how each quadrant is doing overall).

### 4.2 Pre-triage check

- **Goal:** Rule out infrastructure causes before blaming the agent.
- **What you decide:** Confirm whether knowledge sources were reachable, APIs healthy, auth valid during the run. If anything was broken, the run is invalid.

### 4.3 Root-cause classification

- **Goal:** Apply the "at least 20% of failures are eval bugs, not agent bugs" lens.
- **What you get back:** Each failure classified as **Eval Setup Issue** / **Agent Configuration Issue** / **Platform Limitation**, plus a Top 3 actions list formatted as **Change X → Re-run Y → Expect Z**.

### 4.4 Interpret dashboard checkpoint

- **Goal:** Override the LLM judge where you disagree, reclassify root causes, and lock in next actions.
- **What happens:** `python dashboard/serve.py --stage interpret --data stage-4-data.json` opens `interpret-dashboard.html`.
- **What you do in the browser:**
  - Scan the quadrant summary cards (pass rate per quadrant — Critical / Core / Guardrails / Deprioritize).
  - Expand criterion rows to see every test case with LLM judge explanation.
  - Click **Agree** or **Disagree** per case. Disagrees flip the case to an Eval Setup root cause — your human judgment overrides the LLM judge.
  - Reclassify root causes via the dropdown.
  - Edit the Top 3 actions if the AI missed context.
  - Click **Approve & Continue to Next Stage** or **Incorporate Changes & Generate New Plan**.
- **What you save:** `interpret-feedback.json` next to `stage-4-data.json`.
- **What you get back:** A `.docx` triage report — pass rates per quadrant, failure triage table with human-disagreed entries flagged, Top Actions, quadrant-aware pattern analysis (a Guardrails failure is more urgent than a Deprioritize failure), and next steps.

## 9. After the session

**You walk away with:**
- `stage-0-data.json` — confirmed Agent Vision.
- `.docx` eval plan (Stage 1) with Value × Cost matrix and acceptance criteria (pass/fail conditions).
- `.xlsx` eval plan workbook (Stage 1) — same data in filterable form, sheets for criteria / quadrant summary / quality dimensions / agent vision.
- Two CSV variants per quality signal (Stage 2): `-for-import` (2 cols, paste into Copilot Studio) and `-with-methods` (3 cols, working copy with method suggestions).
- `.docx` test case report (Stage 2).
- *If Stage 3 ran:* results CSV/JSON and `.docx` triage report (Stage 4).
- The vocabulary to do the next round yourself: acceptance criteria ("The agent should…"), the four quadrants (Critical / Core / Guardrails / Deprioritize), quality dimensions, `[VERIFY]` discipline, pass/fail conditions, root-cause classification.

**How to re-engage for Pillars 3 and 4:**
- **Pillar 3 (Run systematically)** — come back when you have a DirectLine endpoint and want scheduled runs, CI gating, and a cadence plan (Core on every change, full suite weekly + pre-release).
- **Pillar 4 (Handle changes)** — come back when you have two agent versions to compare, or when you suspect drift from a model/prompt change. You'll use Copilot Studio's comparative testing plus version-tagged result archives.

**How to re-run as the agent evolves:**
- Any change to knowledge, topics, or tools → re-run Critical + Guardrails CSVs first, then check for regressions across the full set.
- New feature → new `/eval-guide` session, jumping to Stage 1 with the existing Agent Vision as input.
- Production signal (real user issues) → add cases to the relevant quality signal CSV, re-run, re-interpret.
- **Export every run's results to CSV immediately** — Copilot Studio retains them for only 89 days.

A 100% pass rate is a red flag, not a trophy — it means your eval is too easy. If you see it, add edge cases and adversarial tests before trusting the number.
