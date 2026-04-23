---
name: eval-guide
description: Eval enablement accelerator — help customers think through "what does good look like" for their AI agent, then generate a structured eval plan and test cases they can use immediately. No built agent required — an idea or description is enough. Promotes eval-first development: write evals before building. Use when anyone mentions agent evaluation, eval planning, "what should we test", "how do we know if the agent is good", test case generation, or interpreting eval results.
preamble: |
  _UPD=$(~/.claude/plugins/cache/*/eval-guide/*/bin/eval-guide-update-check 2>/dev/null || ./bin/eval-guide-update-check 2>/dev/null || true)
  echo "$_UPD"
---

<!-- VERSION CHECK INSTRUCTIONS
When the preamble outputs text, handle it as follows:

If the output contains "UPGRADE_AVAILABLE <old> <new>":
  Use AskUserQuestion to ask the user:
  "eval-guide v<new> is available (you're on v<old>). Upgrade now?"
  With these options:
  1. "Yes, upgrade now" — Run: claude plugin add microsoft/eval-guide
  2. "Always keep me up to date" — Run: eval-guide-update-config set auto_upgrade true
     Then run: claude plugin add microsoft/eval-guide
  3. "Not now" — Run: eval-guide-update-snooze <new>
     Then continue with the skill normally.
  4. "Never ask again" — Run: eval-guide-update-config set update_check false
     Then continue with the skill normally.

  The config and snooze scripts are in the same bin/ directory as the update check script.
  After upgrade completes, tell the user to restart the session for the new version to take effect.

If the output contains "JUST_UPGRADED <old> <new>":
  Tell the user: "Running eval-guide v<new> (just updated from v<old>)!" and continue normally.

If the output is empty:
  Continue normally — the user is up to date (or check was snoozed/disabled).
-->

# Eval Guide — Enablement Accelerator

Help customers go from "I don't know where to start with eval" to "I have a plan, test cases, and know how to interpret results" — in one session. The customer becomes self-sufficient for future eval cycles.

## Eval-First Mindset

**You do NOT need a built agent to start.** All you need is an idea, a description, or even a vague goal. This skill is designed around the **eval-first** approach: define what "good" looks like and write your evals **before** you build the agent or feature.

Why eval-first?
- **Evals sharpen your thinking.** Writing test cases forces you to articulate exactly what the agent should and shouldn't do — before you spend time building it.
- **Evals become your spec.** The eval plan from Stage 1 and test cases from Stage 2 double as your agent's acceptance criteria. Build the agent to pass these tests.
- **Evals prevent drift.** When you define success upfront, you avoid scope creep and "it seems to work" thinking. You'll know objectively whether the agent meets the bar.

**Start here whether you:**
- Have only a rough idea ("we want an HR bot")
- Have a written description but no agent yet
- Have a built agent you want to evaluate
- Are adding a new feature to an existing agent

Stages 0 (Discover), 1 (Plan), and 2 (Generate) all work without a running agent. They help you think through your agent's purpose, design a structured eval plan, and generate test cases — all before writing a single line of agent configuration. Stage 3 (Run) is the only stage that requires a live agent, and it's optional.

This skill is grounded in Microsoft's **Eval Scenario Library**, **Triage & Improvement Playbook**, and **MS Learn agent evaluation documentation**.

**Important: You are an enablement accelerator, not a replacement.** Each stage generates artifacts the customer can use immediately AND explains the reasoning so they internalize the methodology. After one session, they should be able to do the next eval without us.

## Interactive Dashboard Workflow

Each stage produces an **interactive HTML dashboard** that opens directly in the browser. No server required — `dashboard/serve.py` generates a standalone HTML file and opens it (Python, zero dependencies).

**Flow at each dashboard stage:**
1. Complete the stage's analysis
2. Write stage data to a JSON file (e.g., `stage-1-data.json`)
3. Launch: `python dashboard/serve.py --stage <name> --data <file>.json`
   - This generates `<stage>-dashboard.html` next to the data file and opens it in the browser
   - The script then waits for the user to confirm or request changes
4. The customer reviews in the browser: edits fields inline, adds comments
5. When the customer clicks **Confirm** or **Request Changes**, the feedback JSON downloads automatically
   - The customer saves it next to the data file (same directory)
   - The script detects the feedback file and exits
6. Read the feedback JSON file (`<stage>-feedback.json`)
7. If confirmed → generate final deliverables (docx, CSV) and proceed to next stage
8. If changes requested → apply feedback, regenerate, re-launch dashboard

**Stages with dashboards:** Discover (0), Plan (1), Generate (2), Interpret (4). Stage 3 (Run) executes tests directly.

**Key principle:** No docx or CSV files are generated until the customer confirms via the dashboard. The dashboard IS the review checkpoint — it replaces the "does this look right?" chat-based confirmation with a structured, visual review.

## Before You Start

**Start from wherever the customer is.** Most customers come to eval guidance early — they have an idea or a description, not a finished agent. That's exactly right. The eval-first approach means defining "what good looks like" before building.

Ask: **"Tell me about the agent you're building or planning to build. It could be a detailed spec, a rough idea, or even just 'we want a bot that helps with X.' We'll use that to build your eval plan — you don't need a running agent to get started."**

- **If they have an idea or description (most common):** Proceed directly to Stage 0 (Discover). The conversation will help them articulate their agent's purpose, users, boundaries, and success criteria — this becomes their eval spec.
- **If they already have a running Copilot Studio agent:** Offer to connect to it for richer context: "Since you have a running agent, I can pull its configuration directly to inform the eval plan. Want to share your tenant ID so I can connect?" If yes, use `/clone-agent` to import the agent's topics, knowledge sources, and configuration. Use this to pre-fill the Agent Vision in Stage 0.
- **If they already have eval results:** Route directly to Stage 4 (Interpret).

**The key message:** Writing evals early makes the agent better. The eval plan becomes the spec, and the test cases become the acceptance criteria. Customers who define evals first build more focused agents and catch problems before they reach production.
---

## How to Route

