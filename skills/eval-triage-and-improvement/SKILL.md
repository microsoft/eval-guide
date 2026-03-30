---
name: eval-triage-and-improvement
description: 'Use this skill when the user''s Copilot Studio agent evaluations have come back and they need to interpret scores, diagnose root causes of underperforming test cases, find remediation steps, or analyze patterns to improve their agent. Always use this skill when the user mentions: "eval failed", "why did this fail", "triage", "diagnose failure", "low pass rate", "fix evaluation results", "not passing", "failing test cases", "evaluation results", "improve my eval scores", or any situation where eval scores need interpretation and action.'
---

# Eval Triage & Improvement

You help users interpret their agent evaluation results and find actionable next steps to improve. Follow the hybrid workflow: gather eval results first, then generate a structured triage report with root causes, owners, and recommended fixes.

This skill serves **Stages 2-4** of the [MS Learn 4-stage evaluation framework](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-checklist) — the iterative loop of running evals, diagnosing failures, applying fixes, and re-running. In Stage 4 (Operationalize), this skill helps triage regressions caught by CI/CD eval runs after agent updates. Use the [evaluation checklist template](https://github.com/microsoft/PowerPnPGuidanceHub/tree/main/guidance/agentevalguidancekit) to track your position in the lifecycle.

### When to use this skill vs. eval-result-interpreter

These two skills share the same triage framework but serve different modes of work:

| Use **eval-triage-and-improvement** when… | Use **eval-result-interpreter** when… |
|---|---|
| You want **interactive guidance** walking through diagnosis step by step | You have a CSV file or concrete results and want a **one-shot structured report** |
| You are in an **ongoing improvement loop** — fixing, re-running, and re-triaging | This is your **first look** at results — you need a verdict and top actions fast |
| You need **detailed remediation help** for specific quality signals (e.g., "wrong tool fires — now what?") | You want a **customer-deliverable artifact** (the .docx triage report) |
| You have **many failures** (15+) and need help prioritizing which to investigate | The eval run is relatively straightforward (<20 failures) |
| You need the playbook worked examples and deeper diagnostic walkthroughs | You need the **activity map / result comparison** tool recommendations inline |

**If in doubt:** Start with eval-result-interpreter to get the structured report, then switch to eval-triage-and-improvement if you need interactive help implementing the fixes.

## Workflow

### Step 1: Gather Eval Results

Ask the user to share:
1. **Which eval sets ran** and their pass rates (e.g., "Knowledge Grounding: 71%, Safety: 95%")
2. **Specific failing test cases** — the test case ID, sample input, expected value, actual agent response, and eval method
3. **How many times they've run** — is this the first run or have they run multiple times?
4. **What they've already tried** — any fixes attempted so far?

If they don't have structured results, help them organize what they have. If they just have a general complaint ("my agent isn't working well"), guide them to run an eval first using the scenario library.

### Step 2: Score Interpretation

Use these thresholds to assess readiness:

```
READINESS ASSESSMENT

Safety/Compliance < 95%  → BLOCK (fix before anything else)
Core business < 80%      → ITERATE (focus here)
Capabilities < threshold → CONDITIONAL SHIP (document gaps)
All above threshold      → SHIP
```

**Setting thresholds** — don't apply fixed numbers. Derive from risk profile:

| Factor | Higher Threshold When... |
|--------|------------------------|
| Consequence of failure | Financial loss, safety risk, legal exposure |
| Frequency of query type | Users trigger this quality signal often |
| Fallback availability | No human backup, or slow backup |
| Audience | External customers, regulated industry |

### Step 3: Pre-Triage Infrastructure Check

Before diagnosing individual failures, verify infrastructure was healthy during the eval run:

- [ ] All knowledge sources accessible and fully indexed?
- [ ] API backends and connectors returned no errors/timeouts?
- [ ] Authentication tokens valid throughout the run?
- [ ] Correct agent version was published and evaluated?

If any dependency was unhealthy, recommend re-running after fixing infrastructure before triaging.

### Step 4: Prioritize Failures

If the user has many failures, recommend this triage order:

| Priority | Triage First | Rationale |
|----------|-------------|-----------|
| 1 | Safety & compliance failures | Highest consequence; blocks ship |
| 2 | Core business failures (high-priority tests) | Direct impact on agent value |
| 3 | Lowest-scoring eval set failures | Likely systemic — fixing root cause resolves multiple |
| 4 | Recurring failures (same test case across runs) | Most diagnosable |
| 5 | Capability scenario failures | Important but lower blast radius |

**15+ failures?** Don't triage every one. Review 3-5 from the lowest-scoring eval set. If they share a root cause, fix that and re-run.

### Step 5: Classify Root Cause

For each failure, work through the diagnostic questions in order:

```
TRIAGE DECISION TREE (for each failing test case)

1. Is the agent's response actually acceptable, even though it failed?
   → YES = Eval Setup Issue (grader or expected value is wrong)

2. Is the expected answer still current against the actual source?
   → NO = Eval Setup Issue (expected answer outdated)

3. Does the test case represent a realistic user input?
   → NO = Eval Setup Issue (unrealistic test case)

4. Could a valid alternative response also be correct, but grader rejects it?
   → YES = Eval Setup Issue (grader too rigid)

5. Is the eval method appropriate for what you're testing?
   → NO = Eval Setup Issue (wrong method for this quality signal)

ALL PASS → The eval is valid. Proceed to agent diagnosis:

6. Can you identify a specific config to change?
   → YES = Agent Configuration Issue

7. Does the fix persist after config change + re-run?
   → NO = Platform Limitation
```

### Step 5b: Conversation (Multi-Turn) Triage

For conversation eval failures, the standard decision tree still applies but you must first identify the **critical turn** — the earliest turn where the agent went wrong. Everything after a bad turn is a cascade, not independent failures.

**Critical turn identification:**
1. Walk the conversation turn by turn
2. Find the first turn where the agent response diverges from expected behavior
3. Classify that turn using the decision tree above
4. Mark downstream turns as "cascade — blocked by Turn N fix"

**Conversation-specific failure patterns and remediations:**

| Pattern | How to spot it | Root cause area | Remediation |
|---------|---------------|-----------------|-------------|
| **Context loss** — Turn 1 fine, Turn 3+ forgets | Agent re-asks or contradicts earlier turns | Agent Config | Review topic management; ensure conversation context is preserved across topic switches |
| **State loop** — Agent repeats the same response | Identical or near-identical agent turns in sequence | Agent Config | Check topic routing for circular references; add explicit exit conditions |
| **Clarification failure** — Agent can't handle follow-ups | Turn 2 fails when user provides clarification or correction | Agent Config | Add follow-up handling instructions; check that topics accept partial/corrective inputs |
| **Last-mile failure** — Understands but can't resolve | Early turns diagnose correctly, final resolution turn fails | Agent Config or Platform | Check action/connector configuration; verify the resolution path is wired correctly |
| **Eval rigidity** — Conversation is acceptable but grader rejects | Reading the full conversation, the outcome is reasonable | Eval Setup | Conversation grading is limited (AI Generated or Approval Rating only); adjust rubric or expected values |

**Key difference from single-response triage:** Do NOT triage each turn independently. Triage the critical turn, apply the fix, re-run, and then see which downstream turns self-resolve. Expect 40-60% of downstream failures to clear after fixing the critical turn.

### Three Root Cause Types

| Root Cause | Who Acts | What It Means |
|-----------|---------|---------------|
| **Eval Setup Issue** | Eval author | The test/grader is wrong. The agent may be fine. |
| **Agent Configuration Issue** | Agent builder | Agent genuinely produced a bad response. Fixable through config. |
| **Platform Limitation** | Platform team | Caused by platform behavior. Cannot fix through config. |

### Step 6: Map to Remediation

For detailed remediation steps by root cause type and quality signal, read the playbook files:
- **Full triage decision tree**: Read `triage-and-improvement-playbook/triage-decision-tree.md`
- **Remediation mapping**: Read `triage-and-improvement-playbook/remediation-mapping.md`
- **Pattern analysis**: Read `triage-and-improvement-playbook/pattern-analysis.md`
- **Worked examples**: Read `triage-and-improvement-playbook/worked-examples.md`

#### Quick Remediation Reference

**Eval Setup Fixes:**

| Sub-Type | Fix |
|----------|-----|
| Outdated expected answer | Update expected value to match current source content |
| Overly rigid grader | Switch to Compare Meaning, or broaden keyword set |
| Unrealistic test case | Rewrite input using actual user language |
| Wrong eval method | Change method to match quality signal (see scenario library) |
| Grader error/bias | Review rubric, add examples, consider deterministic method |

**Agent Configuration Fixes:**

| Quality Signal | Common Fix |
|---------------|-----------|
| Factual accuracy (wrong source) | Review knowledge source config, verify indexing, check vocabulary match |
| Factual accuracy (wrong extraction) | Add extraction guidance to system prompt |
| Hallucination | Add instruction: "Only answer from knowledge sources. If unavailable, say so." |
| Wrong tool fires | Rewrite tool descriptions to differentiate; add negative examples |
| Tool doesn't fire | Review trigger conditions; check if tool is enabled and accessible |
| Wrong topic fires | Review trigger phrase overlap; adjust priority ordering |
| Lacks empathy | Add context-specific tone instructions to system prompt |
| Scope violation | Add explicit out-of-scope instruction |
| PII leakage | Add PII protection instruction; review authentication scope |

**Platform Limitation Response:**
- Document the limitation with evidence
- Implement workaround where possible
- Adjust eval thresholds to account for known platform behavior
- File with platform team with reproduction steps

### Step 7: Triage Rationale (teach the WHY)

Before generating the report, add rationale that teaches the customer the reasoning behind triage decisions — not just the conclusions. For each of these, use the actual eval data from this triage:

1. **Why each failure got its root cause classification** — Walk through the decision tree for at least one example per root cause type. E.g., "Test case KB-014 was classified as an Eval Setup Issue because the agent response is factually correct per the current knowledge source, but the expected value still references the old 14-day policy. The agent is right; the eval is stale."

2. **Why the remediation targets config vs. content vs. eval** — Explain the logic: "We recommended updating the knowledge source rather than changing the prompt because the agent retrieval worked correctly — it found the right document — but the document itself contains outdated information. A prompt change would mask the real problem."

3. **Why the priority order is what it is** — Connect to blast radius and dependency chains: "Safety failures are first not just because they are severe, but because safety prompt instructions can conflict with other behaviors. Fix safety, re-run, then triage the rest — otherwise you are diagnosing failures that might disappear once the safety instructions are in place."

4. **What this triage does NOT tell you** — Name the limits explicitly: "This triage analyzed [N] failures from a single eval run. It cannot detect issues in scenarios you have not written test cases for, and it cannot distinguish between a flaky failure (non-determinism) and a real failure from a single data point. If a failure is borderline, re-run before investing in a fix."

Include this rationale in the triage report (see Triage Rationale section in the report template below).

### Step 8: Generate Triage Report

Output a structured triage report:

```markdown
# Triage Report: [Agent Name] — [Date]

## Score Summary
| Eval Set | Pass Rate | Threshold | Status |
|----------|-----------|-----------|--------|
| ... | ... | ... | PASS/BLOCK/ITERATE |

## Readiness Assessment
[SHIP / SHIP WITH KNOWN GAPS / ITERATE / BLOCK]
[Rationale]

## Failure Analysis
### Failure 1: [Test Case ID]
- **Quality Signal:** ...
- **Sample Input:** ...
- **Expected:** ...
- **Actual:** ...
- **Root Cause:** [Eval Setup / Agent Config / Platform Limitation]
- **Diagnosis:** [specific diagnosis]
- **Owner:** [who needs to act]
- **Remediation:** [specific action]
- **Verification:** [how to verify the fix worked]

[Repeat for each triaged failure]

## Triage Rationale
### Why these root cause classifications
[Walk through the decision tree for representative examples — show the reasoning, not just the label]

### Why these remediations
[Explain the logic connecting root cause to fix — why this fix and not an alternative]

### Why this priority order
[Connect priority to blast radius and dependency chains]

### What this triage does NOT tell you
[Name the limits: coverage gaps, single-run non-determinism, untested scenarios]

## Systemic Patterns
[If 80%+ of failures share a root cause, call it out]

## Action Items
| # | Action | Owner | Priority | Verification |
|---|--------|-------|----------|-------------|
| 1 | ... | ... | ... | Re-run [eval set] |

## Post-Triage Checklist
- [ ] All safety/compliance failures addressed
- [ ] Root causes verified (re-run after fixes)
- [ ] Known gaps documented with owners
- [ ] Platform limitations filed if applicable

## Human Review Required
[Include human review checkpoints table — see Human Review Checkpoints section below]
```

### Post-Triage Verification

After fixes are applied:
- **Scores flat after fix?** → Wrong root cause, re-triage
- **One score up, another down?** → Instruction conflict — the fix improved one behavior but degraded another
- **80%+ of failures share root cause?** → Systemic issue — fix the category, not individual test cases

## Non-Determinism Handling

LLM-based agents and graders produce variable outputs:
- **Establish baselines:** Run 3+ times before treating any score as baseline. Use the average.
- **Normal variance:** +/-5% between runs is expected. Investigate if >10%.
- **Flaky test cases** (pass sometimes, fail others): Agent may produce two valid responses but eval is too rigid. Investigate whether to broaden the expected value.
- **Small eval sets (<30 test cases):** A single test case flip changes the score by 3%+. Don't over-interpret.

## Supplementary Signal: User Reactions

If the agent is deployed (even in preview), check user reactions (thumbs up/down) in Copilot Studio analytics alongside eval results. During an improvement loop, reactions help you prioritize:

- **High thumbs-down on a topic where eval passes:** Your eval may not be testing what real users care about. Add test cases that reflect the actual user complaints.
- **Thumbs-down clustering after a config change:** Your fix may have introduced a regression that the eval doesn’t catch yet. Investigate and expand test coverage.
- **Steady thumbs-up on a topic where eval fails:** Consider whether the eval is too strict — real users may be satisfied with responses the grader rejects.

Reactions are noisy (biased toward engaged users, small sample) and cannot diagnose root causes. Use them as a prioritization signal, not a verdict.

## Human Review Checkpoints

Before acting on the triage report, review these checkpoints. Triage decisions directly drive agent changes — a wrong diagnosis wastes an entire iteration cycle.

| # | Checkpoint | Why it matters |
|---|---|---|
| 1 | **Verify root cause classifications yourself** — For each failure classified as eval setup issue, read the agent actual response. Is it truly acceptable, or is the triage giving the agent the benefit of the doubt? | Misclassifying agent failures as eval issues means real problems get ignored. The 20% baseline is a starting point, not a blanket excuse. |
| 2 | **Confirm systemic pattern diagnoses before applying systemic fixes** — If the report says 80%+ failures share a root cause, verify by reading the actual responses. Similar symptoms can have different causes. | A wrong systemic diagnosis means you apply one fix expecting to resolve many failures, but only fix some or none. |
| 3 | **Validate remediation feasibility and priority order** — Can your team actually make the suggested changes? Is the priority order right for your timeline and constraints? | The triage prioritizes by impact, but your team knows effort and dependencies. A knowledge source fix may take 2 weeks; a prompt tweak may unblock you now. |
| 4 | **Check that proposed fixes will not regress passing scenarios** — Before making changes, consider which currently-passing test cases could be affected. Prompt changes especially have ripple effects. | Fixing 3 failures while introducing 5 new ones is a net loss. Plan to re-run the full suite after any agent configuration change. |
| 5 | **Validate platform limitation classifications before escalating** — If a failure is classified as a platform limitation, confirm the behavior persists across multiple prompt and config variations before filing with the platform team. | Escalating a configuration issue as a platform bug wastes platform team time and delays your actual fix. |
| 6 | **Review threshold choices against your actual risk tolerance** — The readiness thresholds are defaults. Does SHIP/ITERATE/BLOCK match what you would actually be comfortable deploying? | Only your team knows your real risk tolerance. A SHIP at 82% may be fine for an internal tool but unacceptable for a customer-facing agent in a regulated industry. |

Include this table in the triage report output. Add: This triage report accelerates diagnosis but does not replace human judgment. Review checkpoints 1 and 2 before acting on any remediation — the distinction between eval issues and agent issues requires reading the actual responses.

## Data Retention Warning

Copilot Studio **deletes test run results after 89 days**. This means your baseline results from an initial eval may be gone before your next quarterly review. After every triage cycle:

1. **Export the results CSV** immediately (Test set → Export results)
2. **Store alongside your triage report** in SharePoint, a repo, or wherever your team keeps versioned artifacts
3. **Tag with agent version and date** so future comparisons are possible

If your triage identified a fix-and-rerun cycle, export the pre-fix results *before* applying changes. You need the before/after comparison, and Copilot Studio won't keep the "before" forever.

## Cross-Reference

This skill works alongside the **AI Agent Evaluation Scenario Library** (`github.com/microsoft/ai-agent-eval-scenario-library`), which defines the scenarios and quality signals that produce the eval results this triage skill helps interpret, and the **Triage & Improvement Playbook** (`github.com/microsoft/triage-and-improvement-playbook`), which provides the diagnostic frameworks used in this skill's triage steps.

### Related eval skills

| After triage, if you need to... | Use this skill |
|---|---|
| Build or expand the eval plan with new scenarios identified during triage | `/eval-suite-planner` |
| Generate new test cases for expanded or revised scenarios | `/eval-generator` |
| Get a quick structured report from a new CSV (without interactive triage) | `/eval-result-interpreter` |
| Answer a methodology question that came up during triage | `/eval-faq` |
| Walk the customer through the full eval pipeline end-to-end | `/eval-guide` |
