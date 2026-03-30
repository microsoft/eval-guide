/**
 * eval-runner.js — Run eval test sets against a Copilot Studio agent via DirectLine,
 * score responses with Claude Sonnet as LLM judge, and output results.
 *
 * Usage:
 *   node eval-runner.js --token-endpoint <url> --csv <path> [--csv <path2> ...]
 *   node eval-runner.js --token-endpoint <url> --csv-dir <dir>
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY  — required for LLM-based scorers (Compare meaning, General quality)
 *
 * Output: results table to stderr, results JSON + CSV to files
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg) {
  process.stderr.write(msg + "\n");
}

function die(msg) {
  process.stderr.write("ERROR: " + msg + "\n");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// CSV parsing (minimal, handles quoted fields)
// ---------------------------------------------------------------------------

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  function parseLine(line) {
    const fields = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          fields.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    tokenEndpoint: null,
    directlineSecret: null,
    csvFiles: [],
    csvDir: null,
    outputDir: null,
    concurrency: 1,
    timeout: 45000,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--token-endpoint":
        parsed.tokenEndpoint = args[++i];
        break;
      case "--directline-secret":
        parsed.directlineSecret = args[++i];
        break;
      case "--csv":
        parsed.csvFiles.push(args[++i]);
        break;
      case "--csv-dir":
        parsed.csvDir = args[++i];
        break;
      case "--output-dir":
        parsed.outputDir = args[++i];
        break;
      case "--concurrency":
        parsed.concurrency = parseInt(args[++i], 10);
        break;
      case "--timeout":
        parsed.timeout = parseInt(args[++i], 10);
        break;
    }
  }

  if (!parsed.tokenEndpoint && !parsed.directlineSecret) {
    die("Missing connection: provide --token-endpoint or --directline-secret.");
  }
  if (parsed.csvFiles.length === 0 && !parsed.csvDir) {
    die("Missing test data: provide --csv <file> or --csv-dir <directory>.");
  }

  // Resolve csv-dir to individual files
  if (parsed.csvDir) {
    const dir = path.resolve(parsed.csvDir);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".csv"));
    parsed.csvFiles.push(...files.map((f) => path.join(dir, f)));
  }

  if (parsed.csvFiles.length === 0) {
    die("No CSV files found.");
  }

  parsed.outputDir = parsed.outputDir || ".";

  return parsed;
}

// ---------------------------------------------------------------------------
// DirectLine v3 (inline — same pattern as directline-chat.js)
// ---------------------------------------------------------------------------

async function httpGet(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} from GET ${url}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function httpPost(url, headers, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} from POST ${url}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchToken(tokenEndpointUrl) {
  const data = await httpGet(tokenEndpointUrl, {});
  if (!data.token) throw new Error("Token endpoint did not return a token.");
  return data.token;
}

async function getRegionalDomain(tokenEndpointUrl) {
  try {
    const parsed = new URL(tokenEndpointUrl);
    const settingsUrl =
      parsed.origin +
      "/powervirtualagents/regionalchannelsettings?api-version=2022-03-01-preview";
    const data = await httpGet(settingsUrl, {});
    const domain = data.channelUrlsById?.directline?.replace(/\/+$/, "");
    if (domain) return domain;
  } catch (e) {
    // fall through
  }
  return "https://directline.botframework.com";
}

async function startConversation(domain, token) {
  const data = await httpPost(
    `${domain}/v3/directline/conversations`,
    { Authorization: `Bearer ${token}` },
    {}
  );
  if (!data.conversationId) throw new Error("No conversationId returned.");
  return { conversationId: data.conversationId, token: data.token || token };
}

async function sendActivity(domain, conversationId, token, activity) {
  return httpPost(
    `${domain}/v3/directline/conversations/${conversationId}/activities`,
    { Authorization: `Bearer ${token}` },
    activity
  );
}

async function pollActivities(domain, conversationId, token, watermark) {
  let url = `${domain}/v3/directline/conversations/${conversationId}/activities`;
  if (watermark !== undefined) url += `?watermark=${watermark}`;
  const data = await httpGet(url, { Authorization: `Bearer ${token}` });
  return { activities: data.activities || [], watermark: data.watermark };
}

async function sendAndCollect(domain, conversationId, token, utterance, timeoutMs) {
  // Send user message
  await sendActivity(domain, conversationId, token, {
    type: "message",
    from: { id: "eval-runner", role: "user" },
    text: utterance,
  });

  // Poll for bot response
  let watermark;
  let lastActivityTime = Date.now();
  const botMessages = [];

  while (Date.now() - lastActivityTime < timeoutMs) {
    const result = await pollActivities(domain, conversationId, token, watermark);
    watermark = result.watermark;

    const botActivities = result.activities.filter(
      (a) => a.from && a.from.role !== "user" && a.type === "message" && a.text
    );

    for (const activity of botActivities) {
      lastActivityTime = Date.now();
      botMessages.push(activity.text);
    }

    // Check for endOfConversation
    const eoc = result.activities.find((a) => a.type === "endOfConversation");
    if (eoc) break;

    // If we got bot messages, wait a bit more for any follow-ups then break
    if (botMessages.length > 0) {
      await sleep(2000);
      const followUp = await pollActivities(domain, conversationId, token, watermark);
      const moreBotMsgs = followUp.activities.filter(
        (a) => a.from && a.from.role !== "user" && a.type === "message" && a.text
      );
      moreBotMsgs.forEach((a) => botMessages.push(a.text));
      break;
    }

    await sleep(1000);
  }

  return botMessages.join("\n\n");
}

/**
 * Send a question to the agent and get the response.
 * Each question gets a fresh conversation to avoid cross-contamination.
 */
