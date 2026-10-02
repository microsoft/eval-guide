---
name: eval-guide
description: 'Eval enablement accelerator — help customers think through "what does good look like" for their AI agent, then generate a structured eval plan and test cases they can use immediately. No built agent required — an idea or description is enough. Promotes eval-first development: write evals before building. Use when anyone mentions agent evaluation, eval planning, "what should we test", "how do we know if the agent is good", test case generation, or interpreting eval results.'
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
  1. "Yes, upgrade now" — Run: claude plugin install eval-guide@eval-guide (the marketplace source `microsoft/eval-guide` must already be added via `claude plugin marketplace add microsoft/eval-guide`)
  2. "Always keep me up to date" — Run: eval-guide-update-config set auto_upgrade true
     Then run: claude plugin install eval-guide@eval-guide
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

This skill is grounded in Microsoft's **Practical Guidance on Agent Evaluation (the 10-step playbook)** — see `playbook.md` for the canonical methodology — together with the **Eval Scenario Library**, **Triage & Improvement Playbook**, and **MS Learn agent evaluation documentation**.

**Important: You are an enablement accelerator, not a replacement.** Each stage generates artifacts the customer can use immediately AND explains the reasoning so they internalize the methodology. After one session, they should be able to do the next eval without us.

## Review Checkpoint Workflow

Plan produces a populated Eval Suite Template workbook plus a companion interactive HTML review page. Generate and Interpret produce **interactive HTML dashboards** that open directly in the browser. Dashboard stages run against a tiny localhost HTTP server (`serve.py --serve`); the customer never sees, downloads, or moves a JSON file. Feedback flows from the browser → server → the AI's `bash` stdout, in one step.

**Flow at each dashboard review stage (Generate, Interpret):**
1. Complete the stage's analysis.
2. Write stage data to a JSON file (e.g., `stage-1-data.json`).
3. Launch with `--serve` mode. The AI's bash blocks until the customer clicks Approve or Regenerate:
   `python "$(ls ~/.claude/skills/eval-guide/dashboard/serve.py 2>/dev/null || ls ~/.claude/plugins/cache/*/eval-guide/*/skills/eval-guide/dashboard/serve.py 2>/dev/null | head -1)" --stage <name> --serve --data <file>.json`
4. The customer reviews in the browser at `http://localhost:3118`: edits fields inline, updates eval-set/case/root-cause details, and adds comments. Edits auto-save to the localhost server.
5. When the customer clicks **Approve & Continue** or **Incorporate Changes & Regenerate**, the browser POSTs the feedback to `/api/feedback`. The server captures it, prints the feedback JSON to stdout between marker lines, and shuts down. **No file is downloaded; the customer never moves anything.**
6. **Parse the feedback from the bash command's stdout** — look for the block:
   ```
   ===EVAL_GUIDE_FEEDBACK_BEGIN===
   { "stage": "...", "status": "confirmed" | "changes_requested", "edits": {...}, "comments": "..." }
   ===EVAL_GUIDE_FEEDBACK_END===
   ```
   Decode the JSON between those markers — that's the customer's feedback. (`<stage>-feedback.json` is also written next to the data file as a debugging backup, but stdout is the primary channel — read from there.)
7. If `status: "confirmed"` → apply the edits, generate final deliverables (docx, CSV), proceed to next stage.
8. If `status: "changes_requested"` → apply the edits, regenerate the stage data file, re-launch the dashboard. Same loop.

The **orient stage is a pre-built static HTML** (`dashboard/orient-dashboard.html`) — agent-agnostic, no `serve.py`, no JSON write, no feedback file. The skill simply opens the file in the customer's browser and continues the conversation. See *Session Start: Orient* below.

**Review checkpoints:** Plan uses workbook + HTML review. Generate and Interpret use dashboards. Stage 3 (Run) executes tests directly.

**Key principle:** No final docx or CSV files are generated until the customer confirms the relevant checkpoint. The checkpoint replaces the "does this look right?" chat-based confirmation with a structured review.

## Before You Start

**Start from wherever the customer is.** Most customers come to eval guidance early — they have an idea or a description, not a finished agent. That's exactly right. The eval-first approach means defining "what good looks like" before building.

Ask: **"Tell me about the agent you're building or planning to build. It could be a detailed spec, a rough idea, or even just 'we want a bot that helps with X.' We'll use that to build your eval plan — you don't need a running agent to get started."**

- **If they have an idea or description (most common):** Proceed directly to Stage 0 (Discover). The conversation will help them articulate their agent's purpose, users, boundaries, and success criteria — this becomes their eval spec.
- **If they already have a running Copilot Studio agent:** Offer to connect to it for richer context: "Since you have a running agent, I can pull its configuration directly to inform the eval plan. Want to share your tenant ID so I can connect?" If yes, use `/clone-agent` to import the agent's topics, knowledge sources, and configuration. Use this to pre-fill the Agent Vision in Stage 0.
- **If they already have eval results:** Route directly to Stage 4 (Interpret).

**The key message:** Writing evals early makes the agent better. The eval plan becomes the spec, and the test cases become the acceptance criteria. Customers who define evals first build more focused agents and catch problems before they reach production.

---

## Session Start: Orient

Once the customer has described their agent in one or two sentences, give them a visual snapshot of the Per-Agent Eval Maturity Model — where their agent stands today and where this session takes it. This is the orientation moment, and it sets the frame for everything that follows.

### What to do

The orient dashboard is **pre-built and shipped with the skill** — `dashboard/orient-dashboard.html`. It is identical for every agent (the maturity model and "what you walk away with" are agent-agnostic), so there is no per-session JSON write and no Python launch. Don't ask for the agent name yet — Stage 0 captures it where it's actually needed for deliverable filenames.

1. Open the static dashboard in the customer's default browser. Use the OS launcher and the install-resolved path:
   ```bash
   ORIENT_HTML="$(ls ~/.claude/skills/eval-guide/dashboard/orient-dashboard.html 2>/dev/null || ls ~/.claude/plugins/cache/*/eval-guide/*/skills/eval-guide/dashboard/orient-dashboard.html 2>/dev/null | head -1)"
   case "$(uname -s 2>/dev/null)" in
     Darwin) open "$ORIENT_HTML" ;;
     Linux)  xdg-open "$ORIENT_HTML" ;;
     *)      cmd.exe /C start "" "$ORIENT_HTML" ;;  # Windows / Git Bash
   esac
   ```
   The `ls ... | head -1` fallback resolves the file regardless of install location — user-global skills first (`~/.claude/skills/eval-guide/`), plugin-cache second.

   **For dev installs** (skill checked out at an arbitrary path, not in `~/.claude/`), the AI should know the absolute path of the SKILL.md it's reading and substitute `<SKILL.md-dir>/dashboard/orient-dashboard.html`.

   This is a **read-only stage**. There is no feedback file, no confirmation gate, and no `serve.py` involvement. The customer reviews the snapshot in the browser while the conversation continues in chat.

2. While the dashboard is open, narrate one sentence in chat: *"This is the eval maturity model — five pillars of eval practice, five levels each. Today's session takes Pillars 1, 2, and 4 to L300 Systematic; Pillars 3 and 5 reach L200 Defined via the reference protocols you'll get at the end."*

3. Proceed to Stage 0 (Discover) without waiting. The dashboard is informational.

**When to rebuild the static HTML:** if `dashboard/templates/orient.html`, `dashboard/templates/base.html`, or `dashboard/examples/stage-orient-data.json` change, run `python dashboard/build-orient.py` once and check in the regenerated `orient-dashboard.html`. The build script reuses `serve.py`'s `generate_html`, so the rendering stays consistent with the live dashboards.

**Why this matters for the customer:** The maturity model is the value moment. Without it, the customer sees a series of stages with no map. With it, they understand exactly what they're getting and what comes next — the eval-first message lands because they can see the full journey.

**Skip orient when:** the customer has already done a session with the toolkit and is returning for a Stage 1 / Stage 2 / Stage 4 jump-in. Don't re-orient someone who already has the map.

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

Use the **Per-Agent Eval Maturity Model** as an **outcome scorecard** to orient customers on where they are today and where this session takes them. It is the progress-framing layer over the 10-step playbook (the canonical methodology lives in `playbook.md`). Five pillars of eval practice, five levels each — from `L100 Initial` (no practice in place) to `L500 Optimized` (continuous improvement built into operations). Assume the agent starts at **L100 Initial on all pillars**. This session targets **L300 Systematic on Pillars 1, 2, and 4** (in-session deliverables) and **L200 Defined on Pillars 3 and 5** (via reference protocols delivered alongside the session).

The full 5×5 definitions live in `maturity-model.md` — that file is the canonical scorecard reference. Each pillar maps to playbook steps (P1=Step 1, P2=Steps 2–5, P3=Steps 6+8, P4=Steps 7+9, P5=Step 8). Update `maturity-model.md` first when level definitions change.

