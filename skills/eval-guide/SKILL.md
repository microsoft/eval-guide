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

   **Use this to filter scenarios in the next step** — skip capability scenarios that don't apply to the agent's architecture. A prompt-level agent doesn't need Knowledge Grounding tests; a non-agentic agent doesn't need Tool Invocation tests.

2. **Match to scenario types:**

| If the agent... | Business-problem scenarios | Capability scenarios |
|---|---|---|
| Answers questions from knowledge sources | Information Retrieval | Knowledge Grounding + Compliance |
| Executes tasks via APIs/connectors | Request Submission | Tool Invocations + Safety |
| Walks users through troubleshooting | Troubleshooting | Knowledge Grounding + Graceful Failure |
| Guides through multi-step processes | Process Navigation | Trigger Routing + Tone & Quality |
| Routes conversations to teams/departments | Triage & Routing | Trigger Routing + Graceful Failure |
| Handles sensitive data | (add to whichever applies) | Safety + Compliance |
| All agents (always include) | — | Red-Teaming |

**Explain your picks:** "Based on your Agent Vision, I'm selecting Information Retrieval and Knowledge Grounding because your agent answers from policy documents. I'm also including Red-Teaming because every agent needs adversarial testing — your users will try to break it eventually."

3. **Produce the eval plan:**

**Scenario plan table:**

| # | Scenario Name | Category | Tag | Evaluation Methods |
|---|---|---|---|---|

Category distribution: Core business 30-40%, Capability 20-30%, Safety 10-20%, Edge cases 10-20%. Total: 10-15 scenarios.

**Method mapping:**

| What you're testing | Primary method | Secondary |
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

**Beyond Custom — rubric-based grading:** For customers who need more granular scoring than Custom's pass/fail labels, the [Copilot Studio Kit](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-rubrics-tests) supports rubric-based grading on a 1–5 scale. Rubrics replace the standard validation logic with a custom AI grader aligned to domain-specific criteria. Two modes: **Refinement** (grade + rationale — use first to calibrate the rubric against human judgment) and **Testing** (grade only — use for routine QA after the rubric is trusted). Mention this to customers who are choosing Custom methods for compliance, tone, or brand voice — rubrics are the advanced option for ongoing calibrated quality assurance.

**What General Quality actually measures:** When explaining General Quality to customers, tell them what the LLM judge evaluates. Per MS Learn docs (March 2026), General Quality scores on four criteria — ALL must be met for a high score:

| Criterion | What it checks | Example question it answers |
|---|---|---|
| **Relevance** | Does the response address the question directly? | "Did the agent stay on topic or go off on a tangent?" |
| **Groundedness** | Is the response based on provided context, not invented? | "Did the agent cite its knowledge sources or make things up?" |
| **Completeness** | Does the response cover all aspects with sufficient detail? | "Did the agent answer the full question or just part of it?" |
| **Abstention** | Did the agent attempt to answer at all? | "Did the agent refuse to answer a question it should have answered?" |

Tell the customer: "If General Quality scores are low, these four criteria tell you WHERE to look. A response can be relevant but not grounded (it answered the right question but invented the answer), or grounded but incomplete (it used the right source but missed half the information)."

**Explain the methods:** "I'm using Compare meaning for factual questions because the agent doesn't need to use the exact same words — it just needs to convey the same information. For safety tests I'm using Compare meaning too, because we need to check that the refusal matches what we expect."

**Quality signals** — map to the agent's capabilities.

**Pass/fail thresholds** — calibrated to risk profile:

| Category | Low risk | Medium risk | High risk |
|---|---|---|---|
| Core business | >=80% | >=90% | >=95% |
| Safety & compliance | >=90% | >=95% | >=99% |
| Edge cases | >=60% | >=70% | >=80% |

**Priority order:** Core business → Safety → Capability → Edge cases.

**Highlight what they'd miss:** "Notice I included hallucination prevention tests — questions about topics NOT in your knowledge sources. Most customers only test what the agent should know. Testing what it should NOT know is just as important — this catches the agent making up answers."

### Output

Display the scenario plan table and thresholds.

### Interactive Dashboard Checkpoint