async function askAgent(connectionParams, utterance, timeoutMs) {
  let token, domain;

  if (connectionParams.tokenEndpoint) {
    token = await fetchToken(connectionParams.tokenEndpoint);
    domain = connectionParams.domain; // cached from init
  } else {
    token = connectionParams.directlineSecret;
    domain = "https://directline.botframework.com";
  }

  const conv = await startConversation(domain, token);

  // Send startConversation event
  await sendActivity(domain, conv.conversationId, conv.token, {
    type: "event",
    name: "startConversation",
    from: { id: "eval-runner", role: "user" },
  });

  // Wait briefly for welcome message
  await sleep(2000);
  // Drain welcome activities
  await pollActivities(domain, conv.conversationId, conv.token, undefined);

  // Now send actual question and collect response
  const response = await sendAndCollect(
    domain,
    conv.conversationId,
    conv.token,
    utterance,
    timeoutMs
  );

  return response;
}

// ---------------------------------------------------------------------------
// Claude Sonnet scoring (Anthropic API)
// ---------------------------------------------------------------------------

const SCORE_MODEL = "claude-sonnet-4-20250514";

async function initScoring() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log("WARNING: No ANTHROPIC_API_KEY found. LLM-based scorers will be skipped.");
    return { client: null };
  }

  const Anthropic = require("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });
  log(`Scoring configured: Claude Sonnet (${SCORE_MODEL})`);
  return { client };
}

/**
 * Call Claude Sonnet to judge a response. Returns { score, rationale }.
 */