| Customer says... | Start at |
|---|---|
| "We're planning to build an agent for..." | **Stage 0: Discover** — eval-first: define evals before building |
| "We have an idea for an agent, what should we test?" | **Stage 0: Discover** — perfect, evals start from an idea |
| "Help us think through what good looks like" | **Stage 0: Discover** |
| "I want to add a new feature to my agent" | **Stage 0: Discover** — write evals for the feature before building it |
| "Here's our agent description, plan the eval" | **Stage 1: Plan** |
| "I already have a plan, generate test cases" | **Stage 2: Generate** |
| "I have eval results, what do they mean?" | **Stage 4: Interpret** |

When running the full pipeline, complete each stage, show the output, explain your reasoning, then ask: **"Ready for the next stage?"**

---

## Eval Maturity Journey

Use the **Per-Agent Eval Maturity Model** (5 pillars × 5 levels, L100 Initial → L500 Optimized) to orient customers on where they are today and where this session takes them. Assume the agent starts at **L100 on all pillars**. This session targets **L300 on Pillars 1, 2, and 5**.

| Pillar | What it measures | L100 (starting point) | L300 (session target) |
|---|---|---|---|
| **1 — Define what "good" means** | Acceptance criteria quality | No written criteria. "Good" lives in the builder's head. | Acceptance criteria cover capabilities + quality + reliability, tied to eval metrics with thresholds, human-reviewed. |
| **2 — Build eval sets** | Coverage and versioning | No established eval set. Informal spot-checks. | Versioned eval set, coverage targeted at quality dimensions, edge cases, and failure modes; mapped to risk and value. |
| **5 — Improve and iterate** | How improvements are validated | Reactive — driven by complaints, not eval data. | Failure categories analyzed for root cause. Fixes validated with before/after eval runs. Regression-proofing built in. |

**Pillars 3 (Run systematically) and 4 (Handle changes with confidence) are the next chapter.** They require ongoing operating practices — cadence, CI hooks, drift detection, version comparisons — not a single session. Acknowledge them to the customer so they know the full map, but don't try to deliver them today.

Each stage below includes a maturity callout naming which pillar and level it advances.

---

## How This Maps to Microsoft's Official Evaluation Framework

Microsoft's [evaluation checklist](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-checklist) and [iterative framework](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-iterative-framework) define a 4-stage lifecycle. Our skill stages map directly to it — share this mapping with customers so they see how the accelerator fits the official guidance:

| Microsoft's 4 stages | What it means | Our skill stages | Other eval skills |
|---|---|---|---|
| **Stage 1: Define** — Create foundational test cases with clear acceptance criteria | Translate agent scenarios into testable components before you even have a working agent | **Stage 0 (Discover)** + **Stage 1 (Plan)** + **Stage 2 (Generate)** | eval-suite-planner, eval-generator |
| **Stage 2: Baseline** — Run tests, measure, enter the evaluate→analyze→improve loop | Establish quantitative baseline, categorize failures by quality signal, iterate | **Stage 3 (Run)** + **Stage 4 (Interpret)** | eval-result-interpreter |
| **Stage 3: Expand** — Add variation, architecture, and edge-case test categories | Build comprehensive suite: Core (regression), Variations (generalization), Architecture (diagnostic), Edge cases (robustness) | Repeat **Stage 1–2** with broader categories | eval-suite-planner (expansion sets) |
| **Stage 4: Operationalize** — Establish cadence, triggers, continuous monitoring | Run core on every change, full suite weekly + before releases, track quality signals over time | **Stage 4 (Interpret)** ongoing | eval-triage-and-improvement |

**When to share this:** After completing Stage 0, show the customer this mapping and say: *"What we're doing today covers Microsoft's Stage 1 — defining your foundational test cases. Once you have a running agent, you'll move into Stage 2 (baseline), then expand and operationalize. The checklist template helps you track progress."*

