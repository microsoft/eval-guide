# Eval Setup Guide — Running Your Evals in Copilot Studio

<!--
  AI-readable source content. The customer-facing artifact is generated as
  `eval-setup-guide-<agent>-<date>.docx` via the /docx skill at Stage 2 close.
  See SKILL.md "Stage 2 → After confirmation → Deliverable E" for rendering rules.
  Edit this file when the setup steps or screenshots change; the docx render
  follows automatically on the next session.
-->

> **Pillar:** 3 — Run evals across the lifecycle (companion to the rerun protocol)
> **Purpose:** A step-by-step walkthrough for setting up and running the eval CSVs you just generated against your Copilot Studio agent.
> **When to use:** First time you run the evals from this session, and any time someone new to your team is setting up an eval run.

This is the operational companion to your eval set. Your CSVs and your eval plan tell you *what* to run; this guide tells you *how* to run them inside Copilot Studio without getting lost in the UI. Read once end-to-end before you start, then keep it open as a reference during your first run.

## What you should have before you start

If any of these are missing, finish them first — running the eval before this list is in place wastes time and produces ambiguous results.

| You need | Where it came from | What it looks like |
|---|---|---|
| Your eval CSVs (one per quality signal) | Stage 2 of `/eval-guide` | `eval-knowledge-accuracy-<date>.csv`, `eval-safety-compliance-<date>.csv`, etc. |
| Your eval plan `.docx` | Stage 1 of `/eval-guide` | `eval-plan-<agent>-<date>.docx` — keep it open; the quadrants and pass/fail conditions live here. |
| A Copilot Studio agent in your environment | Whoever built the agent | Reachable in the Copilot Studio Maker portal. |
| Maker access to that agent | Your tenant admin | You can open the agent and see the **Test** / **Evaluate** tab without errors. |
| One LLM-judge run budget | Your tenant / API plan | LLM-judge methods (`General quality`, `Compare meaning`, `Custom`) consume tokens — confirm budget before kicking off a 100-case run. |

## Step 1 — Open the Evaluate tab

1. Sign in to Copilot Studio (`copilotstudio.microsoft.com`) and select the environment your agent lives in.
2. Open your agent.
3. In the left rail, choose **Test** → **Evaluate** (the exact label may show as **Evaluations** depending on your tenant rollout).
4. If the tab is missing, your tenant either hasn't enabled the Evaluation feature or you don't have Maker rights. Ask your admin to enable it before continuing.

## Step 2 — Create a test set

A test set is one bundle of test cases that share an evaluation mode. You will create **one test set per CSV** (i.e., one per quality signal).

1. Click **New test set**.
2. Name it after the CSV you're about to import — e.g., `Knowledge Accuracy — 2026-05-05`. Naming consistency makes re-run logs (Pillar 3) and baseline comparisons (Pillar 5) much easier later.
3. Choose the evaluation mode:
   - **Single response** *(default — fits ~80% of agents)*: each test case is one Question + one Expected response. Up to 100 cases per set. All seven test methods supported.
   - **Multi-turn / Conversation**: each test case is a sequence of up to 6 user/agent exchanges. Up to 20 cases per set. Only `General quality`, `Keyword match`, `Capability use`, and `Custom` are supported.
   - **If you don't know which one to pick, choose Single response.** That's what your `/eval-guide` Stage 2 CSVs default to.
4. Save.

## Step 3 — Import the CSV

1. Inside the new test set, click **Add test cases** → **Import from CSV**.
2. Pick the CSV for the signal you're setting up (e.g., `eval-knowledge-accuracy-<date>.csv`). **It has exactly two columns: `Question` and `Expected response`.** That's by design — the testing method is **not** in the CSV. You will set it manually per row in the next step.
3. Confirm the column mapping:
   - `Question` → user prompt the agent will receive.
   - `Expected response` → the reference value the test case compares against. The eval-guide skill pre-fills this with the most useful starting value per row (canonical answer, keyword list, or blank, depending on the criterion).
4. Import. Spot-check the first 3 rows after import — UTF-8 quote handling and embedded commas are the most common reasons rows look mangled.