async function llmJudge(client, systemPrompt, userPrompt) {
  const response = await client.messages.create({
    model: SCORE_MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0]?.text || "";

  // Parse structured output: expect SCORE: <number> and RATIONALE: <text>
  const scoreMatch = text.match(/SCORE:\s*([\d.]+)/i);
  const rationaleMatch = text.match(/RATIONALE:\s*(.+)/is);

  const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
  const rationale = rationaleMatch ? rationaleMatch[1].trim() : text;

  return { score, rationale };
}

/**
 * Score a single test case based on its testing method.
 */
async function scoreTestCase(scorers, testCase) {
  const { question, expected, actual, testingMethod } = testCase;
  const method = testingMethod.toLowerCase().replace(/\s+/g, "_");

  try {
    switch (method) {
      case "compare_meaning": {
        if (!scorers.client) return { score: null, pass: null, explanation: "No LLM scorer available" };
        const { score, rationale } = await llmJudge(
          scorers.client,
          `You are an evaluation judge. Compare the ACTUAL response to the EXPECTED response for semantic equivalence.
Score on a 0.0 to 1.0 scale:
- 1.0 = same meaning (paraphrasing is fine)
- 0.6 = mostly correct with minor omissions or additions
- 0.4 = partially correct but missing key information
- 0.0 = wrong, contradictory, or completely irrelevant

Respond in exactly this format:
SCORE: <number between 0.0 and 1.0>
RATIONALE: <one sentence explanation>`,
          `QUESTION: ${question}\n\nEXPECTED RESPONSE: ${expected}\n\nACTUAL RESPONSE: ${actual}`
        );
        return { score, pass: score !== null && score >= 0.6, explanation: rationale };
      }

      case "general_quality": {
        if (!scorers.client) return { score: null, pass: null, explanation: "No LLM scorer available" };
        const { score, rationale } = await llmJudge(
          scorers.client,
          `You are an evaluation judge. Assess the overall quality of the ACTUAL response to the user's question.
Consider: helpfulness, accuracy, relevance, completeness, and tone.
If an EXPECTED response is provided, use it as reference but the actual response does not need to match exactly.

Score on a 0.0 to 1.0 scale:
- 1.0 = excellent, fully addresses the question
- 0.7 = good, mostly addresses the question with minor issues
- 0.4 = mediocre, partially addresses the question
- 0.0 = poor, unhelpful, wrong, or harmful

Respond in exactly this format:
SCORE: <number between 0.0 and 1.0>
RATIONALE: <one sentence explanation>`,
          `QUESTION: ${question}\n\nEXPECTED RESPONSE (reference): ${expected}\n\nACTUAL RESPONSE: ${actual}`
        );
        return { score, pass: score !== null && score >= 0.5, explanation: rationale };
      }

      case "keyword_match": {
        // Code-based — no LLM needed
        const keywords = expected
          .split(/[,;|]/)
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean);
        if (keywords.length === 0) {
          const found = actual.toLowerCase().includes(expected.toLowerCase());
          return { score: found ? 1 : 0, pass: found, explanation: found ? "Keyword found" : "Keyword not found" };
        }
        const actualLower = actual.toLowerCase();
        const matched = keywords.filter((k) => actualLower.includes(k));
        const score = matched.length / keywords.length;
        return {
          score,
          pass: score >= 0.5,
          explanation: `Matched ${matched.length}/${keywords.length} keywords: [${matched.join(", ")}]`,
        };
      }

      case "exact_match": {
        // Code-based — no LLM needed
        const pass = actual.trim().toLowerCase() === expected.trim().toLowerCase();
        return { score: pass ? 1 : 0, pass, explanation: pass ? "Exact match" : "No exact match" };
      }

      case "similarity": {
        // Use Claude as semantic similarity judge
        if (!scorers.client) return { score: null, pass: null, explanation: "No LLM scorer available" };
        const { score, rationale } = await llmJudge(
          scorers.client,
          `You are an evaluation judge. Rate the semantic similarity between the EXPECTED and ACTUAL responses.
Score on a 0.0 to 1.0 scale where 1.0 = identical meaning and 0.0 = completely different.

Respond in exactly this format:
SCORE: <number between 0.0 and 1.0>
RATIONALE: <one sentence explanation>`,
          `QUESTION: ${question}\n\nEXPECTED RESPONSE: ${expected}\n\nACTUAL RESPONSE: ${actual}`
        );
        return { score, pass: score !== null && score >= 0.6, explanation: rationale };
      }

      default: {
        // Unknown method — use general quality as fallback
        if (!scorers.client) return { score: null, pass: null, explanation: `Unknown method: ${testingMethod}` };
        const { score, rationale } = await llmJudge(
          scorers.client,
          `You are an evaluation judge. Assess whether the ACTUAL response adequately addresses the question.

Score on a 0.0 to 1.0 scale:
- 1.0 = fully addresses the question
- 0.0 = does not address the question

Respond in exactly this format:
SCORE: <number between 0.0 and 1.0>
RATIONALE: <one sentence explanation>`,
          `QUESTION: ${question}\n\nEXPECTED RESPONSE: ${expected}\n\nACTUAL RESPONSE: ${actual}`
        );
        return { score, pass: score !== null && score >= 0.5, explanation: rationale };
      }
    }
  } catch (err) {
    return { score: null, pass: null, explanation: `Scoring error: ${err.message}` };
  }
}

// ---------------------------------------------------------------------------
// Progress display
// ---------------------------------------------------------------------------

function progressBar(current, total, width = 30) {
  const pct = Math.floor((current / total) * 100);
  const filled = Math.floor((current / total) * width);
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(width - filled);
  return `  ${bar} ${current}/${total} (${pct}%)`;
}

