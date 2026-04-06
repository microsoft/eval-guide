# Eval Guide — Copilot Instructions

This repository is an AI agent evaluation toolkit for Copilot Studio. It provides structured methodologies for planning, generating, running, and interpreting AI agent evaluations.

## Quick Reference

- **Prompt files** are in `.github/prompts/` — attach the relevant one when helping with eval tasks
- **Full methodology** is in `AGENTS.md` at the repo root
- **Eval runner script** is at `skills/eval-guide/scripts/eval-runner.js`

## Skill Routing

| Task | Prompt File |
|---|---|
| Full eval lifecycle | `eval-guide.prompt.md` |
| Create eval plan | `eval-suite-planner.prompt.md` |
| Generate test cases | `eval-generator.prompt.md` |
| Interpret results | `eval-result-interpreter.prompt.md` |
| Triage failures | `eval-triage-and-improvement.prompt.md` |
| Methodology Q&A | `eval-faq.prompt.md` |

## Key Conventions

- CSV format for Copilot Studio: 3 columns — `Question`, `Expected response`, `Testing method`
- Valid test methods: `General quality`, `Compare meaning`, `Similarity`, `Exact match`, `Keyword match`
- Always explain reasoning — users should learn the methodology, not just receive artifacts
- Include at least 1 adversarial/safety scenario in every eval plan
- Group test cases by quality signal into separate CSV files
- Stages 0-2 (Discover, Plan, Generate) work without a running agent