> ⚠️ **The CSV does not carry the testing method.** That decision is yours, made in the Copilot Studio UI, per row, in Step 4 below. Do not assume the imported rows are ready to run — they are not.

## Step 4 — Set the testing method per row in the Copilot Studio UI

**This is the most important manual step in the setup.** The eval-guide skill cannot encode test methods in the CSV — Copilot Studio's Evaluation tab assigns the method per row in its own UI after import. **Every row must have a method set before you can run the eval.**

### What to do, row by row

1. In the imported test set, find the **Testing method** column (a dropdown per row).
2. For every row, pick the method based on the criterion that row tests. Use the decision tree below.
3. Save the test set after the last row is configured.

### How to pick the method (quick decision tree)

Walk this top-down — first match wins.

1. **Is the criterion about the agent invoking the right tool/topic, regardless of phrasing?** → `Capability use` (called *Tool use* in some UI versions).
2. **Is the response a fixed string or templated output (IDs, codes, structured replies)?** → `Exact match`.
3. **Must the response contain specific words or disclaimers (compliance, citation phrases, required boilerplate)?** → `Keyword match`. Edit the cell to a comma-separated keyword list if it isn't already.
4. **Is there a clear correct answer that can be phrased many ways?** → `Compare meaning`. The cell already holds the canonical answer.
5. **Is correctness a 0/1 string-similarity question (close enough wording)?** → `Text similarity`.
6. **Is the criterion subjective (tone, helpfulness, completeness, safety) with no single right answer?** → `General quality`. **Clear the Expected response cell** — General quality grades against the criterion's pass/fail conditions, not a reference.
7. **None of the above fit cleanly?** → `Custom`. Configure the rubric in the test-set's Custom method settings (the eval-guide skill drafts a rubric per criterion in the test-case `.docx` report — paste that in).

If two methods feel equally right, prefer the cheaper, more deterministic one (`Keyword match` > `Text similarity` > `Compare meaning`/`General quality`). LLM-judge methods cost tokens and have ±5% run-to-run variance.

### What goes in the Expected response cell, per method

| Method | What the cell should contain |
|---|---|
| `Compare meaning` | Canonical answer in natural language. Paraphrase OK at run time. |
| `Text similarity` | Expected text. Higher similarity → pass. |
| `Exact match` | Exact string. Byte-equal at grade time. |
| `Keyword match` | Comma-separated keywords (`"escalate, manager, callback"`). All must appear by default. |
| `General quality` | **Empty.** Judge uses the criterion's pass/fail conditions instead. |
| `Capability use` | **Empty** (or, if your tenant supports it, the expected tool/topic name). |
| `Custom` | **Empty** in the cell. The rubric is configured at the test-set level, not per row. |

If a row's pre-filled cell content doesn't match the method you're picking — for example, the cell has a long sentence but you want `Keyword match` — edit the cell. The CSV's pre-fills are starting points, not final.

### Per-method setup, thresholds, and pitfalls (depth reference)

Read the block for whichever method you assigned in the CPS dropdown. Each block tells you (a) how to configure it, (b) what threshold to set, and (c) common pitfalls.

#### General quality (LLM judge — rubric-based, no reference answer)