// ---------------------------------------------------------------------------
// Results formatting
// ---------------------------------------------------------------------------

function printResultsTable(categoryResults) {
  const colWidths = { name: 26, total: 7, pass: 6, fail: 6, score: 7 };
  const sep = (ch) =>
    "\u250C" +
    "\u2500".repeat(colWidths.name) +
    "\u252C" +
    "\u2500".repeat(colWidths.total) +
    "\u252C" +
    "\u2500".repeat(colWidths.pass) +
    "\u252C" +
    "\u2500".repeat(colWidths.fail) +
    "\u252C" +
    "\u2500".repeat(colWidths.score) +
    "\u2510";

  const pad = (s, w) => (" " + s).padEnd(w);
  const padR = (s, w) => (s + " ").padStart(w);

  log("");
  log(
    "\u250C" +
    "\u2500".repeat(colWidths.name) +
    "\u252C" +
    "\u2500".repeat(colWidths.total) +
    "\u252C" +
    "\u2500".repeat(colWidths.pass) +
    "\u252C" +
    "\u2500".repeat(colWidths.fail) +
    "\u252C" +
    "\u2500".repeat(colWidths.score) +
    "\u2510"
  );
  log(
    "\u2502" + pad("Category", colWidths.name) +
    "\u2502" + pad("Total", colWidths.total) +
    "\u2502" + pad("Pass", colWidths.pass) +
    "\u2502" + pad("Fail", colWidths.fail) +
    "\u2502" + pad("Score", colWidths.score) +
    "\u2502"
  );
  log(
    "\u251C" +
    "\u2500".repeat(colWidths.name) +
    "\u253C" +
    "\u2500".repeat(colWidths.total) +
    "\u253C" +
    "\u2500".repeat(colWidths.pass) +
    "\u253C" +
    "\u2500".repeat(colWidths.fail) +
    "\u253C" +
    "\u2500".repeat(colWidths.score) +
    "\u2524"
  );

  let totalAll = 0, passAll = 0, failAll = 0;

  for (const cat of categoryResults) {
    totalAll += cat.total;
    passAll += cat.pass;
    failAll += cat.fail;
    const scorePct = cat.total > 0 ? Math.round((cat.pass / cat.total) * 100) + "%" : "N/A";
    log(
      "\u2502" + pad(cat.name, colWidths.name) +
      "\u2502" + padR(String(cat.total), colWidths.total) +
      "\u2502" + padR(String(cat.pass), colWidths.pass) +
      "\u2502" + padR(String(cat.fail), colWidths.fail) +
      "\u2502" + padR(scorePct, colWidths.score) +
      "\u2502"
    );
  }

  log(
    "\u251C" +
    "\u2500".repeat(colWidths.name) +
    "\u253C" +
    "\u2500".repeat(colWidths.total) +
    "\u253C" +
    "\u2500".repeat(colWidths.pass) +
    "\u253C" +
    "\u2500".repeat(colWidths.fail) +
    "\u253C" +
    "\u2500".repeat(colWidths.score) +
    "\u2524"
  );

  const overallPct = totalAll > 0 ? Math.round((passAll / totalAll) * 100) + "%" : "N/A";
  log(
    "\u2502" + pad("OVERALL", colWidths.name) +
    "\u2502" + padR(String(totalAll), colWidths.total) +
    "\u2502" + padR(String(passAll), colWidths.pass) +
    "\u2502" + padR(String(failAll), colWidths.fail) +
    "\u2502" + padR(overallPct, colWidths.score) +
    "\u2502"
  );

  log(
    "\u2514" +
    "\u2500".repeat(colWidths.name) +
    "\u2534" +
    "\u2500".repeat(colWidths.total) +
    "\u2534" +
    "\u2500".repeat(colWidths.pass) +
    "\u2534" +
    "\u2500".repeat(colWidths.fail) +
    "\u2534" +
    "\u2500".repeat(colWidths.score) +
    "\u2518"
  );
  log("");
}

