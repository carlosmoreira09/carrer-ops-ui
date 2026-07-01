#!/usr/bin/env node
/**
 * openai-eval.mjs — OpenAI-powered Job Offer Evaluator for career-ops
 *
 * Mirror of gemini-eval.mjs, but calls the OpenAI Chat Completions API using
 * native fetch (no SDK dependency). Reads evaluation logic from
 * modes/oferta.md + modes/_shared.md, the resume from cv.md, and evaluates a
 * Job Description passed as text or --file.
 *
 * Usage:
 *   node openai-eval.mjs "Paste full JD text here"
 *   node openai-eval.mjs --file ./jds/my-job.txt
 *   node openai-eval.mjs --model gpt-4o "<JD text>"
 *
 * Requires: OPENAI_API_KEY in .env (or environment). Default model gpt-4o-mini.
 */

import {
  readFileSync,
  existsSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

try {
  const { config } = await import('dotenv');
  config();
} catch {
  /* dotenv optional */
}

const ROOT = dirname(fileURLToPath(import.meta.url));

const PATHS = {
  shared: join(ROOT, 'modes', '_shared.md'),
  oferta: join(ROOT, 'modes', 'oferta.md'),
  cv: join(ROOT, 'cv.md'),
  profile: join(ROOT, 'modes', '_profile.md'),
  profileYml: join(ROOT, 'config', 'profile.yml'),
  reports: join(ROOT, 'reports'),
  trackerAdditions: join(ROOT, 'batch', 'tracker-additions'),
};

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
career-ops — OpenAI Evaluator

  USAGE
    node openai-eval.mjs "<JD text>"
    node openai-eval.mjs --file ./jds/my-job.txt
    node openai-eval.mjs --model gpt-4o "<JD text>"

  OPTIONS
    --file <path>    Read JD from a file instead of inline text
    --model <name>   OpenAI model (default: env OPENAI_MODEL or gpt-4o-mini)
    --no-save        Do not save the report
`);
  process.exit(0);
}

let jdText = '';
let modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
let saveReport = true;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i + 1]) {
    const filePath = args[++i];
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    jdText = readFileSync(filePath, 'utf-8').trim();
  } else if (args[i] === '--model' && args[i + 1]) {
    modelName = args[++i];
  } else if (args[i] === '--no-save') {
    saveReport = false;
  } else if (!args[i].startsWith('--')) {
    jdText += (jdText ? '\n' : '') + args[i];
  }
}

if (!jdText) {
  console.error('No Job Description provided. Run with --help for usage.');
  process.exit(1);
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error(`
OPENAI_API_KEY not found.
  Add it to .env:   OPENAI_API_KEY=your_key_here
`);
  process.exit(1);
}

function readFile(path, label) {
  if (!existsSync(path)) {
    console.warn(`${label} not found at: ${path}`);
    return `[${label} not found — skipping]`;
  }
  return readFileSync(path, 'utf-8').trim();
}

function nextReportNumber() {
  if (!existsSync(PATHS.reports)) return '001';
  const nums = readdirSync(PATHS.reports)
    .filter((f) => /^\d{3}-/.test(f))
    .map((f) => parseInt(f.slice(0, 3)))
    .filter((n) => !isNaN(n));
  return nums.length === 0 ? '001' : String(Math.max(...nums) + 1).padStart(3, '0');
}

function slugifyCompany(value) {
  return (
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'unknown'
  );
}

const tsvSafe = (v) => String(v ?? '').replace(/[\t\r\n]+/g, ' ').trim();
const normalizedTrackerScore = (v) => {
  const c = tsvSafe(v);
  if (!c || c === '?') return 'N/A';
  return /\/5$/i.test(c) ? c : `${c}/5`;
};

console.log('Loading context files...');
const sharedContext = readFile(PATHS.shared, 'modes/_shared.md');
const ofertaLogic = readFile(PATHS.oferta, 'modes/oferta.md');
const cvContent = readFile(PATHS.cv, 'cv.md');
const profileContent = readFile(PATHS.profile, 'modes/_profile.md');
const profileYml = readFile(PATHS.profileYml, 'config/profile.yml');

const systemPrompt = `You are career-ops, an AI-powered job search assistant.
You evaluate job offers against the user's CV using a structured A-G scoring system.
Follow the methodology below exactly.

═══════════ SYSTEM CONTEXT (_shared.md) ═══════════
${sharedContext}

═══════════ EVALUATION MODE (oferta.md) ═══════════
${ofertaLogic}

═══════════ CANDIDATE RESUME (cv.md) ═══════════
${cvContent}

═══════════ CANDIDATE PROFILE & TARGETS (config/profile.yml) ═══════════
${profileYml}

═══════════ USER ARCHETYPES & NARRATIVE (_profile.md) ═══════════
${profileContent}

═══════════ OPERATING RULES FOR THIS HEADLESS SESSION ═══════════
1. You do NOT have web search, Playwright, or file-writing tools.
   - Block D (Comp): give salary estimates from training data, clearly marked as estimates.
   - Block G (Legitimacy): analyze JD text only; skip URL/freshness checks.
   - File saving is handled by the calling script, not by you.
2. Generate Blocks A through G in full, in English (unless the JD is in another language).
3. At the very end, output a machine-readable summary in this EXACT format:

---SCORE_SUMMARY---
COMPANY: <company name or "Unknown">
ROLE: <role title>
SCORE: <global score as decimal, e.g. 3.8>
ARCHETYPE: <detected archetype>
LEGITIMACY: <High Confidence | Proceed with Caution | Suspicious>
---END_SUMMARY---
`;

async function callOpenAI(withTemperature) {
  const body = {
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `JOB DESCRIPTION TO EVALUATE:\n\n${jdText}` },
    ],
  };
  if (withTemperature) body.temperature = 0.4;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      msg = JSON.parse(text).error?.message || text;
    } catch {
      /* keep raw */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return JSON.parse(text);
}

console.log(`Calling OpenAI (${modelName})...`);
let data;
try {
  data = await callOpenAI(true);
} catch (err) {
  // Some models reject a custom temperature — retry with the default.
  if (/temperature/i.test(err.message || '')) {
    try {
      data = await callOpenAI(false);
    } catch (e2) {
      err.message = e2.message;
      err.status = e2.status;
    }
  }
  if (!data) {
    const sanitized = (err.message || '').split(apiKey).join('[REDACTED]');
    console.error(`OpenAI API error (${err.status || '?'}): ${sanitized}`);
    if (err.status === 404) {
      console.error(
        `    Model "${modelName}" was not found for your account. ` +
          `Check the model id (e.g. gpt-4o, gpt-4o-mini) and your API access.`
      );
    } else if (err.status === 401) {
      console.error('    Check your OPENAI_API_KEY in .env');
    } else if (err.status === 429) {
      console.error('    Rate limit / quota exceeded. Wait and retry.');
    }
    process.exit(1);
  }
}

const evaluationText = data.choices?.[0]?.message?.content?.trim() || '';
if (!evaluationText) {
  console.error('OpenAI returned an empty response.');
  process.exit(1);
}

console.log('\n' + '═'.repeat(66));
console.log('  CAREER-OPS EVALUATION — powered by OpenAI');
console.log('═'.repeat(66) + '\n');
console.log(evaluationText);

const summaryMatch = evaluationText.match(
  /---SCORE_SUMMARY---\s*([\s\S]*?)---END_SUMMARY---/
);
let company = 'unknown';
let role = 'unknown';
let score = '?';
let archetype = 'unknown';
let legitimacy = 'unknown';

if (summaryMatch) {
  const block = summaryMatch[1];
  const extract = (key) => {
    for (const line of block.split('\n')) {
      const t = line.trimStart();
      if (t.startsWith(`${key}:`)) return t.slice(key.length + 1).trim();
    }
    return 'unknown';
  };
  company = extract('COMPANY');
  role = extract('ROLE');
  score = extract('SCORE');
  archetype = extract('ARCHETYPE');
  legitimacy = extract('LEGITIMACY');
}

if (saveReport) {
  try {
    if (!existsSync(PATHS.reports)) mkdirSync(PATHS.reports, { recursive: true });
    const num = nextReportNumber();
    const today = new Date().toISOString().split('T')[0];
    const companySlug = slugifyCompany(company);
    const filename = `${num}-${companySlug}-${today}.md`;
    const reportPath = join(PATHS.reports, filename);
    const trackerPath = join(PATHS.trackerAdditions, `${num}-${companySlug}.tsv`);

    const reportContent = `# Evaluation: ${company} — ${role}

**Date:** ${today}
**Archetype:** ${archetype}
**Score:** ${score}/5
**Legitimacy:** ${legitimacy}
**Verification:** unconfirmed (headless mode)
**PDF:** pending
**Tool:** OpenAI (${modelName})

---

${evaluationText.replace(/---SCORE_SUMMARY---[\s\S]*?---END_SUMMARY---/, '').trim()}
`;

    writeFileSync(reportPath, reportContent, 'utf-8');
    mkdirSync(PATHS.trackerAdditions, { recursive: true });
    const trackerFields = [
      String(parseInt(num, 10)),
      today,
      tsvSafe(company),
      tsvSafe(role),
      'Evaluated',
      normalizedTrackerScore(score),
      '❌',
      `[${num}](reports/${filename})`,
      'OpenAI evaluation',
    ];
    writeFileSync(trackerPath, `${trackerFields.join('\t')}\n`, 'utf-8');
    console.log(`\nReport saved: reports/${filename}`);

    const mergeOutput = execFileSync(process.execPath, [join(ROOT, 'merge-tracker.mjs')], {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (mergeOutput.trim()) console.log(mergeOutput.trim());
    console.log('Tracker merged into data/applications.md.');
  } catch (err) {
    console.warn(`Could not save report: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n' + '─'.repeat(66));
console.log(`  Score: ${score}/5  |  Archetype: ${archetype}  |  Legitimacy: ${legitimacy}`);
console.log('─'.repeat(66) + '\n');