Before generating any deliverable documents, launch the plan dashboard for review:

1. Write the plan to `stage-1-data.json` using the Zone Model structure:
   ```json
   {
     "agent_name": "...",
     "scenarios": [
       {
         "id": 1,
         "name": "PTO policy lookup",
         "zone": "1",
         "quality_dimension": "Policy Accuracy",
         "acceptance_criteria": "Pass = agent returns correct PTO accrual rate matching HR policy.\nFail = incorrect rate or information from wrong tenure band.",
         "target_pass_rate": 90
       }
     ],
     "quality_dimensions": ["Policy Accuracy", "Source Attribution", "Hallucination Prevention", ...]
   }
   ```
   Each scenario must have: `zone` ("1", "2", or "3"), `quality_dimension`, `acceptance_criteria` (with Pass = and Fail = conditions), and `target_pass_rate` (increment of 5%).
   
   **Zone assignment guidelines:**
   - Zone 1 ("This Must Work"): Safety failures, core business functions, guardrail tests. Highest value, full investment.
   - Zone 2 ("Real but Lower Priority"): Nice-to-have features, low-traffic use cases, areas where higher score doesn't justify effort.
   - Zone 3 ("Exploratory"): Emergent patterns, new tools with minimal effort, capabilities you're exploring.
2. Launch the dashboard:
   ```bash
   python dashboard/serve.py --stage plan --data stage-1-data.json
   ```
3. The user reviews scenarios (add/remove/edit), adjusts thresholds, and changes methods in the browser.
4. When the user confirms, read `plan-feedback.json` and apply edits. If changes requested, regenerate and re-launch.
5. **After confirmation, automatically generate the customer-ready .docx eval plan report** using the `/docx` skill — do not wait for the user to ask for it. This is the customer's first deliverable.

The report must be:
- **Concise** — no filler, no walls of text. Tables over paragraphs.
- **Presentable** — professional formatting with color-coded headers, clean tables, visual hierarchy
- **Self-contained** — a customer who wasn't in the conversation can read it and understand the eval plan

Report structure:
1. Agent Vision summary (from Stage 0) — 5-6 lines max
2. Zone Model overview — explain the three zones and how scenarios were classified based on Priority + Value + Effort
3. Zone assignment table — scenarios grouped by zone (Zone 1: "This Must Work", Zone 2: "Real but Lower Priority", Zone 3: "Exploratory") with acceptance criteria (Pass = / Fail = conditions)
4. Quality Dimensions to Test — list dimensions with grouped scenarios under each
5. Success Metrics table — Zone, Scenario, Quality Dimension, Target Pass Rate for each scenario
6. Method mapping explanation — which test methods apply to which quality dimensions

Tell the customer: "Here's your eval plan report with the Zone Model prioritization. Share this with your team for alignment — business and dev should agree on the zone assignments and target pass rates before we generate test cases."

---

## Stage 2: Generate

Generate test cases as **separate CSV files per quality signal**. These are the customer's deliverable — they can import them into Copilot Studio or use them as acceptance criteria during development.


### Choose evaluation mode: Single Response vs. Conversation

Before generating test cases, determine which evaluation mode fits each scenario. Copilot Studio supports two modes:

| Mode | Best for | Limits | Supported test methods |
|---|---|---|---|
| **Single response** | Factual Q&A, tool routing, specific answers, safety tests | Up to 100 test cases per set | All 7 methods (General quality, Compare meaning, Keyword match, Capability use, Text similarity, Exact match, Custom) |
| **Conversation (multi-turn)** | Multi-step workflows, context retention, clarification flows, process navigation | Up to 20 test cases, max 12 messages (6 Q&A pairs) per case | General quality, Keyword match, Capability use, Custom (Classification) |

**When to recommend conversation eval:**
- The agent walks users through multi-step processes (e.g., troubleshooting, onboarding, form completion)
- Context retention matters — later answers depend on earlier ones
- The agent needs to ask clarifying questions before answering
- The scenario involves slot-filling or information gathering across turns

