# eval-guide

AI agent evaluation toolkit for [Copilot Studio](https://copilotstudio.microsoft.com). Plan evals, generate test cases, interpret results, and triage failures — all from Claude Code.

Grounded in Microsoft's [Eval Scenario Library](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-checklist), [Triage & Improvement Playbook](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-iterative-framework), [Common Evaluation Approaches](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/architecture/common-evaluation-approaches), and MS Learn agent evaluation documentation.

## Install

```bash
claude plugin add microsoft/eval-guide
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

The toolkit walks you through Microsoft's 4-stage evaluation lifecycle:

| Stage | What happens | Works without a running agent? |
|-------|-------------|-------------------------------|
| **0. Discover** | Articulate what the agent does and what success looks like | Yes |
| **1. Plan** | Scope eval depth by agent architecture, map to scenario types, pick methods, set thresholds | Yes |
| **2. Generate & Baseline** | Produce test case CSVs (single-response) or conversation blueprints (multi-turn) importable into Copilot Studio | Yes |
| **3. Run** | Execute tests against a live agent | Needs running agent |
| **4. Interpret & Improve** | Triage results, classify root causes, prioritize fixes, re-test | Needs eval results |

Stages 0-2 work from just an agent description — no running agent required.

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
| `/eval-guide` | Agent Vision doc, eval plan (.docx), test case CSVs, triage report (.docx) |
| `/eval-suite-planner` | Eval plan table with scenarios, methods, thresholds, test data strategy, priority order (.docx + .xlsx) |
| `/eval-generator` | Copilot Studio-importable CSV (single-response) or conversation blueprint + .docx report |
| `/eval-result-interpreter` | SHIP/ITERATE/BLOCK verdict with root cause analysis and pattern detection |
| `/eval-triage-and-improvement` | Interactive remediation guidance with specific fixes per quality signal |
| `/eval-faq` | Answers grounded in MS Learn, Eval Scenario Library, Triage Playbook |

## Enhanced experience with Copilot Studio plugin

For the full experience — connecting to a live agent, pulling its configuration, and running tests against it — also install the [Copilot Studio plugin](https://github.com/microsoft/skills-for-copilot-studio):

```bash
claude plugin add microsoft/skills-for-copilot-studio
```

When both plugins are installed, `/eval-guide` can:
- Connect to your Copilot Studio agent via `/clone-agent` and pull its real topics, knowledge sources, and configuration
- Run test cases against the live agent via `/chat-with-agent`
- Ground the eval plan in what the agent actually does, not just what you describe

Without the Copilot Studio plugin, all skills work in **description-based mode** — you describe your agent and the skills generate plans and test cases from that description.

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
