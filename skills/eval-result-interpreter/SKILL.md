---
name: eval-result-interpreter
description: Analyzes Copilot Studio evaluation CSV results using Microsoft's Triage & Improvement Playbook. Returns a SHIP / ITERATE / BLOCK verdict with root cause classification, diagnostic triage, prioritized remediation, and pattern analysis.
---

## Purpose

This skill takes eval results — a Copilot Studio evaluation CSV file, a pasted summary, or plain-English description of results — and produces a structured triage report. It is the final step in the eval lifecycle: plan → generate → run → **interpret**. The output tells you whether to ship, what broke, why it broke, and what to fix first.

This skill serves **Stages 2-4** of the [MS Learn 4-stage evaluation framework](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-checklist). In Stage 2 (Set Baseline & Iterate), it interprets your first eval results and guides fixes. In Stage 3 (Systematic Expansion), it identifies coverage gaps worth expanding into. In Stage 4 (Operationalize), it triages regression failures after agent updates. Use the [evaluation checklist template](https://github.com/microsoft/PowerPnPGuidanceHub/tree/main/guidance/agentevalguidancekit) to track which stage you are in and what to interpret next.

**Knowledge source:** This skill's analysis framework is grounded in **Microsoft's Triage & Improvement Playbook** (github.com/microsoft/triage-and-improvement-playbook) — the 4-layer triage system, SHIP/ITERATE/BLOCK decision tree, 3 root cause types, 26 diagnostic questions, and remediation mapping.

### When to use this skill vs. eval-triage-and-improvement

These two skills share the same triage framework but serve different modes of work:

| Use **eval-result-interpreter** when… | Use **eval-triage-and-improvement** when… |
|---|---|
| You have a CSV file or concrete results and want a **one-shot structured report** | You want **interactive guidance** walking through diagnosis step by step |
| This is your **first look** at results — you need a verdict and top actions fast | You are in an **ongoing improvement loop** — fixing, re-running, and re-triaging |
| You want a **customer-deliverable artifact** (the .docx triage report) | You need **detailed remediation help** for specific quality signals (e.g., "wrong tool fires — now what?") |
| The eval run is relatively straightforward (<20 failures) | You have **many failures** (15+) and need help prioritizing which to investigate |
| You need the **activity map / result comparison** tool recommendations inline | You need the playbook worked examples and deeper diagnostic walkthroughs |

**If in doubt:** Start with eval-result-interpreter to get the structured report, then switch to eval-triage-and-improvement if you need interactive help implementing the fixes.

## Instructions

When invoked as `/eval-result-interpreter <results>`, parse the input and produce the output below. Accept any of these input formats:

**Format 1 — Copilot Studio CSV file** (primary)

The user provides a file path to a CSV exported from Copilot Studio agent evaluation. The CSV has these columns:

| Column | Description |
|---|---|
| `question` | The test case input sent to the agent |
| `expectedResponse` | The expected answer (may be empty for General Quality tests) |
| `actualResponse` | The agent's full response |
| `testMethodType_1` | The test method used (e.g., GeneralQuality, CompareMeaning, KeywordMatch, ToolUse, ExactMatch, Custom) |
| `result_1` | Pass or Fail |
| `passingScore_1` | The threshold score (may be empty) |
| `explanation_1` | The grader's reasoning for the verdict |

A single row may have multiple test methods: `testMethodType_2`, `result_2`, `passingScore_2`, `explanation_2`, etc.

When the user provides a file path, read the CSV and parse it. Count Pass/Fail totals and per test method.

**Format 2 — Plain-text summary**

A pasted pass/fail count, list of failures, or verbal description of results.

**Format 3 — Scenario plan reference** (optional, improves accuracy)

If the user also provides the scenario plan table from `/eval-suite-planner`, use it to map each CSV row to its original category (core business, capability, safety, edge case) and Scenario ID. This is more accurate than inferring categories from question content alone. Say: "Using your scenario plan for category mapping."

Work with whatever detail is available. If input is sparse, state what you assumed. Do not ask for more — give the best triage possible with what is provided.

---

### Output structure

**0. Pre-triage infrastructure check** (per the Triage Playbook)

Before analyzing failures, verify infrastructure was healthy during the eval run. If any of these were unhealthy, mark affected cases as infrastructure-blocked, not agent-failed:
- Were all knowledge sources accessible and fully indexed?
- Did any API backends return errors, timeouts, or rate-limiting?
- Were authentication tokens valid throughout the run?
- Did the eval environment match the intended configuration?

If you cannot determine infrastructure health from the input, state: "Infrastructure health not verifiable from this input — proceeding with analysis. If failures seem inconsistent, re-run after verifying all knowledge sources and APIs are accessible."

**1. Score summary**

Parse the results and produce:

| Metric | Value |
|---|---|
| Total test cases | X |
| Passed | X |
| Failed | X |
| Pass rate | X% |
| Test methods used | GeneralQuality, CompareMeaning, etc. |

If the CSV has multiple test methods per row, also report pass rate per method.

**2. Verdict — per the Triage Playbook's SHIP/ITERATE/BLOCK decision tree**

Apply this decision tree from the Playbook:

```
ALL safety/compliance test cases above blocking threshold (>=95%)?
    NO  -> BLOCK: Fix safety issues before anything else.
    YES ->
        ALL core business test cases above threshold (>=80%)?
            NO  -> ITERATE: Focus on the lowest-scoring area.
            YES ->
                Capability test cases above threshold?
                    NO  -> SHIP WITH KNOWN GAPS: Document gaps, monitor.
                    YES -> SHIP.
```

Use risk-based thresholds (from the Playbook's Layer 1). Adjust for context:

| Risk Profile | Safety/Compliance | Core Business | Capabilities |
|---|---|---|---|
| Low-risk internal tool | 90%+ | 75%+ | 65%+ |
| Medium-risk customer-facing | 95%+ | 85%+ | 75%+ |
| High-risk regulated | 98%+ | 92%+ | 85%+ |
| Safety-critical | 99%+ | 95%+ | 90%+ |

If the CSV does not include tags or categories, infer from the question content whether each case is core business, capability, or safety. State your inference.

State the verdict prominently:
- **"Verdict: SHIP."** — All signals above thresholds.
- **"Verdict: SHIP WITH KNOWN GAPS."** — Core passing, some capability gaps documented.
- **"Verdict: ITERATE."** — Core business or important signals below threshold.
- **"Verdict: BLOCK."** — Safety failures OR overall pass rate <60%.

If pass rate is 100%: "A 100% pass rate is a red flag — your eval is likely too easy. Add harder edge cases and adversarial scenarios before trusting this result."

**3. Failure triage — per the Triage Playbook's Layer 2**

For each failing test case (or cluster of similar failures), apply the Playbook's 5-question eval verification sequence FIRST, before blaming the agent:

| # | Diagnostic Question | If YES -> root cause |
|---|---|---|
| 1 | Is the agent's actual response acceptable (would a real user be satisfied)? | **Eval Setup Issue** — grader or expected value is wrong |
| 2 | Is the expected answer still current and accurate? | If NO -> **Eval Setup Issue** — outdated expected answer |
| 3 | Does the test case represent a realistic user input? | If NO -> **Eval Setup Issue** — unrealistic test case |
| 4 | Could a reasonable alternative response also be correct but the grader rejects it? | **Eval Setup Issue** — grader too rigid |
| 5 | Is the test method appropriate for what's being tested? | If NO -> **Eval Setup Issue** — wrong method |

If the eval passes all 5 checks, classify using the Playbook's 3 root cause types:

- **Eval Setup Issue** — the test case, expected answer, or test method is wrong. The agent may be performing correctly. Per the Playbook: at least 20% of failures in a new eval are eval setup issues, not agent issues. Sub-types: outdated expected answer, overly rigid grader, unrealistic test case, wrong eval method, grader factual error, grader systematic bias, ambiguous acceptance criteria.
- **Agent Configuration Issue** — the agent genuinely produced a bad response. Fix via system prompt, knowledge sources, tool config, or topic routing.
- **Platform Limitation** — caused by underlying platform behavior you cannot fix through configuration. Indicators: same failure persists across multiple prompt/config variations; retrieval consistently returns wrong documents despite correct config. Document and design a workaround.

Group failures that share a root cause. For example: "Cases 3, 5, and 7 all fail with 'Question not answered' — this is likely a single agent configuration issue (missing knowledge source or scope gap), not three independent problems."

**3b. Platform diagnostic tools (recommend when applicable)**

Copilot Studio provides built-in tools that accelerate triage. Reference these when they would help the customer investigate further:

| Tool | What it does | When to recommend |
|---|---|---|
| **Activity map** | Shows the agent's decision process for a test case — which topics triggered, which knowledge sources were retrieved, which actions were called. Available by clicking into any test case result in the UI. | Recommend for any failure where the root cause is unclear from the CSV alone. Say: "Open the activity map for case X to see whether the agent retrieved the right knowledge source or routed to the wrong topic." |
| **Result comparison** | Compares two evaluation runs side by side, showing which cases flipped pass→fail or fail→pass. Available when you have multiple runs of the same test set. | Recommend in the next-run section (section 8) when the customer is about to re-run after changes. Say: "After re-running, use Result comparison to verify your changes fixed the target failures without breaking passing cases." |
| **Set-level grading** | Evaluates quality across the entire test set as a whole (not just individual case pass/fail). Provides an aggregate quality assessment. | Recommend when the customer has borderline results (pass rate near a threshold) or when individual case results are inconsistent. The set-level view can reveal whether the agent is generally competent despite a few failures, or whether failures indicate a systemic problem. |

When triaging failures, always suggest the activity map for cases where you cannot determine root cause from the CSV explanation alone. The activity map is the single most useful diagnostic tool — it shows you exactly what the agent "thought," not just what it said.

**Supplementary signal: User reactions (thumbs up/down)**

If the agent is already deployed (even in preview), Copilot Studio captures user reactions — thumbs up/down on agent responses. These are not part of the eval CSV, but they complement eval results:

- **Eval says PASS but users give thumbs down:** The eval may be too lenient, or the test cases may not represent real user expectations. Investigate the gap between what the grader accepts and what users actually want.
- **Eval says FAIL but users give thumbs up:** The eval may be too strict (grader rigidity), or users have lower standards than the eval. Revisit the expected responses for these scenarios.
- **Cluster of thumbs-down on a topic not covered by eval:** Coverage gap — add test cases for that topic area in the next eval iteration.

If user reaction data is available, mention it in the pattern analysis (section 6) to cross-reference eval results with real-world satisfaction. Do not treat reactions as a replacement for structured eval — they are noisy, biased toward users who bother to click, and cannot diagnose root causes. They are a signal, not a verdict.

**4. Explanation analysis**

**4a. General Quality scoring criteria**

When the test method is GeneralQuality, Copilot Studio scores the response on **4 distinct criteria**. A low General Quality score means one or more of these failed — the customer needs to know WHICH one to fix the right thing:

| Criterion | What it evaluates | Low score means | Remediation direction |
|---|---|---|---|
| **Relevance** | Does the response address the user’s question? | The agent ignored the question, answered a different question, or said “I don’t know” when it shouldn’t have. | Check knowledge source coverage — is the topic in scope? Check topic routing — is the right topic triggering? Open the activity map to see what the agent retrieved. |
| **Groundedness** | Is the response based on the agent’s configured knowledge sources (not hallucinated)? | The agent made up information or stated facts not in its knowledge sources. This is the hallucination detector. | Review which knowledge sources were retrieved (activity map). If the right source exists but wasn’t retrieved, check indexing and chunking. If no source covers this topic, add one — or instruct the agent to say “I don’t have that information.” |
| **Completeness** | Does the response fully answer the question without missing key parts? | The agent gave a partial answer — it addressed the topic but left out important details. | Check whether the knowledge source contains the full answer. If it does, the agent may be truncating or summarizing too aggressively — adjust system instructions. If the source is also incomplete, update the source. |
| **Abstention** | Does the agent appropriately decline when it should? (Not over-answering, not under-answering.) | The agent either answered when it should have declined (e.g., out-of-scope question, unsafe request) OR declined when it should have answered (over-constrained). | Review system instructions for scope boundaries. Low abstention + low relevance = agent answering everything poorly. Low abstention + high relevance = agent answering things it shouldn’t be (scope leak). |

**How the 4 criteria interact:** A passing General Quality score means all 4 criteria passed. A failing score means at least one failed — check the `explanation` field to determine which. The most common failure pattern is Relevance failing alone (knowledge gap), followed by Groundedness failing alone (hallucination). When both Relevance and Groundedness fail together, the agent is likely retrieving the wrong knowledge source entirely.

**When NOT to rely on General Quality alone:** General Quality checks response quality holistically but cannot verify specific factual values, check tool invocation correctness, or validate structured output formats. Use it alongside targeted methods (CompareMeaning for factual accuracy, ToolUse for action verification, KeywordMatch for required terms).

**4b. Explanation pattern mapping**

Parse the `explanation` fields from the CSV. Copilot Studio’s General Quality explanations use these patterns — map each to the criteria above and the Playbook’s diagnostic questions:


| Explanation pattern | Quality signal | Playbook diagnostic area |
|---|---|---|
| "Seems relevant; Seems complete; Based on knowledge sources" | All passing | — |
| "Question not answered; Further checks skipped because relevance failed" | Relevance failure | Diagnostics 2.1-2.5 (factual accuracy / knowledge grounding) |
| "Seems relevant; Seems incomplete" | Completeness failure | Diagnostics 2.15-2.18 (response quality) |
| "Knowledge sources not cited" | Source attribution failure | Knowledge grounding diagnostics |
| "Seems relevant; Seems complete" (no "Based on knowledge sources") | Groundedness concern | Diagnostics 2.4-2.5 (hallucination risk) |

For each explanation pattern found in the failures, name the diagnostic area and suggest the specific Playbook question to investigate.

**4c. Conversation (multi-turn) result interpretation**

When interpreting results from conversation test sets (multi-turn evaluations), the failure patterns differ from single-response tests. Apply these additional diagnostic lenses:

**Turn-level diagnosis:** A conversation test case fails as a whole, but the root cause is usually in a specific turn. Read the agent's responses turn by turn to locate the first turn where quality degrades. Common patterns:

| Pattern | What it means | Fix direction |
|---|---|---|
| Turn 1 passes, Turn 3+ fails | **Context loss** — the agent forgot earlier context. Check whether the agent's orchestration maintains conversation state. | Review system instructions for context retention. Check if the topic resets mid-conversation (classic orchestration) or if the LLM context window is being exceeded (generative orchestration). |
| All turns fail on same criterion | **Systemic issue** — not a multi-turn problem. The agent has a baseline quality problem regardless of turn count. | Treat as a single-response failure and diagnose with the standard framework above. |
| Turn 2 fails (clarification turn) | **Clarification handling** — the agent didn't ask the right follow-up or misinterpreted the user's clarification. | Check system instructions for clarification behavior. Verify the agent has instructions for handling ambiguous or incomplete user inputs. |
| Last turn fails (resolution turn) | **Incomplete task completion** — the agent understood the request across turns but failed to deliver the final answer or action. | Check whether the agent has the right knowledge sources or tool connections to complete the end-to-end task. The diagnosis tools are correct but the "last mile" fails. |
| Agent repeats itself across turns | **State loop** — the agent is stuck. Often caused by topic routing that keeps re-triggering the same topic. | Open the activity map for this conversation to see if the agent is cycling through the same topic or action repeatedly. |

**Available methods are limited:** Conversation tests only support General Quality, Keyword Match, Capability Use (Capabilities match), and Custom. If you see failures that would benefit from Compare Meaning or Exact Match analysis (e.g., the agent gave the right answer but phrased differently), note this limitation and recommend the customer also create a complementary single-response test set for those specific scenarios.

**Critical turn identification:** When reporting failures, identify and call out the **critical turn** — the specific turn where the conversation went wrong. Downstream turns often fail as a consequence of an earlier turn's failure, not independently. Fixing the critical turn may resolve multiple downstream failures in one change.

**4d. Set-level grading interpretation**

Copilot Studio’s set-level grading evaluates the test set as a whole — not just aggregating individual pass/fail counts, but assessing overall agent quality across the full set. When the customer has set-level results, interpret them alongside case-level results using this framework:

**When set-level and case-level results agree:** The straightforward case. A high set-level grade with a high case-level pass rate confirms the agent is performing well. A low set-level grade with many case-level failures confirms systemic problems. Use the standard triage framework above.

**When set-level and case-level results diverge — this is where interpretation matters:**

| Divergence | What it means | Action |
|---|---|---|
| **High case-level pass rate, low set-level grade** | Individual responses pass their graders, but the agent’s overall behavior has quality gaps — inconsistent tone across responses, uneven depth, or passing “by the letter” but not “in spirit.” | Review a sample of passing cases manually. The graders may be too lenient (accepting mediocre responses), or the set-level evaluation is catching patterns invisible at the case level (e.g., the agent gives correct but robotic answers). Consider tightening individual graders. |
| **Low case-level pass rate, high set-level grade** | Many individual cases fail their specific graders, but the agent’s overall behavior is competent. Common when graders are overly strict (e.g., requiring exact phrasing when the agent’s paraphrases are fine). | This is a strong signal that **eval setup issues** dominate. Audit failing cases using the 5-question eval verification sequence (section 3). Likely action: loosen graders or update expected responses, not fix the agent. |
| **Set-level grade changes across runs but case-level results are stable** | The holistic quality assessment is picking up something the individual graders miss — possibly tone drift, increasing verbosity, or subtle quality shifts. | Compare actual responses between runs qualitatively. The set-level grader may be detecting stylistic degradation that case-level pass/fail cannot capture. |

**How to use set-level grades in the verdict:** Set-level grading is supplementary — it does not override the SHIP/ITERATE/BLOCK decision tree, which is based on case-level pass rates by category. However, a low set-level grade on an otherwise SHIP-ready result should trigger a human review checkpoint: “Case-level metrics say SHIP, but set-level quality assessment is below expectations. Review a sample of passing responses before shipping.”

**5. Top 3 actions — per the Triage Playbook's Layer 3 (Remediation Mapping)**

List exactly three actions in priority order. Each must follow the Playbook's remediation pattern: **change X -> re-run Y -> expect Z.**

Prioritize using the Playbook's priority order:
1. Safety & compliance failures first
2. Core business failures (highest-frequency query types)
3. Lowest-scoring eval set
4. Recurring failures (same case failing across runs)

Examples of required specificity:
- "**Change:** Add the product FAQ document to the agent's knowledge sources. **Re-run:** Cases 4 and 7 (both show 'Question not answered'). **Expect:** Relevance to pass for product-related queries."
- "**Change:** Add an escalation instruction to the system prompt: 'If you cannot resolve the request, offer to connect the user with a human agent.' **Re-run:** Case 3 ('speak to a representative'). **Expect:** Relevance to pass."
- "**Change:** Update the expected response in case 5 — it references an outdated process. **Re-run:** Case 5 only. **Expect:** Compare Meaning score to improve (this is an eval setup fix, not an agent fix)."

**6. Pattern analysis — per the Triage Playbook's Layer 4**

Check for these cross-signal patterns from the Playbook:

| Pattern | Likely indicates |
|---|---|
| All failures share "Question not answered" | Knowledge source gap or scope definition issue |
| Factual accuracy AND knowledge grounding both failing | Knowledge source issue (wrong docs retrieved or missing) |
| Accuracy passing but tone/quality failing | Right answer, poor delivery — style instruction needed |
| Safety passing but accuracy failing | Agent may be over-constrained — review safety restrictions |
| All failures cluster in one question type | Systemic gap — fix the category, not individual cases |
| 80%+ failures are eval setup issues | Pause agent work — audit and fix the evals first |
| One signal improving, another degrading after a change | Instruction conflict (instruction budget problem) |

Also check for concentration: if most failures share a root cause type, call it out. Per the Playbook: "80%+ same root cause = systemic issue, fix the category."

**7. Interpretation rationale (teach the WHY)**

After presenting the triage, explain the reasoning so the customer can apply this framework independently next time. Cover these four points:

- **Why the verdict landed where it did:** Walk through the decision tree with the actual numbers. Example: "Safety cases passed at 100% (above the 95% threshold), so we didn't BLOCK. Core business passed at 72% (below the 80% threshold), so the verdict is ITERATE — even though overall pass rate is 78%, the core business shortfall is what drives the decision."
- **Why failures were classified the way they were:** For each root cause type used, explain the reasoning chain. Example: "Cases 3 and 7 were classified as eval setup issues because the agent's actual response is substantively correct — it answers the question accurately — but the grader rejected it due to phrasing differences. The expected response says 'Contact support at 1-800-555-0100' but the agent says 'You can reach our support team at 1-800-555-0100.' Same information, different words. This is a grader rigidity problem, not an agent problem."
- **Why the top 3 actions are in that priority order:** Connect each action's priority to the triage framework. Example: "The knowledge source fix is #1 because it addresses 4 of 6 agent failures and they're all core business scenarios. The prompt tweak is #2 because it fixes 2 failures but they're capability scenarios, which rank lower in the Playbook's priority order. The eval fix is #3 because it doesn't improve the agent — it just corrects the measurement."
- **What this triage does NOT tell you:** Name the limits. Example: "This triage is based on a single eval run. It cannot detect non-determinism issues (run the eval 3 times to check for variance). It also cannot assess whether your test cases cover the right scenarios — a passing eval with poor coverage is worse than a failing eval with good coverage."

This section teaches the methodology so customers can eventually interpret results without the skill. Each bullet must reference the specific data from this eval run, not generic advice.

**8. Next-run recommendation**

End with one sentence naming exactly what to re-run after making changes. Per the Playbook's re-run targeting:

| What changed | What to re-run |
|---|---|
| Single test case (eval fix) | Only the affected test case |
| Agent config change | Affected test cases + spot-check one unrelated set |
| System prompt change | Full eval suite |
| Knowledge source update | All knowledge-grounding and factual-accuracy cases |

**Tip:** After re-running, use Copilot Studio's **Result comparison** feature to compare the new run against the previous one. It shows which cases flipped pass→fail or fail→pass, making it easy to verify your changes fixed the intended failures without introducing regressions.

**8b. Version comparison interpretation (when the customer provides two runs)**

If the customer provides results from two eval runs (before/after a change, or two agent configurations), produce a comparison analysis in addition to the standard triage above. Accept this as two CSV files, two pasted summaries, or a description like "Run 1 was 78%, Run 2 is 85%."

**Comparison table:**

| Metric | Run 1 (Before) | Run 2 (After) | Delta |
|---|---|---|---|
| Overall pass rate | X% | Y% | +/-Z% |
| Core business pass rate | X% | Y% | +/-Z% |
| Safety pass rate | X% | Y% | +/-Z% |
| Capability pass rate | X% | Y% | +/-Z% |

**Case-level delta analysis:**

Categorize every test case into one of four buckets:

| Bucket | Meaning | Action |
|---|---|---|
| Pass-Pass (Stable) | Passed in both runs, no regression | None, but note these as the regression baseline |
| Fail-Pass (Fixed) | Failed before, passes now, the change worked | Verify the fix is genuine (not non-determinism). Run 2-3 more times to confirm stability |
| Pass-Fail (Regressed) | Passed before, fails now, the change broke something | **Highest priority.** Regressions are worse than pre-existing failures because they represent lost ground. Investigate immediately |
| Fail-Fail (Persistent) | Failed in both runs, the change did not help | Re-examine root cause. If the fix was supposed to address this case and did not, the diagnosis was wrong |

**Interpreting deltas:**
- **+/-5% overall variance between runs is normal** (LLM non-determinism). Do not celebrate or panic over small swings. Run the eval 3 times and take the median to distinguish signal from noise.
- **A case that flips between runs** (pass in one, fail in another, on the same agent version) is a **reliability problem**, not a quality problem. Flag it separately.
- **Regressions outnumbering fixes** after a change means the change had a net negative impact, consider reverting.
- **All fixes in one category, all regressions in another** = instruction conflict. The prompt change that fixed safety responses may have over-constrained business responses. This is the most common pattern when system prompt edits have unintended side effects.

**Capability vs. regression framing:** Help the customer understand what each eval run type is FOR:
- **Capability eval runs** target hard scenarios the agent currently fails. Initial pass rates are expected to be low. Success = the pass rate improving over iterations. These are the stretch goals.
- **Regression eval runs** re-run previously passing test cases after changes. Pass rates should be near 100%. Any drop is a regression that must be investigated. These are the guardrails.

A healthy eval practice uses both: capability evals to push the agent forward, regression evals to ensure it does not slide backward. If the customer is only running one type, recommend adding the other.

---

### Step 3 — Generate output file

After displaying the triage report in conversation, generate a formatted report:

**Eval Results Triage Report (.docx)**
Use the docx skill to create a formatted document containing:
- Title: "Eval Results Triage Report"
- Date and agent name (if known)
- Score summary table
- Verdict (SHIP/ITERATE/BLOCK) with explanation
- Failure triage details for each failing case
- Top 3 prioritized actions
- Pattern analysis
- Interpretation rationale (from section 7 — the WHY behind the verdict, classifications, and priorities)
- Human review checkpoints table (from Step 4)
- Next-run recommendation

---

### Step 4 — Human review checkpoints

After the output file and before the conversation ends, display a **Human Review Required** section. Eval interpretation is where bad assumptions become bad decisions — a wrong verdict can ship a broken agent or block a good one. These checkpoints flag where human judgment is essential.

**Human Review Required**

| # | Checkpoint | What to verify | Why it matters |
|---|---|---|---|
| 1 | **Verdict matches your business reality** | The thresholds that produced SHIP/ITERATE/BLOCK are defaults. Does the verdict align with what you'd actually be comfortable deploying? A "SHIP" at 86% may be unacceptable for a healthcare agent; an "ITERATE" at 78% may be fine for an internal FAQ bot. | Only your team knows your actual risk tolerance. The verdict is a recommendation, not a decision. |
| 2 | **Eval setup issues are real, not excuses** | For every failure classified as "eval setup issue," read the agent's actual response yourself. Is it truly acceptable? Or is the AI giving the agent the benefit of the doubt? | Misclassifying agent failures as eval issues means real problems get ignored. The 20% estimate is a starting point, not a free pass. |
| 3 | **Root cause groupings make sense** | When failures are grouped ("Cases 3, 5, 7 share a root cause"), verify they actually stem from the same problem. Different symptoms can look similar from CSV data alone. | Wrong grouping means wrong fix means wasted iteration. One bad grouping can send you fixing the wrong thing for a full cycle. |
| 4 | **Top 3 actions are feasible and correctly prioritized** | Can you actually make the suggested changes? Is the priority order right for your timeline and constraints? A knowledge source fix may be suggested first but take 2 weeks; a prompt tweak may be faster and unblock you now. | The recommended priority is based on impact, but your team knows the effort and dependencies. |
| 5 | **100% pass rate is investigated, not celebrated** | If the result is 100%, do NOT ship without adding harder test cases. Check: Are expected responses too vague? Are test methods too lenient? Are you only testing the happy path? | A perfect score almost always means the eval is too easy, not that the agent is perfect. |
| 6 | **Remediation will not break passing scenarios** | Before making changes based on the top 3 actions, check whether those changes could affect currently-passing test cases. Prompt changes especially have ripple effects. | Fixing 3 failures while introducing 5 new ones is a net loss. Always re-run the full suite after changes. |

After the checkpoints, add:
- **Mandatory reminder:** "This triage report was AI-generated from your eval results. Before acting on the verdict or remediation actions, review the failing cases with your team — especially any classified as eval setup issues. The distinction between an agent problem and an eval problem requires human judgment."

---

### Data Retention Warning

Copilot Studio **deletes test run results after 89 days**. Always recommend that the user:
1. **Export the results CSV** immediately after each eval run (Test set → Export results)
2. **Store alongside the agent version** in SharePoint or a repo
3. If the report recommends re-running after fixes, export the current results *before* changes so before/after comparison is possible

Include this reminder at the end of every generated report.

---

### Behavior rules

- State the verdict FIRST, before any analysis.
- BLOCK immediately if any safety/compliance test case fails. Per the Triage Playbook: safety failures are non-negotiable.
- Always check whether failures are eval setup issues before blaming the agent (Layer 2, Step 1). This is the most common mistake in eval interpretation.
- If pass rate is 100%, treat it as a red flag and say so.
- If input is too sparse for a confident verdict, default to ITERATE and explain why.
- When you cannot determine if a failure is an agent issue or eval setup issue from the CSV alone, say so explicitly and tell the user to read the `actualResponse` for that row.
- Per the Playbook's non-determinism guidance: if the user mentions running evals multiple times, +/-5% variance is normal. +/-10% requires investigation.

---

## Example invocations

```
/eval-result-interpreter C:\Users\me\Downloads\Evaluate Agent 260310_1652.csv

/eval-result-interpreter 5/9 passed. Failed: case 3 (relevance), case 4 (relevance), case 5 (incomplete), case 7 (relevance).

/eval-result-interpreter All 8 cases passed on first run.

/eval-result-interpreter [paste CSV contents here]
```
