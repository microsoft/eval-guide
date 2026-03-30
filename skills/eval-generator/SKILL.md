---
name: eval-generator
description: Generates eval test cases from an eval suite plan (output of /eval-suite-planner) or a plain-English agent description. Supports both single-response and conversation (multi-turn) evaluation modes. Outputs a Copilot Studio test set table, a CSV file for import (single-response only), and a docx report for human review.
---

## Purpose

This skill generates concrete eval test cases â€” with realistic inputs, expected outputs, and evaluation method configurations. It is the second step in the eval lifecycle: plan â†’ **generate** â†’ run â†’ interpret.

This skill covers **Stage 2 (Set Baseline & Iterate)** of the MS Learn [4-stage evaluation framework](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/evaluation-checklist). Use `/eval-suite-planner` first for Stage 1 (Define), then generate test cases here, run them, and interpret results with `/eval-result-interpreter`. Stage 3 (Systematic Expansion) means repeating this cycle with broader coverage â€” the checklist defines four expansion categories: Foundational core, Agent robustness, Architecture test, and Edge cases. Stage 4 (Operationalize) means embedding these evals into your agent's CI/CD pipeline. Point customers to the [editable checklist template](https://github.com/microsoft/PowerPnPGuidanceHub/tree/main/guidance/agentevalguidancekit) to track their progress across all four stages.

**Primary mode**: If the conversation already contains output from `/eval-suite-planner`, use that planâ€™s scenario table, evaluation methods, quality signals, and tags as the blueprint. Generate one test case per row in the plan.

**Fallback mode**: If no plan exists in the conversation, accept a plain-English agent description and generate test cases from scratch (6-8 cases minimum).

## Instructions

When invoked as `/eval-generator` (with or without additional input):

### Step 1 â€” Detect input mode