- **Setup in the UI:**
  - Leave the **Expected response** column blank for these rows (the judge isn't comparing to a reference).
  - Provide a **rubric / pass condition** in the test set's method configuration. Paste the criterion's *Pass condition* from your eval plan verbatim — e.g., *"Response is empathetic and acknowledges the user's frustration before giving an answer."*
  - If the UI exposes a **judge model** dropdown, leave it on the default unless your tenant requires a specific one.
- **Threshold (how to set it):** the judge returns a 1–5 score per case.
  - Default Pass threshold: **score ≥ 4**.
  - Stricter (High Value · High Risk / Low Value · High Risk quadrants): **score ≥ 4.5** (effectively requires a 5).
  - Looser (Low Value · Low Risk quadrant): **score ≥ 3** is acceptable.
  - Decide once per quality signal and apply uniformly — don't set per-row thresholds; they're impossible to maintain.
- **Pitfalls:**
  - Vague rubrics produce inconsistent scores. "Helpful and clear" is a bad pass condition; "Names the specific policy and links to it" is a good one.
  - Non-deterministic — re-run the set; if a borderline case flips between Pass and Fail, take the median of three runs or sharpen the rubric.
  - Highest token cost of any method. Don't use it for criteria that `Keyword match` would handle.

#### Compare meaning (LLM judge — semantic equivalence to expected response)

- **Setup in the UI:**
  - **Expected response** must be filled in with the canonical correct answer. No `[VERIFY: …]` placeholders left over.
  - The judge compares meaning, not wording — paraphrase is OK; contradiction or omission is not.
- **Threshold:** typically returned as a binary Pass/Fail by the judge, not a numeric score. If your tenant exposes a numeric similarity score instead, default Pass at **≥ 0.75**, tighten to **≥ 0.85** for High Value · High Risk / Low Value · High Risk.
- **Pitfalls:**
  - If the expected response embeds dates, prices, IDs, or anything time-sensitive, the judge will mark stale-but-close answers as Fail. Use `Keyword match` for the time-sensitive piece and split it into two criteria.
  - Same ±5% variance as `General quality`. Median of three runs for borderline cases.

#### Text similarity (deterministic string distance)

- **Setup in the UI:**
  - **Expected response** filled in. No placeholders.
  - The score is a normalized similarity (0–1) — implementation is usually a token-level F1 or ROUGE-style metric.
- **Threshold:**
  - Default Pass: **≥ 0.7** for free-form answers.
  - Tighter wording (templates, structured replies): **≥ 0.85**.
  - Loose paraphrase tolerated: **≥ 0.5**.
  - **Tune by sampling 10 cases:** look at the cases at your candidate threshold and ask "is the agent right or wrong on each?" Adjust until the threshold matches human judgment.
- **Pitfalls:**
  - Low-information answers ("Yes." / "OK.") get high similarity even when wrong context-wise. Don't use `Text similarity` on short responses.
  - Cheaper than LLM judge but **less semantic** — paraphrases that are correct can still fail. Move borderline criteria to `Compare meaning`.

#### Keyword match (deterministic — required tokens present)

- **Setup in the UI:**
  - **Expected response** holds the required keyword(s). The Evaluate tab interprets this column as the keyword list — usually a comma-separated string (e.g., `escalate, manager, callback`).
  - Decide **case-sensitive vs. case-insensitive**: default is case-insensitive; switch only if you need it (rare).
  - Decide **all keywords required vs. any keyword required**: default is *all* — every keyword must appear in the response. Use *any* for synonym sets ("password" OR "credential" OR "MFA").
- **Threshold:** binary Pass/Fail — no tuning needed.
- **Pitfalls:**
  - Over-specifying keywords leads to false fails ("I'd be happy to help you escalate" misses "manager"). Keep keyword lists short — 1–3 tokens — and use synonyms-OR mode where possible.
  - Keyword-positive answers can still be wrong (`"You should NOT escalate"` matches `escalate`). Pair with `Compare meaning` or `Custom` if direction matters.

#### Exact match (deterministic — full string equality)

- **Setup in the UI:**
  - **Expected response** is the exact string the agent must return.
  - Some tenants normalize whitespace and case before comparing; check the UI's match-mode option if you see surprising fails.
- **Threshold:** binary — 100% identical or nothing.
- **Pitfalls:**
  - Almost always wrong for free-form Q&A. Reserve for ID returns, fixed structured replies, or compliance-required exact wording.
  - Highly fragile to model variation — a single trailing period flips Pass to Fail.

#### Capability use (tool/topic routing correctness)

- **Setup in the UI:**
  - Some tenants expose **Capability use** in the same dropdown as the other methods; others surface it under a separate "Tool / topic invocation" toggle on the test set.
  - For each test row, specify the **expected capability name** — exactly as it appears in your agent's topic or action library (e.g., `topic:create_ticket`, `action:check_inventory`).
  - For agentic agents, you can additionally specify expected **slot values** the agent should have extracted before invoking the capability.
- **Threshold:** binary — was the named capability invoked? (And if slot values were specified: did each slot match?)
- **Pitfalls:**
  - Capability name mismatch is silent — if you typed `topic:CreateTicket` but the topic is `topic:create_ticket`, every case fails. Copy the name from the topic file, don't retype.
  - Doesn't validate the response *content*. Pair with `Compare meaning` if both routing and answer correctness matter — that means two test cases for the same prompt.
  - Only meaningful for agents that route to topics/actions. A single-prompt FAQ bot doesn't need this method.

#### Custom (user-defined rubric, LLM-judged)

- **Setup in the UI:**
  - Pick **Custom** as the method.
  - In the rubric field, paste a **specific, scoped rubric** with named output classes. Examples:
    - *"Classify the response as one of: ESCALATED (response routes to a human), DEFLECTED (response says it can't help), ANSWERED (response gives a direct answer). Pass if and only if class = ANSWERED."*
    - *"Did the response cite at least one source URL from the provided knowledge base? Pass = yes, Fail = no."*
  - **Expected response** can be left blank if the rubric doesn't need a reference, or used as supporting context.
- **Threshold:** defined by your rubric. Always express the rubric as a Pass/Fail decision rule, not just a description.
- **Pitfalls:**
  - Vague rubrics behave like `General quality` with extra steps. If you can't write the rubric as a deterministic decision, you don't have one — pick `General quality` instead.
  - Token cost and variance are the same as `General quality`. Custom is for *what* you're judging, not *how cheap* the judging is.

### How to choose a threshold across the test set

For LLM-judge and similarity methods, the threshold is the only knob you control after import. Three rules:

1. **Tie thresholds to quadrants, not to individual cases.** High Value · High Risk and Low Value · High Risk get the strictest threshold; High Value · Low Risk gets the default; Low Value · Low Risk gets the loosest. This is what makes the Value × Risk matrix actually do work for you.
2. **Calibrate on 10 cases before locking.** Run a small subset, sample 10 verdicts at your candidate threshold, and ask: "If I were grading this myself, would I have come to the same Pass/Fail?" If agreement is below 80%, the threshold is wrong (or the rubric is).
3. **Document the threshold next to the eval plan.** Write the threshold per quality signal into your `eval-plan-<agent>-<date>.docx` so future runs use the same bar. Drifting thresholds are the silent killer of run-to-run comparability.

### A note on the test-case `.docx` report from `/eval-guide`

The Stage 2 `.docx` test-case report (separate from this setup guide) groups every criterion and lists which method the eval-guide skill *suggested* for each. Use it as a cross-reference while you're setting methods in the CPS UI — it's the authoritative source for "this criterion was designed to be tested by Compare meaning, that one by Keyword match." If a row's pre-filled Expected response cell contradicts the method you ultimately want to use, edit the cell — see the table at the top of Step 4 for the right cell content per method.

## Step 5 — Connect to the agent endpoint

The Evaluate tab uses the agent you have open by default. You don't normally configure an endpoint here. Two exceptions:

- **You're testing a non-default version**: choose the version under **Settings** → **Agent versions** before clicking Run.
- **You're testing through DirectLine** (e.g., to evaluate a specific channel's behavior): leave the in-product Evaluation tab and use the `eval-runner.js` CLI path documented in `/eval-guide` Stage 3 instead.