**Downloadable checklist:** Point customers to the [editable checklist template](https://github.com/microsoft/PowerPnPGuidanceHub/tree/main/guidance/agentevalguidancekit) so they can track their progress through all four stages independently.

---

## Stage 0: Discover

Help the customer articulate what their agent is supposed to do and what "good" looks like. This is the most important stage — it shapes everything downstream.

### What to do

**Have a conversation.** Ask questions one at a time. Adapt based on what they tell you.

1. **What problem does the agent solve?**
   - "Tell me about the agent you're building (or planning to build). What's the core problem it solves for your users?"

2. **Who are the users?**
   - "Who will talk to this agent? What's their context — internal employees, external customers, technical, non-technical?"

3. **What will the agent know?**
   - "What information sources will the agent use? Policy docs, FAQs, databases, APIs?"
   - If they're not sure: "That's fine — we'll plan around what you expect to have."

4. **What should the agent DO vs NOT DO?**
   - "What are the boundaries? What should the agent never attempt to answer or do?"

5. **What does success look like?**
   - "If the agent is working perfectly, what does that look like? How would you know?"

6. **What happens if the agent gets it wrong?**
   - "What's the worst case if it gives a bad answer? Is this internal low-risk, or customer-facing high-risk?"

7. **Does the agent behave differently per user?**
   - "Does the agent return different results depending on who's asking? For example, different roles seeing different data, or personalized responses based on user profile?"
   - If yes: note this — the eval plan will need separate test sets per user role using Copilot Studio's user profile feature.

### Build the Agent Vision

After the conversation, summarize:

```
Agent Vision: [Name]

Purpose: [one sentence]
Users: [who, in what context]
Knowledge & Data: [planned or actual sources]
Core Capabilities: [3-5 things the agent should do]
Boundaries: [what it must NOT do]
Success Criteria: [measurable outcomes]
Role-Based Access: [yes/no — if yes, list roles and what differs]
Risk Profile: [low / medium / high]
```

Display this and ask: **"Does this capture what you're building? Anything to add?"**

**Why this matters for the customer:** Most customers have never written down what "good" looks like for their agent. This document becomes the foundation for everything — the eval plan, the test cases, and eventually the agent's system prompt. Tell them: "This Agent Vision is your eval spec. Everything we test from here ties back to what you just defined."

### Confirm and Proceed

After building the Agent Vision, display it to the customer and ask: **"Does this capture what you're building? Anything to add or change?"**

Iterate on the Agent Vision based on their feedback until they confirm. Write the confirmed Agent Vision to `stage-0-data.json` for use by downstream stages:
```json
{"agent_name": "...", "vision": {"purpose": "...", "users": "...", "knowledge": [...], "capabilities": [...], "boundaries": [...], "success_criteria": "...", "role_based_access": false, "risk_profile": "medium"}}
```

Once confirmed, proceed directly to Stage 1. No dashboard or document generation at this stage — the value is the conversation itself and the clarity it produces.

**Reinforce the eval-first message:** "Now that we've defined what your agent should do, we'll turn this into a structured eval plan. These evals will serve as your acceptance criteria — build the agent to pass these tests."

---

## Stage 1: Plan

Using the Agent Vision, produce a structured eval suite plan. This works whether the agent exists or not — the plan defines what the agent SHOULD do.

### What to do

1. **Determine eval depth from agent architecture:**

   Different agent architectures require different eval layers. Use this to scope the eval plan — don't over-test simple agents or under-test complex ones.

   | Architecture | What it is | What to evaluate | Example scenarios |
   |---|---|---|---|
   | **Prompt-level** (simple Q&A, no knowledge sources, no tools) | Agent responds from its system prompt and LLM knowledge only | Response quality, tone, boundaries, refusal behavior | FAQ bot with hardcoded answers, greeting agent |
   | **RAG / Knowledge-grounded** (has knowledge sources, no tool use) | Agent retrieves from documents, SharePoint, websites, etc. | Everything above PLUS: retrieval accuracy, grounding (did it cite the right source?), hallucination prevention, completeness | HR policy bot, IT knowledge base agent |
   | **Agentic** (multi-step, tool use, orchestration) | Agent calls APIs, uses connectors, makes decisions, chains actions | Everything above PLUS: tool selection accuracy, action correctness, error recovery, multi-turn context retention, task completion rate | Expense submission agent, incident triage bot, booking agent |

   **Tell the customer:** "Your agent is [architecture type], which means we need to test [these layers]. A knowledge-grounded agent needs hallucination tests that a simple Q&A bot doesn't. An agentic workflow needs tool-routing tests that a knowledge bot doesn't. This scopes your eval so you're testing what actually matters."

   **Use this to filter criteria families in the next step** — skip capability families that don't apply to the agent's architecture. A prompt-level agent doesn't need Knowledge Grounding criteria; a non-agentic agent doesn't need Tool Invocation criteria.

2. **Identify the families of acceptance criteria to write:**

Acceptance criteria come in two families — **functional** (what the agent should do for users) and **capability** (how well it should do it). Use the table to pick the families that apply.

| If the agent... | Functional criteria | Capability criteria |
|---|---|---|
| Answers questions from knowledge sources | Information Retrieval | Knowledge Grounding + Compliance |
| Executes tasks via APIs/connectors | Request Submission | Tool Invocations + Safety |
| Walks users through troubleshooting | Troubleshooting | Knowledge Grounding + Graceful Failure |
| Guides through multi-step processes | Process Navigation | Trigger Routing + Tone & Quality |
| Routes conversations to teams/departments | Triage & Routing | Trigger Routing + Graceful Failure |
| Handles sensitive data | (add to whichever applies) | Safety + Compliance |
| All agents (always include) | — | Red-Teaming |

**Explain your picks:** "Based on your Agent Vision, I'm selecting Information Retrieval and Knowledge Grounding because your agent answers from policy documents. I'm also including Red-Teaming — every agent needs adversarial testing."

3. **Write acceptance criteria:**

Each criterion is a single testable statement starting with **"The agent should…"** (or "The agent should NOT…" for negative tests). Write 10–15 criteria across the families identified above.

**Criteria plan table:**

| # | Acceptance Criterion | Quality Dimension | Method |
|---|---|---|---|

Good criteria are:
- **Behavior-led** — start with "The agent should…" and describe an observable behavior
- **Verifiable** — pass or fail can be judged by comparing a response to the criterion
- **Scoped** — one behavior per criterion; don't stack multiple checks into one row
- **Grounded** — tied to the Agent Vision (a capability, boundary, knowledge source, or user cohort)

Examples:
- "The agent should return the correct PTO days for the employee's office and tenure, with a citation to the source policy."
- "The agent should refuse salary or compensation queries and direct the user to HR."
- "The agent should respond empathetically to emotional signals before citing policy."
- "The agent should NOT answer questions outside its knowledge sources; it should say it doesn't know."

4. **Pick a method per criterion:**

| What you're verifying | Primary method | Secondary |
|---|---|---|
| Factual accuracy (specific facts) | Keyword Match | Compare Meaning |
| Factual accuracy (flexible phrasing) | Compare Meaning | Keyword Match |
| Response quality, tone, empathy | General Quality | Compare Meaning |
| Hallucination prevention | Compare Meaning | General Quality |
| Negative tests (must NOT do X) | Keyword Match — negative | — |
| Tool/topic routing correctness | Capability Use | — |
| Exact codes, labels, structured output | Exact Match | — |
| Phrasing precision (wording matters) | Text Similarity | Compare Meaning |
| Domain-specific criteria (compliance, tone, policy) | Custom | — |

The method governs what information the test case needs in Stage 2 — Keyword Match needs exact keywords in the expected response; Compare Meaning needs a reference answer; Custom needs rubric labels. Pick the method here so Stage 2's test cases carry the right content.

**Beyond Custom — rubric-based grading:** For customers who need more granular scoring than Custom's pass/fail labels, the [Copilot Studio Kit](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-rubrics-tests) supports rubric-based grading on a 1–5 scale. Rubrics replace the standard validation logic with a custom AI grader aligned to domain-specific criteria. Two modes: **Refinement** (grade + rationale — use first to calibrate the rubric against human judgment) and **Testing** (grade only — use for routine QA after the rubric is trusted). Mention this to customers who are choosing Custom methods for compliance, tone, or brand voice — rubrics are the advanced option for ongoing calibrated quality assurance.

**What General Quality actually measures:** When explaining General Quality to customers, tell them what the LLM judge evaluates. Per MS Learn docs (March 2026), General Quality scores on four sub-criteria — ALL must be met for a high score:

| Sub-criterion | What it checks | Example question it answers |
|---|---|---|
| **Relevance** | Does the response address the question directly? | "Did the agent stay on topic or go off on a tangent?" |
| **Groundedness** | Is the response based on provided context, not invented? | "Did the agent cite its knowledge sources or make things up?" |
| **Completeness** | Does the response cover all aspects with sufficient detail? | "Did the agent answer the full question or just part of it?" |
| **Abstention** | Did the agent attempt to answer at all? | "Did the agent refuse to answer a question it should have answered?" |

Tell the customer: "If General Quality scores are low, these four sub-criteria tell you WHERE to look. A response can be relevant but not grounded (it answered the right question but invented the answer), or grounded but incomplete (it used the right source but missed half the information)."

**Explain your method picks:** "I'm using Compare meaning for factual criteria because the agent doesn't need to use the exact same words — it just needs to convey the same information. For refusal criteria I'm using Compare meaning too, because we need to check that the refusal matches what we expect."

5. **Prioritize criteria on the Value × Cost-of-Failure matrix:**

Every acceptance criterion goes in one of four quadrants based on two judgments:
- **Value** of getting this right — how much does successful behavior drive the product's purpose?
- **Cost of failure** if the agent gets it wrong — how much harm, embarrassment, or business damage does a failure cause?

|  | **Low cost of failure** | **High cost of failure** |
|---|---|---|
| **High value** | **Core** — expected capabilities users rely on. Solid coverage; occasional misses tolerable. | **Critical** — product-defining; failure hurts. Invest heaviest: most test cases, strictest review. |
| **Low value** | **Deprioritize** — exploratory or rare behaviors. Light coverage; revisit when the criterion starts mattering more. | **Guardrails** — rarely triggered but must never fail (safety refusals, compliance boundaries). Invest in negative tests and adversarial cases. |

**Quadrant assignment guidance:**
- **Critical** — the agent's main capabilities AND high-harm behaviors. Highest investment.
- **Core** — the agent's expected behaviors where misses are noticed but not catastrophic.
- **Guardrails** — safety, compliance, refusals. Low traffic; zero tolerance for failure.
- **Deprioritize** — experimental, low-traffic, or low-stakes. Test lightly; revisit if usage grows.

Pass/fail for each test case is determined by the criterion's pass/fail conditions, not a prescribed percentage target. The quadrant tells you **where to invest effort**, not a threshold to clear.

**Before confirming quadrant assignments:** Align placements with the customer's risk owner or compliance partner — especially for Guardrails criteria. Human expert review of criteria and their placement is what distinguishes L300 Pillar 1 from L200.

**Highlight what they'd miss:** "Notice I included a Guardrails criterion for topics NOT in your knowledge sources. Most customers only test what the agent should know. Testing what it should NOT know — and where it should refuse — is just as important."

### Output

Display the criteria plan table and the Value × Cost matrix with each criterion placed in its quadrant.

**Maturity callout — Pillar 1 (L100 → L300):** Completing Stage 0 + Stage 1 advances Pillar 1 from "no written criteria" to acceptance criteria phrased as "The agent should…", each tied to a method and placed on the Value × Cost matrix, with human-expert review. Pillar 2 advances in Stage 2; Pillar 5 in Stage 4.

### Interactive Dashboard Checkpoint

Before generating any deliverable documents, launch the plan dashboard for review:

1. Write the plan to `stage-1-data.json` using the criterion + quadrant structure. Include multiple criteria per quality dimension where applicable — one criterion typically covers one behavior, so a dimension like "Policy Accuracy" usually needs several:
   ```json
   {
     "agent_name": "...",
     "criteria": [
       {
         "id": 1,
         "statement": "The agent should return the correct PTO days for the employee's office and tenure, citing the Time Off Policy.",
         "quadrant": "critical",
         "quality_dimension": "Policy Accuracy",
         "signal_type": "Factual content",
         "method": "Compare meaning",
         "pass_condition": "Response contains the correct PTO number for the user's office/tenure AND cites the Time Off Policy.",
         "fail_condition": "Incorrect number, missing citation, or cites the wrong policy."
       },
       {
         "id": 2,
         "statement": "The agent should return the correct parental-leave duration and tenure eligibility, citing the policy.",
         "quadrant": "critical",
         "quality_dimension": "Policy Accuracy",
         "signal_type": "Factual content",
         "method": "Compare meaning",
         "pass_condition": "Response states correct paid-leave weeks AND tenure requirement AND cites the Time Off Policy.",
         "fail_condition": "Incorrect weeks, missing tenure requirement, or no citation."
       },
       {
         "id": 3,
         "statement": "The agent should return the correct carryover limit for the user's office.",
         "quadrant": "core",
         "quality_dimension": "Policy Accuracy",
         "signal_type": "Factual content",
         "method": "Compare meaning",
         "pass_condition": "Response states correct carryover days for the user's office.",
         "fail_condition": "Wrong carryover number, or uses the wrong office's limit."
       },
       {
         "id": 4,
         "statement": "The agent should NOT provide legal advice; it should escalate to Employee Relations or the Ethics Hotline.",
         "quadrant": "guardrails",
         "quality_dimension": "Boundary Enforcement",
         "signal_type": "Topic / tool invocation",
         "method": "Capability use",
         "pass_condition": "Escalation topic fires AND response points to Employee Relations or the Ethics Hotline.",
         "fail_condition": "Agent gives legal advice or fails to trigger escalation."
       },
       {
         "id": 5,
         "statement": "The agent should respond empathetically to emotional signals before citing policy.",
         "quadrant": "core",
         "quality_dimension": "Tone",
         "signal_type": "Custom rubric / style",
         "method": "Custom",
         "pass_condition": "Response opens with empathetic acknowledgment before any policy details (rubric: warmth, acknowledgment, respect).",
         "fail_condition": "Response leads with policy; no emotional acknowledgment."
       }
     ],
     "quality_dimensions": ["Policy Accuracy", "Boundary Enforcement", "Grounding", "Hallucination Prevention", "Tone"]
   }
   ```
   Each criterion must have: `statement` (starts with "The agent should…"), `quadrant` (one of `critical`, `core`, `guardrails`, `deprioritize`), `quality_dimension`, `signal_type`, `method`, `pass_condition`, and `fail_condition`. A single quality dimension commonly holds several criteria covering different behaviors — e.g., Policy Accuracy covers PTO, parental leave, carryover, etc., as separate rows.

   **`signal_type` — the single field that drives method selection.** It captures what the test case must actually verify, and the Method is derived from it automatically — the dashboard does not expose a separate Method column:

   | signal_type | What it means | Sets method to |
   |---|---|---|
   | `Factual content` | A specific fact / number / name must appear in the response | Compare meaning |
   | `Semantic match` | Response meaning must match expected, wording flexible (e.g., a refusal phrased however) | Compare meaning |
   | `Response quality` | Open-ended LLM judgment across relevance / groundedness / completeness | General quality |
   | `Custom rubric / style` | Domain-specific criteria (tone, brand voice, compliance wording) that need a custom grader | Custom |
   | `Topic / tool invocation` | A specific topic or tool must fire (escalation, handoff, connector action) — text alone isn't enough | Capability use |
   | `Exact string or format` | Output must match exactly (structured codes, IDs, machine-parseable format) | Exact match |

   When the customer picks a signal_type in the dashboard, the `method` field in the saved JSON is set to the aligned value. Method still flows through to Stage 2 (each test case inherits it); it's just not shown in the plan dashboard table. If a criterion genuinely needs a non-default mapping (e.g., "Factual content" graded with Keyword match instead of Compare meaning), override `method` directly in `stage-1-data.json` before launching the dashboard.

   **Quadrant assignment guidelines:**
   - **critical** — high value + high cost of failure. Product-defining capabilities; failure hurts. Most test cases, strictest review.
   - **core** — high value + low cost of failure. Expected capabilities; occasional misses tolerable.
   - **guardrails** — low value + high cost of failure. Safety, compliance, refusals; zero tolerance for failure.
   - **deprioritize** — low value + low cost of failure. Exploratory or rare; light coverage.
2. Launch the dashboard:
   ```bash
   python dashboard/serve.py --stage plan --data stage-1-data.json
   ```
3. The user reviews criteria (add/remove/edit), drags criteria between quadrants on the 2×2 matrix, and changes methods in the browser.
4. When the user confirms, read `plan-feedback.json` and apply edits. If changes requested, regenerate and re-launch.
5. **After confirmation, automatically generate TWO deliverables — do not wait for the user to ask:**

   **A. Customer-ready `.docx` eval plan report** using the `/docx` skill. This is the customer's narrative deliverable.

   **B. Editable `.xlsx` workbook** using the `/xlsx` skill, named `eval-plan-<agent-name>-<YYYY-MM-DD>.xlsx`. This is the customer's machine-readable deliverable — every piece of data on the Stage 1 dashboard lives here, ready for Excel filtering, import into other tools, or collaborative edit offline.

The report must be:
- **Concise** — no filler, no walls of text. Tables over paragraphs.
- **Presentable** — professional formatting with color-coded headers, clean tables, visual hierarchy
- **Self-contained** — a customer who wasn't in the conversation can read it and understand the eval plan

Report structure:
1. Agent Vision summary (from Stage 0) — 5-6 lines max
2. Value × Cost matrix overview — explain the four quadrants (Critical, Core, Guardrails, Deprioritize) and what kinds of criteria belong in each
3. Quadrant assignment — visual 2×2 matrix with each criterion placed, followed by a table listing criteria grouped by quadrant with pass/fail conditions
4. Quality Dimensions to Test — list dimensions with grouped criteria under each
5. Method mapping explanation — which methods apply to which criteria and why (reference the `signal_type` → method guidance)

XLSX workbook structure (all sheets auto-size columns; freeze header row):

| Sheet name | Contents |
|---|---|
| **Criteria** | One row per criterion. Columns: ID, Quadrant, Quality Dimension, Statement (The agent should…), What to verify (signal_type), Method, Pass condition, Fail condition. Color-code Quadrant column (Critical=red, Core=blue, Guardrails=yellow, Deprioritize=gray). |
| **Quadrant Summary** | Quadrant × count of criteria + brief description of what belongs there. One row per quadrant, four rows total. |
| **Quality Dimensions** | Quality dimension × count of criteria × comma-separated criterion IDs. One row per dimension. |
| **Agent Vision** | Key-value layout of the Agent Vision from Stage 0 (Purpose, Users, Knowledge, Capabilities, Boundaries, Success Criteria, Role-Based Access, Risk Profile). Spans two columns. |

Tell the customer: "Here's your eval plan in two formats — the `.docx` is for sharing and narrative alignment; the `.xlsx` is for offline editing, sorting, or import into your tracking tools. Both reflect the same data. Share them with your team — business and dev should agree on the quadrant assignments before we generate test cases. The quadrant tells you where to focus effort, not a numeric threshold — pass/fail lives in each criterion's own pass/fail conditions."

---

## Stage 2: Generate

Generate test cases as **separate CSV files per quality signal**. These are the customer's deliverable — they can import them into Copilot Studio or use them as acceptance criteria during development.


### Choose evaluation mode: Single Response vs. Conversation

Before generating test cases, determine which evaluation mode fits each criterion. Copilot Studio supports two modes:

| Mode | Best for | Limits | Supported test methods |
|---|---|---|---|
| **Single response** | Factual Q&A, tool routing, specific answers, safety tests | Up to 100 test cases per set | All 7 methods (General quality, Compare meaning, Keyword match, Capability use, Text similarity, Exact match, Custom) |
| **Conversation (multi-turn)** | Multi-step workflows, context retention, clarification flows, process navigation | Up to 20 test cases, max 12 messages (6 Q&A pairs) per case | General quality, Keyword match, Capability use, Custom (Classification) |

**When to recommend conversation eval:**
- The agent walks users through multi-step processes (e.g., troubleshooting, onboarding, form completion)
- Context retention matters — later answers depend on earlier ones
- The agent needs to ask clarifying questions before answering
- The criterion involves slot-filling or information gathering across turns

**When to stay with single response:**
- Each question is independent (FAQ, policy lookup, data retrieval)
- You need Compare meaning, Text similarity, or Exact match (conversation mode doesn't support these)
- You need more than 20 test cases in a set

**Explain the choice:** "I'm recommending single response eval for your knowledge-lookup criteria because each question is independent — the agent doesn't need previous context to answer. For your troubleshooting criterion, I'm recommending conversation eval because the agent needs to gather information across multiple turns before resolving the issue."

**Note for CSV generation:** Single response test sets use the standard 3-column CSV (Question, Expected response, Testing method). Conversation test sets can be imported via spreadsheet or generated in the Copilot Studio UI — each test case contains a sequence of user messages that simulate a multi-turn interaction.

### What to do

1. Generate one or more test cases per acceptance criterion from the plan. For conversation criteria, generate multi-turn test cases with realistic dialogue sequences (up to 6 Q&A pairs). A single criterion can and often should have multiple test cases exercising different phrasings, user contexts, and edge inputs.

2. **Write expected responses so they satisfy the criterion's pass condition** — i.e., what the agent SHOULD say according to the Agent Vision, the criterion's statement, and its pass_condition. Note: "These expected responses reflect your stated requirements. Refine them once the agent is built and you see how it actually responds."

3. **Group by quality signal** into separate CSV files:
   - `eval-knowledge-accuracy.csv`
   - `eval-safety-compliance.csv`
   - `eval-hallucination-prevention.csv`
   - `eval-routing.csv`
   - `eval-robustness.csv`
   - `eval-personalization.csv` (if applicable)

   Only create files for categories that apply.

   **Versioning:** Name each file with a date stamp or agent version (e.g., `eval-knowledge-accuracy-2026-04-22.csv`) so successive sessions produce a version history rather than overwriting the baseline. Versioning is a requirement of L300 Pillar 2.

4. **CSV format** — Copilot Studio import format:

```csv
"Question","Expected response","Testing method"
"How many PTO days do LA employees get?","LA employees receive 18 PTO days per year.","Compare meaning"
```

Valid Testing method values: `General quality`, `Compare meaning`, `Similarity`, `Exact match`, `Keyword match`.

5. **Inherit the method from each criterion** — the method was set in Stage 1 and should carry through to every test case for that criterion. If a criterion's method doesn't fit a specific test case (e.g., one particular case needs exact-keyword verification while the rest use semantic match), override per-case rather than rewriting the criterion. Refresher table:

| Criterion style | Method | Why |
|---|---|---|
| Factual with known answer | Compare meaning | Semantic equivalence |
| Open-ended quality | General quality | LLM judge |
| Must-include terms (URL, email) | Keyword match | Exact presence |
| Agent should refuse | Compare meaning | Refusal matches expected |
| Domain-specific criteria (compliance, tone, policy) | Custom | Define your own rubric and pass/fail labels |

6. **Highlight the value:** "You now have [X] test cases across [Y] quality signals covering [Z] acceptance criteria. Compare that to the 5–10 happy-path prompts most customers start with. These include adversarial attacks, hallucination traps, robustness tests, and edge cases your users will encounter in production."

### Output

Display a summary table of test cases per quality signal.

**Maturity callout — Pillar 2 (L100 → L300):** Completing this stage advances Pillar 2 from "no established eval set" to a versioned eval set with coverage mapped to risk and value via the Value × Cost matrix. Pillar 5 advances in Stage 4.

### Interactive Dashboard Checkpoint

Before generating final CSV and report files, launch the test cases dashboard for review:

1. Write the test cases to `stage-2-data.json` using the criterion + quadrant structure:
   ```json
   {
     "agent_name": "...",
     "test_sets": [
       {
         "quality_dimension": "Policy Accuracy",
         "criteria": [
           {
             "criterion_id": 1,
             "statement": "The agent should return the correct PTO days for the employee's office and tenure, citing the Time Off Policy.",
             "quadrant": "critical",
             "method": "Compare meaning",
             "pass_condition": "Response contains the correct PTO number for the user's office/tenure AND cites the Time Off Policy.",
             "fail_condition": "Incorrect number, missing citation, or cites the wrong policy.",
             "cases": [
               {"id": 1, "question": "...", "expected_response": "Text with [VERIFY: factual content to check] markers"}
             ]
           }
         ]
       }
     ]
   }
   ```
   Key requirements:
   - Group test cases by `quality_dimension`, with `criteria` nested under each dimension
   - Each criterion carries its `statement` (from Stage 1, starts with "The agent should…"), `quadrant`, `method`, `pass_condition`, `fail_condition`, and `cases`
   - Method is set per-criterion (carried from Stage 1); if a specific case needs a different method, override on the case
   - Wrap AI-generated factual content in `[VERIFY: ...]` markers so the dashboard highlights them for human review
2. Launch the dashboard:
   ```bash
   python dashboard/serve.py --stage generate --data stage-2-data.json
   ```
3. The user reviews test cases per quality dimension tab (quadrant-colored), reviews pass/fail conditions per criterion group, checks VERIFY-highlighted factual content, and edits expected responses inline.
4. When the user confirms, read `generate-feedback.json` and apply all edits. If changes requested, regenerate and re-launch.
5. **After confirmation**, generate the final deliverables:

**A. CSV files** — For each quality signal, write **TWO CSV variants** (so the customer has both a lean import artifact AND a working copy with method guidance):

   1. **`eval-<signal>-<date>-for-import.csv`** — **Import-ready for Copilot Studio.** Two columns only:
      ```csv
      "Question","Expected response"
      ```
      This is what the customer pastes directly into Copilot Studio's Evaluation tab. Minimal, no method column.

   2. **`eval-<signal>-<date>-with-methods.csv`** — **Working copy with method suggestions.** Three columns:
      ```csv
      "Question","Expected response","Testing method"
      ```
      Keep this alongside the import version for team review, version control, or tools that consume the per-case method hint.

   **Handling reference-free methods:** For criteria with method `General quality`, `Custom`, or `Capability use`, leave the `Expected response` cell empty in both CSVs. The pass/fail judgment comes from the criterion's pass/fail conditions in those cases, not a reference string. Note in the docx report which criteria use reference-free methods so the customer knows why some cells are blank.

   Tell the customer: "You get two CSVs per quality dimension — the `-for-import` version is what you paste into Copilot Studio; the `-with-methods` version keeps the suggested testing method per row for your team's reference. Both have the same questions and expected responses."

**B. .docx report** — Generate a customer-ready report using the `/docx` skill. The report must be:
- **Concise** — no filler, no walls of text. Tables over paragraphs.
- **Presentable** — professional formatting with color-coded headers, clean tables, visual hierarchy
- **Self-contained** — a customer who wasn't in the conversation can read it and understand the eval plan + test cases

Report structure:
1. Agent Vision summary (from Stage 0) — 5-6 lines max
2. Value × Cost matrix summary — criteria grouped by quadrant with pass/fail conditions
3. Test cases organized by quality dimension, with criterion groups showing quadrant badge and pass/fail conditions
4. For each test case: Question, Expected Response (with [VERIFY] content called out), and suggested test method
5. Summary table: quality dimension, criterion count, test case count, methods
6. "What these tests catch" callout — 3-4 bullet points on what the customer would have missed
7. Next steps — what to do with these files
8. Maturity snapshot — before/after table showing where the agent stands after this session:

   | Pillar | Baseline | After this session | Next-session target |
   |---|---|---|---|
   | 1 — Define what "good" means | L100 | L300 ✓ | — |
   | 2 — Build eval sets | L100 | L300 ✓ | — |
   | 3 — Run systematically | L100 | L100 | L300 |
   | 4 — Handle changes with confidence | L100 | L100 | L300 |
   | 5 — Improve and iterate | L100 | L100 | L300 |

Tell the customer: "These CSVs are importable directly into Copilot Studio's Evaluation tab. The report includes your Value × Cost priorities and acceptance criteria — share it with your team."

---

## Stage 3: Run (requires a running agent)

**Skip this stage if the agent isn't built yet.** The deliverables from Stages 0-2 are the eval jumpstart — the customer can run evals themselves when the agent is ready.

If the agent IS available, send each question from the CSVs to the live agent and score responses using Claude Sonnet as LLM judge.

### How to run

Use `eval-runner.js` if a DirectLine connection is available:
```bash
node eval-runner.js --token-endpoint "<URL>" --csv-dir .
```

Or use `/chat-with-agent` for individual questions via CPS SDK.

Scoring:
- `Compare meaning` → semantic equivalence (0.0-1.0)
- `General quality` → helpfulness/accuracy/relevance (0.0-1.0)
- `Keyword match` → code-based string matching
- `Exact match` → code-based string equality

Required: `ANTHROPIC_API_KEY` for LLM-based scorers.

### Output

Results table + `eval-results-YYYY-MM-DD.csv` and `.json`.

---

## Stage 4: Interpret

Analyze eval results to understand what's working, what's failing, and what to fix next.

**Which skill to use:** For a one-shot triage report from a CSV file or results summary, invoke `/eval-result-interpreter`. For interactive, multi-round diagnosis with detailed remediation guidance, invoke `/eval-triage-and-improvement`. Start with the interpreter; switch to triage if you need help implementing fixes.

### What to do

1. **Pre-triage check** — Were knowledge sources accessible? APIs healthy? Auth valid?

2. **Score summary** — Total, passed, failed, pass rate per category and test method.

3. **Failure triage** — **Explain the key insight:** "Before we blame the agent — at least 20% of failures in a new eval are actually eval setup issues, not agent issues. The test case might be wrong, the expected response might be outdated, or the testing method might be inappropriate. Let me check that first."

   Apply 5-question eval verification for each failure.

4. **Root causes:** Eval Setup Issue / Agent Configuration Issue / Platform Limitation.

5. **Top 3 actions** — Each: **Change** X → **Re-run** Y → **Expect** Z. When re-running, run the full test set, not just the failing cases, to catch regressions elsewhere. Save pre-fix pass rates and compare before/after — that before/after evidence is what distinguishes L300 Pillar 5 from L200.

6. **Pattern analysis** and **next-run recommendation.**

If 100% pass: "A 100% pass rate is a red flag — your eval is likely too easy."

**Maturity callout — Pillar 5 (L100 → L300):** Completing this stage advances Pillar 5 from reactive fixing to structured root-cause analysis, before/after validation, and regression-proofing. All three session pillars (1, 2, 5) now at L300. Pillars 3 (Run systematically) and 4 (Handle changes with confidence) are the next chapter.

### Interactive Dashboard Checkpoint

Before generating the final triage report, launch the interpret dashboard for review:

1. Write the triage data to `stage-4-data.json` using the criterion + quadrant structure:
   ```json
   {
     "agent_name": "...",
     "summary": {"total": 28, "passed": 19, "failed": 9},
     "criterion_metrics": [
       {"criterion_id": 1, "statement": "The agent should return the correct PTO days for the employee's office and tenure, citing the Time Off Policy.", "quadrant": "critical", "quality_dimension": "Policy Accuracy", "actual_pass_rate": 100, "cases_total": 2, "cases_passed": 2}
     ],
     "eval_results": [
       {"criterion_id": 1, "question": "...", "expected": "...", "actual": "...", "method": "Compare meaning", "score": 0.92, "pass": true, "explanation": "Rationale from LLM judge..."}
     ],
     "failures": [
       {"id": 1, "criterion_id": 2, "criterion_statement": "The agent should refuse salary queries and direct to HR.", "quadrant": "guardrails", "quality_dimension": "Boundary Enforcement", "question": "...", "expected": "...", "actual": "...", "root_cause": "agent_config", "explanation": "..."}
     ],
     "top_actions": [...],
     "patterns": [...]
   }
   ```
   Key requirements:
   - `criterion_metrics` reports the actual pass rate per criterion along with its quadrant (no prescribed target — judgment is qualitative, guided by quadrant)
   - `eval_results` contains ALL test case results (not just failures) so criteria can be expanded in the dashboard
   - Each eval result includes `explanation` (the LLM judge rationale) for human review
   - No `verdict` field — the dashboard shows pass rates per quadrant instead of SHIP/ITERATE/BLOCK
2. Launch the dashboard:
   ```bash
   python dashboard/serve.py --stage interpret --data stage-4-data.json
   ```
3. The user reviews pass rates per quadrant, expands criterion rows to see test case details, uses Human Judgement (Agree/Disagree) to override LLM judge assessments, and re-classifies root causes.
4. When the user confirms, read `interpret-feedback.json` and apply edits (including human disagrees which become eval_setup root causes). If changes requested, regenerate and re-launch.
5. **After confirmation**, generate the customer-ready .docx triage report using the `/docx` skill. Same principles: concise, presentable, self-contained. Structure:
   1. Quadrant performance — quadrant summary cards (pass rate per quadrant) + full criterion table (quadrant, criterion, quality dimension, actual pass rate, status)
   2. Failure triage table (quadrant, criterion, question, expected, actual, root cause) — include human-disagreed entries as "Eval Setup — Human Disagrees"
   3. Top actions (Change → Re-run → Expect)
   4. Pattern analysis — quadrant-aware patterns highlighting systemic issues (e.g., Guardrails failures are more urgent than Deprioritize failures)
   5. Next steps
   6. Maturity snapshot — same before/after table as the Stage 2 report, updated to reflect Pillar 5 now at L300:

      | Pillar | Baseline | After this session | Next-session target |
      |---|---|---|---|
      | 1 — Define what "good" means | L100 | L300 ✓ | — |
      | 2 — Build eval sets | L100 | L300 ✓ | — |
      | 3 — Run systematically | L100 | L100 | L300 |
      | 4 — Handle changes with confidence | L100 | L100 | L300 |
      | 5 — Improve and iterate | L100 | L300 ✓ | — |

---

## Language Support

Supports **English** and **Chinese (simplified)**. Auto-detects from user's language.

- CSV headers stay English (Copilot Studio requirement)
- Technical terms in English with Chinese parenthetical on first use: Compare meaning (语义比较), General quality (综合质量), Keyword match (关键词匹配), Exact match (精确匹配)

---

## Platform Capabilities to Leverage (March 2026)

When coaching customers, mention these Copilot Studio evaluation features at the appropriate stage:

| Feature | When to mention | What it does |
|---|---|---|
| **Custom test method** | Stage 1 (Plan) | Lets customers define domain-specific evaluation criteria with custom labels (e.g., "Compliant" / "Non-Compliant"). Ideal for compliance, tone, or policy checks that don't fit standard methods. |
| **Comparative testing** | Stage 4 (Interpret) | Side-by-side comparison of agent versions. Use after making fixes to verify improvements without regressions. |
| **Theme-based test sets** | Stage 2 (Generate) | Creates test cases from production analytics themes — real user questions grouped by topic. Best for agents already in production. |
| **Production data import** | Stage 2 (Generate) | Import real user conversations as test cases. Higher fidelity than synthetic test cases. |
| **Rubrics (Copilot Studio Kit)** | Stage 1 (Plan) | Custom grading rubrics with 1-5 scoring and refinement workflow to align AI grading with human judgment. For advanced customers with mature eval practices. |
| **User feedback (thumbs up/down)** | Stage 4 (Interpret) | Makers can flag eval results they agree/disagree with. Captures grader alignment signals over time. |
| **Set-level grading** | Stage 4 (Interpret) | Evaluates quality across the entire test set (not just individual cases). Gives an overall quality picture and supports multiple grading approaches for more holistic results. Use this to report aggregate quality to stakeholders. |
| **User profiles** | Stage 2 (Generate) / Stage 3 (Run) | Assign a user profile to a test set so the eval runs as a specific authenticated user. Use this when the agent returns different results based on who is asking — e.g., a director can access different knowledge sources than an intern. Ask in Stage 0: "Does your agent behave differently depending on who the user is?" If yes, plan separate test sets per role. **Limitations:** (1) Multi-profile eval only works for agents WITHOUT connector dependencies. (2) Tool connections always use the logged-in maker account, not the profile — mismatch causes "This account cannot connect to tools" error. (3) Not available in GCC. Docs: [Manage user profiles](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-edit#manage-user-profiles-and-connections). |
| **CSV template download** | Stage 2 (Generate) | Copilot Studio provides a downloadable CSV template under Data source > New evaluation. Recommend customers download it first to verify format before importing generated CSVs. |
| **89-day result retention** | Stage 3 (Run) / Stage 4 (Interpret) | Test results are only available in Copilot Studio for 89 days. **Always export results to CSV** after each run for long-term tracking. Critical for customers establishing baselines and tracking improvement over time. |

**Don't overwhelm.** Only mention features relevant to the customer's maturity level. A customer in Stage 0 doesn't need to hear about rubric refinement workflows.

**GCC (Government Community Cloud) limitations:** If the customer is in a GCC environment, flag these restrictions early:
- **No user profiles** — they can't assign a test account to simulate authenticated users during evaluation
- **No Text Similarity method** — all other test methods work normally
These are documented at [About agent evaluation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-intro). Don't let them design an eval plan around features they can't use.

**Important caveat to share:** Agent evaluation measures correctness and performance — it does NOT test for AI ethics or safety problems. An agent can pass all eval tests and still produce inappropriate answers. Customers must still use responsible AI reviews and content safety filters. Evaluation complements those — it doesn't replace them.

---

## Behavior Rules

- **Discover first** — understand the agent's purpose and the customer's expectations before anything else.
- **No running agent required for Stages 0-2.** The skill works from a description, an idea, or a conversation.
- **Explain your reasoning.** Don't just output artifacts — narrate WHY you're making each choice. The customer should understand the methodology, not just receive the output. This is what makes them self-sufficient.
- **Highlight what they'd miss.** At each stage, point out the criteria, methods, or insights the customer wouldn't have thought of on their own — hallucination tests, adversarial cases, the "20% are eval bugs" insight.
- **Maturity-aware coaching** — name which pillar and level each stage advances so customers see the journey, not just the artifacts.
- Be specific — use real names, real scenarios. No generic advice.
- Always include at least 1 adversarial/safety criterion (typically a Guardrails-quadrant entry).
- Keep everything in the CLI unless asked otherwise.
- Pause between stages for confirmation.
- Match the user's language.
