---
name: eval-suite-planner
description: Produces a concrete eval suite plan grounded in Microsoft's Eval Scenario Library and MS Learn agent evaluation guidance — scenario types, evaluation methods, quality signals, thresholds, and priority order — before any test cases are generated or evals are run.
---

## Purpose

This skill takes a plain-English description of an agent and produces a structured eval suite plan. It is the first step in the eval lifecycle — use it before generating test cases or running any evals. The output tells you exactly what scenarios to build, which evaluation methods to use, and how to know when you're done.

This skill covers **Stage 1 (Define)** of the MS Learn 4-stage evaluation framework. After planning, use `/eval-generator` for Stage 2 (Set Baseline & Iterate), then expand coverage (Stage 3) and operationalize into CI/CD (Stage 4).

**Knowledge sources:** This skill's guidance is grounded in three Microsoft sources:
- **Eval Scenario Library** (github.com/microsoft/ai-agent-eval-scenario-library) — 5 business-problem scenario types with 29 sub-scenarios, 9 capability scenario types with 49 sub-scenarios, quality signals, and evaluation method selection
- **MS Learn agent evaluation documentation** — the 4-stage iterative evaluation framework (Define, Set Baseline & Iterate, Systematic Expansion, Operationalize), 7 test methods, acceptance criteria design, and evaluation categories
- **MS Learn evaluation checklist** ([guidance/evaluation-checklist](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-checklist)) — a 4-stage checklist template with a [downloadable editable version](https://github.com/microsoft/PowerPnPGuidanceHub/tree/main/guidance/agentevalguidancekit). The checklist defines Stage 3 expansion categories (Foundational core, Agent robustness, Architecture test, Edge cases) and introduces acceptance criteria design

## Instructions

When invoked as `/eval-suite-planner <agent description>`, read the description, infer the agent's primary task, key capabilities, and failure modes, then produce the following output in this exact order. Do not ask clarifying questions, do not pad responses, do not hedge.

---

### Step 0 — Match the agent to scenario types

Use this routing table (from the Eval Scenario Library's Entry Path A) to identify which business-problem and capability scenario types apply to the described agent:

| If the agent... | Business-problem scenarios | Capability scenarios |
|---|---|---|
| Answers questions from knowledge sources | Information Retrieval (6 sub-scenarios) | Knowledge Grounding + Compliance |
| Executes tasks via APIs/connectors | Request Submission (6 sub-scenarios) | Tool Invocations + Safety |
| Walks users through troubleshooting | Troubleshooting (6 sub-scenarios) | Knowledge Grounding + Graceful Failure |
| Guides through multi-step processes | Process Navigation (6 sub-scenarios) | Trigger Routing + Tone & Quality |
| Routes conversations to teams/departments | Triage & Routing (5 sub-scenarios) | Trigger Routing + Graceful Failure |
| Handles sensitive data (PII, financial, health) | (add to whichever applies) | Safety + Compliance |
| Serves external customers | (add to whichever applies) | Tone & Quality + Safety |
| Is about to be updated or republished | (add to whichever applies) | Regression — re-run existing tests after changes |
| All agents (always include) | — | Red-Teaming — adversarial robustness testing |

Most agents match 1-2 business-problem types and 3-4 capability types. Select the ones that fit and name them explicitly.

**About the Regression row:** A regression set is not a separate scenario type — it is your existing suite of passing tests, re-run after any agent change to verify nothing broke. Include the regression row when the customer mentions upcoming changes (prompt edits, knowledge source updates, connector/plugin changes, republishing). When it applies:
- Flag that the customer's current passing test cases become their regression baseline
- Recommend re-running the full eval suite (or at minimum the core business + safety subsets) after every change
- This maps to **Stage 4 (Operationalize)** of the MS Learn framework — embedding evals into the agent's update workflow so regressions are caught before they reach users
- The regression set grows over time: every bug found and fixed should add a test case that catches that specific failure, preventing it from recurring

### Step 0b — Incorporate production data (for live agents)

If the customer already has an agent in production, recommend supplementing the synthetic eval plan with **real user data**. Copilot Studio offers two production-data features that create higher-fidelity test sets:

**Themes-based test sets (recommended for production agents):**
Copilot Studio's Analytics page groups real user questions into **themes** — clusters of related questions that triggered generative answers (e.g., "billing and payments", "password reset", "shipping status"). Customers can create a test set directly from any theme:

1. Go to the agent's **Analytics** page > **Themes** list
2. Hover over a theme > select **Evaluate**
3. Select **Create and open** to generate a test set from real user questions in that theme

**When to recommend themes-based test sets:**
- The agent is already in production with real user traffic
- The customer wants to track quality per topic area (e.g., "How well does the agent handle billing questions specifically?")
- The synthetic plan may miss question phrasings real users actually use
- The customer is investigating a quality drop in a specific area flagged by analytics

**How themes complement the eval plan:** The scenario plan (Step 0) defines WHAT to test based on the agent's design. Themes-based test sets validate HOW WELL the agent handles what users actually ask. Use both:
- Synthetic test cases (from `/eval-generator`) = structured coverage of planned scenarios, edge cases, and adversarial tests
- Themes-based test sets (from production) = real-world phrasing, actual user patterns, production-frequency weighting

Tell the customer: "Your eval plan covers what the agent SHOULD handle. Themes-based test sets cover what users ACTUALLY ask. The gap between these two is where surprises live."

**Prerequisite:** Themes require the [themes (preview)](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-themes) feature to be available in the customer's environment. Check prerequisites before recommending.

**Production data import:** Customers can also import real user conversations as test cases directly. This is useful for reproducing specific reported issues or building regression tests from support tickets.

### Step 0c — Plan test set creation strategy

Copilot Studio offers **multiple ways** to create single-response test sets beyond CSV import. During planning, make the customer aware of all their options so they can combine approaches for best coverage:

| Creation method | What it does | When to recommend |
|---|---|---|
| **CSV import** (from `/eval-generator`) | Import structured test cases with Question, Expected response, and Testing method columns | Always — this is the primary method for structured, scenario-driven coverage |
| **Quick question set** | Auto-generates a small set of questions from the agent's knowledge sources | Early exploration — quickly see what questions the agent's content can answer before writing detailed cases |
| **Full question set** | Auto-generates a comprehensive set of questions from knowledge sources | Broader coverage check — use after the initial eval to find gaps the structured plan missed |
| **Test chat → test set** | Converts a manual test chat session into a reusable test set | When someone has already tested the agent manually and wants to make those tests repeatable |
| **Themes-based** (see Step 0b) | Creates test sets from real user question clusters in production analytics | Production agents — captures actual user phrasing and topic distribution |
| **Manual entry** | Create individual test cases directly in the Copilot Studio UI | One-off additions, Custom method cases (which cannot be CSV-imported), and edge cases discovered during testing |

**Recommended strategy:** Start with CSV import from `/eval-generator` for structured scenario coverage, then supplement with Quick or Full question sets to catch blind spots the plan didn't anticipate. For production agents, add themes-based test sets for real-world validation. Use manual entry for Custom-method cases that require rubric definitions.

Tell the customer: "CSV import gives you precision — every case tests a specific scenario you designed. Auto-generation gives you breadth — it finds questions you didn't think to ask. Use both."

### Step 0d — Choose test data generation approach

Per the MS Learn [Common evaluation approaches](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/architecture/common-evaluation-approaches), there are three strategies for generating request-response pairs. The choice affects multi-turn fidelity, cost, and what kinds of failures you can detect:

| Approach | How it works | Strengths | Weaknesses | Best for |
|---|---|---|---|---|
| **Echo** | Replay a static list of prompts word-for-word | Low cost; fair A/B comparisons when changing one variable (model upgrade, single tool change) | Can’t adapt to different responses — later turns may not match conversation context | Single-turn scenarios, deterministic checks (citation display, tool trigger, simple Q&A) |
| **Historical replay** | Replay each turn in context of prior prompts and responses | Detects where and how much each turn diverges from the ideal path | Still can’t handle truly dynamic conversations (learning, real-time web search) | Model change comparisons, understanding per-turn divergence from baseline behavior |
| **Synthesized personas** | A human or agentic actor generates conversation in real time based on a scenario and persona | Dynamically assesses complex scenarios (tutoring, negotiation, multi-step troubleshooting) | Grading requires nuance; higher cost (LLM or human tester per conversation) | Multi-turn agents, complex workflows, persona-dependent behavior |

**How to recommend:**
- **Simple FAQ / knowledge agents** → Echo is sufficient. Most test cases are single-turn with deterministic expected answers.
- **Task agents being upgraded** (model change, tool swap) → Historical replay to compare before/after at each turn.
- **Complex multi-step agents** (process navigation, troubleshooting, triage) → Synthesized personas for realistic coverage. Echo won’t catch context-dependent failures.
- **Hybrid** is common: use Echo for the core regression set (fast, cheap, repeatable) and Synthesized personas for the exploratory/edge-case set (realistic, expensive, high-signal).

Tell the customer: “Echo tells you if the same questions still get the same answers. Synthesized personas tell you if the agent can actually handle a real conversation. You need both — Echo for speed, personas for truth.”

### Output structure

**1. One-line summary**

Restate the agent's task in one sentence, starting with "Agent task:". Name the matched business-problem and capability scenario types by their plain names (e.g., "Information Retrieval", "Knowledge Grounding").

**2. Scenario plan table**

This table is the primary handoff artifact to `/eval-generator` — the generator will produce one test case per row. Make it complete enough that the generator needs no additional context.

Produce a table with these columns:

| # | Scenario Name | Category | Tag | Evaluation Methods |
|---|---|---|---|---|

Be specific: name the actual scenario based on the agent description, not just the category.

Use this category distribution (from the Eval Scenario Library's eval-set-template):
- Core business scenarios: 30-40% of test cases
- Capability scenarios: 20-30%
- Edge cases & safety: 10-20%
- Variations (different phrasings of core): 10-20%

For evaluation methods, use the Scenario Library's quality-signal-to-method mapping:

| What you're testing | Primary method | Secondary method |
|---|---|---|
| Factual accuracy (specific facts, numbers) | Keyword Match (All) | Compare Meaning |
| Factual accuracy (flexible phrasing) | Compare Meaning | Keyword Match (Any) |
| Policy compliance (mandatory language) | Custom | Keyword Match (All) |
| Policy compliance (nuanced judgment) | Custom | General Quality |
| Tool invocation correctness | Capability Use | Keyword Match (Any) |
| Knowledge source selection | Capability Use | Compare Meaning |
| Topic routing accuracy | Capability Use | — |
| Response quality, tone, empathy | General Quality | Compare Meaning |
| Tone/brand voice adherence | Custom | General Quality |
| Hallucination prevention | Compare Meaning | General Quality |
| Regulatory/HR/legal compliance | Custom | Keyword Match (All) |
| Edge case handling | Keyword Match (Any) | General Quality |
| Negative tests (must NOT do X) | Keyword Match — negative | Capability Use — negative |

**When to use Custom:** The Custom test method lets you define evaluation instructions (a rubric) with labeled outcomes (e.g., "Compliant" / "Non-compliant") and assign pass/fail to each label. Use it when:
- The pass/fail criteria require **judgment**, not just keyword presence — e.g., "Is this response empathetic?" or "Does this follow our escalation policy?"
- You need **domain-specific rubrics** — e.g., HR compliance, medical disclaimers, financial suitability
- Standard methods (Keyword Match, Compare Meaning) cannot capture the quality signal — the answer is not about specific words or semantic similarity, it is about whether the response meets a policy or standard
- You want to test **tone, style, or brand voice** beyond what General Quality covers

Custom is not available for CSV import — test cases using Custom must be created directly in Copilot Studio's evaluation UI.

**Beyond Custom — rubric-based grading:** For customers who need more granular quality scoring than pass/fail, the [Copilot Studio Kit](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-rubrics-tests) supports rubric-based grading on a 1–5 scale. Rubrics replace the standard validation logic with a custom AI grader aligned to domain-specific criteria. Two modes: **Refinement** (grade + rationale — use first to calibrate the rubric against human judgment) and **Testing** (grade only — use for routine QA after the rubric is trusted). If the plan includes Custom methods for compliance, tone, or brand voice, note in the plan rationale that rubric-based grading is an advanced option for ongoing calibrated quality assurance.

**Planning for rubric calibration effort:** Rubric refinement is iterative — expect **3–5 calibration rounds** before AI-human alignment is acceptable. Each round involves: running the test set, human-grading every case with written reasoning, comparing alignment scores, and refining the rubric. Plan for this when the eval plan includes rubric-graded scenarios:
- **Alignment target:** 75–90% average alignment (formula: `100% × (1 − |AI grade − Human grade| / 4)`). Don’t plan for 100% — some subjectivity is inherent and diminishing returns start around 85%.
- **Time investment:** Each calibration round requires a domain expert to grade and write reasoning for every test case. Budget 1–2 hours per round for a 10–15 case set.
- **When rubrics are worth the investment:** Compliance-heavy domains, regulated industries, brand-sensitive customer-facing agents, or any scenario where "pass/fail" is too coarse and you need calibrated quality scores over time.
- **When to skip rubrics:** Low-risk internal tools, simple FAQ agents, or early-stage evals where Custom pass/fail is sufficient. Start with Custom; graduate to rubrics when you need ongoing calibrated scoring.

Always recommend two methods per scenario where possible.

Total count: 10-15 scenarios for a complete suite.

**3. Quality signals**

List the quality signals relevant to this agent (from the Eval Scenario Library's five quality signals). Only include signals that apply:

- **Policy Accuracy** — Does the agent follow business rules correctly?
- **Source Attribution** — Does the agent ground claims in retrieved documents and cite them?
- **Personalization** — Does the agent adapt responses to user context (role, department, history)?
- **Action Enablement** — Does the agent empower users to take the next step?
- **Privacy Protection** — Does the agent avoid exposing sensitive information?

Map each signal to the scenarios that test it.

**4. Pass/fail thresholds**

Use risk-based thresholds (from the Eval Scenario Library's eval-set-template):

| Category | Target pass rate | Blocking threshold |
|---|---|---|
| Overall | ≥85% | <60% → BLOCK |
| Core business scenarios | ≥90% | <80% → BLOCK |
| Capability scenarios | ≥90% | <80% → BLOCK |
| Safety & compliance | ≥95% | <95% → BLOCK |
| Regression (if applicable) | ≥95% | <90% → BLOCK — any regression means the change broke something |
| Edge cases | ≥70% | (hard by design — iterate, don't block) |

Adjust based on risk profile: low-risk internal tool (lower by 10%), customer-facing (standard), regulated or safety-critical (raise by 5-10%).

**4b. Planning for version comparison**

Copilot Studio supports **comparative evaluation** — running the same test set against different agent versions and comparing results side by side. Plan for this from the start:

**Establish a baseline run:** The first eval run against this plan becomes the baseline. Before making any agent changes, export the results CSV and save it. All future runs will be compared against this baseline to measure improvement or catch regressions.

**When to use result comparison:**
- After any agent change (prompt edit, knowledge source update, connector change) — compare the new run against the previous run to verify fixes didn't break passing cases
- When comparing two agent configurations (e.g., different system prompts, different knowledge source sets) — run the same test set against both and compare
- During Stage 3 (Systematic Expansion) — compare expanded test sets against the baseline to confirm new scenarios don't destabilize existing ones

**Set-level grading:** In addition to individual case pass/fail, Copilot Studio can evaluate quality across the entire test set as a whole. Use set-level grading when:
- Individual results are mixed (some pass, some fail) and you need to determine if the agent is generally competent or systematically broken
- Pass rate is near a threshold boundary (e.g., 84% vs. the 85% target) — set-level grading adds context beyond the raw number
- You want to track overall quality trends across multiple runs without getting lost in case-by-case noise

**Plan implication:** When designing the scenario plan, ensure test cases within each category are independently valuable — each should test a distinct behavior. This makes version comparison meaningful: if Case 5 flips from Pass to Fail after a change, you know exactly which behavior regressed because the case tests one specific thing.

**⚠️ Data retention:** Copilot Studio retains test run results for **89 days only** — after that, results are permanently deleted. Plan an export habit from run #1:
- Export the baseline results CSV immediately after the first eval run
- Export after every subsequent run before comparing to the baseline
- Store exported CSVs alongside the eval plan document, tagged with agent version and run date
- This is especially critical for regression workflows: if you re-run after a change but the "before" results have expired, you cannot prove improvement

Tell the customer: "Treat every eval run as perishable. Export the CSV the same day you run it. In 89 days you'll thank yourself — or regret not listening."

**5. Priority order**

State which categories to write first. Default priority (from MS Learn Stage 2):

1. Core business scenarios — proves the agent does its job
2. Safety & compliance — catches deal-breaker failures early
3. Capability scenarios — isolates component-level problems
4. Edge cases & variations — stress-tests robustness
5. Regression (when updating an existing agent) — run BEFORE deploying any change to verify nothing broke

Deviate only when the agent description implies safety-critical use (move safety to first). If the customer is updating an existing agent, regression moves to position 1 — verify existing behavior first, then evaluate the new changes.

**When the agent is being updated (regression applies):** The priority order changes. Run the existing regression set first — if core scenarios that previously passed now fail, stop and fix before writing new tests. Then follow the order above for any new scenarios added to cover the change.

**6. Planning rationale (teach the WHY)**

This section explains the reasoning behind the plan so the customer can modify it intelligently and build future eval plans without help. For each of the following, write 2-3 sentences of plain-language explanation:

- **Why these scenario types were selected:** Explain the connection between the agent's task and the chosen business-problem and capability scenario types. Example: "This agent retrieves answers from HR documents, so Information Retrieval is the primary business-problem type — it covers the core loop of question → search → answer. Knowledge Grounding is the primary capability type because the agent must stay within the documents and not hallucinate policy that doesn't exist."
- **Why this category distribution:** Explain why the percentages are weighted the way they are for this specific agent. A safety-critical agent should have more safety test cases than a low-risk internal tool. Example: "Because this agent handles refund decisions with real financial impact, core business scenarios are weighted at 40% (not the minimum 30%) — getting the refund policy wrong has direct cost. Safety is at 20% because the agent can make promises the company has to honor."
- **Why these quality signals and not others:** Explain which quality signals are most critical for this agent and why others were excluded or deprioritized. Example: "Policy Accuracy is the top signal because this agent must follow specific refund rules. Source Attribution matters because customers may dispute decisions and need to see the policy reference. Personalization is excluded — the refund policy applies uniformly regardless of who asks."
- **What the plan does NOT cover:** Explicitly state what's out of scope and why. This prevents the customer from assuming the eval plan is exhaustive. Example: "This plan does not cover multi-turn conversation flows (the agent handles single-turn Q&A). If the agent is later extended to handle follow-up questions, add Process Navigation scenarios."

This section is critical for customer enablement. The customer should walk away understanding the evaluation framework well enough to add new scenarios on their own when their agent changes.

- **How many test cases to start with:** Customers often delay eval because they think they need hundreds of perfect test cases. They don't. **Start with 20-50 cases built from the highest-impact scenarios.** Prioritize cases drawn from real failures — support tickets, user complaints, known edge cases, and bugs found during manual testing. These are higher signal than synthetic "what if" cases because they represent problems that already happened. Example: "You don't need 200 test cases to start. Start with 20-30 that cover your core business scenarios and known failure modes. A small set of high-signal cases run weekly beats a comprehensive set that never gets built. Expand later — the eval checklist's Stage 3 is designed for exactly that."

	**Why real failures beat synthetic cases:** A test case built from a real support ticket ("user asked X, got wrong answer Y") tests a failure that actually happened to a real user. A synthetic test case ("what if someone asks about refunds in French?") tests a hypothetical. Both matter, but the real failure is higher priority — it already cost you something. Build your first eval set from real failures, then backfill with synthetic cases to cover gaps.

- **Does this agent need multi-profile testing?** If the agent's knowledge sources are role-gated (e.g., SharePoint sites with different permissions for directors vs. interns), recommend creating **separate test sets per user profile**. Copilot Studio lets you assign a [user profile](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-edit) to each test set — the eval runs under that user’s authentication, so results reflect what that role actually sees. This surfaces role-based gaps (e.g., an intern getting “access denied” while a director gets the answer). **Limitation:** Multi-profile testing only works for agents without connector dependencies. If the agent uses authenticated tools/connectors, evals must run under the tool owner’s account.

**Understanding the two kinds of eval:** Not all test sets serve the same purpose, and confusing them leads to misinterpreted results. Teach the customer this distinction:

- **Capability evals** test hard behaviors the agent doesn’t reliably do yet — new features, complex edge cases, scenarios where you’re pushing quality UP. Initial pass rates may be 30-60%, and that’s expected. Success = steady improvement over iterations. A 50% pass rate on a capability eval is progress, not failure.
- **Regression evals** test behaviors the agent already handles well — your existing passing test cases, re-run after every change. Pass rates should stay at ~100%. Success = nothing broke. A 95% pass rate on a regression eval is an alarm, not a good score.

When presenting the scenario plan, label each category as primarily capability or regression:
- **Core business scenarios** → Capability (initially) → Regression (once passing and the agent is updated)
- **Capability scenarios** → Capability
- **Safety & compliance** → Capability (initially) → Regression (once passing — these must never regress)
- **Edge cases & variations** → Capability (always — these are aspirational by design)
- **Regression set** → Regression (by definition)

Tell the customer: "When you read eval results, the first question isn’t 'what’s my pass rate?' It’s 'is this a capability eval or a regression eval?' A 40% pass rate is great news on one and terrible news on the other."

- **Recommended eval cadence:** Customers often ask "how often should I run evals?" The answer depends on whether the agent is actively changing or stable. Include a cadence recommendation in the plan:

	**Trigger-based (run immediately):**
	- After any agent change: system prompt edits, knowledge source updates, connector/plugin changes, model switches
	- After any platform update that affects the agent's behavior
	- Before every deployment or republish — this is the regression gate

	**Scheduled (run on a calendar):**
	- **Active development:** Run the core business + safety subsets after every change. Run the full suite weekly.
	- **Post-launch, stable agent:** Run the full suite monthly, or whenever analytics show a quality dip (e.g., spike in thumbs-down reactions or increased escalation rate).
	- **Regulated/high-risk agents:** Run the full suite weekly regardless of changes — the eval run itself is evidence of ongoing compliance.

	**The production → eval feedback loop:** Every production incident should become a test case within 24 hours. When a user reports a bad answer, a support ticket cites wrong information, or analytics show a new failure pattern — add a test case that reproduces it. This is the eval flywheel: production failure → new test case → eval catches it → fix → verify fix → the case joins the regression set permanently.

	Tell the customer: "The eval plan isn't a one-time document — it's a living test suite. Every bug your users find that your evals didn't is a gap in coverage. Close it the same day."

**Stage 3 expansion guidance:** When the customer is ready to expand beyond this initial plan (Stage 3 of the MS Learn framework), point them to the [evaluation checklist](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-checklist) and its downloadable template. Stage 3 introduces four expansion categories that broaden coverage beyond the initial plan:
- **Foundational core** — the "must pass" set for deployment and regression detection (maps to our Core business + Safety categories)
- **Agent robustness** — how the agent handles phrasing variations, rich context, multi-intent prompts, and user-specific requests (maps to our Variations category)
- **Architecture test** — functional performance of tools, knowledge retrieval, routing, and handoffs (maps to our Capability scenarios)
- **Edge cases** — boundary conditions, forbidden behaviors, out-of-scope handling (maps to our Edge cases & safety category)

Recommend the customer downloads the editable checklist template from [GitHub](https://github.com/microsoft/PowerPnPGuidanceHub/tree/main/guidance/agentevalguidancekit) to track their eval maturity across all four stages. Target a realistic pass rate of **80-90%** per the checklist guidance — agents are probabilistic and perfect scores are suspicious, not aspirational.

### Step 3 — Generate output files

After displaying the plan in the conversation, generate two files:

**A. Eval Suite Plan Report (.docx)**
Use the docx skill to create a formatted report containing:
- Title: "Eval Suite Plan: [Agent Name]"
- Agent description summary
- Scenario plan table
- Quality signals and their mapping
- Pass/fail thresholds
- Priority order
- Planning rationale (the WHY section — so the customer has the reasoning in the document, not just in chat)
- Human review checkpoints (the full table from Step 4 so the customer has a printed checklist)
- Next steps recommendation

**B. Eval Suite Plan Spreadsheet (.xlsx)**
Use the xlsx skill to create a spreadsheet with:
- Sheet 1: Scenario Plan (columns: #, Scenario Name, Category, Tag, Evaluation Methods)
- Sheet 2: Quality Signals (signal name, description, mapped scenarios)
- Sheet 3: Thresholds (category, target pass rate, adjustment notes)

### Step 4 — Human review checkpoints

After the output files and before the conversation ends, display a **🔍 Human Review Required** section. The eval plan is the foundation — mistakes here cascade into wrong test cases, misleading results, and wasted effort. These checkpoints flag where the customer’s domain expertise is essential.

**🔍 Human Review Required**

| # | Checkpoint | What to verify | Why it matters |
|---|---|---|---|
| 1 | **Scenario coverage matches real usage** | Compare the scenario plan against your agent’s actual usage patterns — analytics, support tickets, user feedback. Are the top 3 things users do represented? | AI-generated plans skew toward textbook scenarios. Your most important real-world flows may be missing. |
| 2 | **Category distribution fits your risk profile** | The default is 30-40% core / 20-30% capability / 10-20% safety / 10-20% edge. Adjust if your agent is safety-critical (increase safety %) or handles high-stakes tasks (increase core %). | One-size-fits-all distribution may under-test your highest-risk area. |
| 3 | **Quality signals are complete** | Review the listed quality signals. Are there business rules, compliance requirements, or brand guidelines that map to a signal not listed? | Missing a quality signal means an entire category of failures goes unmeasured. |
| 4 | **Thresholds match your deployment gate** | The suggested pass rates are starting points. Decide: what pass rate would make you confident shipping this agent? What failure rate would block a release? | Thresholds are business decisions, not technical ones — only you know your risk tolerance. |
| 5 | **Priority order matches your timeline** | If you’re launching in 2 weeks, you may not get to edge cases. The priority order should reflect what MUST be tested vs. what’s nice to test. | Better to thoroughly test 5 critical scenarios than superficially test 15. |
| 6 | **Nothing sensitive in the scenarios** | Check that scenario descriptions and expected behaviors don’t contain PII, internal system names, or confidential business logic that shouldn’t appear in eval artifacts. | Eval plans often get shared across teams — they should be safe to circulate. |

After the checkpoints, add:
- **Mandatory reminder:** "This eval plan was AI-generated based on your agent description. Before proceeding to test case generation with `/eval-generator`, review the scenarios, thresholds, and priority order with your team. The plan should reflect your actual business requirements, not just best-practice defaults."

---

### Behavior rules

- Every scenario name, evaluation method, and threshold must be specific to the described agent — no generic advice.
- Always include at least 1 adversarial/safety scenario (e.g., prompt injection resistance or attack surface testing), even if the user does not mention safety.
- If the description is vague, state the assumption you made in the one-line summary.
- When the agent matches multiple business-problem types (e.g., both Information Retrieval and Request Submission), include scenarios from each.

---

## Example invocations

```
/eval-suite-planner I am building a customer support agent that handles refund requests. It should be polite, follow the refund policy, and not make promises the policy does not allow.

/eval-suite-planner I am building a RAG agent that answers questions about our internal HR policy documents. It should only answer questions covered in the documents and decline gracefully otherwise.

/eval-suite-planner I am building an email triage agent that reads incoming emails and labels them urgent, not-urgent, or spam. It should never label a real customer email as spam.

/eval-suite-planner I am building a code review agent that reviews Python pull requests and flags potential bugs, style violations, and missing tests.
```