**When to stay with single response:**
- Each question is independent (FAQ, policy lookup, data retrieval)
- You need Compare meaning, Text similarity, or Exact match (conversation mode doesn't support these)
- You need more than 20 test cases in a set

**Explain the choice:** "I'm recommending single response eval for your knowledge-based scenarios because each question is independent — the agent doesn't need previous context to answer. For your troubleshooting flow, I'm recommending conversation eval because the agent needs to gather information across multiple turns before resolving the issue."

**Note for CSV generation:** Single response test sets use the standard 3-column CSV (Question, Expected response, Testing method). Conversation test sets can be imported via spreadsheet or generated in the Copilot Studio UI — each test case contains a sequence of user messages that simulate a multi-turn interaction.

### What to do

1. Generate one test case per scenario row from the plan. For conversation scenarios, generate multi-turn test cases with realistic dialogue sequences (up to 6 Q&A pairs).

2. **Write expected responses based on the Agent Vision** — what the agent SHOULD say based on the knowledge sources and boundaries defined in Stage 0. Note: "These expected responses reflect your stated requirements. Refine them once the agent is built and you see how it actually responds."

3. **Group by quality signal** into separate CSV files:
   - `eval-knowledge-accuracy.csv`
   - `eval-safety-compliance.csv`
   - `eval-hallucination-prevention.csv`
   - `eval-routing.csv`
   - `eval-robustness.csv`
   - `eval-personalization.csv` (if applicable)

   Only create files for categories that apply.

4. **CSV format** — Copilot Studio import format:

```csv
"Question","Expected response","Testing method"
"How many PTO days do LA employees get?","LA employees receive 18 PTO days per year.","Compare meaning"
```

Valid Testing method values: `General quality`, `Compare meaning`, `Similarity`, `Exact match`, `Keyword match`.

5. **Test method per scenario type:**

| Scenario type | Method | Why |
|---|---|---|
| Factual with known answer | Compare meaning | Semantic equivalence |
| Open-ended quality | General quality | LLM judge |
| Must-include terms (URL, email) | Keyword match | Exact presence |
| Agent should refuse | Compare meaning | Refusal matches expected |
| Domain-specific criteria (compliance, tone, policy) | Custom | Define your own rubric and pass/fail labels |

6. **Highlight the value:** "You now have [X] test cases across [Y] quality signals. Compare that to the 5-10 happy-path prompts most customers start with. These include adversarial attacks, hallucination traps, robustness tests, and edge cases your users will encounter in production."

### Output

Display a summary table of test cases per quality signal.

### Interactive Dashboard Checkpoint

Before generating final CSV and report files, launch the test cases dashboard for review:

1. Write the test cases to `stage-2-data.json` using the Zone Model structure:
   ```json
   {
     "agent_name": "...",
     "test_sets": [
       {
         "quality_dimension": "Policy Accuracy",
         "methods": ["Compare meaning", "Keyword match"],
         "scenarios": [
           {
             "scenario_id": 1,
             "name": "PTO policy lookup",
             "zone": "1",
             "acceptance_criteria": "Pass = correct PTO accrual rate.\nFail = incorrect rate.",
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
   - Group test cases by `quality_dimension` (not quality_signal), with `scenarios` nested under each dimension
   - Each scenario carries its `zone`, `acceptance_criteria` (from Stage 1), and `cases`
   - Test `methods` are set at the dimension level, not per-case
   - Wrap AI-generated factual content in `[VERIFY: ...]` markers so the dashboard highlights them for human review
2. Launch the dashboard:
   ```bash
   python dashboard/serve.py --stage generate --data stage-2-data.json
   ```
3. The user reviews test cases per quality dimension tab (zone-colored), reviews acceptance criteria per scenario group, checks VERIFY-highlighted factual content, and edits expected responses inline.
4. When the user confirms, read `generate-feedback.json` and apply all edits. If changes requested, regenerate and re-launch.
5. **After confirmation**, generate the final deliverables:

**A. CSV files** — Write each quality signal's test cases to a separate CSV:
```csv
"Question","Expected response","Testing method"
```

**B. .docx report** — Generate a customer-ready report using the `/docx` skill. The report must be:
- **Concise** — no filler, no walls of text. Tables over paragraphs.
- **Presentable** — professional formatting with color-coded headers, clean tables, visual hierarchy
- **Self-contained** — a customer who wasn't in the conversation can read it and understand the eval plan + test cases

Report structure:
1. Agent Vision summary (from Stage 0) — 5-6 lines max
2. Zone Model summary — scenarios by zone with acceptance criteria (Pass/Fail)
3. Test cases organized by quality dimension, with scenario groups showing zone badge and acceptance criteria
4. For each test case: Question, Expected Response (with [VERIFY] content called out), and suggested test method
5. Summary table: quality dimension, scenario count, test case count, methods
6. "What these tests catch" callout — 3-4 bullet points on what the customer would have missed
7. Next steps — what to do with these files

Tell the customer: "These CSVs are importable directly into Copilot Studio's Evaluation tab. The report includes your Zone Model priorities and acceptance criteria — share it with your team."

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

5. **Top 3 actions** — Each: **Change** X → **Re-run** Y → **Expect** Z.

6. **Pattern analysis** and **next-run recommendation.**

If 100% pass: "A 100% pass rate is a red flag — your eval is likely too easy."

### Interactive Dashboard Checkpoint

Before generating the final triage report, launch the interpret dashboard for review:

1. Write the triage data to `stage-4-data.json` using the success metrics structure:
   ```json
   {
     "agent_name": "...",
     "summary": {"total": 28, "passed": 19, "failed": 9},
     "success_metrics": [
       {"scenario_id": 1, "name": "PTO policy lookup", "zone": "1", "quality_dimension": "Policy Accuracy", "target_pass_rate": 90, "actual_pass_rate": 100, "cases_total": 2, "cases_passed": 2}
     ],
     "eval_results": [
       {"scenario_id": 1, "question": "...", "expected": "...", "actual": "...", "method": "Compare meaning", "score": 0.92, "pass": true, "explanation": "Rationale from LLM judge..."}
     ],
     "failures": [
       {"id": 1, "scenario_id": 2, "scenario_name": "...", "zone": "1", "quality_dimension": "...", "question": "...", "expected": "...", "actual": "...", "root_cause": "agent_config", "explanation": "..."}
     ],
     "top_actions": [...],
     "patterns": [...]
   }
   ```
   Key requirements:
   - `success_metrics` maps each scenario to its target vs actual pass rate (from Stage 1 targets)
   - `eval_results` contains ALL test case results (not just failures) so scenarios can be expanded in the dashboard
   - Each eval result includes `explanation` (the LLM judge rationale) for human review
   - No `verdict` field — the dashboard shows success metrics status per zone instead of SHIP/ITERATE/BLOCK
2. Launch the dashboard:
   ```bash
   python dashboard/serve.py --stage interpret --data stage-4-data.json
   ```
3. The user reviews success metrics status per zone, expands scenario rows to see test case details, uses Human Judgement (Agree/Disagree) to override LLM judge assessments, and re-classifies root causes.
4. When the user confirms, read `interpret-feedback.json` and apply edits (including human disagrees which become eval_setup root causes). If changes requested, regenerate and re-launch.
5. **After confirmation**, generate the customer-ready .docx triage report using the `/docx` skill. Same principles: concise, presentable, self-contained. Structure:
   1. Success Metrics Status — zone summary cards (targets met per zone) + full scenario table (zone, scenario, quality dimension, target vs actual, status)
   2. Failure triage table (zone, scenario, question, expected, actual, root cause) — include human-disagreed entries as "Eval Setup — Human Disagrees"
   3. Top actions (Change → Re-run → Expect)
   4. Pattern analysis — zone-aware patterns highlighting systemic issues
   5. Next steps

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
- **Highlight what they'd miss.** At each stage, point out the scenarios, methods, or insights the customer wouldn't have thought of on their own — hallucination tests, adversarial cases, the "20% are eval bugs" insight.
- Be specific — use real names, real scenarios. No generic advice.
- Always include at least 1 adversarial/safety scenario.
- Keep everything in the CLI unless asked otherwise.
- Pause between stages for confirmation.
- Match the user's language.