## Step 6 — Run the evaluation

1. Click **Run evaluation**.
2. Watch the run banner — for 100 single-response cases against an LLM-judge method, expect 5–15 minutes depending on agent latency. Conversation evals take longer because each case is a multi-turn exchange.
3. **Don't close the tab during the run.** Closing usually does not cancel the run, but it does break your live progress view.
4. **Run order rule (from `rerun-protocol`):** start with **High Value · High Risk** and **Low Value · High Risk** quadrant test sets first. If those fail, fix and re-run before bothering with the Low-Risk quadrants — the rest is noise until the high-stakes cases pass.

## Step 7 — Read the results

When the run completes, the Evaluate tab shows:

- **Overall pass rate** for the test set.
- **Per-case verdict** — Pass / Fail with the LLM-judge's explanation. Click into any case to see the agent's full response and the judge's reasoning.
- **Score column** (1–5 for `General quality`, similarity score for `Text similarity`, etc.).

Two things to do *before* you trust the headline number:

1. **Skim the judge's explanations** for 5–10 random cases. If the judge consistently mis-grades (e.g., calling a correct answer wrong because the wording doesn't match yours), that's an *eval setup* problem, not an *agent* problem — see the 20% rule in `/eval-result-interpreter`.
2. **Apply the quadrant lens** before reacting to the pass rate. A 70% overall pass rate where every Low Value · High Risk case failed is a *worse* outcome than 60% overall where all Low Value · High Risk cases passed and the failures are in Low Value · Low Risk.

