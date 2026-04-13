# eval-guide

AI agent evaluation toolkit for [Copilot Studio](https://copilotstudio.microsoft.com). Plan evals, generate test cases, interpret results, and triage failures — from Claude Code or GitHub Copilot.

Grounded in Microsoft's [Eval Scenario Library](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-checklist), [Triage & Improvement Playbook](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-iterative-framework), [Common Evaluation Approaches](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/architecture/common-evaluation-approaches), and MS Learn agent evaluation documentation.

## Install

### Claude Code

```bash
claude plugin add microsoft/eval-guide
```

### GitHub Copilot

```bash
npx skills add microsoft/eval-guide
```

## Skills

| Skill | Command | What it does |
|-------|---------|-------------|
| **Eval Guide** | `/eval-guide` | Full eval lifecycle — discover, plan, generate, run, interpret. Start here. |
| **Eval Suite Planner** | `/eval-suite-planner` | Structured eval plan with scenarios, methods, quality signals, thresholds, and test data strategy |
| **Eval Generator** | `/eval-generator` | Test cases for single-response and conversation (multi-turn) evaluation modes |
| **Eval Result Interpreter** | `/eval-result-interpreter` | SHIP / ITERATE / BLOCK verdict with root cause classification |
| **Eval Triage & Improvement** | `/eval-triage-and-improvement` | Interactive diagnosis and remediation for failing evals |
| **Eval FAQ** | `/eval-faq` | Methodology questions answered from Microsoft's eval ecosystem |

## Quick start

```
> /eval-guide

Tell me about your agent — what does it do, who uses it, and what does "good" look like?
```

Works the same in both Claude Code and GitHub Copilot.

The toolkit walks you through Microsoft's 4-stage evaluation lifecycle:

| Stage | What happens | Works without a running agent? |
|-------|-------------|-------------------------------|
| **0. Discover** | Articulate what the agent does and what success looks like | Yes |
| **1. Plan** | Scope eval depth by agent architecture, map to scenario types, pick methods, set thresholds | Yes |
| **2. Generate & Baseline** | Produce test case CSVs (single-response) or conversation blueprints (multi-turn) importable into Copilot Studio | Yes |
| **3. Run** | Execute tests against a live agent | Needs running agent |
| **4. Interpret & Improve** | Triage results, classify root causes, prioritize fixes, re-test | Needs eval results |

Stages 0-2 work from just an agent description — no running agent required.

## Interactive dashboard review

Each stage generates an **interactive HTML dashboard** served locally in your browser. You review, edit inline, and confirm before the AI proceeds — no more back-and-forth in chat to fix test cases.

```
Stage complete → Dashboard opens → You review & edit → Confirm → Final artifacts generated
```

| Stage | What you review in the dashboard | What you can edit |
|---|---|---|
| **0. Discover** | Agent Vision (purpose, users, knowledge, capabilities, boundaries, success criteria) | All fields inline, add/remove list items |
| **1. Plan** | Scenario table, methods, thresholds, quality signals | Add/remove scenarios, change methods, adjust thresholds |
| **2. Generate** | Test cases per quality signal | Edit expected responses, questions, methods, add/remove cases |
| **4. Interpret** | Verdict, failure triage, root causes, actions | Reclassify root causes, add comments |

Final deliverables (`.docx` reports, `.csv` test sets) are only generated **after you confirm** via the dashboard.

The dashboard runs via a zero-dependency Python server (`skills/eval-guide/dashboard/serve.py`). Feedback auto-saves as you edit — if the browser closes, your work is preserved.

## Architecture-aware eval scoping

The toolkit automatically scopes evaluation depth based on your agent's architecture:

| Architecture | What gets tested |
|---|---|
| **Prompt-level** (simple Q&A, no knowledge sources) | Response quality, tone, boundaries, refusal behavior |
| **RAG / Knowledge-grounded** (has knowledge sources, no tools) | All of the above + retrieval accuracy, grounding, hallucination prevention |
| **Agentic** (multi-step, tool use, orchestration) | All of the above + tool selection, action correctness, error recovery, task completion |

A simple FAQ bot doesn't need tool-routing tests. A multi-step workflow agent does. The toolkit handles this so you test what actually matters.

## Single-response and conversation evaluation

The eval generator supports both modes:

- **Single-response** — one input, one output. Produces a CSV importable directly into Copilot Studio. Supports all 7 test methods (General Quality, Compare Meaning, Keyword Match, Text Similarity, Exact Match, Capability Use, Custom).
- **Conversation (multi-turn)** — multi-turn dialogues for agents that handle context-dependent, multi-step tasks. Produces a structured blueprint for creating conversation test sets in Copilot Studio. Supports General Quality, Keyword Match, Capability Use, and Custom.

The skill detects which mode fits your agent and recommends accordingly.

## Test data generation strategies

The planner recommends the right test data approach based on agent complexity:

| Approach | Best for |
|---|---|
| **Echo** | Single-turn Q&A, regression testing, deterministic checks |
| **Historical replay** | Model change comparisons, per-turn divergence analysis |
| **Synthesized personas** | Multi-step workflows, persona-dependent behavior, complex scenarios |

Most agents benefit from a hybrid: Echo for fast regression, Synthesized personas for realistic coverage.

## What each skill produces

| Skill | Artifacts |
|-------|-----------|
| `/eval-guide` | Interactive dashboards at each stage, Agent Vision doc, eval plan (.docx), test case CSVs, triage report (.docx) |
| `/eval-suite-planner` | Eval plan table with scenarios, methods, thresholds, test data strategy, priority order (.docx + .xlsx) |
| `/eval-generator` | Copilot Studio-importable CSV (single-response) or conversation blueprint + .docx report |
| `/eval-result-interpreter` | SHIP/ITERATE/BLOCK verdict with root cause analysis and pattern detection |
| `/eval-triage-and-improvement` | Interactive remediation guidance with specific fixes per quality signal |
| `/eval-faq` | Answers grounded in MS Learn, Eval Scenario Library, Triage Playbook |

## Enhanced experience with Copilot Studio plugin (Claude Code)

For the full experience — connecting to a live agent, pulling its configuration, and running tests against it — also install the [Copilot Studio plugin](https://github.com/microsoft/skills-for-copilot-studio):

```bash
claude plugin add microsoft/skills-for-copilot-studio
```

When both plugins are installed, `/eval-guide` can:
- Connect to your Copilot Studio agent via `/clone-agent` and pull its real topics, knowledge sources, and configuration
- Run test cases against the live agent via `/chat-with-agent`
- Ground the eval plan in what the agent actually does, not just what you describe

Without the Copilot Studio plugin (or when using GitHub Copilot), all skills work in **description-based mode** — you describe your agent and the skills generate plans and test cases from that description.

## Example workflows

**"I have an idea for an agent and want to know how to evaluate it"**
```
/eval-guide I'm building an HR policy bot that answers employee questions from our SharePoint knowledge base
```

**"I have a plan and need test cases"**
```
/eval-suite-planner Customer support agent handling refund requests, order tracking, and escalation to human agents
/eval-generator
```

**"My evals came back and I need to interpret them"**
```
/eval-result-interpreter
> [paste CSV results or attach file]
```

**"Some tests are failing and I don't know why"**
```
/eval-triage-and-improvement
> My agent scores 40% on knowledge grounding tests but 90% on general quality
```

**"Quick methodology question"**
```
/eval-faq How is evaluating a multi-step workflow different from a simple Q&A agent?
```

## Repository structure

```
eval-guide/
├── .claude-plugin/           # Claude Code plugin configuration
│   ├── plugin.json
│   └── marketplace.json
├── .github/
│   ├── copilot-instructions.md   # GitHub Copilot always-on instructions
│   └── prompts/                  # GitHub Copilot prompt files
│       ├── eval-guide.prompt.md
│       ├── eval-suite-planner.prompt.md
│       ├── eval-generator.prompt.md
│       ├── eval-result-interpreter.prompt.md
│       ├── eval-triage-and-improvement.prompt.md
│       └── eval-faq.prompt.md
├── bin/                      # CLI utilities
│   ├── eval-guide-update-check   # Version check (local vs GitHub remote)
│   ├── eval-guide-update-snooze  # Snooze upgrade reminders
│   └── eval-guide-update-config  # Read/write ~/.eval-guide/config.yaml
├── skills/                   # Claude Code skills (SKILL.md format)
│   ├── eval-guide/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   │   └── eval-runner.js    # Run evals via DirectLine API
│   │   └── dashboard/            # Interactive review dashboards
│   │       ├── serve.py          # Python server (zero dependencies)
│   │       └── templates/        # Stage-specific HTML templates
│   │           ├── base.html     # Shared layout, CSS, feedback JS
│   │           ├── discover.html # Stage 0: Agent Vision review
│   │           ├── plan.html     # Stage 1: Eval plan review
│   │           ├── generate.html # Stage 2: Test cases (editable)
│   │           └── interpret.html# Stage 4: Triage report review
│   ├── eval-suite-planner/
│   ├── eval-generator/
│   ├── eval-result-interpreter/
│   ├── eval-triage-and-improvement/
│   └── eval-faq/
├── AGENTS.md                 # Agent instructions (GitHub Copilot agent mode + other AI tools)
├── CLAUDE.md                 # Claude Code project instructions
├── README.md
└── VERSION                   # Current release version (semver)
```

## Methodology

This toolkit encodes Microsoft's official evaluation framework:

- **[Eval Scenario Library](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-checklist)** — 5 business-problem + 9 capability scenario types
- **[Triage & Improvement Playbook](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-iterative-framework)** — 4-layer root cause classification (eval setup, agent config, knowledge, platform)
- **[Common Evaluation Approaches](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/architecture/common-evaluation-approaches)** — Echo, Historical Replay, Synthesized Personas; code-based vs LLM-judge graders
- **[Evaluation Checklist](https://github.com/microsoft/PowerPnPGuidanceHub/tree/main/guidance/agentevalguidancekit)** — 4-stage lifecycle (Define, Baseline, Expand, Operationalize)
- **[Evaluation Frameworks](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/architecture/evaluation-frameworks)** — 11 scenario validation themes
- **MS Learn agent evaluation docs** — test methods, quality signals, comparative testing, rubric-based grading

## Contributing

This project welcomes contributions and suggestions. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE)
