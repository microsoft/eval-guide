# eval-guide

AI agent evaluation toolkit for [Copilot Studio](https://copilotstudio.microsoft.com). Plan evals, generate test cases, interpret results, and triage failures — all from Claude Code.

Grounded in Microsoft's [Eval Scenario Library](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-checklist), [Triage & Improvement Playbook](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-iterative-framework), and MS Learn agent evaluation documentation.

## Install

```bash
claude plugin add github:serenaxie/eval-guide
```

## Skills included

| Skill | Command | What it does |
|-------|---------|-------------|
| **Eval Guide** | `/eval-guide` | Full eval lifecycle — discover, plan, generate, run, interpret. Start here. |
| **Eval Suite Planner** | `/eval-suite-planner` | Generate a structured eval plan with scenarios, quality signals, and thresholds |
| **Eval Generator** | `/eval-generator` | Generate test case CSVs importable into Copilot Studio |
| **Eval Result Interpreter** | `/eval-result-interpreter` | Triage eval results with SHIP / ITERATE / BLOCK verdict |
| **Eval Triage & Improvement** | `/eval-triage-and-improvement` | Interactive diagnosis and remediation for failing evals |
| **Eval FAQ** | `/eval-faq` | Answers methodology questions grounded in Microsoft's eval ecosystem |

## Quick start

```
> /eval-guide

Tell me about your agent — what does it do, who uses it, and what does "good" look like?
```

The skill walks you through 5 stages:

1. **Discover** — articulate what the agent does and what success looks like
2. **Plan** — map to scenario types, pick evaluation methods, set thresholds
3. **Generate** — produce test case CSVs importable into Copilot Studio
4. **Run** — execute tests against a live agent (requires running agent)
5. **Interpret** — triage results, classify root causes, prioritize fixes

Stages 0-2 work without a running agent. You get an eval plan and test cases from just a description.

## Enhanced experience with Copilot Studio plugin

For the full experience — connecting to a live agent, pulling its configuration, and running tests against it — also install the [Copilot Studio plugin](https://github.com/microsoft/skills-for-copilot-studio):

```bash
claude plugin add github:microsoft/skills-for-copilot-studio
```

When both plugins are installed, `/eval-guide` can:
- Connect to your Copilot Studio agent via `/clone-agent` and pull its real topics, knowledge sources, and configuration
- Run test cases against the live agent via `/chat-with-agent`
- Ground the eval plan in what the agent actually does, not just what you describe

Without the Copilot Studio plugin, all skills work in **description-based mode** — you describe your agent and the skills generate plans and test cases from that description.

## What each skill produces

| Skill | Artifacts |
|-------|-----------|
| `/eval-guide` | Agent Vision doc, eval plan (.docx), test case CSVs, triage report (.docx) |
| `/eval-suite-planner` | Eval plan table with scenarios, methods, thresholds, priority order |
| `/eval-generator` | Copilot Studio-importable CSV files + .docx report |
| `/eval-result-interpreter` | SHIP/ITERATE/BLOCK verdict with root cause analysis |
| `/eval-triage-and-improvement` | Interactive remediation guidance with specific fixes |
| `/eval-faq` | Answers grounded in MS Learn, Eval Scenario Library, Triage Playbook |

## Methodology

This toolkit encodes Microsoft's official evaluation framework:

- **Eval Scenario Library** — 5 business-problem + 9 capability scenario types
- **Triage & Improvement Playbook** — 4-layer root cause classification
- **MS Learn evaluation docs** — test methods, quality signals, comparative testing, rubrics
- **Evaluation checklist** — 4-stage lifecycle (Define → Baseline → Expand → Operationalize)

## License

MIT