When you're ready for triage, hand the results to `/eval-result-interpreter` (Stage 4 of `/eval-guide`).

## Step 8 — Export results before they expire

Copilot Studio retains evaluation runs for **89 days**. Export every run, every time:

1. From the test set, click **Export results** → choose **CSV** (recommended) and/or **JSON**.
2. Name the file `eval-results-<agent>-<YYYY-MM-DD>.csv`.
3. Park it next to your eval plan and CSVs. Your re-run protocol (Pillar 3) and baseline-comparison workbook (Pillar 5) both consume this export.

If you skip the export, you will lose run history and the ability to compare runs once the 89 days pass.

## Common setup issues and what to do

| Symptom | Likely cause | Fix |
|---|---|---|
| CSV import fails with "row format invalid" | Smart quotes / non-UTF-8 / extra columns | Re-save the CSV as UTF-8; confirm exactly the two columns the Evaluate tab expects: `Question`, `Expected response`. No `Testing method` column should be in the file. |
| Every case fails on `Compare meaning` | Expected response column is blank or contains `[VERIFY: …]` placeholders | Fill in the expected response with verified content; never leave `[VERIFY]` markers in the imported file. |
| LLM judge marks correct answers as wrong | Pass/fail condition is too narrow, or judge doesn't know the domain | Switch to `General quality` with a more explicit pass condition, OR add a `Custom` rubric, OR fix the expected response. |
| Run gets stuck "in progress" past expected time | Agent endpoint is unreachable, throttled, or auth expired | Re-test the agent in the standard Test pane. Resolve auth/quota first; restart the run. |
| Results disappear after a few months | 89-day retention limit hit | Always export immediately after the run; cannot recover after expiry. |
| Conversation eval set rejects > 20 cases | Multi-turn cap | Split into multiple test sets, or move single-turn cases out of the conversation set. |

## You've finished setup successfully when…

- All your `eval-<signal>-<date>.csv` files are imported as named test sets in the agent.
- Each test set's evaluation mode and per-row method match your eval plan.
- A first run has completed end-to-end (even on a small subset).
- Results are exported as `eval-results-<agent>-<YYYY-MM-DD>.csv` and stored next to your eval plan.

At that point you have a repeatable eval setup. The rerun protocol tells you when to come back and run it again; the baseline-comparison workbook tells you how to compare two runs.

## Related artifacts (from this session)

- `eval-plan-<agent>-<date>.docx` — Stage 1 plan; defines the criteria each test case is judging.
- `eval-<signal>-<date>.csv` — the files you import in Step 3 (two columns: Question, Expected response). The testing method is set per row in the CPS UI in Step 4.
- `rerun-protocol-<agent>-<date>.docx` — when to re-run; pairs with this guide.
- `baseline-comparison-<agent>-<date>.xlsx` — how to compare two runs once you have multiple exports.

## References

- [Copilot Studio — Evaluate your agent (overview)](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-iterative-framework)
- [Copilot Studio — Evaluation checklist](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-checklist)
- [Copilot Studio — Result comparison](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-intro)
- `/eval-result-interpreter` — Stage 4 skill that takes the exported results and produces a triage report.
- `/eval-triage-and-improvement` — deeper-dive remediation skill once you have failures to fix.