function resultsToCSV(allResults) {
  const header = "Category,Question,Expected response,Actual response,Testing method,Score,Pass/Fail,Explanation";
  const rows = allResults.map((r) => {
    const esc = (s) => '"' + String(s || "").replace(/"/g, '""') + '"';
    return [
      esc(r.category),
      esc(r.question),
      esc(r.expected),
      esc(r.actual),
      esc(r.testingMethod),
      r.score !== null ? r.score.toFixed(2) : "",
      r.pass === true ? "Pass" : r.pass === false ? "Fail" : "N/A",
      esc(r.explanation),
    ].join(",");
  });
  return header + "\n" + rows.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs();
  const scorers = await initScoring();

  // Resolve connection
  const connectionParams = {};
  if (args.tokenEndpoint) {
    connectionParams.tokenEndpoint = args.tokenEndpoint;
    log("Fetching regional DirectLine domain...");
    connectionParams.domain = await getRegionalDomain(args.tokenEndpoint);
    log(`Using domain: ${connectionParams.domain}`);
  } else {
    connectionParams.directlineSecret = args.directlineSecret;
  }

  // Load all CSV files
  const testSets = [];
  for (const csvPath of args.csvFiles) {
    const absPath = path.resolve(csvPath);
    const content = fs.readFileSync(absPath, "utf-8");
    const rows = parseCSV(content);
    const name = path.basename(csvPath, ".csv");
    testSets.push({ name, path: absPath, rows });
    log(`Loaded: ${name} (${rows.length} test cases)`);
  }

  const totalCases = testSets.reduce((sum, ts) => sum + ts.rows.length, 0);
  log(`\nTotal: ${totalCases} test cases across ${testSets.length} sets\n`);

  // Run each test case
  const allResults = [];
  let completed = 0;

  for (const testSet of testSets) {
    log(`\n--- ${testSet.name} ---`);

    for (const row of testSet.rows) {
      const question = row.question || row.question || "";
      const expected = row.expected_response || row.expected || "";
      const testingMethod = row.testing_method || row.testingmethod || "General quality";

      if (!question) {
        completed++;
        continue;
      }

      // Call agent
      log(`\r${progressBar(completed, totalCases)} Asking: "${question.slice(0, 50)}..."`);
      let actual = "";
      try {
        actual = await askAgent(connectionParams, question, args.timeout);
      } catch (err) {
        actual = `[ERROR: ${err.message}]`;
      }

      // Score
      const scoreResult = await scoreTestCase(scorers, {
        question,
        expected,
        actual,
        testingMethod,
      });

      allResults.push({
        category: testSet.name,
        question,
        expected,
        actual,
        testingMethod,
        score: scoreResult.score,
        pass: scoreResult.pass,
        explanation: scoreResult.explanation,
      });

      completed++;
      const status = scoreResult.pass === true ? "\x1b[32mPASS\x1b[0m" : scoreResult.pass === false ? "\x1b[31mFAIL\x1b[0m" : "\x1b[33mN/A\x1b[0m";
      log(`  ${status} (${scoreResult.score !== null ? (scoreResult.score * 100).toFixed(0) + "%" : "N/A"}) ${question.slice(0, 60)}`);
    }
  }

  log(`\n${progressBar(totalCases, totalCases)} Complete!\n`);

  // Aggregate by category
  const categoryMap = {};
  for (const r of allResults) {
    if (!categoryMap[r.category]) categoryMap[r.category] = { name: r.category, total: 0, pass: 0, fail: 0 };
    categoryMap[r.category].total++;
    if (r.pass === true) categoryMap[r.category].pass++;
    if (r.pass === false) categoryMap[r.category].fail++;
  }
  const categoryResults = Object.values(categoryMap);

  // Print table
  log("Results:");
  printResultsTable(categoryResults);

  // Write output files
  const timestamp = new Date().toISOString().slice(0, 10);
  const csvOutPath = path.join(args.outputDir, `eval-results-${timestamp}.csv`);
  const jsonOutPath = path.join(args.outputDir, `eval-results-${timestamp}.json`);

  fs.writeFileSync(csvOutPath, resultsToCSV(allResults), "utf-8");
  fs.writeFileSync(
    jsonOutPath,
    JSON.stringify({ timestamp: new Date().toISOString(), summary: categoryResults, results: allResults }, null, 2),
    "utf-8"
  );

  log(`Results saved to: ${csvOutPath}`);
  log(`JSON saved to: ${jsonOutPath}`);

  // Also write to stdout as JSON for skill consumption
  process.stdout.write(JSON.stringify({ summary: categoryResults, results: allResults }) + "\n");
}

main().catch((err) => die(err.message));