Check the conversation history for output from `/eval-suite-planner`. Look for the scenario plan table (a markdown table with columns: #, Scenario Name, Category, Tag, Evaluation Methods).

- **Plan found**: Use it as the blueprint. Say: "Generating test cases from your eval suite plan (X scenarios)." Generate one test case per row.
- **No plan, but user provides an agent description**: Generate from scratch. Say: "Generating eval scenarios for: [agent task in your own words]." If the description is fewer than two sentences or doesnâ€™t mention success criteria, ask exactly one clarifying question, then wait.
- **No plan and no description**: Say: "I need either an agent description or a plan from `/eval-suite-planner`. Run `/eval-suite-planner <your agent description>` first for the best results, or give me a description and Iâ€™ll generate directly."

### Step 1b â€” Determine evaluation mode (Single Response vs. Conversation)

Before generating test cases, determine which evaluation mode fits the agent. This affects the output format, available test methods, and import options.

**Choose Conversation mode when the agent:**
- Handles multi-step tasks that require context across turns (e.g., booking a trip with departure, return, and seat selection)
- Needs to ask clarifying questions before completing a request
- Must maintain state (e.g., remembering a customerâ€™s account after initial identification)
- Has handoff or escalation flows that depend on prior turns

**Choose Single Response mode when the agent:**
- Answers standalone questions (FAQ, policy lookup, factual retrieval)
- Routes to a single tool per request
- Produces a self-contained output per input (e.g., a summary, a classification)

**Default:** If the plan or agent description does not indicate multi-turn behavior, default to Single Response.

**If Conversation mode is selected**, say: "This agent benefits from conversational (multi-turn) evaluation. I will generate conversation test cases â€” each is a multi-turn dialogue, not a single question."

Then skip to **Step 2b** below for conversation-specific generation.

### Step 2a â€” Generate single-response test cases

**When generating from a plan:** Match each scenario row exactly â€” use its Scenario Name, Tag, and Evaluation Methods. Translate the evaluation methods into the right expected fields and test configurations.

**When generating from scratch (no plan):**
- 6-8 total scenarios
- At least 2 happy-path / core business cases
- At least 2 edge cases (empty input, long input, ambiguous input, malformed input)
- At least 1 adversarial case (prompt injection, out-of-scope request, policy violation attempt)
- Fill remaining with whatever gives the most signal for this agent

### Step 2b â€” Generate conversation (multi-turn) test cases

Use this step instead of Step 2a when the agent requires multi-turn evaluation.

**Conversation test set constraints (Copilot Studio limits):**
- Up to **20 test cases** per test set
- Each test case supports up to **12 total messages** (6 user-agent Q&A pairs)
- Supported test methods: **General Quality**, **Keyword Match**, **Capability Use** (called "Capabilities match" in conversation UI), **Custom (Classification)**
- NOT supported in conversation mode: Compare Meaning, Text Similarity, Exact Match

**When generating from a plan:** Group related scenarios into multi-turn conversations. A single conversation test case can cover 2-3 related scenarios that would naturally occur in sequence (e.g., "check order status" then "request refund on that order" then "confirm refund policy").

**When generating from scratch (no plan):**
- 4-6 conversation test cases
- At least 2 happy-path multi-step task completions
- At least 1 conversation with a clarification loop (user gives vague input, agent asks, user clarifies)
- At least 1 conversation with a mid-conversation topic switch or escalation
- At least 1 adversarial turn mid-conversation (e.g., user attempts prompt injection after establishing context)

**Conversation test case format (displayed in conversation):**

For each test case, produce a structured conversation block:

> **Conversation Test Case #N: [Scenario Name]**
>
> Turn 1 - User: [realistic user message]
> Turn 1 - Agent (expected): [expected agent response or behavior description]
>
> Turn 2 - User: [follow-up that depends on Turn 1 context]
> Turn 2 - Agent (expected): [expected response maintaining context]
>
> Turn 3 - User: [further follow-up or new request within same session]
> Turn 3 - Agent (expected): [expected response]
>
> Test method: General Quality / Keyword Match / Capability Use / Custom (Classification)
> Keywords (if Keyword Match): [comma-separated keywords expected in any agent response]
> What this tests: [1 sentence: what multi-turn capability is being evaluated]
> Critical turn: [which turn is most likely to fail and why]

**Rules for conversation test cases:**
- Each turn must build naturally on the previous turn â€” do not write turns that could stand alone
- Agent expected responses should describe the behavior, not the exact wording (these are reference responses for the LLM judge)
- Include at least one conversation where the userâ€™s intent shifts or expands across turns
- Flag which turn is the "critical" turn â€” the one most likely to fail (e.g., Turn 3 where context from Turn 1 must be retained)

**Important â€” no CSV import for conversation test sets:** Unlike single-response test cases, conversation test sets cannot be imported via CSV. The customer must create them in Copilot Studio using one of these methods:
1. **Quick conversation set** â€” auto-generates 10 short conversations from agent description and instructions
2. **Full conversation set** â€” generates conversations from agent knowledge sources or topics (short or long)
3. **Use test chat** â€” converts the latest test chat session into a conversation test case
4. **Manual entry** â€” add user questions and agent reference responses turn by turn in the UI

The conversation test cases generated by this skill serve as a **planning blueprint** â€” the customer uses them to:
- Guide what they enter manually in the Copilot Studio conversation editor
- Compare against AI-generated conversation sets to check coverage
- Document the multi-turn scenarios that matter before creating test sets in the UI

### Output â€” Single Response

**Copilot Studio Test Set Table (displayed in conversation)**

This is the primary output for single-response mode. Produce a markdown table matching the Copilot Studio test set format:

| # | Question | Expected Response | Test Method | Pass Score |
|---|---|---|---|---|
| 1 | [realistic user input] | [expected answer, or leave blank for General Quality] | General Quality | â€” |
| 2 | [realistic user input] | [expected answer for comparison] | Compare Meaning | 50 |
| 3 | [realistic user input] | [keywords to check] | Keyword Match (All) | â€” |

Map the evaluation methods from the plan (or from your analysis) to Copilot Studioâ€™s 7 test methods using this selection guide:

**Test Method Selection Guide**

Use this table to select the correct test method based on *what you need to verify* about the response. When in doubt, match to the "What youâ€™re testing" column first, not the method name.

| What youâ€™re testing | Test Method | Expected Response format | Pass Score |
|---|---|---|---|
| Overall response quality, tone, helpfulness (LLM judge checks: relevance, groundedness, completeness, abstention) | **General Quality** | Leave blank â€” no expected response needed | â€” |
| Factual accuracy with flexible phrasing (meaning matters, wording doesnâ€™t) | **Compare Meaning** | Write the ideal answer in natural language | 50 (default) |
| Factual accuracy with specific required facts, numbers, or policy language | **Keyword Match (All)** | Comma-separated list of keywords/phrases that MUST all appear | â€” |
| Partial keyword coverage (at least one key term should appear) | **Keyword Match (Any)** | Comma-separated list of keywords/phrases where ANY match is a pass | â€” |
| Correct tool/topic/connector invocation | **Capability Use** (shown as "Tool use" in UI) | Comma-separated list of expected tool or topic names | â€” |
| Classification, labeling, or structured output with exact expected values | **Exact Match** | The exact expected string (case-sensitive) | â€” |
| Response phrasing matters (not just meaning â€” specific wording preferred) | **Text Similarity** | Write the expected phrasing | 0.70 (default; scale 0â€“1) |
| Domain-specific criteria that donâ€™t fit above methods | **Custom** | Write evaluation instructions and pass/fail label definitions | â€” |

**How General Quality scoring works**

General Quality is the default test method and the most commonly used. Understanding its 4 scoring criteria helps customers write better test cases and interpret results correctly. General Quality uses an LLM judge that scores each response on:

| Criterion | What it checks | A low score means | Tip for the customer |
|---|---|---|---|
| **Relevance** | Does the response directly address the user's question? Does it stay on topic? | The agent went off-topic, added irrelevant information, or answered a different question than what was asked | If relevance scores are low, check the agent's topic routing |
| **Groundedness** | Is the response based on the agent's knowledge sources? Does it avoid hallucinating unsupported claims? | The agent invented facts, cited sources it doesn't have, or generated plausible-sounding but unverified information | Low groundedness is the most dangerous failure. Check knowledge source coverage |
| **Completeness** | Does the response cover all aspects of the question with sufficient detail? | The agent gave a partial answer, missed key details, or was too brief to be useful | If completeness is low but relevance is high, the agent understands the question but its knowledge sources may have gaps |
| **Abstention** | Did the agent attempt to answer at all? (Abstaining on an answerable question is bad; abstaining on an unanswerable question is good) | The agent refused to answer a question it should have answered, OR answered a question it should have declined | Abstention failures often indicate overly restrictive or overly permissive system instructions |

All 4 criteria must be met for a response to score high. A response that is relevant, grounded, and complete but fails abstention (e.g., answering a question outside its scope) still gets a low score. This prevents agents from "helpfully" answering questions they shouldn't.

**When NOT to rely on General Quality alone:** If your scenario has a specific correct answer (a fact, a number, a policy), pair General Quality with Compare Meaning or Keyword Match. General Quality evaluates *how well* the agent responds, but without an expected answer it cannot catch factual errors where the agent sounds great but says the wrong thing.

**How Custom test methods work**

Custom is the newest test method in Copilot Studio. It lets you define your own evaluation criteria when none of the built-in methods fit â€” for example, compliance checks, tone audits, or domain-specific quality bars. Custom works for both single-response and conversation test sets.

A Custom test has two components you configure:

| Component | What it is | How to write it |
|---|---|---|
| **Evaluation instructions** | A prompt that tells the LLM judge what to look for in the agent's response | Be goal-oriented. Use bullet points and headings. Describe the specific qualities you want to assess. |
| **Labels** | Named categories the judge assigns to each response, each mapped to Pass or Fail | Use 2-3 labels. Each label has a name and a description of what qualifies. One label = Pass, the other = Fail. |

**Example â€” HR Policy Compliance custom test:**
- Evaluation instructions: "Evaluate the agent's response for HR policy compliance. Check: protects privacy, avoids discrimination or bias, provides safe HR-aligned guidance, does not give legal advice."
- Labels: `Compliant` (Pass) â€” "Response follows all HR policies and guidelines." / `Non-Compliant` (Fail) â€” "Response violates one or more HR policy requirements."

**When to use Custom:**
- Domain-specific compliance or regulatory requirements the built-in methods cannot express
- Tone or style evaluation (e.g., "Is the response empathetic?" or "Does it match our brand voice?")
- Safety or guardrail checks beyond what General Quality's abstention criterion covers
- Classification accuracy where labels are complex or context-dependent (not a simple exact match)

**Important â€” Custom is NOT available via CSV import.** If your test plan includes Custom test cases, import the other test cases via CSV first, then add Custom test cases manually in the Copilot Studio UI. Note this in the docx report.

**Advanced â€” Rubric-based grading (Copilot Studio Kit)**

For customers using the [Copilot Studio Kit](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/kit-rubrics-tests), rubrics provide a structured 1â€“5 grading scale for Generative Answers test cases. Rubrics are more granular than the built-in test methods â€” they replace the standard validation logic with a custom AI grader that scores responses against domain-specific criteria.

Rubrics operate in two modes:

| Mode | Assignment level | AI output | Cost | Use when |
|---|---|---|---|---|
| **Testing mode** | Individual test case | Grade only (1â€“5) | Lower | Rubric is refined and trusted; routine QA and regression testing |
| **Refinement mode** | Entire test run | Grade + detailed rationale | Higher | Creating or improving a rubric; comparing AI vs. human grading to minimize misalignment |

**Key workflow — the rubric refinement cycle:** Rubric refinement is iterative, not a one-time configuration. The cycle is: **Run → Review → Grade → Refine → Save → Re-run → Repeat**. Expect several iterations before alignment is acceptable. The steps:

1. **Start a refinement run** — configure a test run with the rubric attached; the AI grades each Generative Answer test case on 1–5 and writes a detailed rationale.
2. **Review in Standard view first** — Standard refinement view hides AI grades so humans grade without bias. This is critical: research shows seeing AI grades anchors human judgment.
3. **Human grading** — assign a grade (1–5) and write reasoning for every test case. Reasoning must reference specific rubric criteria ("Grade 4: accurate technical info, professional tone, but lacks timeline estimates for Grade 5"). Vague reasoning ("Pretty good") undermines refinement.
4. **Mark examples** — flag select test cases as Good or Bad examples. Focus on misaligned cases and edge cases. Quality over quantity — a few well-chosen examples beat many mediocre ones.
5. **Check alignment** — switch to Full refinement view to compare AI vs. human grades. Alignment per test case: `alignment = 100% × (1 − |AI − Human| / 4)`. Average across all graded cases for the run score.

   | Average alignment | Assessment | Action |
   |---|---|---|
   | **90–100%** | Excellent | Rubric is reliable; move to testing mode |
   | **75–89%** | Good | Mostly aligned; refine edge cases |
   | **60–74%** | Fair | Needs improvement; focus on misalignment patterns |
   | **< 60%** | Poor | Significant refinement or rubric redesign needed |

6. **Refine the rubric** — click "Refine Rubric" to let AI update the rubric based on all human grades, reasoning, examples, and misalignment patterns. Use "Save As" for early iterations (preserve history), "Save" once stable.
7. **Re-run** — duplicate the test run with the refined rubric. Compare alignment to the prior iteration.
8. **Iterate** — repeat until alignment reaches 75–90%+. Don’t chase 100% — some subjectivity is inherent, and diminishing returns kick in around 85–90%.

**Passing grade guidance:**
- **Grade 5** (default): Only exemplary responses pass — use for critical communications (IR reports, executive summaries)
- **Grade 4**: Strong or better responses pass — appropriate for most business communications
- **Grade 3**: Acceptable or better — minimum functional quality for internal tools

**When to mention rubrics to customers:** If the eval plan includes Custom test methods, domain-specific compliance checks, or tone/style evaluation, note in the docx report that the customer can create a rubric in Copilot Studio Kit for more granular, repeatable grading with human-AI alignment tracking. Rubrics are the next step beyond Custom for customers who need ongoing quality assurance with calibrated scoring. Include the alignment targets table above so they know what "good enough" looks like.


**Tip â€” negative testing with Keyword Match:** To verify an agent does NOT reveal forbidden content (e.g., internal policy details, competitor names, PII), use Keyword Match and list the keywords that should be absent. In the test case notes, flag this as a negative check so the reviewer knows a keyword "match" here means a failure.

**Common method selection mistakes to avoid:**
- Do NOT use **General Quality** when there IS a specific correct answer â€” use **Compare Meaning** or **Keyword Match** instead. General Quality has no expected response to compare against.
- Do NOT use **Compare Meaning** for factual claims with precise numbers/dates/names â€” use **Keyword Match (All)** to ensure the exact facts appear.
- Do NOT use **Compare Meaning** for adversarial/negative tests â€” there is often no "expected" answer. Use **General Quality** for adversarial handling and edge cases.
- Do NOT use **General Quality** for tool routing tests â€” use **Capability Use** to verify the correct connector/topic fired.
- Do NOT use **Text Similarity** when meaning is what matters â€” use **Compare Meaning**. Text Similarity penalizes paraphrasing.
- Do NOT use **Exact Match** for natural language responses â€” Exact Match fails on any variation in wording. Only use for labels, codes, or structured data.

Rules for inputs:
- Every `Question` must be a realistic input the agent would receive in production â€” specific, not a placeholder
- Every `Expected Response` must be concrete and testable â€” never vague
- For General Quality, leave Expected Response blank (the LLM judge evaluates without one)
- For Keyword Match, put the required keywords in Expected Response
- For adversarial cases, the Expected Response should describe what the agent should NOT do

### Output files

After displaying the test cases in conversation, generate the output files:

**A. Copilot Studio Import CSV (.csv) â€” Single Response only**

Generate **one CSV file** for import into Copilot Studio. The CSV uses Copilot Studioâ€™s 3-column import format, which supports specifying the test method per row â€” so all test cases go in a single file.

**Note:** CSV import is only available for single-response test sets. For conversation test sets, there is no CSV import â€” see Step 2b for how the customer creates conversation test cases in the Copilot Studio UI.

**CSV format:** Use the `/xlsx` skill to write the file, or write CSV directly with proper quoting:

```csv
"Question","Expected response","Testing method"
"How do I return an item?","The agent should explain the return policy...","Compare meaning"
"What are your hours?","","General quality"
"Can I get a refund after 90 days?","90 days, refund policy, exception","Keyword match"
"What is the order status for #12345?","Order #12345 is in transit","Exact match"
```

**CSV column rules:**
- Three columns, in this exact order: `Question`, `Expected response`, `Testing method`
- Every value must be enclosed in double quotes
- Any double quotes inside a value must be escaped as `""`
- `Question` maps to the Question column from the test case table
- `Expected response` maps to the Expected Response column (leave empty string `""` for General Quality rows)
- `Testing method` must use one of these exact values (case-sensitive as shown):
  - `General quality`
  - `Compare meaning`
  - `Similarity` (this is Text Similarity â€” note: the CSV value is "Similarity", not "Text Similarity")
  - `Exact match`
  - `Keyword match`

**Methods NOT available via CSV import:** Capability Use (labeled "Tool use" in UI) and Custom test methods cannot be specified in the import CSV. If your test plan includes these methods:
1. Import all other test cases via the CSV
2. In the Copilot Studio UI, manually add test cases that use Capability Use or Custom
3. Note this in the docx report so the customer knows which cases to add manually

**After generating the CSV**, display a summary showing the method distribution:

| Testing Method | # Test Cases | Notes |
|---|---|---|
| General quality | 3 | No expected response needed |
| Compare meaning | 4 | Set pass score in UI after import (default: 50) |
| Keyword match | 2 | â€” |
| Capability Use | 1 | Add manually in UI (not CSV-importable) |

This summary helps the customer verify the CSV and know what to configure manually in Copilot Studio.

**Important:** Pass scores for Compare meaning and Similarity are NOT set in the CSV â€” they are configured in the Copilot Studio UI after import. Note the recommended pass scores in the summary table and docx report.

**Operational tips for the customer:**
- **Download the CSV template:** In Copilot Studio, after selecting **New evaluation**, you can download a ready-to-use CSV template under **Data source**. Use this template to verify your column format before importing.
- **Copilot Studio's built-in test generation — alternatives to CSV import:** Besides importing the CSV this skill generates, customers can also create test sets directly in Copilot Studio using these methods (all under **New evaluation → Single response**):
  - **Quick question set** — auto-generates 10 questions from the agent's description, instructions, and capabilities. Good for a fast baseline or to seed a larger test set.
  - **Full question set** — generates questions from a specific knowledge source (text, Word, Excel — up to 5 MB) or from topics. Best for agents using generative orchestration (knowledge) or classic orchestration (topics). You choose how many questions to generate.
  - **Use your test chat** — converts the latest [test chat](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-test-bot) session into test cases. Useful after exploratory testing — just replay the questions you already asked.
  - **Create from analytics themes** — uses [themes (preview)](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-themes) from production conversations to generate test cases focused on one area (e.g., "billing and payments" questions). Requires the themes analytics feature to be enabled.
  - **Manual entry** — write questions yourself directly in the UI.
  Recommend combining approaches: use this skill's CSV for structured, scenario-based test cases, then supplement with Copilot Studio's auto-generation to catch gaps the plan didn't anticipate. Note these options in the docx report.
- **Test set limits:** A single test set supports up to **100 test cases**. Each question can be up to **1,000 characters** (including spaces). If your eval plan exceeds 100 scenarios, split into multiple test sets by category or quality signal.
- **89-day result retention:** Test results are only available in Copilot Studio for **89 days**. After that, they are deleted. Always export results to CSV immediately after running evals â€” especially for baseline runs you will compare against later. Use the export option under test results to save a permanent copy.
- **Version your test sets like code:** Test sets are living artifacts — they change as the agent evolves, new failure modes appear, and business requirements shift. Treat them with the same rigor as source code:
  - **Keep a changelog:** Every time you add, remove, or modify a test case, record what changed and why. A shared spreadsheet or version-controlled CSV works. Without this, you will not know whether a score change came from the agent improving or the test set shifting underneath it.
  - **Tag baselines:** Before a major agent change (new knowledge source, updated system prompt, new tool), snapshot the current test set as a named baseline (e.g., "v2.1 — pre-knowledge-update"). Run the new agent version against the old baseline first, then against an updated test set. This separates "agent changed" from "test changed."
  - **Retire, don’t delete:** When a test case becomes irrelevant (deprecated feature, changed policy), move it to a "retired" section instead of deleting it. You may need it for regression testing if the feature returns or the policy reverts.
  - **Track provenance:** For each test case, note where it came from — was it generated from the eval plan, added from a production incident, suggested by a subject matter expert, or auto-generated by Copilot Studio? Provenance helps you prioritize: real-failure-sourced cases are higher signal than synthetic ones.
  - **Review cadence:** Revisit the full test set quarterly (or after any major agent change). Stale expected responses are the #1 cause of false failures over time — the agent got better but the expected response still reflects the old behavior.
- **User profiles — simulate different user experiences:** Copilot Studio lets you assign a [user profile](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-edit) to a test set so evals run under that user's authentication. This is critical when knowledge sources or SharePoint sites are role-gated — a director and an intern may get different answers from the same agent. To test this:
  - Create separate test sets per profile (e.g., "Core Scenarios — Director" and "Core Scenarios — Intern")
  - In each test set, select **Manage profile** and choose the appropriate account
  - Compare results across profiles to find role-based gaps
  - **Limitation:** Multi-profile evaluation is only supported for agents **without connector dependencies**. If the agent uses tools/connectors that require authentication, the eval must run under the logged-in account that owns those connections — selecting a different profile will fail with *"This account cannot connect to tools"*. In that case, test knowledge-source differences with user profiles, but test tool-dependent scenarios under the tool owner's account.
  - Note which profile was used in the docx report — test results in Copilot Studio show the profile, but exported CSVs may not.
- **GCC (Government Community Cloud) limitations:** If the customer is in a GCC environment, two features are unavailable:
  - **No user profiles** — the test-set profile feature described above is not available in GCC. All evals run under the maker’s own account.
  - **No Text Similarity method** — the “Similarity” test method cannot be used. Replace any Text Similarity test cases with Compare Meaning (for semantic matching) or Keyword Match (for specific phrasing). All other test methods work normally.
  - Ask the customer early: “Are you in a GCC environment?” If yes, omit Text Similarity rows from the CSV and note the restriction in the docx report. Source: [About agent evaluation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-intro).

**B. Eval Test Set Report (.docx)**

Generate a formatted .docx document for human review using the `/docx` skill. Contents:

- **Title:** "Eval Test Set: [Agent Name]" (derive agent name from the plan or description)
- **Evaluation mode:** State whether this is a Single Response or Conversation test set, and why that mode was chosen
- **Plan summary:** Brief summary of the eval suite plan this was generated from (or the agent description if generated from scratch)
- **Test cases:** Each test case formatted clearly with:
  - Scenario name
  - Input / question (for single-response) or full conversation turns (for conversation mode)
  - Expected response or reference responses
  - Test method
  - Pass score (if applicable)
- **Method rationale:** Include the Why These Methods? section from Step 3 so the customer understands the reasoning behind each test method choice
- **Import guide:**
  - For single-response: Document the CSV column format (Question, Expected response, Testing method), list which test methods are CSV-importable vs. UI-only, and note pass scores to configure in the UI after import
  - For conversation: Explain that CSV import is not available, list the four creation methods (Quick set, Full set, Test chat, Manual entry), and recommend using the conversation test cases in this report as a blueprint for manual entry
- **Human review checkpoints:** Include the full checkpoint table from Step 4 so the customer has a printed checklist to work through before running evals
- **Reviewer notes:** The scenario suggestion and mandatory reminder from Step 4
- **Operational reminders:** Include the 89-day result retention warning (export results immediately after running), the 100-test-case limit per test set, and the CSV template download tip

**Important â€” save your plan before running evals:** Copilot Studio CSV exports do not include scenario categories or tags. Before running evals in Copilot Studio, save the scenario plan table from `/eval-suite-planner` as a reference document. You will need it when interpreting results with `/eval-result-interpreter`.

### Step 3 â€” Method rationale (teach the WHY)

After the test case table, include a **Why These Methods?** section that explains the reasoning behind the test method selections. This is critical â€” the table alone shows WHAT was chosen, but the customer needs to understand WHY so they can adjust methods for future test cases on their own.

For each unique test method used in the table, write 1-2 sentences explaining:
1. What property of the response this method actually measures
2. Why that property matters for the specific scenarios it was assigned to
3. What would go wrong if a different method were used instead

Example format:

> **Compare Meaning** (used for scenarios #1, #3, #5): These scenarios have a specific correct answer, but the exact wording does not matter â€” only the meaning. Compare Meaning uses an LLM to judge semantic equivalence, so the agent can phrase the answer differently and still pass. If you used Keyword Match instead, valid paraphrases would fail. If you used General Quality, there would be no expected answer to compare against, so factual errors would go undetected.
>
> **General Quality** (used for scenarios #2, #7): These are adversarial and edge-case scenarios where there is no single correct answer â€” the agent just needs to respond helpfully and safely. General Quality uses an LLM judge to evaluate relevance, groundedness, completeness, and appropriate abstention without needing an expected response.
>
> **Keyword Match (All)** (used for scenario #4): This scenario requires specific facts (policy numbers, dates, dollar amounts) that must appear verbatim. Compare Meaning might accept a response that captures the gist but drops a critical number. Keyword Match ensures every required fact is present.

Adapt the rationale to the actual scenarios and methods in the test set. If only one or two methods are used, explain why those methods are sufficient for this agent eval needs.

**For conversation test sets**, also explain:
- Why conversation mode was chosen over single-response (what multi-turn behavior is being tested)
- Why the available conversation methods (General Quality, Keyword Match, Capability Use, Custom) are sufficient â€” or flag if the customer should also create a complementary single-response test set for scenarios that need Compare Meaning, Exact Match, or Text Similarity

### Step 4 â€” Human review checkpoints

After the table and before generating the output files, display a **Human Review Required** section with these checkpoints. These flag specific decisions that require human judgment â€” the skill accelerates the work, but a human must validate the output before use.

**Human Review Required**

| # | Checkpoint | Why it matters |
|---|---|---|
| 1 | **Are the test inputs realistic?** Review every Question. Delete or rewrite any that would not occur in production. AI-generated inputs tend to be too clean â€” add typos, abbreviations, or ambiguity that real users would include. | Unrealistic inputs produce passing evals that do not predict production performance. |
| 2 | **Are the expected responses correct?** Verify every Expected Response against actual agent knowledge sources. A wrong expected response will cause a correct agent answer to fail. | This is the #1 source of false failures in eval results. |
| 3 | **Is each test method appropriate?** Check the method assigned to each row. Common mistakes: using Compare Meaning when exact facts matter (use Keyword Match), using General Quality when there IS a correct answer. | Wrong method means misleading pass/fail signals. See the selection guide above. |
| 4 | **Are pass scores reasonable?** Compare Meaning default is 50, Text Similarity default is 0.70. Adjust based on how much variation is acceptable for this agent. | Too strict = false failures. Too lenient = missed quality issues. |
| 5 | **Missing scenarios?** Are there realistic user inputs this test set does not cover? Think about your most common support tickets, edge cases unique to your business, and any compliance requirements. | Eval coverage gaps mean untested production paths. |
| 6 | **Negative test coverage:** For adversarial and out-of-scope test cases, verify the expected behavior matches your organizationâ€™s policy (e.g., should the agent refuse, redirect, or escalate?). | Policy alignment cannot be inferred â€” it must be specified by a human. |
| 7 | **(Conversation mode) Are the turn sequences realistic?** Review multi-turn conversations for natural flow. Do users actually ask these follow-ups in this order? Are there turns that should be added or removed? | Artificial conversation sequences test capabilities users never exercise. |
| 8 | **(Conversation mode) Is the right evaluation mode selected?** Confirm that conversation mode is the right choice. If the agent mostly handles standalone questions, single-response may give better signal. Consider creating both types. | Wrong mode means either missing multi-turn failures or over-constraining simple Q&A tests. |

After the checkpoints, add:
- **One more scenario to consider:** Describe an additional scenario worth adding manually â€” something that did not fit but is realistic.
- **Mandatory reminder:** "This test set was AI-generated and must be reviewed by someone who knows the agentâ€™s domain before use. No eval should run without human validation of inputs, expected responses, and method choices."
---

### Behavior rules

- Each case must be independently understandable â€” no references to "the previous case"
- When using a plan, generate exactly the scenarios listed â€” do not add or remove scenarios without saying why
- The Copilot Studio table (single-response) or conversation blocks (conversation mode) is the primary output displayed in conversation; the CSV (single-response only) and docx report are generated afterward
- Make inputs realistic and specific: use names, dates, product references, and context that a real user would provide
- The CSV must be valid and importable into Copilot Studio without manual editing
- For conversation mode, explicitly recommend whether the customer should also create a complementary single-response test set

---

## Example invocations

```
/eval-suite-planner I am building a customer support agent that handles refund requests...
[planner outputs scenario plan table]
/eval-generator
<- generates from the plan above, one case per scenario row (single-response mode)
<- outputs single CSV with Question/Expected response/Testing method columns

/eval-generator I am building a meeting notes agent that takes a raw transcript and produces a structured summary with action items.
<- generates from scratch, 6-8 cases, single CSV with per-row test methods

/eval-generator I am building a travel booking agent that helps users search flights, select seats, and complete purchases across multiple conversation turns.
<- detects multi-turn behavior, generates 4-6 conversation test cases
<- outputs conversation planning blueprint (no CSV â€” conversation test sets are created in UI)
<- recommends complementary single-response test set for standalone queries

/eval-generator
<- no plan in conversation, no description provided â€” asks user to provide input
```
