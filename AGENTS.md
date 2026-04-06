# Eval Guide — AI Agent Evaluation Toolkit

This repository contains an AI agent evaluation toolkit for [Copilot Studio](https://copilotstudio.microsoft.com), grounded in Microsoft's official evaluation framework.

## What This Toolkit Does

Helps users go from "I don't know where to start with eval" to "I have a plan, test cases, and know how to interpret results" — in one session. No running agent required for planning and test generation.

## Available Prompt Files

This toolkit provides 6 prompt files in `.github/prompts/`. When the user's request matches one of these, attach or reference the appropriate prompt file:

| Prompt File | When to Use |
|---|---|
| `eval-guide.prompt.md` | Full eval lifecycle — discover, plan, generate, run, interpret. **Start here** when the user mentions agent evaluation, eval planning, "what should we test", or "how do we know if the agent is good". |
| `eval-suite-planner.prompt.md` | Structured eval plan with scenarios, methods, quality signals, and thresholds. Use when the user has an agent description and needs a plan before generating test cases. |
| `eval-generator.prompt.md` | Generate test cases (CSV for single-response, blueprints for multi-turn). Use after planning, or standalone with an agent description. |
| `eval-result-interpreter.prompt.md` | SHIP / ITERATE / BLOCK verdict from eval results. Use when the user has CSV results or pass/fail data to interpret. |
| `eval-triage-and-improvement.prompt.md` | Interactive diagnosis and remediation for failing evals. Use when the user needs help debugging specific failures. |
| `eval-faq.prompt.md` | Methodology questions answered from Microsoft's eval ecosystem. Use for "how do I...", "what is...", "when should I..." eval questions. |

## Routing Guide

| User says... | Use this prompt |
|---|---|
| "We're planning to build an agent for..." | eval-guide |
| "Help us think through what good looks like" | eval-guide |
| "Here's our agent, plan the eval" | eval-suite-planner |
| "I have a plan, generate test cases" | eval-generator |
| "My evals came back, what do they mean?" | eval-result-interpreter |
| "Some tests are failing and I don't know why" | eval-triage-and-improvement |
| "How is evaluating X different from Y?" | eval-faq |

## Methodology Summary

This toolkit encodes Microsoft's 4-stage evaluation lifecycle:

1. **Define** — Establish purpose, scope, quality signals, success criteria
2. **Set Baseline & Iterate** — Run evals, establish baseline, iterate on the agent
3. **Systematic Expansion** — Expand coverage across 11 validation themes
4. **Operationalize** — Integrate into CI/CD, production monitoring

### Architecture-Aware Scoping

| Architecture | What Gets Tested |
|---|---|
| **Prompt-level** (simple Q&A) | Response quality, tone, boundaries, refusal |
| **RAG / Knowledge-grounded** | + retrieval accuracy, grounding, hallucination prevention |
| **Agentic** (tool use, orchestration) | + tool selection, action correctness, error recovery |

### Key Sources

- [Eval Scenario Library](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-checklist) — 5 business-problem + 9 capability scenario types
- [Triage & Improvement Playbook](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-iterative-framework) — Root cause classification
- [Common Evaluation Approaches](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/architecture/common-evaluation-approaches) — Echo, Historical Replay, Synthesized Personas
- [Eval Guidance Kit](https://aka.ms/EvalGuidanceKit) — Editable checklists and templates

## Scripts

- `skills/eval-guide/scripts/eval-runner.js` — Runs eval test sets against a live Copilot Studio agent via DirectLine API, scores responses with an LLM judge. Usage: `node eval-runner.js --token-endpoint "<URL>" --csv-dir <dir>`

## Output Formats

The toolkit generates:
- **CSV files** — Importable directly into Copilot Studio's Evaluation tab (3 columns: Question, Expected response, Testing method)
- **Report documents** — Eval plans, test case summaries, triage reports
- **Conversation blueprints** — Multi-turn dialogue test structures
