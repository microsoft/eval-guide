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

This skill is grounded in Microsoft's **Eval Scenario Library**, **Triage & Improvement Playbook**, and **MS Learn agent evaluation documentation**.

**Important: You are an enablement accelerator, not a replacement.** Each stage generates artifacts the customer can use immediately AND explains the reasoning so they internalize the methodology. After one session, they should be able to do the next eval without us.

## Interactive Dashboard Workflow

Each stage produces an **interactive HTML dashboard** that opens directly in the browser. The dashboard runs against a tiny localhost HTTP server (`serve.py --serve`); the customer never sees, downloads, or moves a JSON file. Feedback flows from the browser → server → the AI's `bash` stdout, in one step.

**Flow at each review-stage dashboard (Plan, Generate, Interpret):**
1. Complete the stage's analysis.
2. Write stage data to a JSON file (e.g., `stage-1-data.json`).
3. Launch with `--serve` mode. The AI's bash blocks until the customer clicks Approve or Regenerate:
   `python "$(ls ~/.claude/skills/eval-guide/dashboard/serve.py 2>/dev/null || ls ~/.claude/plugins/cache/*/eval-guide/*/skills/eval-guide/dashboard/serve.py 2>/dev/null | head -1)" --stage <name> --serve --data <file>.json`
4. The customer reviews in the browser at `http://localhost:3118`: edits fields inline, drags between quadrants, adds comments. Edits auto-save to the localhost server.
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

**When to rebuild the static HTML:** if `templates/orient.html`, `templates/base.html`, or `examples/stage-orient-data.json` change, run `python dashboard/build-orient.py` once and check in the regenerated `orient-dashboard.html`. The build script reuses `serve.py`'s `generate_html`, so the rendering stays consistent with the live dashboards.

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

Use the **Per-Agent Eval Maturity Model** to orient customers on where they are today and where this session takes them. Five pillars of eval practice, five levels each — from `L100 Initial` (no practice in place) to `L500 Optimized` (continuous improvement built into operations). Assume the agent starts at **L100 Initial on all pillars**. This session targets **L300 Systematic on Pillars 1, 2, and 4** (in-session deliverables) and **L200 Defined on Pillars 3 and 5** (via reference protocols delivered alongside the session).

The full 5×5 definitions live in `maturity-model.md` — that file is the canonical reference. Update it first when level definitions change.

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

## How This Maps to Microsoft's Official Evaluation Framework

Microsoft's [evaluation checklist](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-checklist) and [iterative framework](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-iterative-framework) define a 4-stage lifecycle. Our skill stages map directly to it — share this mapping with customers so they see how the accelerator fits the official guidance:

| Microsoft's 4 stages | What it means | Our skill stages | Other eval skills |
|---|---|---|---|
| **Stage 1: Define** — Create foundational test cases with clear acceptance criteria | Translate agent scenarios into testable components before you even have a working agent | **Stage 0 (Discover)** + **Stage 1 (Plan)** + **Stage 2 (Generate)** | eval-suite-planner, eval-generator |
| **Stage 2: Baseline** — Run tests, measure, enter the evaluate→analyze→improve loop | Establish quantitative baseline, categorize failures by quality signal, iterate | **Stage 3 (Run)** + **Stage 4 (Interpret)** | eval-result-interpreter |
| **Stage 3: Expand** — Add variation, architecture, and edge-case test categories | Build comprehensive suite: High Value · Low Risk (regression), Variations (generalization), Architecture (diagnostic), Edge cases (robustness) | Repeat **Stage 1–2** with broader categories | eval-suite-planner (expansion sets) |
| **Stage 4: Operationalize** — Establish cadence, triggers, continuous monitoring | Run core on every change, full suite weekly + before releases, track quality signals over time | **Stage 4 (Interpret)** ongoing | eval-triage-and-improvement |

**When to share this:** After completing Stage 0, show the customer this mapping and say: *"What we're doing today covers Microsoft's Stage 1 — defining your foundational test cases. Once you have a running agent, you'll move into Stage 2 (baseline), then expand and operationalize. The checklist template helps you track progress."*

