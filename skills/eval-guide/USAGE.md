# Eval Guide — How to Use This Skill

Your step-by-step guide to running a `/eval-guide` session. Written for you, the person running the session — not the AI. It tells you what to bring, what to decide, and what you'll walk away with.

> **Install:** see the repo [README](../../README.md#install). This guide assumes the skill is already installed and you're about to type `/eval-guide` in Claude Code or GitHub Copilot.

## 1. What this is

`/eval-guide` is an eval enablement accelerator. In one session it takes you from "I don't know where to start" to a written eval plan, a set of test cases importable into Copilot Studio, and the vocabulary to triage results the next time evals come back.

**This guide is for:**
- **Customers** — Copilot Studio agent builders, product managers, or business owners — running `/eval-guide` on their own.
- **Internal team members** (CS, FTE, TPM) facilitating a session *alongside* a customer. Use as a shared script so you both know what's coming.

**You are the right audience if you are:**
- New to eval, or new to doing eval *systematically*.
- Working on any agent architecture: prompt-level, RAG, or agentic.

**Use this when you:**
- Are planning a new agent.
- Are adding a feature to an existing agent.
- Have an agent but have never written a real eval.
- Got eval results back and don't know what they mean.

**Do not use this when you:**
- Already have a mature eval suite running on cadence — use `/eval-triage-and-improvement` instead.
- Need ethics, responsible AI, or content-safety review — eval measures correctness, not safety posture. Use content safety filters alongside.

## 2. Before you start

**What you need ready:**
- A description of the agent (idea, draft, spec, or live) — see `workshop/sample-agent.yaml` for a well-formed example.
- A browser. Dashboards open as local HTML files.
- Python 3 on your machine (no dependencies) to launch the dashboards.
- About **30 minutes** of focused time.

**What you do NOT need:**
- A running agent. Stages 0, 1, and 2 work from a description.
- A DirectLine endpoint, tenant ID, or a test environment — nice to have, not required.
- Written requirements or a PRD. The Discover conversation draws these out of you.

## 3. The Eval Maturity Journey

Eval maturity has five pillars and five levels each — from `L100 Initial` (no practice in place) to `L500 Optimized` (continuous improvement built into operations). Today's session takes Pillars 1, 2, and 4 to **L300 Systematic** through in-session work, and Pillars 3 and 5 to **L200 Defined** through reference protocols you keep after the session. The full 5×5 lives in `maturity-model.md`.

| Pillar | What it covers | Today's session | Where you land |
|---|---|---|---|
| **1. Define what "good" means** | Agent Vision, acceptance criteria (*"The agent should…"*), Value × Cost matrix, pass/fail conditions | **Delivered (Stage 0 + Stage 1)** | L300 Systematic |
| **2. Build your eval sets** | Test cases per acceptance criterion, CSVs ready for Copilot Studio | **Delivered (Stage 2)** | L300 Systematic |
| **3. Run evals across the lifecycle** | When and where evals execute (offline, pre-deploy, in production) | **Starter delivered (`rerun-protocol-<agent>-<date>.docx`)** | L200 Defined |
| **4. Improve and iterate** | Root-cause triage, failure patterns, next-action playbook | **Delivered (Stage 4 — if eval results are available)** | L300 Systematic |
| **5. Handle changes with confidence** | Comparing eval runs, validating prompt/tool/model changes before shipping | **Starter delivered (`baseline-comparison-<agent>-<date>.xlsx`)** | L200 Defined |

**Why Pillars 3 and 5 stop at L200 Defined:** they aren't single-session deliverables — they're ongoing operating practices. Pillar 3 needs a release cadence with codified triggers (CI hooks, scheduled runs, production-quality tracking); Pillar 5 needs version-tagged baselines accumulated over multiple changes. The two starter artifacts you'll receive at session close (`rerun-protocol-<agent>-<date>.docx` and `baseline-comparison-<agent>-<date>.xlsx`) give you the documented protocol and fill-in workbook to execute when triggered — the L200 Defined milestone — and the path to L300 Systematic is described inside each artifact. Once you have a running agent and a few changes' worth of comparison history, come back to push them to L300.

## 4. Stage 0 — Discover *(advances Pillar 1)*

**Goal:** Articulate what your agent does and what "good" looks like.

### 0.1 Kick off

- **What you provide:** One or two sentences — *"I'm building / planning / evaluating an agent that does X for Y users."*
- **What you get back:** The AI confirms the mode (idea / description / live agent) and begins the Discover questions.

### 0.2 Answer the seven Discover questions

- **What you provide:** Plain-language answers to:
  1. What problem does the agent solve?
  2. Who are the users?
  3. What knowledge sources will it use?
  4. What must it do — and not do?
  5. What does success look like?
  6. What's the cost of getting it wrong?
  7. Does behavior differ per user role?
- **What you decide:**
  - **Risk profile (low / medium / high)** — informs how much of your Stage 1 plan leans into the **Low Value · High Risk** quadrant and how strict the human-review gate should be. It does *not* prescribe numeric thresholds (those were intentionally dropped).
  - **Role-based access (yes / no)** — if yes, Stage 2 generates separate test sets per role using Copilot Studio user profiles. *Note: multi-profile eval doesn't work with connectors and isn't available in GCC.*
- **What you get back:** An **Agent Vision** block (name, purpose, users, knowledge sources, capabilities, boundaries, success criteria, role-based access, risk profile).

### 0.3 Confirm the Agent Vision

- Review the Agent Vision in chat. Add anything missing. Say "confirmed" when it reflects reality.
- **What you get back:** `stage-0-data.json` on disk. *No dashboard at this stage — the conversation is the checkpoint.*

## 5. Stage 1 — Plan *(advances Pillar 1)*

**Goal:** Turn the Agent Vision into a structured eval plan — acceptance criteria with pass/fail conditions, placed on a Value × Cost-of-Failure matrix.

### 1.1 Confirm the architecture

- **What you decide:** Prompt-level / RAG / Agentic. The AI proposes based on knowledge sources and tools; you confirm.
- **Tradeoff:** Over-scoping wastes effort on criteria that never matter; under-scoping misses real failure modes.
- **What you get back:** Eval layers to apply (RAG adds grounding + hallucination; Agentic adds tool-selection + task-completion).

### 1.2 Write acceptance criteria

- **Goal:** Produce 10–15 criteria, each phrased as **"The agent should…"** (or *"should NOT…"* for negative tests).
- **What you decide:**
  - Which **functional families** apply (Information Retrieval, Request Submission, Troubleshooting, Process Navigation, Triage & Routing).
  - Which **capability families** apply (Knowledge Grounding, Tool Invocation, Trigger Routing, Safety, Compliance, Red-Teaming, Graceful Failure, Tone & Quality).
  - **Pass/fail conditions** for each criterion — explicit enough that a human or LLM judge can decide the outcome from the criterion alone.
- **Coverage target:** ~50–70% focused on High Value · High Risk + Low Value · High Risk, ~20–30% on expected-but-lower-priority behaviors, ~10–20% on exploratory/edge. Always include at least one adversarial / Red-Teaming criterion.
- **What you get back:** A list of acceptance criteria printed in chat. Example:
  > "The agent should return the correct PTO days for the employee's office and tenure, with a citation to the source policy."

### 1.3 Place criteria on the Value × Cost-of-Failure matrix

- **Goal:** Assign each criterion to one of four quadrants so effort flows to what matters most.
- **Quadrants** (two judgments: how much VALUE does getting this right deliver? how much COST does failure cause?):
  - **High Value · High Risk** (high value, high cost) — product-defining capabilities and high-harm behaviors. Invest heaviest.
  - **High Value · Low Risk** (high value, low cost) — expected capabilities; occasional misses tolerable.
  - **Low Value · High Risk** (low value, high cost) — rarely triggered safety/compliance/refusal criteria. Zero tolerance for failure.
  - **Low Value · Low Risk** (low value, low cost) — exploratory or rare. Test lightly.
- **What to verify (per criterion)** — a decision-aid field that captures what the test must actually check. Picking one **sets the test method automatically**:

  | What to verify | Test method it sets | When to use |
  |---|---|---|
  | Factual content | Compare meaning | A specific fact or number must appear |
  | Semantic match | Compare meaning | Meaning must match, wording flexible (e.g., a refusal phrased however) |
  | Response quality | General quality | Open-ended LLM judgment on relevance / groundedness / completeness |
  | Custom rubric / style | Custom | Domain-specific criteria (tone, brand voice, compliance) — write your rubric in the pass/fail conditions |
  | Topic / tool invocation | Capability use | A specific topic or tool must fire (escalation, handoff) — text alone isn't enough |
  | Exact string or format | Exact match | Output must match exactly (codes, IDs, structured formats) |

  The Method isn't shown in the dashboard table — it's derived from "What to verify" and carried into Stage 2 in the saved JSON.
- **No prescribed percentage targets.** Pass/fail lives in each criterion's pass/fail conditions. The quadrant tells you WHERE to invest effort — not a threshold to clear.
- **What you get back:** Each criterion has `statement` + `quadrant` + `quality_dimension` + `signal_type` (what to verify) + `method` (derived) + `pass_condition` + `fail_condition`, written to `stage-1-data.json`.

### 1.4 Plan dashboard checkpoint

- **What happens:** The AI launches the plan dashboard from the eval-guide plugin install. Your browser opens `plan-dashboard.html` (the file gets written next to your working directory).
- **What you do in the browser:**
  - **Value × Cost matrix:** Each criterion is a draggable card placed in its starting quadrant. Axis labels: *High value* / *Low value* on the left, *Low cost of failure* / *High cost of failure* above. **Drag cards between quadrants** to adjust priority. Add new criteria with the per-quadrant *"+ The agent should…"* input.
  - **Acceptance Criteria & Conditions table:** Edit each criterion inline — Statement, the **What to verify** dropdown (auto-sets method), and the explicit green **Pass =** / red **Fail =** condition textareas. Edited fields turn blue.
  - **Quality Dimensions:** Drag criterion chips between dimension groups, or add a new dimension.
  - **General Comments** box at the bottom for anything not captured by the fields above.
  - Click **Approve & Continue to Next Stage** to accept (your inline edits flow into Stage 2), or **Incorporate Changes & Generate New Plan** to send it back to the AI for another pass.
- **What happens when you click:** Your edits go straight from the browser to the localhost dashboard server, which forwards them to the AI's terminal output and shuts down. **No download, no file to move.** The AI applies your edits and either generates the next stage (Approve) or re-launches a fresh dashboard with the changes already incorporated (Regenerate).
- **What you get back (after Approve):**
  - **`.docx` eval plan** (`eval-plan-<agent>-<date>.docx`) — narrative report: Agent Vision summary, Value × Cost matrix overview, quadrant assignment (visual 2×2 + grouped criterion table), quality dimensions, method mapping. For sharing and team alignment.

## 6. Stage 2 — Generate *(advances Pillar 2)*

**Goal:** Turn each acceptance criterion into concrete test cases, grouped into CSVs importable into Copilot Studio.

### 2.1 Choose the evaluation mode per criterion

- **What you decide:**
  - **Single response** (up to 100 cases, all 7 methods) — use for independent Q&A criteria.
  - **Conversation / multi-turn** (up to 20 cases, max 6 Q&A pairs, limited methods) — use for slot-filling, clarification flows, or multi-step workflows.
- **Tradeoff:** Conversation mode matches real user behavior but caps at 20 cases and drops `Compare meaning`, `Text similarity`, and `Exact match`.

### 2.2 Review generated test cases

- The AI generates from the plan. Share real production phrasings now if you want them used.
- Factual content in expected responses is wrapped in `[VERIFY: …]` markers in the dashboard so you can spot-check it. The markers are stripped automatically when the CSV and the test-case `.docx` are generated — the customer-facing artifacts ship clean.

### 2.3 Generate dashboard checkpoint

- **What happens:** The AI launches the generate dashboard from the eval-guide plugin install. Your browser opens `generate-dashboard.html`.
- **What you do in the browser:**
  - **Eval Sets Overview at the top** — a 4-column table (Quality Signal · # Test Cases · Test Methods · Priority Level) listing every signal the AI proposes. Edits below update this table in real time. Click a signal name to jump to its section.
  - **Stacked signal sections, ordered by priority** — High Value · High Risk first, then Low Value · High Risk, then High Value · Low Risk, then Low Value · Low Risk. Each section has a colored top border matching its priority level. No tabs.
  - **"Test Methods to Use:"** bar at the top of each signal section lists the methods that apply to **every criterion in that signal** — methods are signal-level, not per-criterion. Hover a chip and click × to remove. Use **+ Add method** to add another.
  - **Criterion cards** show the quadrant badge, the statement, and the **Pass = / Fail = conditions** in green/red. No per-criterion method dropdown — every criterion in a signal uses the signal's full method set.
  - **Custom rubric callout** appears under the conditions when `Custom` is in the signal's methods — an editable LLM-judge rubric drafted from the criterion's pass/fail conditions. Edit it for your domain.
  - **A small reference-free note** appears when `General quality` or `Capability use` is in the signal's methods — those methods grade against pass/fail conditions, not a reference, so they don't add a per-case column.
  - **Test cases table** has columns driven by the signal's reference-needing methods: one column for `Question`, then one column per method that needs a per-case reference (`Compare meaning`, `Text similarity`, `Exact match`, `Keyword match`). Each cell is editable. `[VERIFY: …]` spans in `Compare meaning` / `Text similarity` cells are highlighted yellow — fact-check before approving. The brackets are stripped automatically when the CSV and `.docx` are generated, so the customer-facing files ship clean.
  - Add or delete test cases with the per-row buttons.
  - Click **Approve & Continue to Next Stage** or **Incorporate Changes & Generate New Plan**.
- **What happens when you click:** Your edits go straight from the browser to the localhost dashboard server, which forwards them to the AI's terminal output and shuts down. **No download, no file to move.** The AI applies your edits and either generates the deliverables (Approve) or re-launches a fresh dashboard with the changes already incorporated (Regenerate).
- **What you get back (after Approve):**
  - **One CSV per quality signal** — e.g. `eval-knowledge-accuracy-<date>.csv`, `eval-safety-compliance-<date>.csv`, etc. **Two columns only: `Question`, `Expected response`.** No testing method column — that is set manually per row in Copilot Studio's Evaluate tab UI after import. The `eval-setup-guide-<agent>-<date>.docx` walks you through that step in detail.
  - For methods that grade against pass/fail (`General quality`, `Capability use`, `Custom`), the `Expected response` cell is empty — Copilot Studio uses the criterion's pass/fail (and for `Custom`, the rubric you set in the test-set configuration).
  - A customer-ready **`.docx` test case report** — Value × Risk matrix summary, test cases grouped by quality dimension with quadrant badges, pass/fail conditions, Custom rubrics where set, and a "What these tests catch" callout.

## 7. Stage 3 — Run *(Pillar 3 starter — skip if agent isn't built)*

**Goal:** Execute the CSVs against a live agent.

This session reaches **L200 Defined on Pillar 3** through the `rerun-protocol-<agent>-<date>.docx` reference document you'll receive at session close — a documented protocol for re-running evals when the agent changes. L300 Systematic on Pillar 3 (offline + production evals running on a defined cadence with production-quality tracking) requires automation and production signal that the starter doc points toward but doesn't deliver. Run Stage 3 yourself later when the agent is ready; the rerun protocol tells you when to trigger and what scope to run.

If the agent IS running:

- **What you provide:** DirectLine token endpoint, or access to `/chat-with-agent` via the Copilot Studio plugin.
- **What you decide:** Which CSVs to run now vs. later. Run **High Value · High Risk and Low Value · High Risk** criteria first — if those fail, the rest is noise.
- **What you get back:** `eval-results-YYYY-MM-DD.csv` and `.json`. **Export immediately** — Copilot Studio only retains results for 89 days.
- **Checkpoint:** None. This stage executes; no dashboard.

## 8. Stage 4 — Interpret *(advances Pillar 4)*

**Goal:** Turn raw results into a ranked list of actions.

### 4.1 Provide results

- **What you provide:** `eval-results-*.csv` from Stage 3, a pasted summary, or exported Copilot Studio results.
- **What you get back:** Total / passed / failed counts, pass rate per quality dimension and method, per-quadrant pass rate summary.

### 4.2 Pre-triage check

- Confirm knowledge sources were reachable, APIs healthy, auth valid during the run. If anything was broken, the run is invalid.

### 4.3 Root-cause classification

- Apply the "at least 20% of failures are eval bugs, not agent bugs" lens.
- **What you get back:** Each failure classified as **Eval Setup Issue** / **Agent Configuration Issue** / **Platform Limitation**, plus a Top 3 actions list formatted as **Change X → Re-run Y → Expect Z** (always re-running the full set, not just failing cases, so regressions surface).

### 4.4 Interpret dashboard checkpoint

- **What happens:** The AI launches the interpret dashboard from the eval-guide plugin install. Your browser opens `interpret-dashboard.html`.
- **What you do in the browser:**
  - Scan the **quadrant summary cards** — pass rate per quadrant (High Value · High Risk / High Value · Low Risk / Low Value · High Risk / Low Value · Low Risk). A Low Value · High Risk failure is more urgent than a Low Value · Low Risk failure at the same rate; the cards make that visible.
  - Expand criterion rows to see every test case with the LLM judge's explanation.
  - Click **Agree** / **Disagree** per case. Disagrees flip the case to an Eval Setup root cause — your human judgment overrides the LLM judge.
  - Reclassify root causes via the dropdown.
  - Edit the Top 3 actions if the AI missed context.
  - Click **Approve & Continue to Next Stage** or **Incorporate Changes & Generate New Plan**.
- **What happens when you click:** Your edits go straight from the browser to the localhost dashboard server, which forwards them to the AI's terminal output and shuts down. **No download, no file to move.** The AI applies your edits and either generates the triage report (Approve) or re-launches a fresh dashboard with the changes already incorporated (Regenerate).
- **What you get back:** A **`.docx` triage report** — pass rates per quadrant, failure triage table with human-disagreed entries flagged as *"Eval Setup — Human Disagrees"*, Top Actions, quadrant-aware pattern analysis, and next steps.

## 9. After the session

**You walk away with:**
- `stage-0-data.json` — confirmed Agent Vision.
- `.docx` eval plan (Stage 1) with Value × Cost matrix and acceptance criteria.
- One CSV per quality signal (Stage 2): `eval-<signal>-<date>.csv` — 2 columns (Question, Expected response), one row per case. Testing method is set manually per row in Copilot Studio's Evaluate tab UI; the `eval-setup-guide-<agent>-<date>.docx` walks through that.
- `.docx` test case report (Stage 2).
- *If Stage 3 ran:* results CSV/JSON and `.docx` triage report (Stage 4).
- **`eval-setup-guide-<agent>-<date>.docx`** — step-by-step walkthrough for setting up and running the CSVs in Copilot Studio's Evaluate tab. Per-method setup details (`General quality`, `Compare meaning`, `Keyword match`, `Custom`, etc.), threshold guidance tied to your quadrants, and a troubleshooting table for common import/run problems. Open it the first time you set up the run and any time someone new on the team picks it up.
- **`rerun-protocol-<agent>-<date>.docx`** — Pillar 3 L200 Defined starter. Reference document — when to re-run evals after the agent changes, what scope to run, how to log results, exit criteria for L200, path to L300. Read it, share it with your team, keep it next to your eval set.
- **`baseline-comparison-<agent>-<date>.xlsx`** — Pillar 5 L200 Defined starter. Fill-in Excel workbook — comparison table for Run 1 vs. Run 2 metrics, four case-level buckets (Pass-Pass / Fail-Pass / Pass-Fail / Fail-Fail), decision rules, capability-vs-regression cheat sheet. Open it each time you compare two eval runs.
- The vocabulary to do the next round yourself: acceptance criteria (*"The agent should…"*), the four quadrants (**High Value · High Risk / High Value · Low Risk / Low Value · High Risk / Low Value · Low Risk**), quality dimensions, `[VERIFY]` discipline, pass/fail conditions, root-cause classification.

**How to push Pillars 3 and 5 from L200 Defined to L300 Systematic:**
- **Pillar 3 (Run evals across the lifecycle)** — your `rerun-protocol-<agent>-<date>.docx` gets you to L200 Defined: a documented protocol you execute when triggered. L300 Systematic requires automation (CI hooks, scheduled runs) and production-quality tracking on a defined cadence. Come back when you have a DirectLine endpoint and want to codify the triggers and start sampling production traffic.
- **Pillar 5 (Handle changes with confidence)** — your `baseline-comparison-<agent>-<date>.xlsx` gets you to L200 Defined: a fill-in workbook for comparing two runs. L300 Systematic requires per-change-type routing (a prompt edit triggers the prompt subset; a tool change triggers the tool-routing subset) and at least three changes' worth of comparison history. Come back when you've accumulated that history.

**How to re-run as the agent evolves:**
- Any change to knowledge, topics, or tools → follow the trigger table in your `rerun-protocol-<agent>-<date>.docx`. High Value · High Risk + Low Value · High Risk first, then the prescribed scope.
- New feature → new `/eval-guide` session, jumping to Stage 1 with the existing Agent Vision as input.
- Comparing two runs → open your `baseline-comparison-<agent>-<date>.xlsx`, fill in the Comparison sheet and Case-level delta sheet. Pass-Fail (regression) cases are highest priority.
- Production signal (real user issues) → add cases to the relevant quality signal CSV, re-run, re-interpret.
- **Export every run's results to CSV immediately** — Copilot Studio retains them for only 89 days.

**A 100% pass rate is a red flag, not a trophy** — it means your eval is too easy. Add edge cases and adversarial criteria before trusting the number.
