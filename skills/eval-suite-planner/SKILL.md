---
name: eval-suite-planner
description: Stage 1 standalone — turns an Agent Vision (or plain-English description) into a structured eval plan: 10–15 acceptance criteria phrased "The agent should…", each placed on a Value × Risk matrix (High Value · High Risk / High Value · Low Risk / Low Value · High Risk / Low Value · Low Risk), each with explicit pass/fail conditions and a test method. Output is a customer-ready `.docx` eval plan. Use before generating test cases or running any evals.
---

## Purpose

This skill produces the **Stage 1** artifact of the `/eval-guide` lifecycle: a written eval plan that a customer's PM, security partner, or business owner can sign off on. It works **without a running agent** — a description, idea, or written Vision is enough. The plan defines what the agent SHOULD do; later stages turn it into test cases and run them.

This is the standalone form of `/eval-guide` Stage 1. Use it when the customer already has an Agent Vision and wants the plan directly, or when a Stage 1 re-plan is needed for a specific feature without re-orienting the whole session. The orchestrator `/eval-guide` invokes the same methodology with its own dashboard checkpoint.

**Knowledge sources:**
- Microsoft's [evaluation iterative framework](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-iterative-framework) and [evaluation checklist](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-checklist).
- [Eval Scenario Library](https://github.com/microsoft/ai-agent-eval-scenario-library) — quality signals and method-mapping guidance.
- [Triage & Improvement Playbook](https://github.com/microsoft/triage-and-improvement-playbook) — what makes a criterion testable.

**Maturity callout — Pillar 1 (Define what "good" means):** Stage 1 advances Pillar 1 from `L100 Initial` ("good lives in the builder's head") to `L300 Systematic` ("written acceptance criteria with pass/fail conditions, tied to eval methods"). The eval plan IS the Pillar 1 artifact.

## Instructions

When invoked as `/eval-suite-planner <agent description>`:

1. Extract or accept the Agent Vision (purpose, users, knowledge, capabilities, boundaries, success criteria, risk profile).
2. Determine eval depth from agent architecture (prompt-level / RAG / agentic) — under-test simple agents, over-test complex ones, scope to fit.
3. Produce **10–15 acceptance criteria** phrased *"The agent should…"* (or *"should NOT…"* for negative tests).
4. Place each criterion on the **Value × Risk matrix** (4 quadrants).
5. Consolidate quality dimensions to **4–6 broad categories** (e.g., "Accuracy", "Grounding", "Boundaries / Safety", "Tone").
6. Assign a test method per criterion (Compare meaning / General quality / Keyword match / Capability use / Custom / Text similarity / Exact match).
7. Write explicit pass/fail conditions per criterion — testable from the criterion alone.
8. Run distribution sanity-check (red flags only).
9. Output the customer-ready `.docx` eval plan.

Do not pad responses. Do not hedge. Be specific to the described agent — no generic advice.

---

### Step 1 — Determine eval depth from architecture

| Architecture | What it is | Eval layers to apply |
|---|---|---|
| **Prompt-level** | Single-turn LLM call, fixed system prompt, no retrieval, no tools | Acceptance criteria + safety/refusal |
| **RAG** | Retrieves from knowledge sources before responding | + Grounding + citation accuracy + hallucination prevention |
| **Agentic** | Routes between topics, tools, or connectors | + Tool/topic routing accuracy + slot extraction + multi-step task completion |

The architecture call drives which capability families apply. Don't write tool-routing tests for a simple FAQ bot.

---

### Step 2 — Acceptance criteria on the Value × Risk matrix

Each criterion belongs in **one quadrant** based on two judgments:
- **Value** — how much does getting this right drive the agent's mission?
- **Risk** — how much harm does failure cause (financial, safety, compliance, trust)?

|  | **Low risk** | **High risk** |
|---|---|---|
| **High value** | **High Value · Low Risk** — expected capabilities users rely on. Solid coverage; occasional misses tolerable. | **High Value · High Risk** — product-defining; failure hurts. Heaviest investment, strictest review. |
| **Low value** | **Low Value · Low Risk** — exploratory or rare. Light coverage; revisit if usage grows. | **Low Value · High Risk** — rarely triggered but must never fail. Safety, compliance, refusals. Zero tolerance. |

**The matrix tells you where to invest test-writing effort, not numeric thresholds.** High Value · High Risk gets the most cases, Low Value · Low Risk the fewest, Low Value · High Risk the strictest review. Pass/fail per case lives in each criterion's own pass/fail conditions — not a prescribed percentage threshold.

---

### Step 3 — Distribution sanity-check (reference, not gate)

Targets vary by `risk_profile`. **Targets are reference patterns, not gates.** Only push back on red flags.

| Risk profile | High Value · High Risk | High Value · Low Risk | Low Value · High Risk | Low Value · Low Risk | Sanity-check rule |
|---|---|---|---|---|---|
| `low`      | 30–50% | 30–50% | 10–20% | 0–20% | At least 1 Low Value · High Risk (always). |
| `medium`   | 25–40% | 25–40% | 20–30% | 0–15% | At least 1 Low Value · High Risk. |
| `high`     | 25–40% | 15–30% | 30–50% | 0–10% | **At least 2 Low Value · High Risk (auto-doubled trigger).** |
| `critical` | 20–35% | 10–20% | 40–60% | 0–5%  | At least 3 Low Value · High Risk. Compliance / Safety domains required. |

**Push back only on these red flags:**
- 0 Low Value · High Risk on any plan — the agent has no enforced boundaries.
- 0 High Value · High Risk — the plan has no product-defining tests.
- >70% High Value · High Risk — every criterion is "the most important." Anchoring bias; force re-evaluation.
- HIGH-risk profile + <30% Low Value · High Risk — under-investment in failure modes that cause real damage.
- CRITICAL-risk profile + <40% Low Value · High Risk — same, stricter.

Marginal deviations (e.g., High Value · Low Risk at 13% with target 15–30%) are NOT red flags. Do not re-litigate customer-confirmed moves.

---

### Step 4 — Adversarial coverage minimums (auto-applied)

Every plan needs **at least 1 Low Value · High Risk / Red-Teaming criterion**. The mandate **auto-doubles to 2 minimum** when any of these triggers fire:

- Risk profile is HIGH or CRITICAL.
- Agent touches sensitive-data domains: PII, payments, HR, health, legal, regulated content.
- Agent has external-customer surface area.
- Knowledge sources include personal or financial records.

When a trigger fires, narrate it: *"Your agent matches the sensitive-data trigger ([reason]) — doubling the adversarial coverage mandate from 1 to 2 minimum. Writing at least two adversarial / red-team criteria targeting your specific boundary risks."*

Adversarial gaps are the failure mode that bites in production: the agent passes every High Value · High Risk test and then leaks data on a question no one thought to write a test for.

---

### Step 5 — Quality dimensions (consolidate to 4–6)

Group criteria by quality dimension. Default consolidated dimensions:
- **Accuracy** (covers all knowledge sources — don't fragment into "Policy Accuracy" + "Benefits Accuracy" + "Training Accuracy").
- **Grounding** (citation, source attribution, hallucination prevention — RAG/agentic only).
- **Boundaries / Safety** (refusals, compliance, escalation paths).
- **Routing / Capability** (correct tool/topic invocation — agentic only).
- **Tone** (when relevant — empathy, brand voice, professionalism).
- **Personalization** (when role-based access is on).

**Customers fragment dimensions when the AI does.** *"Policy Accuracy / Benefits Accuracy / Training Accuracy"* should be **one** dimension called *"Accuracy"*. The criterion's *statement* already specifies what knowledge it tests — the dimension shouldn't repeat that. Consolidate aggressively.

---

### Step 6 — Test methods (per criterion)

Pick the method based on **what you need to verify**, not on familiarity. The signal_type → method mapping:

| Signal type | What you're verifying | Method |
|---|---|---|
| **Factual content** (specific facts, numbers, IDs) | Response contains the right facts | `Compare meaning` (paraphrase OK) or `Keyword match` (exact terms required) |
| **Mandatory wording** (compliance disclaimers, citations) | Specific phrases must appear | `Keyword match` |
| **Routing / capability** | Agent invoked the right tool or topic | `Capability use` |
| **Open-ended quality** (tone, helpfulness, completeness) | Subjective rubric, no single right answer | `General quality` |
| **Domain-specific rubric** (HR / medical / legal / brand) | Custom labeled judgment | `Custom` (with a per-criterion rubric) |
| **Tight wording** (templates, structured replies) | Wording closeness | `Text similarity` |
| **Exact strings** (IDs, codes, fixed responses) | Byte-exact match | `Exact match` |

**Reference-free methods** (`General quality`, `Capability use`, `Custom`) grade against the criterion's own pass/fail conditions, not against a per-case reference. They don't need an "expected response" per case in Stage 2.

**`Custom` method**: when you assign Custom to a criterion, also draft a one-paragraph **rubric** from the pass/fail conditions, e.g.:
> *Rate the response Pass / Fail. Pass = [pass_condition]. Fail = [fail_condition]. Output PASS or FAIL with a one-sentence reason.*

The rubric belongs on the criterion itself (`custom_rubric` field) and is what the LLM judge consumes downstream.

---

### Step 7 — Pass/fail conditions per criterion

Every criterion gets explicit **Pass =** and **Fail =** lines.

- Conditions must be testable from the criterion alone — no implicit context.
- Pass condition names what the response must contain or do.
- Fail condition names what would constitute a failure (often inverse of pass, sometimes additional bad-states).
- For negative tests (`should NOT…`), Pass = "agent correctly refused / redirected"; Fail = "agent disclosed / acted".

**Don't prescribe percentage thresholds per criterion.** The quadrant tells you where to invest effort; pass/fail per case lives in the conditions. *"Critical must pass at 90%"* is wrong — pass/fail is per-case, not per-criterion.

---

### Step 8 — Coverage check against the Vision

Before locking the plan, walk the Agent Vision and confirm coverage:

- Every named **capability** has ≥ 1 criterion.
- Every named **boundary** has ≥ 1 criterion (often a Low Value · High Risk).
- Every named **knowledge source** has ≥ 1 grounding criterion (RAG/agentic only).
- Every named **user cohort** with role-based access has ≥ 1 personalization criterion.

If a Vision capability has no criterion, surface the gap: *"I noticed Capability X has no criterion — add one or mark it out of scope?"* Don't slide gaps silently.

---

### Step 9 — Output: customer-ready `.docx` eval plan

Use the `/docx` skill to generate `eval-plan-<agent-name>-<YYYY-MM-DD>.docx`. The report must be:
- **Concise** — tables over paragraphs, no filler.
- **Presentable** — color-coded headers (red / blue / yellow / gray for the four quadrants), clean tables, visual hierarchy.
- **Self-contained** — a customer who wasn't in the conversation can read it and understand the plan.

**Report structure:**

1. **Agent Vision summary** (5–6 lines max) — purpose, users, knowledge, capabilities, boundaries, success criteria, risk profile.
2. **Value × Risk matrix overview** — explain the four quadrants and what kinds of criteria belong in each.
3. **Quadrant assignment** — visual 2×2 matrix with each criterion placed, followed by a table listing criteria grouped by quadrant with pass/fail conditions.
4. **Quality Dimensions to Test** — list the 4–6 consolidated dimensions, with grouped criteria under each.
5. **Method mapping explanation** — which methods apply to which criteria and why (reference the signal_type → method table).
6. **Distribution check** — actual percentages vs. risk-profile targets, with red-flag verdict.
7. **Adversarial coverage** — count of Low Value · High Risk / red-team criteria; note auto-double trigger if applied.
8. **Next steps** — *"Run `/eval-generator` on this plan to produce test cases (Stage 2). Then run them against your agent (Stage 3) and triage results with `/eval-result-interpreter` (Stage 4)."*
9. **Maturity snapshot** — before/after table:

   | Pillar | Baseline | After this plan | Next-session target |
   |---|---|---|---|
   | 1 — Define what "good" means | L100 Initial | L300 Systematic ✓ | — |
   | 2 — Build your eval sets | L100 Initial | L100 Initial | L300 (run `/eval-generator`) |
   | 4 — Improve and iterate | L100 Initial | L100 Initial | L300 (run `/eval-result-interpreter` after Stage 3) |

Tell the customer: *"Here's your eval plan as a `.docx` — share it with your team. Business and dev should agree on the quadrant assignments before we generate test cases. The quadrant tells you where to focus effort, not a numeric threshold — pass/fail lives in each criterion's own pass/fail conditions."*

---

### Step 10 — 🔍 Human Review checkpoints

Display before ending. The plan is the foundation — mistakes here cascade into bad test cases and wasted effort.

| # | Checkpoint | What to verify |
|---|---|---|
| 1 | **Coverage matches the Vision** | Every named capability, boundary, knowledge source, and user cohort has ≥ 1 criterion. |
| 2 | **Quadrant placements match risk reality** | A Low Value · High Risk on a payments agent is not the same as one on an internal FAQ. Sense-check with the security/compliance partner. |
| 3 | **Pass/fail conditions are decidable** | A human grader (or LLM judge) can read each pass/fail and decide the outcome from the response alone. |
| 4 | **Methods match what you're testing** | Custom for nuanced rubrics, Keyword match for required phrases, Compare meaning for paraphrasable answers. Wrong method = wrong signal. |
| 5 | **Adversarial coverage feels real** | Low Value · High Risk criteria target *specific* boundary risks for this agent (PII for HR, payment-disclosure for billing, etc.) — not generic prompt-injection boilerplate. |
| 6 | **Quality dimensions consolidated** | 4–6 dimensions, not 12. "Accuracy" should cover multiple knowledge sources, not be split per source. |

**Mandatory reminder:** *"This eval plan was AI-generated from your agent description / Vision. Before proceeding to test case generation with `/eval-generator`, review the criteria, quadrants, and pass/fail conditions with your team. The plan should reflect your business reality, not best-practice defaults."*

---

### Behavior rules

- Every criterion must start with *"The agent should…"* (or *"…should NOT…"* for negative tests). Behaviors, not goals.
- Every criterion has all five fields: `statement`, `quadrant`, `method`, `pass_condition`, `fail_condition`.
- For criteria with `method: "Custom"`, also draft `custom_rubric` from the pass/fail.
- 10–15 criteria total. Below 10 means under-coverage; above 15 usually means dimension fragmentation — consolidate.
- At least 1 adversarial / Low Value · High Risk / red-team criterion (2+ if the auto-double trigger fires).
- Don't prescribe percentage pass-thresholds per criterion. Pass/fail per case lives in the conditions.
- If the description is vague, state assumptions explicitly in the Vision summary at the top of the report.

---

## Example invocations

```
/eval-suite-planner I'm building an HR policy bot for a global company with 18 offices. It answers PTO, parental-leave, benefits questions from official HR documents. Should refuse salary-disclosure questions and escalate legal/discrimination concerns.

/eval-suite-planner Customer support agent for refund requests. Polite, follows refund policy, doesn't make promises beyond policy. Risk profile: HIGH (handles financial decisions).

/eval-suite-planner Email triage agent that reads incoming emails and labels them urgent / not-urgent / spam. Must NOT label real customer emails as spam.

/eval-suite-planner I have a Vision doc — purpose: code review for Python PRs, users: dev team, knowledge: PEP 8 + internal style guide, boundaries: no security review, success: PRs land faster with fewer style nits.
```

---

## Companion skills

- **`/eval-generator`** — Stage 2: takes this plan and produces concrete test cases (single CSV per quality signal, 3 columns, one row per case × method).
- **`/eval-result-interpreter`** — Stage 4: takes Stage 3 results and produces a triage report (SHIP / ITERATE / BLOCK with root-cause classification).
- **`/eval-faq`** — methodology Q&A grounded in Microsoft's eval ecosystem.
- **`/eval-guide`** — the orchestrator. Wraps Stages 0–4 with an interactive dashboard checkpoint at each stage.