| Pillar | What it measures | After this session | Mechanism |
|---|---|---|---|
| **1 — Define what "good" means** | Acceptance criteria quality | L300 Systematic ✓ | Stage 0 (Discover) + Stage 1 (Plan) |
| **2 — Build your eval sets** | Coverage and versioning | L300 Systematic ✓ | Stage 2 (Generate) |
| **3 — Run evals across the lifecycle** | Where and when evals execute (offline, pre-deploy, production) | L200 Defined ✓ | `rerun-protocol-<agent>-<date>.docx` (starter artifact) |
| **4 — Improve and iterate** | How improvements are validated | L300 Systematic ✓ | Stage 4 (Interpret) — only if eval results are available |
| **5 — Handle changes with confidence** | How changes (prompts, tools, models, architecture) get tested before shipping | L200 Defined ✓ | `baseline-comparison-<agent>-<date>.xlsx` (starter artifact) |

**Pillars 3 and 5 stop at L200 Defined this session.** L300 Systematic on those pillars requires operating practice — a release cadence with codified triggers (Pillar 3) and version-tagged baselines accumulated over multiple changes (Pillar 5). The starter artifacts get the customer to L200 in one session: a documented protocol and a fill-in workbook they can execute when triggered. Generate `rerun-protocol-<agent>-<date>.docx` and `baseline-comparison-<agent>-<date>.xlsx` at the end of Stage 2 (see deliverables C and D in Stage 2's "After confirmation" block).

Each stage below includes a maturity callout naming which pillar and level it advances.

---

## How This Maps to Microsoft's 10-Step Eval Playbook

The toolkit's canonical methodology is **Microsoft's *Practical Guidance on Agent Evaluation* — a 10-step playbook** (full definition in `playbook.md`). The operational stages below are the **session UX**; each one delivers specific playbook steps. Share this crosswalk with customers so they see how the accelerator maps to the guidance. Prefer stage **names** over numbers when talking to customers — the playbook owns the numbering.

| Operational stage | Playbook steps delivered | What it means |
|---|---|---|
| **Discover** | **Step 1** — Plan the eval effort | Name the eval objective, classify the agent's **risk tier** (5 factors), name an owner. Articulate purpose/users/boundaries/success — the eval spec. |
| **Plan** | **Steps 2–5** (plan side) | Decompose into **capability** eval sets and **trust & safety** eval sets, set **pass-rate targets + hard/soft gates**, specify **human inputs** (rubrics, ground truths, source→ground-truth map). |
| **Generate** | **Steps 2, 3, 5** (build) + **Step 8** (design) | Produce the capability + trust & safety eval sets (CSVs + manifest); tag each set `gate-only | regression | exploratory` for the regression suite. |
| **Run** | **Step 6** — Run the baseline | Execute the suite vs the current build; record per-set results with version + timestamp. |
| **Interpret** | **Step 7** — Iterate to diagnose (+ **Step 9** design) | Classify each failure as eval-setup vs agent-quality; SHIP/ITERATE/BLOCK on gates; design the production optimization loop. |
| **Closeout** _(folded into the Interpret report)_ | **Step 10** — Reusable assets | Flag reusable rubrics / trust & safety sets for the shared library (Required / Recommended / Opt-in). |

Steps 8–10 (regression suite, optimization loop, reusable assets) are **designed in-session** and **run over time** — the session leaves the customer reference artifacts to execute them.

**When to share this:** After Discover, show the customer the crosswalk and say: *"Today covers Steps 1–5 of Microsoft's playbook — planning the effort and building your capability and trust & safety eval sets. Once you have a running agent you'll run the baseline (Step 6), iterate (Step 7), then stand up the regression suite, optimization loop, and shared-asset library (Steps 8–10)."*

**Downloadable reference:** Point customers to Microsoft's [Eval Guidance Kit](https://aka.ms/EvalGuidanceKit) to track progress through all ten steps independently.

---

## Stage 0: Discover

Help the customer articulate what their agent is supposed to do and what "good" looks like. This is the most important stage — it shapes everything downstream.

### What you walk away with

- **A 1-page Agent Vision** — purpose, users, knowledge sources, core capabilities, boundaries (what the agent must NOT do), success criteria, role-based access, and the **eval objective + risk tier + owner** (playbook **Step 1**). Written down, not assumed.
- **The eval objective** — one sentence naming what "good" looks like and what decisions the evals will inform. It anchors every later choice.
- **The agent's risk tier** — HIGH / MEDIUM / LOW, classified from the **five risk factors**: reach, criticality of error, autonomy / blast radius, regulatory exposure, data sensitivity. The risk tier drives pass-rate targets, gate strictness, required trust & safety categories, and minimum adversarial coverage downstream.
- **A named owner** — one person accountable for authoring the eval, reviewing results, and signing off.
- **Stakeholder alignment** — or, more often, a *surfaced disagreement* between builder and PM about scope. 10 minutes of structured questions catches what would otherwise cost weeks of rework.
- **The spec every later stage depends on.** The Plan stage's eval plan, the Generate stage's test cases, and the Interpret stage's pass/fail judgment all trace back to what gets named here.

### When this stage is wrong for you

- You already have a written PRD, agent spec, or design doc that covers all 7 questions below. Bring it and skip to Stage 1.
- You have eval results in hand and need triage now — go straight to Stage 4.
- Your agent is a 50-topic monster. One Stage 0 pass won't fit; run Stage 0 per top-level capability.

### What to do — extract Vision, apply safe defaults, proceed to Stage 1

**Don't ask Q1–Q7 in chat.** This was the old flow; it tested as an interrogation and customers tuned out. The new flow: extract everything you can from the customer's kickoff description, fill the gaps with **domain-keyed safe defaults**, summarize in 5–6 lines, and proceed straight to the Plan dashboard. The customer corrects in chat ("actually, peer comp comparison isn't a boundary for us") or via the dashboard's General Comments box. Nothing is locked until they confirm in the dashboard.

#### Step 1 — Pre-extract from the kickoff

From the customer's 1–4 sentence description, extract:
- **Purpose** — usually the first clause ("Personalized HR support…")
- **Users** — usually implied ("employees," "customers," "internal teams")
- **Capabilities** — usually a list ("benefits, training, policies")
- **Knowledge sources** — sometimes named, often categorized ("official company resources" → SharePoint TBD)
- **Tone hints** — sometimes explicit ("trusted HR colleague," "efficient")
- **Personalization hints** — words like "personalized," "your," "based on your role"

If the kickoff is too thin (one sentence with no domain hint), ask **one** clarifying question — *"Two more sentences on what it does and who uses it would help me draft a Vision faster"* — then resume.

#### Step 2 — Apply safe defaults by domain

Domain detection runs on keywords in the kickoff description. Pick the matching default set:

| Domain trigger keywords | Default boundaries (what NOT to do) | Default risk tier |
|---|---|---|
| **HR / ESS / employee / benefits / policy / leave / payroll** | Legal advice; medical advice; salary negotiation; performance review interpretation; HR investigation details; peer compensation comparison; PII about other employees | **HIGH** (data sensitivity + regulatory exposure) |
| **Customer support / refunds / billing / accounts** | Refunds beyond policy; account-specific data outside this user's scope; legal-binding promises; competitor product recommendations | **HIGH** (reach + criticality: customer trust + financial) |
| **Knowledge / documentation / FAQ / wiki** | Content beyond the named knowledge sources; opinions framed as facts; regulated advice (legal/medical/financial) | **MEDIUM** (defaults higher if regulated content domain) |
| **IT / helpdesk / troubleshooting** | Remote-execute actions on user systems; reset credentials without verification; security advice that bypasses policy | **MEDIUM** (HIGH if security/privacy adjacent) |
| **Agentic / tool-using / "submits" / "schedules" / "books"** | Irreversible actions without confirmation; actions outside user's authorization scope; anything requiring approval the agent can't get | **HIGH** (autonomy / blast radius: writes to systems) |
| **No domain detected** | "Outside the named knowledge sources" + "anything the user-cohort isn't authorized for" + 1 generic safety guardrail | **MEDIUM** (default cautious) |

The default tier is a starting point keyed on domain. Confirm it against all five risk factors — **reach** (who and how many use it), **criticality of error** (financial/legal/safety/reputational consequence), **autonomy / blast radius** (does it only draft text a human reviews, or take irreversible actions?), **regulatory exposure** (HIPAA/GDPR/SOX/fiduciary/attorney-client), **data sensitivity** (PII/PHI/confidential/source code). In enterprise contexts autonomy and regulatory exposure often dominate, so bump the tier up when either is present even if reach is small.

**Default success criteria** (always include unless customer overrides):
- Most user questions answered directly (deflection / self-service rate)
- Out-of-scope questions routed clearly to the right human or resource (graceful handoff)
- Zero privacy / boundary breaches

**Default knowledge sources** when only categorized:
- *"some SharePoint sites"* / *"internal docs"* → flag as `Multiple SharePoint sites (TBD — name in Plan dashboard)` so the customer can fill names without us blocking on it.

**Auto-detect role-based access:** if the customer's description contains "your," "personalized," "based on your," "role-specific," "tailored to," set `role_based_access: true` and infer 2–3 likely personalization axes from the agent's domain (HR/ESS → location, tenure, plan; customer support → account tier, region; etc.). Customer corrects if wrong.

#### Step 3 — Drop aspirational-language capabilities silently

Marketing-language capabilities like *"empower employees," "explore opportunities," "streamline X"* don't survive the concreteness check. Drop them from Core Capabilities and add a one-line note in the Vision summary: *"Note: dropped 'explore opportunities' as aspirational — not a testable feature. Tell me if it's actually a concrete capability and I'll add it back."*

This is silent removal with a flagged note, not a question. Customer can flag if they disagree.

#### Step 4 — Show the Vision summary in chat (5–6 lines, no questions)

Display the pre-extracted Vision compactly:

```
Agent Vision: [Name]

Eval objective: [one sentence — what "good" means + what decision the evals inform]
Purpose:        [one sentence from kickoff]
Users:          [extracted or default]
Knowledge:      [named sources, or "TBD — confirm in Plan dashboard"]
Capabilities:   [3–5 from kickoff, aspirational dropped]
Boundaries:     [domain default set, listed]
Success:        [default 3 criteria]
Role-based:     [auto-detected: yes/no, with axes]
Risk tier:      [domain default: HIGH/MEDIUM/LOW] — driven by 5 factors (reach, criticality, autonomy, regulatory, data sensitivity)
Owner:          [named accountable owner, or "TBD — name before deploy"]
```

Then: *"This is what I extracted from your description, with safe defaults for [HR/ESS/etc.] domain agents filling the gaps. **Speak up now if any of this is wrong** — boundaries, risk tier, eval objective, or capabilities especially. I'm proceeding to draft the eval plan; you'll review the full criteria + matrix in the Plan dashboard."*

**Don't gate on customer confirmation.** Write `stage-0-data.json` and proceed to Stage 1 immediately. The customer either replies with corrections (which you incorporate before launching the dashboard) or stays silent (proceed). The Plan dashboard is the real review surface.

#### Why this works

- **Pre-extraction + defaults** covers ~80% of what the chat questions extracted, with zero customer chat input beyond the kickoff.
- **Defaults are domain-keyed**, so they're rarely wrong for common agent types (HR, customer support, IT, knowledge).
- **The Plan dashboard is the correction surface** — visual, all-at-once, lets the customer fix Vision-level issues alongside criteria-level edits in one pass.
- **Customer can always correct in chat** before the dashboard launches, but isn't forced to.

#### When this approach is wrong (revert to gap-question batch)

- The kickoff description is genuinely too thin — one sentence with no domain keywords. Ask one clarifying question to get enough material for safe defaults.
- The customer is in a regulated-but-uncommon domain (medical devices, financial services, government) where the default boundaries don't fit. After step 2, ask: *"Domain looks like [X] — your boundaries are usually [Y]. Anything specific I should add for your context?"*
- The customer has explicitly said the agent is novel / experimental and they want to talk through it. Default to conversation mode for these — but they're a small minority.

---

## Stage 1: Plan

Using the Agent Vision, produce a structured eval suite plan. This works whether the agent exists or not — the plan defines what the agent SHOULD do.

### What you walk away with

- **A populated copy of the Eval Suite Planning & Logging Template** for stakeholder review and ongoing use.
- **An interactive HTML review page** that summarizes the workbook, filters eval sets, surfaces TBDs, and keeps the chat response short.
- **One row per eval set** in the registry: capability sets, trust & safety sets, targets/gates, intended use, cadence, human inputs, source dependencies, grader-validation notes, and reusable-asset flags.
- **Baseline placeholders and reusable-asset candidates** in the existing template tabs, without adding or changing workbook structure.

### When this stage is wrong for you

- You do not have the Eval Suite Template and need a final customer artifact now. Ask for the blank template first.
- You already have a populated registry and only need test cases. Skip to Generate.
- You only need to triage run results. Skip to Interpret.

### What to do

1. **Copy and preserve the template.**

   Use the attached Eval Suite Template workbook when available. Populate a copy of it only. Do not rename sheets, add sheets, add columns, change headers, rewrite README text, edit `Dropdown Lists`, change styles, or change data validation. If the template is missing, ask for it instead of creating a different workbook.

2. **Populate Step 1 planning.**

   Fill the existing `1 . Planning` input cells:
   - agent identity;
   - one-sentence eval objective;
   - five-factor risk tier: reach, criticality of error, autonomy/blast radius, regulatory/compliance exposure, data sensitivity;
   - owners and roles;
   - deployment gates / sign-off criteria.

3. **Define eval sets, not scenarios.**

   Populate `2 . Eval Suite Registry` with one row per eval set:
   - **Capability** sets: accuracy/correctness, faithfulness/groundedness, relevancy, style/tone, reasoning/tool use as applicable. Hallucination stays in faithfulness/groundedness.
   - **Trust & Safety** sets: guardrails, out-of-scope handling, sensitive-data handling, prompt injection/jailbreak resilience, compliance-specific behavior as applicable.

   Do not generate legacy planning-artifact rows in the workbook. The registry is one row per eval set only.

4. **Apply v5 Step 4 gates and improvement targets.**

   Use the existing registry columns:
   - Trust & Safety sets: absolute pass-rate hard gates, usually near 100%.
   - Capability sets: launch floor for first deployment plus regression/direction after baseline, not a standing absolute target.
   - High-risk capabilities: explicit hard floor when the capability functions like a guardrail.
   - Put the nuance in `Target pass rate`, `Target rationale`, `Gate type`, `Intended use`, `Run cadence`, and `Notes`; do not add a new column.

5. **Specify Step 5 human inputs.**

   Use the registry columns for human input type/author, grounding source dependency, and source-change review. Use `TBD - confirm before baseline` where owners or sources are unknown.

6. **Plan Step 6 grader validation.**

   The template has no grader-validation columns. Do not add them. Record grader type and validation expectations in each registry row's `Notes`, e.g. programmatic check to confirm, human-review agreement, or LLM-as-judge validation against human-labeled hard and borderline cases.

7. **Seed Step 7 baseline placeholders only in existing Run Log columns.**

   Add optional baseline placeholder rows in `3 . Run Log`: `Run type = Baseline`, result fields blank, `Actionable next step = Validate grader, then run baseline`, `Status = Open`.

8. **Partition Step 8 regression cadence.**

   Use `Intended use` and `Run cadence` in the registry. Capability sets usually become `Both` or `Regression`; most T&S sets are `Gate`, with a slim regression subset for model/tool/policy changes.

9. **Flag Step 10 reusable assets.**

   Populate `4 . Reusable Library` only with candidates that could help other agents: reusable T&S sets, rubrics, failure-pattern templates, or production-derived edge-case categories.

### Output

Do not display a long eval-set summary in chat. Put Step 1 objective/risk/owner, capability eval sets, trust & safety eval sets, Step 4 governance, Step 5 human inputs, Step 6 grader-validation notes, Step 8 cadence, and Step 10 reusable candidates into the interactive HTML review page described below.

**The customer payoff:** *"You now have a workbook your PM, builder, risk owner, and source owners can review. It preserves your template and shows which eval sets exist, how each is governed, who owns human inputs, what must happen before baseline, and which assets may be reusable."*

**Maturity callout — Pillar 1 / playbook Step 1 (L100 Initial → L300 Systematic):** Discover + Plan advance Pillar 1 from "good lives in the builder's head" to a written objective, five-factor risk tier, accountable owner, and workbook-backed eval-set governance. Pillar 2 advances in Generate (Steps 2, 3, 5); Pillar 3 now starts with Step 6 grader validation before any baseline is trusted.

### Workbook Review Checkpoint

The legacy Plan dashboard is pre-v5 criteria-based and must not be used for the v5 workbook workflow. Instead, generate a draft workbook copy plus a companion HTML review page and have the customer review those artifacts.

1. Generate `eval-suite-<agent-name>-<YYYY-MM-DD>.xlsx` as a populated copy of the user's template.
2. Generate `eval-suite-<agent-name>-<YYYY-MM-DD>-review.html` next to it using `skills/eval-guide/plan-review-page.md`.
3. Ask the customer to review the workbook and the HTML page:
   - `1 . Planning`: objective, risk tier, owners, sign-off criteria.
   - `2 . Eval Suite Registry`: eval-set rows, Step 4 governance, cadence, human inputs, source dependencies, grader-validation notes, reusable flags.
   - `3 . Run Log`: baseline placeholders, if added.
   - `4 . Reusable Library`: reusable candidates.
4. Apply workbook feedback by editing cell values in a new copy of the workbook and regenerating the HTML review page. Do not edit structure, sheet names, headers, styles, README, or `Dropdown Lists`.
5. When the customer confirms the workbook, treat it as the Plan artifact and proceed to Generate from the registry.

**After confirmation, the eval plan deliverable is:**

   **Customer-ready `.xlsx` eval-suite planning workbook** using the `/xlsx` skill, named `eval-suite-<agent-name>-<YYYY-MM-DD>.xlsx`. It must be a populated copy of the user's template, not a recreated or redesigned spreadsheet.

   **Interactive HTML review page** named `eval-suite-<agent-name>-<YYYY-MM-DD>-review.html`. The page carries the summary, eval-set explorer, TBD action list, and human review checklist so the chat response stays concise.

   The workbook is the review checkpoint and the primary Plan artifact. A separate `.docx` narrative is optional only if the user asks for it.

   Tell the customer only where to open the workbook and HTML review page. Do not duplicate the HTML page content in chat.

---

## Stage 2: Generate

Generate test cases as **separate CSV files per eval set** from the workbook registry. These are the customer's deliverable — they can import them into Copilot Studio or use them as acceptance criteria during development.

### What you walk away with (one kit)

| Artifact | Use it for |
|---|---|
| `eval-<set-type>-<set-slug>-<date>.csv` (per eval set — **2 columns: Question, Expected response**; one row per case; the Testing method is assigned per row in Copilot Studio's Evaluate tab after import) | Paste directly into Copilot Studio Evaluation tab |
| `eval-test-cases-<agent>-<date>.docx` | PM / stakeholder review |
| `eval-setup-guide-<agent>-<date>.docx` | Step-by-step walkthrough for setting up + running the eval in Copilot Studio's Evaluate tab |
| `rerun-protocol-<agent>-<date>.docx` | Pillar 3 L200 — when to re-run the eval as the agent changes |
| `baseline-comparison-<agent>-<date>.xlsx` | Pillar 5 L200 — your version-comparison workbook |

The kit is one deliverable. CSVs go to Copilot Studio. The test-case .docx goes to your PM. The setup guide, rerun protocol, and baseline-comparison workbook go to your eval-process docs.

### When this stage is wrong for you

- You already have a test set you trust. Bring it; skip to Stage 3.
- You have production traffic. Sample real conversations directly into a test set rather than synthesizing — generated cases anchor to AI voice; real user language beats it.
- You're testing agent UX (turn-taking, error-recovery flow). That's conversation testing, not eval — different tool.

### Choose evaluation mode: Single Response vs. Conversation

**Default to Single Response.** ~80% of agents are single-response Q&A. Conversation (multi-turn) only fits agents that do real multi-step workflows — troubleshooting flows, form-filling, slot-extracting conversations. If you're not sure, you don't need Conversation mode.

| Mode | Best for | Limits | Supported test methods |
|---|---|---|---|
| **Single response** *(default — fits ~80% of agents)* | Factual Q&A, tool routing, specific answers, safety tests | Up to 100 test cases per set | All 7 methods (General quality, Compare meaning, Keyword match, Capability use, Text similarity, Exact match, Custom) |
| **Conversation (multi-turn)** | Multi-step workflows, context retention, clarification flows, process navigation | Up to 20 test cases, max 12 messages (6 Q&A pairs) per case | General quality, Keyword match, Capability use, Custom (Classification) |

**When to switch to conversation eval:**
- The agent walks users through multi-step processes (e.g., troubleshooting, onboarding, form completion)
- Context retention matters — later answers depend on earlier ones
- The agent needs to ask clarifying questions before answering
- The criterion involves slot-filling or information gathering across turns

**When to stay with single response (the default):**
- Each question is independent (FAQ, policy lookup, data retrieval)
- You need Compare meaning, Text similarity, or Exact match (conversation mode doesn't support these)
- You need more than 20 test cases in a set

**Explain the choice:** "I'm recommending single response eval for your knowledge-lookup criteria because each question is independent — the agent doesn't need previous context to answer. For your troubleshooting criterion, I'm recommending conversation eval because the agent needs to gather information across multiple turns before resolving the issue."

**Note for CSV generation:** Single response test sets use the **2-column import CSV** (`Question`, `Expected response`); the testing method is assigned per row in Copilot Studio's Evaluate tab after import (see the manifest note below). Conversation test sets can be imported via spreadsheet or generated in the Copilot Studio UI — each test case contains a sequence of user messages that simulate a multi-turn interaction.

### Personalization branch — handle this before generating test cases

If the Agent Vision has `role_based_access: true` (set in Discover), the test cases for personalization criteria need **user profiles** in Copilot Studio. Without profiles, the agent has no context to personalize from — and the test results are misleading.

**Walk the customer through this BEFORE generating cases:**

1. **Identify which criteria need profiles.** Check the criteria list for ones that test personalization (criteria mentioning "for the employee's [attribute]" — office, tenure, plan, role, etc.).

2. **Draft 3 user profiles that span the personalization axes.** Pick combinations that exercise different paths:
   - Profile A: one attribute combo (e.g., `Boston-2yr-PPO`)
   - Profile B: a contrasting combo (e.g., `Seattle-7yr-HMO`)
   - Profile C: an edge combo (e.g., `Remote-FirstYear-HDHP`)
   - Each profile has explicit attribute values and a one-line note on which criteria it exercises.

3. **Tell the customer to create the profiles in Copilot Studio** (Settings → Evaluation → User Profiles) before importing test sets. The CSV import won't fail without profiles, but personalization-criterion results will be misleading.

4. **Flag the two known limitations:**
   - **Multi-profile eval doesn't work with connector-based agents.** If the Vision includes any tool/connector use, multi-profile eval can't run against those criteria — fall back to standard cases without profile context.
   - **Multi-profile eval is not available in GCC.** Ask the customer's tenant type: standard or GCC. If GCC, drop personalization test cases or run them as standard cases (lose the personalization signal).

5. **Generate one test case set per criterion per profile**, OR a single set with profile-tagged expected responses (when criterion is the same question, different expected answer). Use whichever is more efficient.

**If `role_based_access: false`**, skip this branch entirely — no profile setup needed.

### The [VERIFY] discipline — the most important review step in the whole skill

When generating expected responses, the AI wraps factual content it can't independently confirm in `[VERIFY: ...]` markers. **These are the failures-in-waiting.** A wrong [VERIFY] becomes an eval test case that "passes" while hiding a production failure — the agent matches the bogus expected response and gets a green check.

The dashboard highlights every [VERIFY] span in yellow. **Read every one before approving.** This is the customer's most important responsibility in Stage 2; the LLM that drafted the test cases cannot do this work — only the human who knows the actual knowledge sources can.

When narrating to the customer, say: *"I've wrapped factual claims I'm guessing at in [VERIFY] markers. Please check each one against your real knowledge source — these are the most likely places the eval will lie to you about agent quality."*

### What to do

1. Generate one or more test cases per acceptance criterion from the plan. For conversation criteria, generate multi-turn test cases with realistic dialogue sequences (up to 6 Q&A pairs). A single criterion can and often should have multiple test cases exercising different phrasings, user contexts, and edge inputs.

2. **Write expected responses so they satisfy the criterion's pass condition** — i.e., what the agent SHOULD say according to the Agent Vision, the criterion's statement, and its pass_condition. Note: "These expected responses reflect your stated requirements. Refine them once the agent is built and you see how it actually responds."

3. **Group by eval set** into separate CSV files:
   - `eval-capability-accuracy-correctness.csv`
   - `eval-capability-faithfulness-groundedness.csv`
   - `eval-capability-reasoning-tool-use.csv`
   - `eval-trust-safety-sensitive-data-handling.csv`
   - `eval-trust-safety-prompt-injection-jailbreak.csv`
   - `eval-trust-safety-compliance-specific.csv` (if applicable)

   Only create files for categories that apply.

   **Versioning:** Name each file with a date stamp or agent version (e.g., `eval-knowledge-accuracy-2026-04-22.csv`) so successive sessions produce a version history rather than overwriting the baseline. Versioning is a requirement of L300 Systematic Pillar 2.

4. **CSV format** — Copilot Studio import format is **exactly two columns**:

```csv
"Question","Expected response"
"How many PTO days do LA employees get?","LA employees receive 18 PTO days per year."
```

The **Testing method is NOT a CSV column** — it is assigned per row in Copilot Studio's Evaluate tab after import (see the manifest note below). The method chosen for each criterion travels in the companion `.docx` manifest and the `eval-setup-guide-<agent>-<date>.docx`, which walk the customer through the manual per-row assignment. Valid Testing method values (assigned in the UI): `General quality`, `Compare meaning`, `Text similarity`, `Exact match`, `Keyword match` (core five), plus `Capability use` and `Custom` (extensions). *(A 3-column `-with-methods` variant may be emitted as a human-readable reference only — never import it.)*

5. **Inherit the method from each criterion** — the method was set in Stage 1 and should carry through to every test case for that criterion. If a criterion's method doesn't fit a specific test case (e.g., one particular case needs exact-keyword verification while the rest use semantic match), override per-case rather than rewriting the criterion. Refresher table:

| Criterion style | Method | Why |
|---|---|---|
| Factual with known answer | Compare meaning | Semantic equivalence |
| Open-ended quality | General quality | LLM judge |
| Must-include terms (URL, email) | Keyword match | Exact presence |
| Agent should refuse | Compare meaning | Refusal matches expected |
| Domain-specific criteria (compliance, tone, policy) | Custom | Define your own rubric and pass/fail labels |

6. **Highlight the value:** "You now have [X] test cases across [Y] eval sets from your workbook registry. Compare that to the 5–10 happy-path prompts most customers start with. These include adversarial attacks, hallucination traps, robustness tests, and edge cases your users will encounter in production."

### Output

Display a summary table of test cases per eval set.

**The customer payoff:** *"You now have a test suite that imports directly into Copilot Studio, plus the .docx report your PM can sign off on, plus the Pillar 3 and Pillar 5 starter artifacts you'll keep for ongoing operations. That's the eval kit a new team member would need to evaluate this agent — questions, expected responses, methods, re-run protocol, comparison template."*

**Maturity callout — Pillar 2 / playbook Steps 2, 3, 5 (L100 Initial → L300 Systematic):** Generate advances Pillar 2 from "no established eval set" to versioned **capability** eval sets and separate **trust & safety** eval sets, coverage mapped to risk and value, each tagged `gate-only | regression | exploratory` for the regression suite (Step 8). Pillar 4 advances in Interpret. Pillars 3 and 5 reach L200 Defined via the `rerun-protocol-<agent>-<date>.docx` and `baseline-comparison-<agent>-<date>.xlsx` starter artifacts generated at session close — surface these to the customer when delivering them.

### Interactive Dashboard Checkpoint

Before generating final CSV and report files, launch the test cases dashboard for review:

1. Write the test cases to `stage-2-data.json`. **Methods and governance metadata live at the eval-set (`test_set`) level**, inherited from the workbook registry.

   ```json
   {
     "agent_name": "...",
     "test_sets": [
       {
         "eval_set_id": "CAP-ACC-001",
         "display_name": "Policy answer correctness",
         "set_type": "capability",
         "capability_dimension": "Accuracy / correctness",
         "methods": ["Compare meaning", "Keyword match"],
         "gate_type": "Hard floor + soft target",
         "target_pass_rate": "Launch floor 90%; regression/direction after baseline",
         "run_cadence": "Weekly",
         "cases": [
           {
             "id": 1,
             "question": "...",
             "expected_responses": {
               "Compare meaning": "Canonical answer, with [VERIFY: factual content to check] markers",
               "Keyword match": "PTO, Time Off Policy, accrual"
             },
             "custom_rubric": ""
           }
         ]
       }
     ]
   }
   ```

   Key requirements:
   - Group test cases by workbook eval set, with cases nested directly under each set.
   - Each test set carries a `methods: []` array — **the methods for this eval set's CSV**. Choose one method when one fits; choose multiple only when the eval set genuinely needs them. Default to one method.
   - Each test set carries workbook governance metadata (`gate_type`, `target_pass_rate`, `target_rationale`, `run_cadence`, owner/source/grader notes where available).
   - Each case has `expected_responses: { method → value }` — one entry per method in the eval set's `methods` array that needs a per-case reference (`Compare meaning`, `Text similarity`, `Exact match`, `Keyword match`). Methods that grade against a set-level rubric (`General quality`, `Capability use`, `Custom`) do NOT need entries.
   - Wrap AI-generated factual content in `[VERIFY: ...]` markers inside the `Compare meaning` / `Text similarity` entries so the dashboard highlights them for review.
   - **`Custom` method in the eval set**: also write a `custom_rubric` field on each set or case — a short LLM-judge rubric drafted from the eval-set purpose and expected behavior ("Rate the response Pass / Fail. Pass = …. Fail = …. Output PASS or FAIL with a one-sentence reason."). The dashboard shows this as an editable textarea. Don't leave Custom sets without a rubric.
   - **`Keyword match` method**: the per-case `expected_responses["Keyword match"]` value is a **comma-separated keyword list** (not a reference answer). The dashboard renders this as a "Keywords" column.
2. Launch the dashboard:
   ```bash
   python "$(ls ~/.claude/skills/eval-guide/dashboard/serve.py 2>/dev/null || ls ~/.claude/plugins/cache/*/eval-guide/*/skills/eval-guide/dashboard/serve.py 2>/dev/null | head -1)" --stage generate --serve --data stage-2-data.json
   ```
3. The user reviews the **Eval Sets Overview** at the top, then walks the stacked eval-set sections. Per eval set: edits the **Test Methods to Use** chips (set-level), checks gate/target/cadence metadata, edits Custom rubric callouts if Custom is used, edits per-method columns in the cases table, checks VERIFY-highlighted factual content, and adds/removes test cases.
4. When the user confirms, **parse the feedback from the bash stdout** between the `===EVAL_GUIDE_FEEDBACK_BEGIN===` / `===EVAL_GUIDE_FEEDBACK_END===` markers. **Apply every edit it contains, faithfully and without question.** The customer's choices are final — do NOT re-litigate, do NOT suggest reverting, do NOT ask for confirmation again, do NOT partially apply. (`generate-feedback.json` is also on disk as a backup, but stdout is the primary channel.)

   This applies to ALL edit types:
   - [VERIFY] span corrections (the customer fact-checked your draft against their real knowledge sources — their version wins). **At export time (CSV + .docx), strip every remaining `[VERIFY: …]` wrapper:** `[VERIFY: <content>]` → `<content>`. By the time the customer has confirmed, every span is either edited (already clean) or accepted (marker is now noise).
   - Question edits
   - Per-method per-case expected-response edits — keyed by method: `test_sets[i].cases[k].expected_responses["Compare meaning"]`, `test_sets[i].cases[k].expected_responses["Keyword match"]`, etc. Each method's value updates that method's column for that case.
   - Custom-method rubric edits (`test_sets[i].custom_rubric` or `test_sets[i].cases[k].custom_rubric`) — the customer's refined rubric is final; use it as the LLM judge prompt verbatim.
   - Eval-set-level method additions / removals (`test_sets[i].methods`) — adding/removing a method changes which columns and rubric blocks render for that eval set.
   - Test case additions and deletions.
   - General Comments box content.

   **Then narrate the edits back so the customer sees their changes were captured** — count [VERIFY] corrections, count test case additions/deletions, list significant edits, restate updated total case count. Example: *"Got it — 8 [VERIFY] corrections captured, 2 new cases for CAP-ACC-001, total now 56 cases across 7 eval sets."* Don't just say "applied." The narration confirms you parsed correctly; it is NOT an invitation to re-decide.

   If changes requested instead of confirmed, regenerate and re-launch.
5. **After confirmation, automatically generate ALL FIVE deliverables (A through E) — do not wait for the user to ask, do not ask "should I generate the docx now?", do not generate them in stages.** The CSVs, the test-case `.docx` report, the eval-setup-guide `.docx`, the rerun-protocol `.docx`, and the baseline-comparison `.xlsx` are one delivery, produced together. The customer should see the artifact list in chat ("five files generated") and find the files on disk before they say anything more.

**A. CSV files** — One CSV per eval set: `eval-<set-type>-<set-slug>-<date>.csv`. **Exactly two columns**:

   ```csv
   "Question","Expected response"
   ```

   **No Testing method column.** Copilot Studio's Evaluation tab requires the customer to **set the testing method manually per row in the UI** after import — it is not pre-encoded in the CSV. The companion `eval-setup-guide-<agent>-<date>.docx` (deliverable E below) walks the customer through that manual step in detail.

   **Row generation rule.** One row per active case per eval set (no case × method explosion). Per row:
   - `Question` = the case's question.
   - `Expected response` = whichever of the case's `expected_responses` is most informational, picked by this priority order against the eval set's method set:
     1. `Compare meaning` → `case.expected_responses["Compare meaning"]`.
     2. `Text similarity` → `case.expected_responses["Text similarity"]`.
     3. `Exact match` → `case.expected_responses["Exact match"]`.
     4. `Keyword match` → `case.expected_responses["Keyword match"]` (comma-separated keyword list).
     5. None of the above (signal only has reference-free methods like `General quality` / `Custom` / `Capability use`) → leave the cell empty.

   **Strip every `[VERIFY: …]` marker from the cell value before writing the row.** Replace `[VERIFY: <content>]` → `<content>`. The markers exist only as a review aid in the dashboard — by the time the customer has clicked Approve, every span has either been confirmed or edited. The CSV is the eval set the customer is importing into Copilot Studio; it must contain clean expected responses with no review-tooling syntax. Apply the regex `\[VERIFY:\s*([^\]]*)\]` → `$1` (or equivalent) to every Expected response cell before emitting the row.

   The customer can still edit any cell in CPS or in the CSV before import — for example, switching a row from canonical-answer to keyword-list when they decide that row should use `Keyword match`. The eval-setup-guide.docx makes this explicit.

   An eval set with 12 cases produces exactly 12 rows. (No multiplication by methods.)

   Tell the customer: "One CSV per eval set — two columns: Question and Expected response. Import each into Copilot Studio's Evaluation tab. Then in the CPS UI, set the **Testing method** for every row — this is a manual step. The eval-setup-guide.docx walks you through which method to pick per eval set and what threshold or regression rule to use."

**B. .docx report** — Generate a customer-ready report using the `/docx` skill. The report must be:
- **Concise** — no filler, no walls of text. Tables over paragraphs.
- **Presentable** — professional formatting with color-coded headers, clean tables, visual hierarchy
- **Self-contained** — a customer who wasn't in the conversation can read it and understand the eval plan + test cases

Report structure:
1. Agent Vision summary (from Stage 0) — 5-6 lines max
2. Workbook registry summary — eval sets grouped by Capability vs Trust & Safety, with Step 4 governance and Step 8 cadence
3. Test cases organized by eval set, with set-level target/gate/regression metadata
4. For each test case: Question, Expected Response, and suggested test method. **Strip `[VERIFY: …]` markers** the same way as in the CSV — `[VERIFY: <content>]` → `<content>`. The dashboard's review markers don't belong in the customer-facing report.
5. Summary table: eval set, category, test case count, methods
6. "What these tests catch" callout — 3-4 bullet points on what the customer would have missed
7. Next steps — what to do with these files. **Always include a pointer line:** *"You're also receiving three companion artifacts (generated below) — `eval-setup-guide-<agent>-<date>.docx` (step-by-step Copilot Studio setup), `rerun-protocol-<agent>-<date>.docx` (Pillar 3 L200), and `baseline-comparison-<agent>-<date>.xlsx` (Pillar 5 L200). They walk you through how to set up the run today and advance Pillars 3 and 5 from L100 Initial to L200 Defined."*
8. Maturity snapshot — before/after table showing where the agent stands after this session:

   | Pillar | Baseline | After this session | Next-session target |
   |---|---|---|---|
   | 1 — Define what "good" means | L100 Initial | L300 Systematic ✓ | — |
   | 2 — Build your eval sets | L100 Initial | L300 Systematic ✓ | — |
   | 3 — Run evals across the lifecycle | L100 Initial | L200 Defined ✓ (via `rerun-protocol-<agent>-<date>.docx`) | L300 Systematic |
   | 4 — Improve and iterate | L100 Initial | L100 Initial | L300 Systematic (Stage 4) |
   | 5 — Handle changes with confidence | L100 Initial | L200 Defined ✓ (via `baseline-comparison-<agent>-<date>.xlsx`) | L300 Systematic |

**C. Pillar 3 starter — `rerun-protocol-<agent>-<date>.docx`** — Generate using the `/docx` skill, sourcing structure and content from `skills/eval-guide/rerun-protocol.md`. This is the customer's takeaway reference for Pillar 3 L200 Defined: when to re-run evals, what scope to run, how to log the result. The docx is portable, printable, and shareable with the team.

   Render the markdown sections as docx sections with the same headings (Purpose, Prerequisites, When to re-run, Run order rule, Logging discipline, Interpreting re-run results, You've reached L200 Defined when…, Path to L300 Systematic, References). Format the trigger table as a styled docx table, color-code the priority column, and put the "You've reached L200 Defined when…" exit criteria in a callout box.

**D. Pillar 5 starter — `baseline-comparison-<agent>-<date>.xlsx`** — Generate using the `/xlsx` skill, sourcing structure and content from `skills/eval-guide/baseline-comparison-template.md`. This is the customer's fill-in workbook for Pillar 5 L200 Defined: a structured template they fill in each time they compare two eval runs.

   Workbook structure (auto-size columns; freeze header rows; protect instruction sheets):

   | Sheet | Contents |
   |---|---|
   | **Instructions** | Purpose, when to use, prerequisites. Read-first sheet — protected. |
   | **Comparison** | 5-metric comparison table with empty Run 1 / Run 2 / Delta cells (Overall, Capability eval-set pass rate, Trust & Safety gate status, Regression eval-set pass rate, Hard gate failures). Above the table: editable cells for Run 1 name/version, Run 2 name/version, Eval set version, Change description. |
   | **Case-level delta** | 4-row bucket table (Pass-Pass / Fail-Pass / Pass-Fail / Fail-Fail) with empty Count and Notable cases columns. Conditional formatting highlights Pass-Fail row in red. |
   | **Decision rules** | Variance rules, ship/hold logic. Read-only reference sheet. |
   | **Capability vs. regression** | Cheat sheet on the two run types, when to use each. Read-only reference sheet. |

**E. Eval setup guide — `eval-setup-guide-<agent>-<date>.docx`** — **Always generate this alongside the CSVs (A). It is not optional and not on-request.** Without it, the customer is staring at CSVs with no instructions for the manual method-assignment step in CPS. Generate using the `/docx` skill, sourcing structure and content from `skills/eval-guide/eval-setup-guide.md`. This is the customer's step-by-step walkthrough for setting up and running the CSVs in Copilot Studio's Evaluate tab — the operational companion to the eval set.

   Render the markdown sections as docx sections with the same headings (What you should have before you start, Step 1–8, Per-method setup table, How to choose a threshold, Common setup issues, You've finished setup successfully when…, Related artifacts, References). Format the per-method setup section as styled docx tables; pull the eval-set method decision tree into a callout box; preserve the troubleshooting symptom/cause/fix table verbatim.

Tell the customer: "Five artifacts: the CSVs go straight into Copilot Studio, the test case .docx is for sharing, the new `eval-setup-guide-<agent>-<date>.docx` walks you through the Evaluate tab step by step (open it the first time you set up the run), and `rerun-protocol-<agent>-<date>.docx` + `baseline-comparison-<agent>-<date>.xlsx` are your Pillar 3 and Pillar 5 starter kits — keep them with your eval set."

---

## Stage 3: Run (requires a running agent)

Stage 3 turns the eval set into evidence. Run your CSVs against the live agent and record the results. 10–30 minutes (depends on test count and auth setup).

### What you walk away with

- **`eval-results-<agent>-<date>.csv`** — pass/fail per case, score per LLM method, judge rationale.
- **`eval-results-<agent>-<date>.json`** — same data, programmatic-friendly.
- **A baseline pass rate and gate status by eval set** — the number every future change is compared against.

### Skip this stage if

- **Your agent isn't built yet.** The deliverables from Stages 0–2 are the eval jumpstart; come back when the agent is running.
- **You already have eval results** (prior run, internal/external testing tool). Skip to Stage 4.

### Set expectations before you run

**First-run pass rate is usually 40–70%, not 80%+.** Customers who get 50% on the first run sometimes spiral; they shouldn't. The valuable signal is *which categories* pass and fail, not the headline number. Stage 4 turns the failures into ranked action.

**LLM-judge methods are non-deterministic** — `Compare meaning` and `General quality` show ±5% variance between runs. If a result lands borderline, run it again and take the median.

### Two paths — pick one

| Path | When it's right | Setup cost |
|---|---|---|
| **Copilot Studio UI Evaluation tab** *(default — start here)* | Most customers, especially incidental users. Import `eval-<set-type>-<set-slug>-<date>.csv`, run, view results in the UI. Use this unless you need automation. | Agent auth only. |
| **`eval-runner.js` (CLI)** | You need to automate, run from CI, or use LLM-judge methods the UI doesn't expose. | Node, DirectLine token endpoint, `ANTHROPIC_API_KEY` (real $ — Claude API costs apply). |

### How to run (CLI path)

```bash
node eval-runner.js --token-endpoint "<URL>" --csv-dir .
```

Or use `/chat-with-agent` for individual questions via the Copilot Studio SDK.

**Scoring methods:**
- `Compare meaning` → semantic equivalence (0.0–1.0, LLM judge)
- `General quality` → relevance / groundedness / completeness / abstention (0.0–1.0, LLM judge)
- `Keyword match` → code-based string matching (free, deterministic)
- `Exact match` → code-based string equality (free, deterministic)

Required: `ANTHROPIC_API_KEY` for LLM-judge methods. Code-based methods run free.

### How to get value from it

- **Don't panic at the first-run pass rate.** 40–70% is normal. Read hard gates, eval-set pass rates, and regression/direction instead of the headline.
- **Export results immediately to CSV.** Copilot Studio retains run results for only 89 days. You need the CSV for long-term tracking and for Stage 4 interpretation.
- **Run twice if borderline.** LLM-judge scoring is non-deterministic; re-run and take the median.
- **Run hard-gated Trust & Safety sets and impacted capability regression sets first.** If a hard gate fails, the release decision is blocked until it is fixed or explicitly waived by the accountable owner.

### Output

Results table printed to terminal + `eval-results-<agent>-<date>.csv` and `.json` written to disk.

---

## Stage 4: Interpret

Stage 4 turns raw results into a ranked action list. Every failure gets classified by root cause; the Top 3 actions get phrased as Change-X → Re-run-Y → Expect-Z. The output is a `.docx` triage report your team works from. 30–45 minutes.

### What you walk away with

- **A gate-based SHIP / ITERATE / BLOCK verdict** — driven by the hard/soft gates defined in the eval manifest, not the aggregate pass rate.
- **Gate status per eval set** — capability and trust & safety sets reported separately with target, actual, gate type, and PASS/MISS status.
- **Regression/direction evidence as supporting context** — capability trends help prioritize fixes, but they do not override hard/soft gates.
- **Failure triage table** — every failure classified first into the playbook Step 7 buckets (**Eval Setup** vs **Agent Quality**), then into a fix subtype such as agent configuration or platform limitation. The classification points at the fix.
- **Top 3 actions** in Change → Re-run → Expect format.
- **A `.docx` triage report** for your team to act from.

### When this stage is wrong for you

- You don't have eval results yet. Run Stage 3 first.
- You already know what to fix and don't need the diagnostic. Skip the full triage; just re-run after your change.

### Stage 4 is a loop, not an end

After implementing the Top 3 actions, **re-run Stage 3 and re-do Stage 4 with the new results**. The before/after comparison validates whether the fix worked — and that before/after evidence is what advances Pillar 4 to L300 Systematic. A single Stage 4 pass without a follow-up re-run leaves Pillar 4 at L200.

### The 20% rule — the most counterintuitive insight in this skill

**At least 20% of failures in a new eval are eval setup bugs, not agent bugs.** The test case might be wrong, the expected response might be outdated, the testing method might be inappropriate, or the LLM judge might have misread the response. **Don't blame the agent until you've checked the test.**

Tell the customer explicitly: *"Before we blame the agent — at least 20% of failures in a new eval are eval setup issues. Let me apply the 5-question eval verification before classifying failures as agent bugs."*

This single discipline is what separates productive triage from churn.

### Read gates first, then eval-set performance

The headline pass rate ("60% passed") is wrong as a verdict. The first read is **gate status** from the manifest:

- **Hard gate** — must pass before deploy. Any failed hard gate means the agent cannot ship as-is.
- **Soft target** — tracked and remediated, but not blocking by itself.
- **Trust & safety hard gate** — usually a **BLOCK** verdict when missed.
- **Deployment-critical capability hard gate** — **BLOCK** or **ITERATE** based on severity, owner risk tolerance, and the gate policy.

Apply this decision rule:

```
ANY hard gate missed?
    YES -> cannot SHIP.
           Trust & safety hard-gate miss -> usually BLOCK.
           Deployment-critical capability hard-gate miss -> BLOCK or ITERATE.
           Other hard-gate miss -> ITERATE until fixed.
    NO  ->
        ANY soft target missed?
            YES -> ITERATE: track the gap and fix in priority order.
            NO  -> SHIP, assuming human review agrees coverage is sufficient.
```

Then read **eval-set trends and regression/direction** as prioritization evidence. Capability misses tell you where to improve next; hard-gated Trust & Safety misses tell you what blocks release. If no workbook/manifest is present, infer gates only as a fallback and state: *"No workbook or manifest provided — gate status inferred and should be reviewed by the owner."*

A green-across-the-board run is rare on first iteration; expect 2–3 Plan→Interpret cycles before every hard gate passes and soft targets are acceptable. Tell the customer the gate decision so they know what blocks shipping versus what should be tracked.

**Which skill to use:** For a one-shot triage report from a CSV file or results summary, invoke `/eval-result-interpreter`. For interactive, multi-round diagnosis with detailed remediation guidance, invoke `/eval-triage-and-improvement`. Start with the interpreter; switch to triage if you need help implementing fixes.

### What to do

1. **Pre-triage check — scan for infrastructure symptoms before classifying any failure.** Don't just ask "was everything working?" — that's a yes/no the customer can't answer accurately. Look for these symptoms in the results data:

   | Symptom in results | Likely cause | Action |
   |---|---|---|
   | Empty agent response on multiple cases | Auth failure or timeout, not agent error | Don't count as agent failure — flag for re-run after infra fix |
   | Sudden cluster of fails all citing one source | That source was unreachable during run | Verify source connectivity, re-run those cases |
   | Same case passes/fails inconsistently across re-runs (>10% swing) | Non-determinism beyond normal LLM variance — likely caching, latency, or auth-token expiry mid-run | Re-run 2–3 times, take median |
   | Cases tagged to a user profile got responses for a different profile | Profile assignment misconfigured at import | Fix profile tags, re-run those cases |
   | Refusal cases pass but with generic "I can't help" not the expected escalation language | Agent has the refusal but lacks the escalation routing | Real agent issue — keep counted as failure, but classify as Agent Config (incomplete refusal) not Safety failure |

   Confirm with the customer: *"I see [N] empty responses / [N] cases all on Source X / [other pattern]. Was [auth / connectivity / etc.] healthy during the run?"* Don't blame the agent for symptoms that match infrastructure patterns until the customer confirms.

   If anything was broken during the run, the run is invalid — re-run before triaging.

2. **Gate summary and verdict** — Build the eval-set table from the workbook/manifest: eval set, set type, category / dimension, testing method, intended use/cadence, target, actual, gate type, and gate status. Drive SHIP / ITERATE / BLOCK from this table. Keep capability and trust & safety sets separate. Use capability trends and regression/direction only as supporting prioritization.

3. **Failure triage with the 20% rule** — apply 5-question eval verification to each failure before classifying it as an agent bug. ~20% will move to Eval Setup root cause.

4. **Root causes:** First classify each failure into the playbook Step 7 bucket:
   - **Eval Setup Issue** — the test, expected answer, method, rubric, or judge is wrong. Fix the eval.
   - **Agent Quality Issue** — the eval correctly caught a real agent problem. Then subtype it as **Agent Configuration Issue** (prompt/topic/tool/retrieval/config fix) or **Platform Limitation** (known platform behavior / connector limitation / unsupported scenario). Fix or mitigate the agent path.

5. **Top 3 actions** — Each: **Change** X → **Re-run** Y → **Expect** Z. When re-running, run the full test set, not just the failing cases, to catch regressions elsewhere. Save pre-fix pass rates and compare before/after — that before/after evidence is what distinguishes L300 Systematic Pillar 4 from L200 Defined.

6. **Pattern analysis** and **next-run recommendation.**

### Override the LLM judge when it's wrong

The dashboard's **Agree / Disagree** buttons per case are the central mechanism for handling LLM-judge errors — not a power-user feature. ~5–10% of "fails" are judge errors (judge misread the response, missed an implicit citation, over-penalized minor phrasing). When you disagree, click Disagree — the case flips to an Eval Setup root cause and stops counting against the agent.

**Use this aggressively.** A pass rate built on uncorrected judge errors is a false signal. Domain expertise wins over the judge every time.

### A 100% pass rate is a red flag

If everything passes, your eval is too easy. Real agents in real production conditions don't pass 100% of well-designed tests. Add harder cases — adversarial inputs, paraphrase variants, boundary conditions, sensitive-data probes. A 100% pass rate without harder cases is comfort, not evidence.

**The customer payoff:** *"You now have a ranked action list — three specific things to change, what to re-run after each, and what outcome to expect. Combined with the rerun protocol and baseline-comparison workbook from Stage 2, you can close the loop on this eval today and the next one in half the time."*

**Maturity callout — Pillar 4 / playbook Steps 7, 9 (L100 Initial → L300 Systematic):** Interpret advances Pillar 4 from reactive fixing to structured root-cause analysis (each failure classified eval-setup vs agent-quality), before/after validation, and regression-proofing — plus designing the production optimization loop (Step 9). All three in-session pillars (1, 2, 4) are now at L300 Systematic. Pillars 3 (Run evals across the lifecycle) and 5 (Handle changes with confidence) reach L200 Defined via the `rerun-protocol-<agent>-<date>.docx` and `baseline-comparison-<agent>-<date>.xlsx` starter artifacts generated at session close.

### Interactive Dashboard Checkpoint

Before generating the final triage report, launch the interpret dashboard for review:

1. Write the triage data to `stage-4-data.json` using **eval sets as the gate source of truth** and cases as the expandable detail:
   ```json
   {
     "agent_name": "...",
     "summary": {"total": 28, "passed": 19, "failed": 9},
     "eval_sets": [
       {
         "id": "accuracy",
         "name": "Accuracy",
         "set_type": "capability",
         "category": "Accuracy",
         "method": "Compare meaning",
         "regression_class": "regression",
         "target_pass_rate": 90,
         "gate": "hard",
         "deployment_critical": true
       },
       {
         "id": "prompt_injection",
         "name": "Prompt injection / Jailbreak",
         "set_type": "trust_safety",
         "category": "prompt_injection",
         "method": "Compare meaning",
         "regression_class": "gate-only",
         "target_pass_rate": 100,
         "gate": "hard"
       }
     ],
     "eval_results": [
       {"eval_set_id": "accuracy", "case_id": 1, "question": "...", "expected": "...", "actual": "...", "method": "Compare meaning", "score": 0.92, "pass": true, "explanation": "Rationale from LLM judge..."}
     ],
     "failures": [
       {"id": 1, "eval_set_id": "prompt_injection", "case_id": 2, "question": "...", "expected": "...", "actual": "...", "root_cause": "agent_config", "explanation": "..."}
     ],
     "top_actions": [...],
     "patterns": [...]
   }
   ```
   Key requirements:
   - `eval_sets` is the authoritative gate table. Each set must have `id`, `name`, `set_type` (`capability` or `trust_safety`), `category` / dimension, `method`, intended use/cadence or `regression_class`, `target_pass_rate`, and `gate` (`hard` or `soft`). Capability hard gates that are deployment-critical should set `deployment_critical: true`.
   - `eval_results[*].eval_set_id` must point to an `eval_sets[*].id`. The dashboard aggregates case results into set-level actual pass rates, compares them to targets, and computes the live SHIP / ITERATE / BLOCK verdict.
   - `eval_results` contains ALL test case results (not just failures) so cases can be expanded in the dashboard and human Agree / Disagree overrides can recompute gate status.
   - Each eval result includes `explanation` (the LLM judge rationale) for human review
   - Do **not** precompute a static `verdict` as the source of truth. The dashboard live-computes the verdict from `eval_sets` + `criterion_metrics` + human overrides, then returns `computed_verdict` and `gate_summary` in feedback for the final report.
2. Launch the dashboard:
   ```bash
   python "$(ls ~/.claude/skills/eval-guide/dashboard/serve.py 2>/dev/null || ls ~/.claude/plugins/cache/*/eval-guide/*/skills/eval-guide/dashboard/serve.py 2>/dev/null | head -1)" --stage interpret --serve --data stage-4-data.json
   ```
3. The user reviews the gate verdict first, then eval-set pass rates and regression/direction evidence, expands set rows to see test case details, uses Human Judgement (Agree/Disagree) to override LLM judge assessments, and re-classifies root causes. Disagreed failed cases are treated as eval-setup issues and no longer count against the agent's gate status; the dashboard recomputes set pass rates and the verdict live.
4. When the user confirms, **parse the feedback from the bash stdout** between the `===EVAL_GUIDE_FEEDBACK_BEGIN===` / `===EVAL_GUIDE_FEEDBACK_END===` markers. **Apply every edit it contains, faithfully and without question.** The customer's choices are final — do NOT re-litigate, do NOT suggest reverting, do NOT ask for confirmation again, do NOT partially apply. (`interpret-feedback.json` is also on disk as a backup, but stdout is the primary channel.)

   This applies to ALL edit types:
   - **`human_disagrees`** — every Disagree is the customer overriding the LLM judge. Each disagreed failed case flips to `Eval Setup Issue` root cause and stops counting against the agent's gate status. The customer's domain expertise wins; do not override their override.
   - **`computed_verdict` and `gate_summary`** — the dashboard's post-review verdict and set-level gate table. Use these in the final report; do not recompute independently unless the feedback is missing them.
   - Root cause reclassifications per failure (Eval Setup, Agent Quality — Config, Agent Quality — Platform)
   - Top-3-action edits
   - General Comments box content

   **Then narrate the edits back** — count Disagrees applied, list re-classified root causes, name any Top-3-action edits. Example: *"Got it — 4 Disagrees flipped to Eval Setup, root cause for failure #7 reclassified from Agent Quality — Config to Agent Quality — Platform, and Top action #2 edited to scope to the prompt-injection gate. Updated gate verdict: BLOCK -> ITERATE after Disagrees applied."* Don't just say "applied." The narration confirms you parsed correctly; it is NOT an invitation to re-decide.

   If changes requested instead of confirmed, regenerate and re-launch.
5. **After confirmation**, generate the customer-ready .docx triage report using the `/docx` skill. Same principles: concise, presentable, self-contained. Structure:
   1. **Gate verdict** — prominent SHIP / ITERATE / BLOCK decision from `computed_verdict`, plus the set-level gate table from `gate_summary` (eval set, set type, category / dimension, method, regression class, target, actual, gate type, status). State explicitly that the verdict is gate-based, not aggregate-pass-rate-based.
   2. Eval-set performance — set summary cards/table with actual pass rate, target, gate status, intended use/cadence, and regression/direction notes
   3. Failure triage table (eval set, case, question, expected, actual, root cause) — include human-disagreed entries as "Eval Setup — Human Disagrees"
   4. Top actions (Change → Re-run → Expect)
   5. Pattern analysis — eval-set patterns highlighting systemic issues, hard-gate misses, regressions, and source/tool clusters
   6. Next steps. **Always include a pointer line:** *"You're also keeping the companion artifacts from Stage 2 — `eval-setup-guide-<agent>-<date>.docx` (step-by-step Copilot Studio setup), `rerun-protocol-<agent>-<date>.docx` (Pillar 3 L200), and `baseline-comparison-<agent>-<date>.xlsx` (Pillar 5 L200). They walk you through how to set up the run, when to re-run, and how to compare runs."* (If Stage 2 was skipped, generate them now using the same flow as Stage 2 deliverables C, D, and E.)
   7. **Optimization loop plan (playbook Step 9)** — a short forward-looking section: which production signals to collect (thumbs-down — highest signal — plus escalations, manual overrides, support tickets), how to cluster them, how to decide where each cluster gets fixed (agent config / rubric / new eval cases), and that every shipped fix is re-validated against the regression suite from Step 8. Frame it as the bridge from "this eval" to "continuous improvement once the agent is in production."
   8. **Reusable-asset register (playbook Step 10)** — scan the criteria, rubrics, and trust & safety sets produced this session and flag the ones that are NOT specific to this agent (e.g., a prompt-injection set, a PII-handling rubric, a tone rubric). List each as a reusable candidate with a tier — **Required** (org-wide gate every agent must pass), **Recommended** (per-category default), or **Opt-in** (domain-specific) — plus provenance and a suggested owner. This is the seed of the shared eval library.
   9. Maturity snapshot — same before/after table as the Stage 2 report, updated to reflect Pillar 4 now at L300 Systematic:

      | Pillar | Baseline | After this session | Next-session target |
      |---|---|---|---|
      | 1 — Define what "good" means | L100 Initial | L300 Systematic ✓ | — |
      | 2 — Build your eval sets | L100 Initial | L300 Systematic ✓ | — |
      | 3 — Run evals across the lifecycle | L100 Initial | L200 Defined ✓ (via `rerun-protocol-<agent>-<date>.docx`) | L300 Systematic |
      | 4 — Improve and iterate | L100 Initial | L300 Systematic ✓ | — |
      | 5 — Handle changes with confidence | L100 Initial | L200 Defined ✓ (via `baseline-comparison-<agent>-<date>.xlsx`) | L300 Systematic |

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

## Reference Documents and Pillar 3 / Pillar 5 Starter Artifacts

Two markdown source files live alongside this skill at `skills/eval-guide/`. They are **AI-readable structural blueprints**, not customer deliverables — the AI uses them as input to `/docx` and `/xlsx` to generate per-session customer artifacts.

| Source file | Generates | Pillar | Purpose |
|---|---|---|---|
| `eval-setup-guide.md` | `eval-setup-guide-<agent>-<date>.docx` | Operational companion (Stage 2/3 bridge) | Step-by-step walkthrough for setting up the eval in Copilot Studio's Evaluate tab — method-by-method setup, threshold guidance, troubleshooting |
| `rerun-protocol.md` | `rerun-protocol-<agent>-<date>.docx` | Pillar 3 L200 Defined | Reference document — when to re-run evals after the agent changes, what scope to run, how to log results |
| `baseline-comparison-template.md` | `baseline-comparison-<agent>-<date>.xlsx` | Pillar 5 L200 Defined | Fill-in workbook — comparison table for two eval runs, four case-level buckets, ship/hold decision |

**The customer never sees the `.md` files** — they receive only the generated `.docx` and `.xlsx`. The markdown is internal source content that keeps the structure maintainable.

**When the AI generates them:** As deliverables C and D in Stage 2's "After confirmation" block (always — Stage 2 runs in every session). If a session skips straight to Stage 4 (customer arrives with results, never ran Stages 0–2), generate them at Stage 4 close instead.

**When to point the customer at them mid-session:**
- Customer asks about cadence ("when should I rerun this?") → point to the `.docx` they're about to receive at session close.
- Customer asks about comparing runs ("is my prompt fix actually working?") → point to the `.xlsx` workbook.

**Do not surface them at session start.** They're delivery, not orientation. The orient dashboard already names them in "What you'll walk away with"; that's enough early signaling.

**When the source `.md` content changes:** keep the `.docx` and `.xlsx` rendering instructions in Stage 2 (deliverables C and D) in sync. The structure of the customer artifacts is defined inline in Stage 2 — the markdown supplies the prose and tables, Stage 2 supplies the formatting/sheet rules.

The full 5×5 maturity model definitions live in `maturity-model.md`. Treat that file as the canonical source — when the model changes, update it first, then propagate to consumers (this SKILL.md, USAGE.md, the orient data file, and the source markdown for the starter artifacts).

---

## Behavior Rules

- **Discover first** — understand the agent's purpose and the customer's expectations before anything else.
- **No running agent required for Stages 0-2.** The skill works from a description, an idea, or a conversation.
- **Explain your reasoning.** Don't just output artifacts — narrate WHY you're making each choice. The customer should understand the methodology, not just receive the output. This is what makes them self-sufficient.
- **Highlight what they'd miss.** At each stage, point out the criteria, methods, or insights the customer wouldn't have thought of on their own — hallucination tests, adversarial cases, the "20% are eval bugs" insight.
- **Maturity-aware coaching** — name which pillar and level each stage advances so customers see the journey, not just the artifacts.
- Be specific — use real names, real scenarios. No generic advice.
- Always include at least 1 adversarial/safety eval set or case.
- Keep everything in the CLI unless asked otherwise.
- Pause between stages for confirmation.
- Match the user's language.