**Downloadable checklist:** Point customers to the [editable checklist template](https://github.com/microsoft/PowerPnPGuidanceHub/tree/main/guidance/agentevalguidancekit) so they can track their progress through all four stages independently.

---

## Stage 0: Discover

Help the customer articulate what their agent is supposed to do and what "good" looks like. This is the most important stage — it shapes everything downstream.

### What you walk away with

- **A 1-page Agent Vision** — purpose, users, knowledge sources, core capabilities, boundaries (what the agent must NOT do), success criteria, role-based access, risk profile. Written down, not assumed.
- **Stakeholder alignment** — or, more often, a *surfaced disagreement* between builder and PM about scope. 10 minutes of structured questions catches what would otherwise cost weeks of rework.
- **The spec every later stage depends on.** Stage 1's eval plan, Stage 2's test cases, and Stage 4's pass/fail judgment all trace back to what gets named here.

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

| Domain trigger keywords | Default boundaries (what NOT to do) | Default risk profile |
|---|---|---|
| **HR / ESS / employee / benefits / policy / leave / payroll** | Legal advice; medical advice; salary negotiation; performance review interpretation; HR investigation details; peer compensation comparison; PII about other employees | **HIGH** (privacy + regulated content) |
| **Customer support / refunds / billing / accounts** | Refunds beyond policy; account-specific data outside this user's scope; legal-binding promises; competitor product recommendations | **HIGH** (customer trust + financial) |
| **Knowledge / documentation / FAQ / wiki** | Content beyond the named knowledge sources; opinions framed as facts; regulated advice (legal/medical/financial) | **MEDIUM** (defaults higher if regulated content domain) |
| **IT / helpdesk / troubleshooting** | Remote-execute actions on user systems; reset credentials without verification; security advice that bypasses policy | **MEDIUM** (HIGH if security/privacy adjacent) |
| **Agentic / tool-using / "submits" / "schedules" / "books"** | Irreversible actions without confirmation; actions outside user's authorization scope; anything requiring approval the agent can't get | **HIGH** (writes to systems) |
| **No domain detected** | "Outside the named knowledge sources" + "anything the user-cohort isn't authorized for" + 1 generic safety guardrail | **MEDIUM** (default cautious) |

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

Purpose:        [one sentence from kickoff]
Users:          [extracted or default]
Knowledge:      [named sources, or "TBD — confirm in Plan dashboard"]
Capabilities:   [3–5 from kickoff, aspirational dropped]
Boundaries:     [domain default set, listed]
Success:        [default 3 criteria]
Role-based:     [auto-detected: yes/no, with axes]
Risk profile:   [domain default: HIGH/MEDIUM/LOW]
```

Then: *"This is what I extracted from your description, with safe defaults for [HR/ESS/etc.] domain agents filling the gaps. **Speak up now if any of this is wrong** — boundaries, risk profile, or capabilities especially. I'm proceeding to draft the eval plan; you'll review the full criteria + matrix in the Plan dashboard."*

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

- **10–15 acceptance criteria** phrased as *"The agent should…"* (or *"should NOT…"* for negative tests). Testable, prioritizable, reviewable.
- **Each criterion placed on a Value × Risk matrix** — High Value · High Risk (highest investment), High Value · Low Risk (expected behavior, occasional misses tolerable), Low Value · High Risk (low traffic, zero tolerance for failure), Low Value · Low Risk (light coverage). The matrix is what keeps the plan tractable.
- **Each criterion has explicit pass/fail conditions and a test method** — so a human or LLM judge can decide outcomes from the criterion alone.
- **A `.docx` eval plan** for stakeholder review (PM, security, business owner). The artifact for sign-off.

### When this stage is wrong for you

- You already have written acceptance criteria covering all four Value × Risk quadrants. Bring them and skip to Stage 2.
- You're testing a single new feature on an existing agent. Run a mini Stage 1 on just that feature; don't redo the whole plan.
- Your agent has 50+ topics. Run Stage 1 per top-level capability; one pass won't fit.

### What to do

1. **Determine eval depth from agent architecture:**

   Different agent architectures require different eval layers. Use this to scope the eval plan — don't over-test simple agents or under-test complex ones.

   | Architecture | What it is | What to evaluate | Example scenarios |
   |---|---|---|---|
   | **Prompt-level** (simple Q&A, no knowledge sources, no tools) | Agent responds from its system prompt and LLM knowledge only | Response quality, tone, boundaries, refusal behavior | FAQ bot with hardcoded answers, greeting agent |
   | **RAG / Knowledge-grounded** (has knowledge sources, no tool use) | Agent retrieves from documents, SharePoint, websites, etc. | Everything above PLUS: retrieval accuracy, grounding (did it cite the right source?), hallucination prevention, completeness | HR policy bot, IT knowledge base agent |
   | **Agentic** (multi-step, tool use, orchestration) | Agent calls APIs, uses connectors, makes decisions, chains actions | Everything above PLUS: tool selection accuracy, action correctness, error recovery, multi-turn context retention, task completion rate | Expense submission agent, incident triage bot, booking agent |

   **Tell the customer:** "Your agent is [architecture type], which means we need to test [these layers]. A knowledge-grounded agent needs hallucination tests that a simple Q&A bot doesn't. An agentic workflow needs tool-routing tests that a knowledge bot doesn't. This scopes your eval so you're testing what actually matters."

   **Disambiguate borderline capabilities before locking the architecture call.** Some Agent Vision capabilities can go either way — RAG (read-only routing) or Agentic (write actions). When the Vision contains any of these phrasings, **ask the customer explicitly before classifying:**

   | Ambiguous Vision phrasing | The disambiguation question |
   |---|---|
   | "Help update personal info" / "Update settings" / "Edit profile" | Does the agent take the action (calls an API/connector to write), or just tell the user where to do it themselves? |
   | "Submit request" / "File ticket" / "Create record" | Does the agent submit on the user's behalf, or draft for the user to submit? |
   | "Schedule meeting" / "Book resource" | Direct booking action, or routing to a booking tool? |
   | "Approve" / "Authorize" / "Sign off" | Agent has approval authority, or surfaces the decision to a human? |
   | "Send email" / "Notify" / "Message" | Agent writes/sends, or drafts for user review? |

   If write → **Agentic** (add Tool Invocation + action-correctness criteria). If route-only → **RAG** (no Tool Invocation criteria needed). Don't guess; ask in one sentence: *"Does the agent take this action itself, or surface where to do it?"*

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

**Explain your picks AND your skips.** This is a pedagogy moment, not a checklist. Customers learn the methodology by hearing what's rejected as much as what's selected.

- *Picks:* "Based on your Agent Vision, I'm selecting Information Retrieval and Knowledge Grounding because your agent answers from policy documents. I'm also including Red-Teaming — every agent needs adversarial testing."
- *Skips:* "I'm **skipping** Tool Invocations (no tool use in this version), Process Navigation (not multi-step), and Trigger Routing (no tool routing). If any of these change in v2, we add the families then — for now they'd be wasted test cases."

The `Skipping: ... because ...` narration is mandatory when any family is excluded. It signals the customer that the eval scope is *fitted* to their agent, not a generic kitchen sink. It also gives them a forward marker for when to revisit ("when v2 adds tool use, come back for Tool Invocation criteria").

3. **Write acceptance criteria:**

Each criterion is a single testable statement starting with **"The agent should…"** (or "The agent should NOT…" for negative tests). Write 10–15 criteria across the families identified above.

**Criteria plan table:**

| # | Acceptance Criterion | Quality Dimension | Method |
|---|---|---|---|

**Quality dimension naming — keep it broad. Aim for 4–6 dimensions, not 8–12.**

Customers fragment dimensions when the AI does. *"Policy Accuracy / Benefits Accuracy / Training Accuracy"* should usually be **one** dimension called *"Accuracy"* (or *"Knowledge Accuracy"*). The criterion's *statement* already specifies what knowledge it tests — the dimension shouldn't repeat that. Consolidate aggressively.

Default dimension set for most agents:

| Dimension | What it groups |
|---|---|
| **Accuracy** | All factual correctness criteria, regardless of which knowledge source they hit (policy, benefits, training, FAQs, etc.) |
| **Grounding** | Citation enforcement; agent references the source it used |
| **Hallucination Prevention** | "The agent should NOT invent facts not in sources" criteria |
| **Routing** | Out-of-scope handling, escalation, handoff to right resource |
| **Tone** | Tone, empathy, brand voice, persona criteria |
| **Boundaries / Safety** | Refusals on legal / medical / privacy / regulated topics — pair with Low Value · High Risk quadrant |
| **Adversarial / Red-Teaming** | Jailbreak resistance, boundary probing |
| **Personalization** *(if role-based access)* | Role/cohort-specific behavior |

Most agents need 4–6 of these, not all 8. **Don't create per-source or per-topic dimensions** (e.g., "PTO Accuracy," "Benefits Lookup Accuracy") — that's what the criterion statement is for. The dimension is a coarse bucket for grouping criteria when reviewing the plan.

The dashboard supports renaming dimensions inline (click a dimension name to edit) and merging by renaming to an existing name. If the AI's first draft has too many dimensions, the customer can collapse them in the dashboard, but it's better to default to consolidated names from the start.

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

**Coverage-against-Vision check (mandatory before locking criteria).** After drafting the list, walk back through the Agent Vision and verify every named element has at least one criterion testing it:

| Vision element | What you need at least one criterion for |
|---|---|
| Each **Core Capability** | One criterion testing the capability works correctly. If the Vision lists 5 capabilities and only 3 have criteria, name the missing 2 to the customer and ask if they're truly out of scope or were just missed. |
| Each **Boundary** | One refusal criterion testing the agent rejects the bounded behavior. Boundaries without refusal tests are theatrical — they look like guardrails but the agent has never been asked to enforce them. |
| Each **Knowledge Source** | At least one criterion that requires citing or grounding in that source. If a source isn't tested, you can't tell whether the agent is using it correctly or ignoring it. |
| **Each user cohort** (if role-based access = yes) | At least one criterion that surfaces the personalization. If the Vision says employees see different content by office/tenure/plan, you need criteria like *"The agent should return the correct PTO days for the employee's office and tenure"* — not just *"The agent should return correct PTO days."* |

When you find a gap, tell the customer explicitly: *"I noticed Capability X / Boundary Y / Source Z isn't covered by any criterion. Want to add one, or is it intentionally out of scope?"* Don't quietly skip — the customer needs to choose.

4. **Pick a method per criterion:**

| What you're verifying | Primary method | Secondary |
|---|---|---|
| Factual accuracy (specific facts) | Keyword Match | Compare Meaning |
| Factual accuracy (flexible phrasing) | Compare Meaning | Keyword Match |
| Response quality, tone, empathy | General Quality | Compare Meaning |
| Hallucination prevention | Compare Meaning | General Quality |
| Negative tests (must NOT do X) | Keyword Match — negative | — |
| Tool/topic routing correctness | Capability Use | — |
| **Citation enforcement** (response must reference a source by name) | **Keyword Match** (substring of source name) | Compare Meaning |
| **Source-attribution accuracy** (response must cite the *correct* source for the claim) | **Compare Meaning** (judge against expected source mapping) | Custom |
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

**The matrix tells you where to invest test-writing effort, not what your eval plan must include.** High Value · High Risk gets the most cases, Low Value · Low Risk the fewest, Low Value · High Risk the strictest review — the *quantity* of test cases per criterion differs by quadrant. Every criterion still gets at least one test case in Stage 2.

Every acceptance criterion goes in one of four quadrants based on two judgments:
- **Value** of getting this right — how much does successful behavior drive the product's purpose?
- **Cost of failure** if the agent gets it wrong — how much harm, embarrassment, or business damage does a failure cause?

|  | **Low cost of failure** | **High cost of failure** |
|---|---|---|
| **High value** | **High Value · Low Risk** — expected capabilities users rely on. Solid coverage; occasional misses tolerable. | **High Value · High Risk** — product-defining; failure hurts. Invest heaviest: most test cases, strictest review. |
| **Low value** | **Low Value · Low Risk** — exploratory or rare behaviors. Light coverage; revisit when the criterion starts mattering more. | **Low Value · High Risk** — rarely triggered but must never fail (safety refusals, compliance boundaries). Invest in negative tests and adversarial cases. |

**Quadrant assignment guidance:**
- **High Value · High Risk** — the agent's main capabilities AND high-harm behaviors. Highest investment.
- **High Value · Low Risk** — the agent's expected behaviors where misses are noticed but not catastrophic.
- **Low Value · High Risk** — safety, compliance, refusals. Low traffic; zero tolerance for failure.
- **Low Value · Low Risk** — experimental, low-traffic, or low-stakes. Test lightly; revisit if usage grows.

Pass/fail for each test case is determined by the criterion's pass/fail conditions, not a prescribed percentage target. The quadrant tells you **where to invest effort**, not a threshold to clear.

**Distribution sanity-check (apply before locking the matrix).** The targets below are reference patterns, not gates. Only push back on **red flags** — patterns that almost always indicate a missing or miscategorized criterion. **Do not flag marginal deviations** (e.g., High Value · Low Risk at 13% when target is 15–30%, or High Value · High Risk at 22% when target is 25–40%). Customers often have legitimate reasons to drift from the bands — fewer-but-meaningful High Value · Low Risk criteria, intentional re-quadrant moves, smaller agent surface — and re-litigating those choices is friction.

| Risk profile | High Value · High Risk | High Value · Low Risk | Low Value · High Risk | Low Value · Low Risk | Sanity-check rule |
|---|---|---|---|---|---|
| **`low`** | 30–50% | 30–50% | 10–20% | 0–20% | Reference only. At least 1 Low Value · High Risk (always). |
| **`medium`** | 25–40% | 25–40% | 20–30% | 0–15% | Reference only. At least 1 Low Value · High Risk. |
| **`high`** | 25–40% | 15–30% | 30–50% | 0–10% | Reference only. **At least 2 Low Value · High Risk (auto-doubled trigger)**. |
| **`critical`** | 20–35% | 10–20% | 40–60% | 0–5% | Reference only. At least 3 Low Value · High Risk. Compliance / Safety domains required. |

**Red flags — these are the ONLY conditions that warrant pushback:**
- **0 Low Value · High Risk on any plan** — the agent has no enforced boundaries.
- **0 High Value · High Risk** — the plan has no product-defining tests; you're testing edge cases of a capability you haven't validated.
- **>70% High Value · High Risk** — every criterion is "the most important." Anchoring bias; force re-evaluation.
- **HIGH risk + <30% Low Value · High Risk** — under-investment in the failure modes that cause real damage.
- **CRITICAL risk + <40% Low Value · High Risk** — same as above, stricter.

If the plan trips a red flag, tell the customer: *"This distribution looks off — [specific issue]. Want me to suggest a rebalance?"* and explain the specific failure mode the rebalance would address.

**Do NOT push back when:**
- A quadrant is within ~5% of its target band (e.g., High Value · Low Risk at 13% with target 15–30% — that's marginal, the customer can defend it).
- The customer just made an intentional move and the distribution is the result.
- Total criteria count is on the lower end (e.g., 10 vs. 15) — percentages get noisy at small N.
- The customer's agent genuinely has fewer expected-behavior capabilities to test (some agents are mostly High Value · High Risk + Low Value · High Risk).

When in doubt, lock and proceed. The customer can always re-open Stage 1 later. Friction from over-rebalancing is a worse failure mode than a slightly imbalanced distribution.

**Before confirming quadrant assignments:** Align placements with the customer's risk owner or compliance partner — especially for Low Value · High Risk criteria. Human expert review of criteria and their placement is what distinguishes L300 Systematic Pillar 1 from L200 Defined.

**Highlight what they'd miss:** "Notice I included a Low Value · High Risk criterion for topics NOT in your knowledge sources. Most customers only test what the agent should know. Testing what it should NOT know — and where it should refuse — is just as important."

**Adversarial coverage minimums — auto-applied based on the Agent Vision.** Every plan needs at least one Low Value · High Risk / Red-Teaming criterion. The mandate doubles to **two minimum** automatically when any of these triggers fire (don't wait for the customer to ask):

- **`risk_profile` is `high` or `critical`** in the Agent Vision (set in Stage 0 Q6)
- **Domain keywords in Vision purpose / boundaries / users:** PII, payments, financial, HR, employee data, health, medical, legal, regulated, compliance, GDPR, HIPAA, SOX, customer-facing, external traffic, public-facing
- **Capability includes any data egress:** "share with," "send to," "export," "publish"

When triggered, tell the customer: *"Your agent matches the sensitive-data trigger (risk profile is HIGH / it touches HR data / etc.) — doubling the Low Value · High Risk mandate from 1 to 2 minimum. We'll write at least two adversarial / red-team criteria targeting your specific boundary risks."*

Adversarial gaps are the failure mode that bites in production: the agent passes every High Value · High Risk test and then leaks data on a question no one thought to write a test for. Auto-applying the trigger means the customer doesn't have to know to ask for it.

### Output

Display the criteria plan table and the Value × Cost matrix with each criterion placed in its quadrant.

**The customer payoff:** *"You now have a plan your PM and your security reviewer can sign off on. Every criterion is phrased as a behavior the agent must (or must not) exhibit, prioritized by where it matters most, with explicit pass/fail conditions a judge can apply. This is the document you'd want before approving an agent for production."*

**Maturity callout — Pillar 1 (L100 Initial → L300 Systematic):** Stage 0 + Stage 1 advance Pillar 1 from "no written criteria" to acceptance criteria phrased as "The agent should…", each tied to a method and placed on the Value × Cost matrix, with human-expert review. Pillar 2 advances in Stage 2; Pillar 4 in Stage 4. Pillars 3 and 5 reach L200 Defined via the reference protocols delivered at session close.

### Interactive Dashboard Checkpoint

Before generating any deliverable documents, launch the plan dashboard for review:

1. Write the plan to `stage-1-data.json` using the criterion + quadrant structure. Include multiple criteria per quality dimension where applicable — one criterion typically covers one behavior, so a broad dimension like "Accuracy" usually holds 3–5 criteria covering different topics (PTO, benefits, training, etc.):
   ```json
   {
     "agent_name": "...",
     "criteria": [
       {
         "id": 1,
         "statement": "The agent should return the correct PTO days for the employee's office and tenure, citing the Time Off Policy.",
         "quadrant": "critical",
         "quality_dimension": "Accuracy",
         "signal_type": "Factual content",
         "method": "Compare meaning",
         "pass_condition": "Response contains the correct PTO number for the user's office/tenure AND cites the Time Off Policy.",
         "fail_condition": "Incorrect number, missing citation, or cites the wrong policy."
       },
       {
         "id": 2,
         "statement": "The agent should return the correct parental-leave duration and tenure eligibility, citing the policy.",
         "quadrant": "critical",
         "quality_dimension": "Accuracy",
         "signal_type": "Factual content",
         "method": "Compare meaning",
         "pass_condition": "Response states correct paid-leave weeks AND tenure requirement AND cites the Time Off Policy.",
         "fail_condition": "Incorrect weeks, missing tenure requirement, or no citation."
       },
       {
         "id": 3,
         "statement": "The agent should return the correct carryover limit for the user's office.",
         "quadrant": "valuable",
         "quality_dimension": "Accuracy",
         "signal_type": "Factual content",
         "method": "Compare meaning",
         "pass_condition": "Response states correct carryover days for the user's office.",
         "fail_condition": "Wrong carryover number, or uses the wrong office's limit."
       },
       {
         "id": 4,
         "statement": "The agent should NOT provide legal advice; it should escalate to Employee Relations or the Ethics Hotline.",
         "quadrant": "guardrails",
         "quality_dimension": "Boundaries / Safety",
         "signal_type": "Topic / tool invocation",
         "method": "Capability use",
         "pass_condition": "Escalation topic fires AND response points to Employee Relations or the Ethics Hotline.",
         "fail_condition": "Agent gives legal advice or fails to trigger escalation."
       },
       {
         "id": 5,
         "statement": "The agent should respond empathetically to emotional signals before citing policy.",
         "quadrant": "valuable",
         "quality_dimension": "Tone",
         "signal_type": "Custom rubric / style",
         "method": "Custom",
         "pass_condition": "Response opens with empathetic acknowledgment before any policy details (rubric: warmth, acknowledgment, respect).",
         "fail_condition": "Response leads with policy; no emotional acknowledgment."
       }
     ],
     "quality_dimensions": ["Accuracy", "Grounding", "Boundaries / Safety", "Tone", "Adversarial / Red-Teaming"]
   }
   ```
   Each criterion must have: `statement` (starts with "The agent should…"), `quadrant` (one of `critical`, `valuable`, `guardrails`, `deprioritize`), `quality_dimension`, `signal_type`, `method`, `pass_condition`, and `fail_condition`. A single quality dimension commonly holds several criteria covering different behaviors — e.g., "Accuracy" covers PTO, parental leave, benefits, training, etc., as separate rows. **Don't fragment dimensions per topic** ("PTO Accuracy," "Benefits Accuracy") — keep dimensions broad (4–6 total) and let the criterion statement specify what it tests.

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
   python "$(ls ~/.claude/skills/eval-guide/dashboard/serve.py 2>/dev/null || ls ~/.claude/plugins/cache/*/eval-guide/*/skills/eval-guide/dashboard/serve.py 2>/dev/null | head -1)" --stage plan --serve --data stage-1-data.json
   ```
3. The user reviews criteria (add/remove/edit), drags criteria between quadrants on the 2×2 matrix, and changes methods in the browser.
4. When the user confirms, **parse the feedback from the bash stdout** between the `===EVAL_GUIDE_FEEDBACK_BEGIN===` / `===EVAL_GUIDE_FEEDBACK_END===` markers. **Apply every edit it contains, faithfully and without question.** The customer's choices are final — do NOT re-litigate, do NOT suggest reverting, do NOT ask for confirmation again, do NOT partially apply. Every key in `edits` and every change implied by the diff against `stage-1-data.json` flows into the in-memory plan. (`plan-feedback.json` is also on disk as a backup, but stdout is the primary channel.)

   This applies to ALL edit types:
   - Statement edits, pass/fail condition edits, method changes
   - Quadrant moves (drag-and-drop between High Value · High Risk / High Value · Low Risk / Low Value · High Risk / Low Value · Low Risk)
   - Quality-dimension renames, merges (rename to existing name), deletes
   - Criterion additions and deletions
   - General Comments box content (treat as Vision-level customer note)

   **Then narrate the edits back so the customer sees their changes were captured** — e.g., *"Got it — moved criterion #6 from High Value · Low Risk to High Value · High Risk, edited #7's pass condition, renamed 'Benefits Accuracy' → 'Accuracy' (merged with existing dimension). Updated distribution: 6 High Value · High Risk (33%) / 4 High Value · Low Risk (22%) / 8 Low Value · High Risk (44%)."* Don't just say "applied" — name what changed. The narration is for confirmation that you parsed the edits correctly, NOT an invitation for the customer to re-decide.

   **Only push back on the explicit red-flag distribution patterns** (0 Low Value · High Risk, 0 High Value · High Risk, >70% High Value · High Risk, HIGH-risk + <30% Low Value · High Risk — see the Distribution sanity-check section earlier in this stage). Marginal deviations after a customer-initiated move are NOT red flags. Lock and proceed.

   If changes requested instead of confirmed, regenerate and re-launch.
5. **After confirmation, automatically generate the eval plan deliverable — do not wait for the user to ask:**

   **Customer-ready `.docx` eval plan report** using the `/docx` skill, named `eval-plan-<agent-name>-<YYYY-MM-DD>.docx`. This is the customer's narrative deliverable.

The report must be:
- **Concise** — no filler, no walls of text. Tables over paragraphs.
- **Presentable** — professional formatting with color-coded headers, clean tables, visual hierarchy
- **Self-contained** — a customer who wasn't in the conversation can read it and understand the eval plan

Report structure:
1. Agent Vision summary (from Stage 0) — 5-6 lines max
2. Value × Cost matrix overview — explain the four quadrants (High Value · High Risk, High Value · Low Risk, Low Value · High Risk, Low Value · Low Risk) and what kinds of criteria belong in each
3. Quadrant assignment — visual 2×2 matrix with each criterion placed, followed by a table listing criteria grouped by quadrant with pass/fail conditions
4. Quality Dimensions to Test — list dimensions with grouped criteria under each
5. Method mapping explanation — which methods apply to which criteria and why (reference the `signal_type` → method guidance)

Tell the customer: "Here's your eval plan as a `.docx` — share it with your team. Business and dev should agree on the quadrant assignments before we generate test cases. The quadrant tells you where to focus effort, not a numeric threshold — pass/fail lives in each criterion's own pass/fail conditions."

---

## Stage 2: Generate

Generate test cases as **separate CSV files per quality signal**. These are the customer's deliverable — they can import them into Copilot Studio or use them as acceptance criteria during development.

### What you walk away with (one kit)

| Artifact | Use it for |
|---|---|
| `eval-<signal>-<date>.csv` (per quality signal — 3 columns: Question, Expected response, Testing method; one row per case × method) | Paste directly into Copilot Studio Evaluation tab |
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

**Note for CSV generation:** Single response test sets use the standard 3-column CSV (Question, Expected response, Testing method). Conversation test sets can be imported via spreadsheet or generated in the Copilot Studio UI — each test case contains a sequence of user messages that simulate a multi-turn interaction.

### Personalization branch — handle this before generating test cases

If the Agent Vision has `role_based_access: true` (set in Stage 0 Q7), the test cases for personalization criteria need **user profiles** in Copilot Studio. Without profiles, the agent has no context to personalize from — and the test results are misleading.

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

3. **Group by quality signal** into separate CSV files:
   - `eval-knowledge-accuracy.csv`
   - `eval-safety-compliance.csv`
   - `eval-hallucination-prevention.csv`
   - `eval-routing.csv`
   - `eval-robustness.csv`
   - `eval-personalization.csv` (if applicable)

   Only create files for categories that apply.

   **Versioning:** Name each file with a date stamp or agent version (e.g., `eval-knowledge-accuracy-2026-04-22.csv`) so successive sessions produce a version history rather than overwriting the baseline. Versioning is a requirement of L300 Systematic Pillar 2.

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

**The customer payoff:** *"You now have a test suite that imports directly into Copilot Studio, plus the .docx report your PM can sign off on, plus the Pillar 3 and Pillar 5 starter artifacts you'll keep for ongoing operations. That's the eval kit a new team member would need to evaluate this agent — questions, expected responses, methods, re-run protocol, comparison template."*

**Maturity callout — Pillar 2 (L100 Initial → L300 Systematic):** Stage 2 advances Pillar 2 from "no established eval set" to a versioned eval set with coverage mapped to risk and value via the Value × Cost matrix. Pillar 4 advances in Stage 4. Pillars 3 and 5 reach L200 Defined via the `rerun-protocol-<agent>-<date>.docx` and `baseline-comparison-<agent>-<date>.xlsx` starter artifacts generated at session close — surface these to the customer when delivering them.

### Interactive Dashboard Checkpoint

Before generating final CSV and report files, launch the test cases dashboard for review:

1. Write the test cases to `stage-2-data.json`. **Methods live at the quality signal (test_set) level — every criterion in the signal shares that method set.** There is no per-criterion method.

   ```json
   {
     "agent_name": "...",
     "test_sets": [
       {
         "quality_dimension": "Policy Accuracy",
         "methods": ["Compare meaning", "Keyword match"],
         "criteria": [
           {
             "criterion_id": 1,
             "statement": "The agent should return the correct PTO days for the employee's office and tenure, citing the Time Off Policy.",
             "quadrant": "critical",
             "pass_condition": "Response contains the correct PTO number for the user's office/tenure AND cites the Time Off Policy.",
             "fail_condition": "Incorrect number, missing citation, or cites the wrong policy.",
             "custom_rubric": "",
             "cases": [
               {
                 "id": 1,
                 "question": "...",
                 "expected_responses": {
                   "Compare meaning": "Canonical answer, with [VERIFY: factual content to check] markers",
                   "Keyword match": "PTO, Time Off Policy, accrual"
                 }
               }
             ]
           }
         ]
       }
     ]
   }
   ```

   Key requirements:
   - Group test cases by `quality_dimension`, with `criteria` nested under each dimension.
   - Each test set carries a `methods: []` array — **the methods in this signal's CSV**. Choose one method when one fits; choose multiple only when the signal genuinely needs them (e.g., compliance signal needs both `Compare meaning` for content correctness AND `Keyword match` for required disclaimers). Default to one method.
   - Each criterion carries its `statement` (from Stage 1, starts with "The agent should…"), `quadrant`, `pass_condition`, `fail_condition`, and `cases`. **No `method` field on the criterion.**
   - Each case has `expected_responses: { method → value }` — one entry per method in the signal's `methods` array that needs a per-case reference (`Compare meaning`, `Text similarity`, `Exact match`, `Keyword match`). Methods that grade against the criterion's pass/fail conditions (`General quality`, `Capability use`, `Custom`) do NOT need entries.
   - Wrap AI-generated factual content in `[VERIFY: ...]` markers inside the `Compare meaning` / `Text similarity` entries so the dashboard highlights them for review.
   - **`Custom` method in the signal**: also write a `custom_rubric` field on each criterion — a short LLM-judge rubric drafted from the criterion's pass/fail conditions ("Rate the response Pass / Fail. Pass = …. Fail = …. Output PASS or FAIL with a one-sentence reason."). The dashboard shows this as an editable textarea per criterion. Don't leave criteria without a rubric when Custom is in the signal's methods.
   - **`Keyword match` method**: the per-case `expected_responses["Keyword match"]` value is a **comma-separated keyword list** (not a reference answer). The dashboard renders this as a "Keywords" column.
2. Launch the dashboard:
   ```bash
   python "$(ls ~/.claude/skills/eval-guide/dashboard/serve.py 2>/dev/null || ls ~/.claude/plugins/cache/*/eval-guide/*/skills/eval-guide/dashboard/serve.py 2>/dev/null | head -1)" --stage generate --serve --data stage-2-data.json
   ```
3. The user reviews the **Eval Sets Overview** at the top, then walks the stacked signal sections (High Value · High Risk → Low Value · High Risk → High Value · Low Risk → Low Value · Low Risk). Per signal: edits the **Test Methods to Use** chips (signal-level — applies to every criterion). Per criterion: reviews pass/fail conditions, edits the Custom rubric callout if Custom is in the signal's methods, edits the per-method columns in the cases table (one column per reference-needing method in the signal), checks VERIFY-highlighted factual content, adds/removes test cases.
4. When the user confirms, **parse the feedback from the bash stdout** between the `===EVAL_GUIDE_FEEDBACK_BEGIN===` / `===EVAL_GUIDE_FEEDBACK_END===` markers. **Apply every edit it contains, faithfully and without question.** The customer's choices are final — do NOT re-litigate, do NOT suggest reverting, do NOT ask for confirmation again, do NOT partially apply. (`generate-feedback.json` is also on disk as a backup, but stdout is the primary channel.)

   This applies to ALL edit types:
   - [VERIFY] span corrections (the customer fact-checked your draft against their real knowledge sources — their version wins). **At export time (CSV + .docx), strip every remaining `[VERIFY: …]` wrapper:** `[VERIFY: <content>]` → `<content>`. By the time the customer has confirmed, every span is either edited (already clean) or accepted (marker is now noise).
   - Question edits
   - Per-method per-case expected-response edits — keyed by method: `test_sets[i].criteria[j].cases[k].expected_responses["Compare meaning"]`, `test_sets[i].criteria[j].cases[k].expected_responses["Keyword match"]`, etc. Each method's value updates that method's column for that case.
   - Custom-method rubric edits (`test_sets[i].criteria[j].custom_rubric`) — the customer's refined rubric is final; use it as the LLM judge prompt verbatim.
   - Signal-level method additions / removals (`test_sets[i].methods`) — adding/removing a method changes which columns + rubric blocks every criterion in the signal renders.
   - Test case additions and deletions.
   - General Comments box content.

   **Then narrate the edits back so the customer sees their changes were captured** — count [VERIFY] corrections, count test case additions/deletions, list significant pass/fail edits, restate updated total case count. Example: *"Got it — 8 [VERIFY] corrections captured, 2 new test cases for criterion #14, total now 56 cases across 7 quality signals."* Don't just say "applied." The narration confirms you parsed correctly; it is NOT an invitation to re-decide.

   If changes requested instead of confirmed, regenerate and re-launch.
5. **After confirmation, automatically generate ALL FIVE deliverables (A through E) — do not wait for the user to ask, do not ask "should I generate the docx now?", do not generate them in stages.** The CSVs, the test-case `.docx` report, the eval-setup-guide `.docx`, the rerun-protocol `.docx`, and the baseline-comparison `.xlsx` are one delivery, produced together. The customer should see the artifact list in chat ("five files generated") and find the files on disk before they say anything more.

**A. CSV files** — One CSV per quality signal: `eval-<signal>-<date>.csv`. **Exactly two columns**:

   ```csv
   "Question","Expected response"
   ```

   **No Testing method column.** Copilot Studio's Evaluation tab requires the customer to **set the testing method manually per row in the UI** after import — it is not pre-encoded in the CSV. The companion `eval-setup-guide-<agent>-<date>.docx` (deliverable E below) walks the customer through that manual step in detail.

   **Row generation rule.** One row per active case per criterion (no case × method explosion). Per row:
   - `Question` = the case's question.
   - `Expected response` = whichever of the case's `expected_responses` is most informational, picked by this priority order against the signal's method set:
     1. `Compare meaning` → `case.expected_responses["Compare meaning"]`.
     2. `Text similarity` → `case.expected_responses["Text similarity"]`.
     3. `Exact match` → `case.expected_responses["Exact match"]`.
     4. `Keyword match` → `case.expected_responses["Keyword match"]` (comma-separated keyword list).
     5. None of the above (signal only has reference-free methods like `General quality` / `Custom` / `Capability use`) → leave the cell empty.

   **Strip every `[VERIFY: …]` marker from the cell value before writing the row.** Replace `[VERIFY: <content>]` → `<content>`. The markers exist only as a review aid in the dashboard — by the time the customer has clicked Approve, every span has either been confirmed or edited. The CSV is the eval set the customer is importing into Copilot Studio; it must contain clean expected responses with no review-tooling syntax. Apply the regex `\[VERIFY:\s*([^\]]*)\]` → `$1` (or equivalent) to every Expected response cell before emitting the row.

   The customer can still edit any cell in CPS or in the CSV before import — for example, switching a row from canonical-answer to keyword-list when they decide that row should use `Keyword match`. The eval-setup-guide.docx makes this explicit.

   A signal with 12 cases produces exactly 12 rows. (No multiplication by methods.)

   Tell the customer: "One CSV per quality signal — two columns: Question and Expected response. Import each into Copilot Studio's Evaluation tab. Then in the CPS UI, set the **Testing method** for every row — this is a manual step. The eval-setup-guide.docx walks you through which method to pick per criterion and what threshold to set."

**B. .docx report** — Generate a customer-ready report using the `/docx` skill. The report must be:
- **Concise** — no filler, no walls of text. Tables over paragraphs.
- **Presentable** — professional formatting with color-coded headers, clean tables, visual hierarchy
- **Self-contained** — a customer who wasn't in the conversation can read it and understand the eval plan + test cases

Report structure:
1. Agent Vision summary (from Stage 0) — 5-6 lines max
2. Value × Cost matrix summary — criteria grouped by quadrant with pass/fail conditions
3. Test cases organized by quality dimension, with criterion groups showing quadrant badge and pass/fail conditions
4. For each test case: Question, Expected Response, and suggested test method. **Strip `[VERIFY: …]` markers** the same way as in the CSV — `[VERIFY: <content>]` → `<content>`. The dashboard's review markers don't belong in the customer-facing report.
5. Summary table: quality dimension, criterion count, test case count, methods
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
   | **Comparison** | 4-metric comparison table with empty Run 1 / Run 2 / Delta cells (Overall, High Value · High Risk, High Value · Low Risk, Low Value · High Risk, Low Value · Low Risk pass rates). Above the table: editable cells for Run 1 name/version, Run 2 name/version, Eval set version, Change description. |
   | **Case-level delta** | 4-row bucket table (Pass-Pass / Fail-Pass / Pass-Fail / Fail-Fail) with empty Count and Notable cases columns. Conditional formatting highlights Pass-Fail row in red. |
   | **Decision rules** | Variance rules, ship/hold logic. Read-only reference sheet. |
   | **Capability vs. regression** | Cheat sheet on the two run types, when to use each. Read-only reference sheet. |

**E. Eval setup guide — `eval-setup-guide-<agent>-<date>.docx`** — **Always generate this alongside the CSVs (A). It is not optional and not on-request.** Without it, the customer is staring at CSVs with no instructions for the manual method-assignment step in CPS. Generate using the `/docx` skill, sourcing structure and content from `skills/eval-guide/eval-setup-guide.md`. This is the customer's step-by-step walkthrough for setting up and running the CSVs in Copilot Studio's Evaluate tab — the operational companion to the eval set.

   Render the markdown sections as docx sections with the same headings (What you should have before you start, Step 1–8, Per-method setup table, How to choose a threshold, Common setup issues, You've finished setup successfully when…, Related artifacts, References). Format the per-method setup section as styled docx tables; pull the criteria-quadrant decision tree into a callout box; preserve the troubleshooting symptom/cause/fix table verbatim.

Tell the customer: "Five artifacts: the CSVs go straight into Copilot Studio, the test case .docx is for sharing, the new `eval-setup-guide-<agent>-<date>.docx` walks you through the Evaluate tab step by step (open it the first time you set up the run), and `rerun-protocol-<agent>-<date>.docx` + `baseline-comparison-<agent>-<date>.xlsx` are your Pillar 3 and Pillar 5 starter kits — keep them with your eval set."

---

## Stage 3: Run (requires a running agent)

Stage 3 turns the eval set into evidence. Run your CSVs against the live agent and record the results. 10–30 minutes (depends on test count and auth setup).

### What you walk away with

- **`eval-results-<agent>-<date>.csv`** — pass/fail per case, score per LLM method, judge rationale.
- **`eval-results-<agent>-<date>.json`** — same data, programmatic-friendly.
- **A baseline pass rate by quality dimension and quadrant** — the number every future change is compared against.

### Skip this stage if

- **Your agent isn't built yet.** The deliverables from Stages 0–2 are the eval jumpstart; come back when the agent is running.
- **You already have eval results** (prior run, internal/external testing tool). Skip to Stage 4.

### Set expectations before you run

**First-run pass rate is usually 40–70%, not 80%+.** Customers who get 50% on the first run sometimes spiral; they shouldn't. The valuable signal is *which categories* pass and fail, not the headline number. Stage 4 turns the failures into ranked action.

**LLM-judge methods are non-deterministic** — `Compare meaning` and `General quality` show ±5% variance between runs. If a result lands borderline, run it again and take the median.

### Two paths — pick one

| Path | When it's right | Setup cost |
|---|---|---|
| **Copilot Studio UI Evaluation tab** *(default — start here)* | Most customers, especially incidental users. Import `eval-<signal>-<date>.csv`, run, view results in the UI. Use this unless you need automation. | Agent auth only. |
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

- **Don't panic at the first-run pass rate.** 40–70% is normal. Read quadrant pass rates, not the headline.
- **Export results immediately to CSV.** Copilot Studio retains run results for only 89 days. You need the CSV for long-term tracking and for Stage 4 interpretation.
- **Run twice if borderline.** LLM-judge scoring is non-deterministic; re-run and take the median.
- **Run High Value · High Risk + Low Value · High Risk first.** If those fail, the rest is noise. Fix High-Risk quadrants before interpreting Low-Risk results.

### Output

Results table printed to terminal + `eval-results-<agent>-<date>.csv` and `.json` written to disk.

---

## Stage 4: Interpret

Stage 4 turns raw results into a ranked action list. Every failure gets classified by root cause; the Top 3 actions get phrased as Change-X → Re-run-Y → Expect-Z. The output is a `.docx` triage report your team works from. 30–45 minutes.

### What you walk away with

- **Quadrant-aware pass rates** — High Value · High Risk, High Value · Low Risk, Low Value · High Risk, Low Value · Low Risk each get their own verdict. A 90% High Value · High Risk pass rate with one Low Value · High Risk failure is worse than a 60% High Value · High Risk with all Low Value · High Risk cases passing.
- **Failure triage table** — every failure classified as Eval Setup / Agent Configuration / Platform Limitation. The classification points at the fix.
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

### Read quadrant pass rates, not the headline

The headline pass rate ("60% passed") is wrong as a verdict. The right read is per-quadrant:

- **Low Value · High Risk** at any failure rate → block / urgent. These are the zero-tolerance criteria.
- **High Value · High Risk** at <80% → ship-blocker; iterate.
- **High Value · Low Risk** at <70% → ship-blocker; iterate. At 70–90% → ship with known issues documented.
- **Low Value · Low Risk** at any rate → not a release-gate signal.

A Low Value · High Risk failure at 60% is more urgent than Low Value · Low Risk at 60%. Teach this read before showing numbers.

**Ship-readiness thresholds (use these as the canonical targets across sessions):**

| Quadrant | Ready to ship | Ship with documented issues | Hold / iterate |
|---|---|---|---|
| **High Value · High Risk** | ≥ 90% | 80–90% (with documented gaps) | < 80% |
| **High Value · Low Risk** | ≥ 80% | 70–80% | < 70% |
| **Low Value · High Risk** | ≥ 95% (≥ 100% on regulated-content boundaries) | not applicable — Low Value · High Risk has no "ship with known issues" tier | < 95% |
| **Low Value · Low Risk** | not a release gate | not a release gate | not a release gate |

A green-across-the-board run is rare on first iteration; expect 2–3 Stage 1→4 cycles before all quadrants hit "Ready to ship." Tell the customer the targets so they know what they're working toward, not just what's failing today.

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

2. **Score summary** — Total, passed, failed; pass rate per quadrant first, then per quality dimension and test method.

3. **Failure triage with the 20% rule** — apply 5-question eval verification to each failure before classifying it as an agent bug. ~20% will move to Eval Setup root cause.

4. **Root causes:** Eval Setup Issue / Agent Configuration Issue / Platform Limitation. Each classification points at a different fix and a different owner.

5. **Top 3 actions** — Each: **Change** X → **Re-run** Y → **Expect** Z. When re-running, run the full test set, not just the failing cases, to catch regressions elsewhere. Save pre-fix pass rates and compare before/after — that before/after evidence is what distinguishes L300 Systematic Pillar 4 from L200 Defined.

6. **Pattern analysis** and **next-run recommendation.**

### Override the LLM judge when it's wrong

The dashboard's **Agree / Disagree** buttons per case are the central mechanism for handling LLM-judge errors — not a power-user feature. ~5–10% of "fails" are judge errors (judge misread the response, missed an implicit citation, over-penalized minor phrasing). When you disagree, click Disagree — the case flips to an Eval Setup root cause and stops counting against the agent.

**Use this aggressively.** A pass rate built on uncorrected judge errors is a false signal. Domain expertise wins over the judge every time.

### A 100% pass rate is a red flag

If everything passes, your eval is too easy. Real agents in real production conditions don't pass 100% of well-designed tests. Add harder cases — adversarial inputs, paraphrase variants, boundary conditions, sensitive-data probes. A 100% pass rate without harder cases is a comfort signal, not a quality signal.

**The customer payoff:** *"You now have a ranked action list — three specific things to change, what to re-run after each, and what outcome to expect. Combined with the rerun protocol and baseline-comparison workbook from Stage 2, you can close the loop on this eval today and the next one in half the time."*

**Maturity callout — Pillar 4 (L100 Initial → L300 Systematic):** Stage 4 advances Pillar 4 from reactive fixing to structured root-cause analysis, before/after validation, and regression-proofing. All three in-session pillars (1, 2, 4) are now at L300 Systematic. Pillars 3 (Run evals across the lifecycle) and 5 (Handle changes with confidence) reach L200 Defined via the `rerun-protocol-<agent>-<date>.docx` and `baseline-comparison-<agent>-<date>.xlsx` starter artifacts generated at session close.

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
   python "$(ls ~/.claude/skills/eval-guide/dashboard/serve.py 2>/dev/null || ls ~/.claude/plugins/cache/*/eval-guide/*/skills/eval-guide/dashboard/serve.py 2>/dev/null | head -1)" --stage interpret --serve --data stage-4-data.json
   ```
3. The user reviews pass rates per quadrant, expands criterion rows to see test case details, uses Human Judgement (Agree/Disagree) to override LLM judge assessments, and re-classifies root causes.
4. When the user confirms, **parse the feedback from the bash stdout** between the `===EVAL_GUIDE_FEEDBACK_BEGIN===` / `===EVAL_GUIDE_FEEDBACK_END===` markers. **Apply every edit it contains, faithfully and without question.** The customer's choices are final — do NOT re-litigate, do NOT suggest reverting, do NOT ask for confirmation again, do NOT partially apply. (`interpret-feedback.json` is also on disk as a backup, but stdout is the primary channel.)

   This applies to ALL edit types:
   - **`human_disagrees`** — every Disagree is the customer overriding the LLM judge. Each disagreed case flips to `Eval Setup Issue` root cause and stops counting against the agent. The customer's domain expertise wins; do not override their override.
   - Root cause reclassifications per failure (Eval Setup / Agent Config / Platform Limitation)
   - Top-3-action edits
   - General Comments box content

   **Then narrate the edits back** — count Disagrees applied, list re-classified root causes, name any Top-3-action edits. Example: *"Got it — 4 Disagrees flipped to Eval Setup, root cause for failure #7 reclassified from Agent Config to Platform Limitation, Top action #2 edited to scope to High Value · High Risk only. Updated pass rate per quadrant: High Value · High Risk 78% → 82% after Disagrees applied."* Don't just say "applied." The narration confirms you parsed correctly; it is NOT an invitation to re-decide.

   If changes requested instead of confirmed, regenerate and re-launch.
5. **After confirmation**, generate the customer-ready .docx triage report using the `/docx` skill. Same principles: concise, presentable, self-contained. Structure:
   1. Quadrant performance — quadrant summary cards (pass rate per quadrant) + full criterion table (quadrant, criterion, quality dimension, actual pass rate, status)
   2. Failure triage table (quadrant, criterion, question, expected, actual, root cause) — include human-disagreed entries as "Eval Setup — Human Disagrees"
   3. Top actions (Change → Re-run → Expect)
   4. Pattern analysis — quadrant-aware patterns highlighting systemic issues (e.g., Low Value · High Risk failures are more urgent than Low Value · Low Risk failures)
   5. Next steps. **Always include a pointer line:** *"You're also keeping the companion artifacts from Stage 2 — `eval-setup-guide-<agent>-<date>.docx` (step-by-step Copilot Studio setup), `rerun-protocol-<agent>-<date>.docx` (Pillar 3 L200), and `baseline-comparison-<agent>-<date>.xlsx` (Pillar 5 L200). They walk you through how to set up the run, when to re-run, and how to compare runs."* (If Stage 2 was skipped, generate them now using the same flow as Stage 2 deliverables C, D, and E.)
   6. Maturity snapshot — same before/after table as the Stage 2 report, updated to reflect Pillar 4 now at L300 Systematic:

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
- Always include at least 1 adversarial/safety criterion (typically a Low Value · High Risk entry).
- Keep everything in the CLI unless asked otherwise.
- Pause between stages for confirmation.
- Match the user's language.
