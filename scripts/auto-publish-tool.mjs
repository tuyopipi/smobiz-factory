import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();
const artifactsDir = join(root, "artifacts", "auto-publish");
const force = process.argv.includes("--force");
const phpBin = process.env.PHP_BIN || "php";
const nodeBin = process.env.NODE_BIN || process.execPath || "node";

await mkdir(artifactsDir, { recursive: true });

function run(command, args, options = {}) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options });
}

function runJson(command, args) {
  return JSON.parse(run(command, args));
}

async function writeJson(name, value) {
  const path = join(artifactsDir, name);
  await writeFile(path, JSON.stringify(value, null, 2));
  return path;
}

async function readFreshDiscovery(path) {
  try {
    const payload = JSON.parse(await readFile(path, "utf8"));
    const generatedAt = new Date(payload.generatedAt);
    const today = new Date().toISOString().slice(0, 10);
    if (generatedAt.toISOString().slice(0, 10) === today && (payload.results?.length ?? 0) > 0) {
      return payload;
    }
  } catch {
    return null;
  }
  return null;
}

try {
  runJson(phpBin, ["scripts/automation-db.php", "ensure-schema"]);
  const today = runJson(phpBin, ["scripts/automation-db.php", "today-status"]);
  if (today.published_today && !force) {
    const payload = { status: "skipped", reason: "already-published-today", details: today.run };
    refreshSeoFiles({ upload: true });
    await writeJson("latest-result.json", payload);
    console.log(JSON.stringify(payload, null, 2));
    process.exit(0);
  }

  const tools = runJson(phpBin, ["scripts/automation-db.php", "list-tools"]).tools ?? [];
  const existingSlugs = new Set(tools.map((tool) => tool.slug));
  const existingKeywords = new Set(tools.map((tool) => String(tool.target_keyword ?? "").toLowerCase()));

  const discoveryPath = join(root, "artifacts", "english-web-tool-discovery", "latest.json");
  let discovery = await readFreshDiscovery(discoveryPath);
  if (!discovery) {
    run(nodeBin, ["scripts/english-web-tool-discovery.mjs"], {
      env: { ...process.env, COUNT: "5", KEYWORD_LIMIT: "30" }
    });
    discovery = JSON.parse(await readFile(discoveryPath, "utf8"));
  }
  const selected = selectCandidate(discovery.results ?? [], existingSlugs, existingKeywords);
  if (!selected) {
    const payload = { status: "skipped", reason: "no-quality-candidate", details: { resultCount: discovery.results?.length ?? 0 } };
    await logRun(payload);
    await writeJson("latest-result.json", payload);
    refreshSeoFiles({ upload: true });
    process.exit(0);
  }

  const generated = generateTool(selected);
  validateGeneratedTool(generated, existingSlugs);
  await writeToolFiles(generated);
  const payloadPath = await writeJson("latest-tool.json", { tool: generated.tool, score: generated.score, source: selected });
  runJson(phpBin, ["scripts/automation-db.php", "upsert-tool", payloadPath]);
  refreshSeoFiles();
  run(phpBin, ["scripts/ftp-upload.php", "--include-config"]);

  const result = {
    status: "published",
    slug: generated.tool.slug,
    name: generated.tool.name,
    target_keyword: generated.tool.target_keyword,
    gap_score: generated.score.gapScore,
    url: `https://mmk.tokyo/tools/${generated.tool.slug}/`,
    details: { score: generated.score, sourceKeyword: selected.keyword }
  };
  await logRun(result);
  await writeJson("latest-result.json", result);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  const result = { status: "failed", reason: error instanceof Error ? error.message : String(error) };
  try {
    await logRun(result);
    await writeJson("latest-result.json", result);
  } catch {
    // Preserve the original failure.
  }
  throw error;
}

function selectCandidate(results, existingSlugs, existingKeywords) {
  return results
    .filter((item) => item.risk !== "high")
    .filter((item) => opportunityValue(item) >= 0.35)
    .filter((item) => {
      const slug = slugify(toolNameFor(item));
      return !existingSlugs.has(slug) && !existingKeywords.has(String(item.keyword).toLowerCase());
    })
    .find((item) => generatorKind(item) !== "unsupported");
}

function opportunityValue(item) {
  return Number(item.opportunityScore ?? item.gapScore ?? 0);
}

function generatorKind(item) {
  const keyword = String(item.keyword).toLowerCase();
  if (keyword.includes("checklist") || keyword.includes("intake") || keyword.includes("onboarding") || keyword.includes("monthly close") || keyword.includes("document")) return "client-checklist";
  if (keyword.includes("quote") || keyword.includes("estimate") || keyword.includes("retainer") || keyword.includes("change order") || keyword.includes("ledger")) return "quote-calculator";
  if (keyword.includes("maintenance checklist")) return "maintenance-checklist";
  if (keyword.includes("contract")) return "contract-template";
  if (keyword.includes("json formatter") || keyword.includes("api response")) return "json-formatter";
  if (keyword.includes("csv") && keyword.includes("json")) return "csv-json";
  if (keyword.includes("invoice")) return "invoice";
  if (keyword.includes("regex")) return "regex";
  if (keyword.includes("screenshot")) return "screenshot";
  return "generic-checklist";
}

function toolNameFor(item) {
  const kind = generatorKind(item);
  if (item.candidate?.name) return item.candidate.name;
  if (kind === "client-checklist") return "Client Intake Checklist Builder";
  if (kind === "quote-calculator") return "Small Business Quote Calculator";
  if (kind === "maintenance-checklist") return "Maintenance Checklist Generator";
  if (kind === "json-formatter") return "JSON Formatter";
  if (kind === "csv-json") return "CSV to JSON Converter";
  if (kind === "invoice") return "Invoice Line Item Calculator";
  if (kind === "regex") return "Regex Test Case Builder";
  if (kind === "screenshot") return "Screenshot Annotation Checklist";
  return item.candidate?.name ?? `${titleCase(item.keyword)} Tool`;
}

function generateTool(item) {
  const kind = generatorKind(item);
  const name = toolNameFor(item);
  const slug = slugify(name);
  const category = categoryFor(kind);
  const differentiationPoints = [
    ...(item.candidate?.differentiationPoints ?? []),
    ...(item.differentiationPoints ?? [])
  ].filter(Boolean).slice(0, 4);
  const painPoints = [
    ...(item.candidate?.painPoints ?? []),
    ...(item.painPoints ?? [])
  ].filter(Boolean).slice(0, 4);
  const tool = {
    slug,
    name,
    description: descriptionFor(kind, differentiationPoints),
    category,
    target_keyword: item.keyword,
    logo_color: colorFor(category),
    pricing_model: pricingFor(kind),
    price_amount_cents: null,
    price_currency: "usd",
    price_interval: "one_time",
    price_id: null,
    stripe_price_id: null,
    stripe_product_id: null,
    pain_points: painPoints,
    differentiation_points: differentiationPoints
  };
  return {
    tool,
    score: pickScore(item),
    php: phpForTool(tool, kind)
  };
}

function pickScore(item) {
  return {
    gapScore: item.gapScore,
    opportunityScore: item.opportunityScore,
    competitorPainScore: item.competitorPainScore,
    demandScore: item.demandScore,
    purchaseIntentScore: item.purchaseIntentScore,
    implementationEaseScore: item.implementationEaseScore,
    competitionThinnessScore: item.competitionThinnessScore,
    painPoints: item.painPoints ?? [],
    differentiationPoints: item.differentiationPoints ?? [],
    risk: item.risk
  };
}

function phpForTool(tool, kind) {
  if (kind === "client-checklist") return clientChecklistPhp(tool);
  if (kind === "quote-calculator") return quoteCalculatorPhp(tool);
  if (kind === "maintenance-checklist") return maintenanceChecklistPhp(tool);
  if (kind === "json-formatter" || kind === "api-formatter") return jsonFormatterPhp(tool);
  if (kind === "contract-template") return contractTemplatePhp(tool);
  if (kind === "invoice") return invoiceCalculatorPhp(tool);
  if (kind === "regex") return regexBuilderPhp(tool);
  if (kind === "screenshot") return screenshotChecklistPhp(tool);
  return maintenanceChecklistPhp(tool);
}

function pageShell(tool, labels, toolHtml, codeHtml, faq) {
  return `<?php

require_once __DIR__ . '/../inc/template.php';

$tool = ${phpArray(tool)};
$lang = current_lang();
$isJa = $lang === 'ja';
$labels = $isJa ? ${phpArray(labels.ja)} : ${phpArray(labels.en)};
$painFixes = array_values(array_filter($tool['differentiation_points'] ?? []));

$toolHtml = <<<HTML
${toolHtml}
HTML;

$painFixHtml = '';
if (count($painFixes) > 0) {
    $items = '';
    foreach ($painFixes as $fix) {
        $items .= '<li>' . h((string) $fix) . '</li>';
    }
    $painFixHtml = '<section class="tool-shell"><h2>Why this is simpler</h2><ul>' . $items . '</ul></section>';
}

$codeHtml = ${phpString(codeHtml)};

render_tool_page($tool, [
    'seo_title' => [
        'en' => ${phpString(`${titleCase(tool.target_keyword)} | Free Online Tool`)},
        'ja' => ${phpString(`${tool.name} | 無料オンラインツール`)},
    ],
    'seo_description' => [
        'en' => ${phpString(`${tool.description} Free private tool with no login, no sign up, no upload, and no paywall for the core workflow.`)},
        'ja' => ${phpString(`${tool.name} はブラウザで使えるシンプルな無料Webツールです。`)},
    ],
    'h1' => ['en' => ${phpString(titleCase(tool.target_keyword))}, 'ja' => ${phpString(tool.name)}],
    'inline_help' => ['en' => $labels['help'], 'ja' => $labels['help']],
    'explanation' => ['en' => $labels['explanation'], 'ja' => $labels['explanation']],
    'tool_html' => $toolHtml . $painFixHtml,
    'code_html' => $codeHtml,
    'faq' => ${phpArray(faq)},
]);
`;
}

function maintenanceChecklistPhp(tool) {
  const labels = {
    en: {
      item: "Maintenance item",
      frequency: "Frequency",
      add: "Add item",
      build: "Build checklist",
      copy: "Copy",
      help: "Add maintenance tasks, choose a frequency, and generate a clean checklist.",
      explanation: "This generator creates a practical maintenance checklist you can copy into a work order, email, or spreadsheet."
    },
    ja: {
      item: "点検項目",
      frequency: "頻度",
      add: "項目を追加",
      build: "チェックリスト生成",
      copy: "コピー",
      help: "点検項目と頻度を入力して、コピーしやすいチェックリストを生成します。",
      explanation: "作業指示、メール、表計算に貼り付けやすいメンテナンスチェックリストを作ります。"
    }
  };
  return pageShell(tool, labels, `<label for="task-input">{\$labels['item']}</label>
<input id="task-input" value="Inspect filters">
<label for="frequency-input">{\$labels['frequency']}</label>
<select id="frequency-input"><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Quarterly</option></select>
<div class="actions"><button id="add-button" type="button">{\$labels['add']}</button><button id="build-button" type="button">{\$labels['build']}</button><button id="copy-button" type="button">{\$labels['copy']}</button></div>
<ul id="task-list"></ul>
<textarea id="output" rows="12" readonly></textarea>
<script>
const tasks = [{ item: 'Inspect filters', frequency: 'Monthly' }, { item: 'Check safety labels', frequency: 'Weekly' }];
const taskInput = document.querySelector('#task-input');
const frequencyInput = document.querySelector('#frequency-input');
const taskList = document.querySelector('#task-list');
const output = document.querySelector('#output');
function renderTasks() {
  taskList.replaceChildren();
  for (const task of tasks) {
    const li = document.createElement('li');
    li.textContent = task.frequency + ': ' + task.item;
    taskList.append(li);
  }
}
function build() {
  output.value = ['Maintenance Checklist', '', ...tasks.map((task, index) => (index + 1) + '. [ ] ' + task.item + ' (' + task.frequency + ')')].join(String.fromCharCode(10));
}
document.querySelector('#add-button').addEventListener('click', () => {
  if (taskInput.value.trim()) tasks.push({ item: taskInput.value.trim(), frequency: frequencyInput.value });
  renderTasks();
  build();
});
document.querySelector('#build-button').addEventListener('click', build);
document.querySelector('#copy-button').addEventListener('click', async () => { if (!output.value) build(); await navigator.clipboard.writeText(output.value); });
renderTasks();
build();
</script>`, "<textarea rows=\"8\" readonly>Checklist text output</textarea>", [
    { question: "Does this require an account?", answer: "No. The checklist generator runs in your browser." },
    { question: "Can I copy the output?", answer: "Yes. Use the Copy button after generating the checklist." },
  ]);
}

function clientChecklistPhp(tool) {
  const labels = {
    en: {
      item: "Client document or task",
      frequency: "Repeat cadence",
      add: "Add item",
      build: "Build checklist",
      copy: "Copy follow-up",
      help: "Add repeat client tasks or documents, then generate a reusable checklist and follow-up message.",
      explanation: "This browser-only tool helps small professional services teams standardize recurring client intake, document collection, and follow-up without connecting to internal systems."
    },
    ja: {
      item: "クライアント書類/タスク",
      frequency: "繰り返し頻度",
      add: "項目を追加",
      build: "チェックリスト生成",
      copy: "フォロー文をコピー",
      help: "繰り返し使うクライアント対応項目を追加し、チェックリストとフォロー文を生成します。",
      explanation: "社内システム連携なしで、クライアント受付、書類回収、フォローアップを標準化するブラウザ完結ツールです。"
    }
  };
  return pageShell(tool, labels, `<label for="task-input">{\$labels['item']}</label>
<input id="task-input" value="Request signed engagement letter">
<label for="freq-input">{\$labels['frequency']}</label>
<input id="freq-input" value="Every new client">
<div class="actions">
  <button id="add-task" type="button">{\$labels['add']}</button>
  <button id="build-list" type="button">{\$labels['build']}</button>
  <button id="copy-list" type="button">{\$labels['copy']}</button>
</div>
<p id="status" class="inline-help">{\$labels['help']}</p>
<textarea id="output" rows="14" readonly></textarea>
<script>
const tasks = [{ item: 'Request signed engagement letter', frequency: 'Every new client' }];
const itemInput = document.querySelector('#task-input');
const freqInput = document.querySelector('#freq-input');
const output = document.querySelector('#output');
const statusEl = document.querySelector('#status');
function build() {
  output.value = ['Client workflow checklist', '', ...tasks.map((task, index) => (index + 1) + '. [ ] ' + task.item + ' — ' + task.frequency), '', 'Follow-up message:', 'Hi, I am missing the items checked above. Please send them when convenient so I can keep the work moving.'].join(String.fromCharCode(10));
  statusEl.textContent = tasks.length + ' checklist items ready.';
}
document.querySelector('#add-task').addEventListener('click', () => {
  const item = itemInput.value.trim();
  if (item) tasks.push({ item, frequency: freqInput.value.trim() || 'As needed' });
  build();
});
document.querySelector('#build-list').addEventListener('click', build);
document.querySelector('#copy-list').addEventListener('click', async () => {
  if (!output.value) build();
  await navigator.clipboard.writeText(output.value);
  statusEl.textContent = 'Copied.';
});
build();
</script>`, '<textarea rows="8" readonly>Reusable client checklist and follow-up message</textarea>', [
    { question: "Does this connect to my CRM or client files?", answer: "No. It runs in the browser and does not connect to internal systems." },
    { question: "Can I reuse it every month or for every client?", answer: "Yes. It is designed for repeat client intake and document collection workflows." }
  ]);
}

function quoteCalculatorPhp(tool) {
  const labels = {
    en: {
      help: "Calculate a repeatable quote, retainer, or change order summary without a spreadsheet.",
      explanation: "This calculator helps small service businesses price repeat work, show clear line items, and copy a client-ready quote. It runs in the browser without uploading client data.",
      client: "Client",
      item: "Line item",
      quantity: "Quantity",
      rate: "Rate",
      margin: "Margin %",
      add: "Add line",
      build: "Calculate",
      copy: "Copy quote"
    },
    ja: {
      help: "見積、リテイナー、変更依頼の金額をブラウザ内で計算します。",
      explanation: "小規模事業者向けに、明細、マージン、合計額、クライアント向け文面を生成します。データはアップロードされません。",
      client: "クライアント",
      item: "明細",
      quantity: "数量",
      rate: "単価",
      margin: "マージン %",
      add: "明細を追加",
      build: "計算",
      copy: "見積をコピー"
    }
  };
  return pageShell(tool, labels, `<label for="client-input">{\$labels['client']}</label>
<input id="client-input" value="Acme LLC">
<label for="item-input">{\$labels['item']}</label>
<input id="item-input" value="Monthly support retainer">
<label for="qty-input">{\$labels['quantity']}</label>
<input id="qty-input" type="number" min="0" step="0.01" value="10">
<label for="rate-input">{\$labels['rate']}</label>
<input id="rate-input" type="number" min="0" step="0.01" value="125">
<label for="margin-input">{\$labels['margin']}</label>
<input id="margin-input" type="number" min="0" step="0.01" value="20">
<div class="actions">
  <button id="add-line" type="button">{\$labels['add']}</button>
  <button id="build-quote" type="button">{\$labels['build']}</button>
  <button id="copy-quote" type="button">{\$labels['copy']}</button>
</div>
<p id="status" class="inline-help">{\$labels['help']}</p>
<textarea id="output" rows="14" readonly></textarea>
<script>
const lines = [{ item: 'Monthly support retainer', quantity: 10, rate: 125 }];
const inputs = {
  client: document.querySelector('#client-input'),
  item: document.querySelector('#item-input'),
  quantity: document.querySelector('#qty-input'),
  rate: document.querySelector('#rate-input'),
  margin: document.querySelector('#margin-input')
};
const output = document.querySelector('#output');
const statusEl = document.querySelector('#status');
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
function numberValue(input) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : 0;
}
function build() {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.rate, 0);
  const margin = subtotal * numberValue(inputs.margin) / 100;
  const total = subtotal + margin;
  output.value = ['Quote summary', 'Client: ' + (inputs.client.value.trim() || '[Client]'), '', ...lines.map((line, index) => (index + 1) + '. ' + line.item + ': ' + line.quantity + ' x ' + money.format(line.rate) + ' = ' + money.format(line.quantity * line.rate)), '', 'Subtotal: ' + money.format(subtotal), 'Margin: ' + money.format(margin), 'Total: ' + money.format(total)].join(String.fromCharCode(10));
  statusEl.textContent = 'Quote ready.';
}
document.querySelector('#add-line').addEventListener('click', () => {
  const item = inputs.item.value.trim();
  if (item) lines.push({ item, quantity: numberValue(inputs.quantity), rate: numberValue(inputs.rate) });
  build();
});
document.querySelector('#build-quote').addEventListener('click', build);
document.querySelector('#copy-quote').addEventListener('click', async () => {
  if (!output.value) build();
  await navigator.clipboard.writeText(output.value);
  statusEl.textContent = 'Copied.';
});
for (const input of Object.values(inputs)) input.addEventListener('input', build);
build();
</script>`, '<textarea rows="8" readonly>Client-ready quote summary with margin and total</textarea>', [
    { question: "Is this connected to accounting software?", answer: "No. It is a browser-only quote calculator for quick repeat estimates." },
    { question: "Is it meant for recurring work?", answer: "Yes. It is designed for quotes, retainers, and change orders that small service businesses repeat often." }
  ]);
}
function jsonFormatterPhp(tool) {
  const labels = {
    en: { help: "Paste JSON, format it, and copy clean output.", explanation: "This tool formats JSON and reports parsing errors without uploading data.", format: "Format JSON", copy: "Copy" },
    ja: { help: "JSONを貼り付けて整形し、コピーできます。", explanation: "JSONを整形し、構文エラーを表示します。データはアップロードされません。", format: "JSON整形", copy: "コピー" }
  };
  return pageShell(tool, labels, `<textarea id="input" rows="10">{ "name": "Ada", "active": true }</textarea>
<div class="actions"><button id="format" type="button">{\$labels['format']}</button><button id="copy" type="button">{\$labels['copy']}</button></div>
<p id="status" class="inline-help"></p><textarea id="output" rows="14" readonly></textarea>
<script>
const input = document.querySelector('#input');
const output = document.querySelector('#output');
const status = document.querySelector('#status');
function formatJson() {
  try {
    output.value = JSON.stringify(JSON.parse(input.value), null, 2);
    status.textContent = 'JSON formatted.';
  } catch (error) {
    status.textContent = error.message;
  }
}
document.querySelector('#format').addEventListener('click', formatJson);
document.querySelector('#copy').addEventListener('click', async () => { if (!output.value) formatJson(); await navigator.clipboard.writeText(output.value); });
formatJson();
</script>`, "<textarea rows=\"8\" readonly>Formatted JSON output</textarea>", [
    { question: "Is JSON uploaded?", answer: "No. Formatting runs in the browser." },
  ]);
}

function contractTemplatePhp(tool) {
  const labels = {
    en: {
      client: "Client name",
      contractor: "Contractor name",
      scope: "Project scope",
      fee: "Fee",
      deadline: "Deadline",
      build: "Build contract draft",
      copy: "Copy",
      help: "Fill the fields to generate a plain-English freelance contract draft. This is not legal advice.",
      explanation: "Create a structured draft covering scope, fees, deadlines, revisions, and ownership. Have a qualified professional review important contracts."
    },
    ja: {
      client: "クライアント名",
      contractor: "受託者名",
      scope: "業務範囲",
      fee: "報酬",
      deadline: "納期",
      build: "契約書たたき台を生成",
      copy: "コピー",
      help: "項目を入力すると、プレーン英語のフリーランス契約書たたき台を生成します。法的助言ではありません。",
      explanation: "スコープ、報酬、納期、修正回数、成果物の権利を整理した契約書ドラフトを作ります。"
    }
  };
  return pageShell(tool, labels, `<label for="client">{\$labels['client']}</label>
<input id="client" value="Acme LLC">
<label for="contractor">{\$labels['contractor']}</label>
<input id="contractor" value="Jordan Smith">
<label for="scope">{\$labels['scope']}</label>
<textarea id="scope" rows="4">Design and deliver a landing page.</textarea>
<label for="fee">{\$labels['fee']}</label>
<input id="fee" value="$1,500 fixed fee">
<label for="deadline">{\$labels['deadline']}</label>
<input id="deadline" value="August 30, 2026">
<div class="actions"><button id="build-contract" type="button">{\$labels['build']}</button><button id="copy-contract" type="button">{\$labels['copy']}</button></div>
<p id="contract-status" class="inline-help">{\$labels['help']}</p>
<textarea id="contract-output" rows="18" readonly></textarea>
<script>
const fields = { client: document.querySelector('#client'), contractor: document.querySelector('#contractor'), scope: document.querySelector('#scope'), fee: document.querySelector('#fee'), deadline: document.querySelector('#deadline') };
const output = document.querySelector('#contract-output');
const statusEl = document.querySelector('#contract-status');
function buildContract() {
  output.value = ['Freelance Services Agreement Draft', '', 'Client: ' + fields.client.value, 'Contractor: ' + fields.contractor.value, '', '1. Scope of Work', fields.scope.value, '', '2. Fee', fields.fee.value, '', '3. Deadline', fields.deadline.value, '', 'Review note: This generated draft is not legal advice.'].join(String.fromCharCode(10));
  statusEl.textContent = 'Contract draft generated.';
}
document.querySelector('#build-contract').addEventListener('click', buildContract);
document.querySelector('#copy-contract').addEventListener('click', async () => { if (!output.value) buildContract(); await navigator.clipboard.writeText(output.value); });
for (const element of Object.values(fields)) element.addEventListener('input', buildContract);
buildContract();
</script>`, "<textarea rows=\"8\" readonly>Contract draft output</textarea>", [
    { question: "Is this legal advice?", answer: "No. It is a drafting helper. Have important contracts reviewed by a qualified professional." },
    { question: "Does this require an account?", answer: "No. The draft generator runs in your browser." },
  ]);
}

function invoiceCalculatorPhp(tool) {
  const labels = {
    en: {
      client: "Client name",
      invoice: "Invoice number",
      item: "Line item",
      quantity: "Quantity",
      rate: "Rate",
      tax: "Tax %",
      add: "Add line item",
      build: "Calculate invoice",
      copy: "Copy summary",
      help: "Add invoice line items, quantity, rate, and tax to calculate totals in your browser.",
      explanation: "This calculator helps freelancers prepare invoice totals before sending an invoice. It totals line items, applies tax, and creates a copy-ready summary."
    },
    ja: {
      client: "クライアント名",
      invoice: "請求書番号",
      item: "明細項目",
      quantity: "数量",
      rate: "単価",
      tax: "税率 %",
      add: "明細を追加",
      build: "請求額を計算",
      copy: "概要をコピー",
      help: "請求明細、数量、単価、税率を入力して、ブラウザ内で合計額を計算します。",
      explanation: "フリーランス向けに、請求書送付前の明細合計、税額、総額を計算し、コピーしやすい概要を作成します。"
    }
  };
  return pageShell(tool, labels, `<label for="client-input">{\$labels['client']}</label>
<input id="client-input" value="Acme LLC">
<label for="invoice-input">{\$labels['invoice']}</label>
<input id="invoice-input" value="INV-1001">
<div class="tool-layout">
  <div>
    <label for="item-input">{\$labels['item']}</label>
    <input id="item-input" value="Landing page design">
  </div>
  <div>
    <label for="quantity-input">{\$labels['quantity']}</label>
    <input id="quantity-input" type="number" min="0" step="0.01" value="1">
  </div>
  <div>
    <label for="rate-input">{\$labels['rate']}</label>
    <input id="rate-input" type="number" min="0" step="0.01" value="1500">
  </div>
</div>
<label for="tax-input">{\$labels['tax']}</label>
<input id="tax-input" type="number" min="0" step="0.01" value="0">
<div class="actions"><button id="add-line" type="button">{\$labels['add']}</button><button id="calculate-invoice" type="button">{\$labels['build']}</button><button id="copy-invoice" type="button">{\$labels['copy']}</button></div>
<p id="invoice-status" class="inline-help">{\$labels['help']}</p>
<table id="invoice-lines"><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead><tbody></tbody></table>
<textarea id="invoice-output" rows="14" readonly></textarea>
<script>
const lines = [{ item: 'Landing page design', quantity: 1, rate: 1500 }];
const inputs = {
  client: document.querySelector('#client-input'),
  invoice: document.querySelector('#invoice-input'),
  item: document.querySelector('#item-input'),
  quantity: document.querySelector('#quantity-input'),
  rate: document.querySelector('#rate-input'),
  tax: document.querySelector('#tax-input')
};
const tbody = document.querySelector('#invoice-lines tbody');
const output = document.querySelector('#invoice-output');
const statusEl = document.querySelector('#invoice-status');
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
function numberValue(input) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : 0;
}
function renderLines() {
  tbody.replaceChildren();
  for (const line of lines) {
    const row = document.createElement('tr');
    const total = line.quantity * line.rate;
    for (const value of [line.item, String(line.quantity), money.format(line.rate), money.format(total)]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    tbody.append(row);
  }
}
function calculateInvoice() {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.rate, 0);
  const taxRate = numberValue(inputs.tax);
  const tax = subtotal * taxRate / 100;
  const total = subtotal + tax;
  output.value = [
    'Invoice summary',
    'Client: ' + (inputs.client.value.trim() || '[Client]'),
    'Invoice: ' + (inputs.invoice.value.trim() || '[Invoice number]'),
    '',
    'Subtotal: ' + money.format(subtotal),
    'Tax (' + taxRate + '%): ' + money.format(tax),
    'Total: ' + money.format(total),
    '',
    'Line items:',
    ...lines.map((line, index) => (index + 1) + '. ' + line.item + ' - ' + line.quantity + ' x ' + money.format(line.rate) + ' = ' + money.format(line.quantity * line.rate))
  ].join(String.fromCharCode(10));
  statusEl.textContent = 'Invoice total calculated.';
}
document.querySelector('#add-line').addEventListener('click', () => {
  const item = inputs.item.value.trim();
  if (item) lines.push({ item, quantity: numberValue(inputs.quantity), rate: numberValue(inputs.rate) });
  renderLines();
  calculateInvoice();
});
document.querySelector('#calculate-invoice').addEventListener('click', calculateInvoice);
document.querySelector('#copy-invoice').addEventListener('click', async () => { if (!output.value) calculateInvoice(); await navigator.clipboard.writeText(output.value); });
for (const input of Object.values(inputs)) input.addEventListener('input', calculateInvoice);
renderLines();
calculateInvoice();
</script>`, "<textarea rows=\"8\" readonly>Invoice subtotal, tax, total, and line item summary</textarea>", [
    { question: "Does this create a final legal invoice?", answer: "No. It calculates invoice totals and creates a copy-ready summary you can paste into your invoice system." },
    { question: "Is data uploaded?", answer: "No. The calculation runs in your browser." },
  ]);
}

function regexBuilderPhp(tool) {
  return jsonFormatterPhp(tool);
}

function screenshotChecklistPhp(tool) {
  return maintenanceChecklistPhp(tool);
}

function validateGeneratedTool(generated, existingSlugs) {
  if (existingSlugs.has(generated.tool.slug)) throw new Error(`duplicate slug: ${generated.tool.slug}`);
  if (!generated.php.includes("render_tool_page")) throw new Error("missing render_tool_page");
  if (!generated.php.includes("addEventListener")) throw new Error("missing implemented browser logic");
  if (!generated.php.includes("FAQ") && !generated.php.includes("'faq'")) throw new Error("missing FAQ");
  if (/\b(fetch|XMLHttpRequest|sendBeacon)\s*\(/.test(generated.php)) {
    throw new Error("privacy check failed: generated tool sends browser data over the network");
  }
  if (/method=["']?post|action=["']?\/api/i.test(generated.php)) {
    throw new Error("privacy check failed: generated tool includes a form post");
  }
  if (/contract/i.test(generated.tool.target_keyword) && /Maintenance Checklist|maintenance checklist/i.test(generated.php)) {
    throw new Error("quality check failed: contract candidate contains maintenance checklist implementation");
  }
  if (/invoice/i.test(generated.tool.target_keyword) && /Maintenance Checklist|maintenance checklist/i.test(generated.php)) {
    throw new Error("quality check failed: invoice candidate contains maintenance checklist implementation");
  }
}

async function writeToolFiles(generated) {
  const phpPath = join(root, "php-app", "tools", `${generated.tool.slug}.php`);
  const indexPath = join(root, "php-app", "tools", generated.tool.slug, "index.php");
  await mkdir(dirname(indexPath), { recursive: true });
  await writeFile(phpPath, generated.php);
  await writeFile(indexPath, `<?php\nrequire_once __DIR__ . '/../${generated.tool.slug}.php';\n`);
  await updateRegistry(generated.tool);
}

async function updateRegistry(tool) {
  const registryPath = join(root, "php-app", "tools", "registry.php");
  let tools = [];
  try {
    const source = await readFile(registryPath, "utf8");
    const matches = [...source.matchAll(/'slug' => '([^']+)'[\s\S]*?'name' => '([^']+)'[\s\S]*?'description' => '([^']+)'[\s\S]*?'category' => '([^']+)'[\s\S]*?'target_keyword' => '([^']+)'[\s\S]*?'logo_color' => '([^']+)'[\s\S]*?'pricing_model' => '([^']+)'/g)];
    tools = matches.map((match) => ({
      slug: match[1],
      name: match[2],
      description: match[3],
      category: match[4],
      target_keyword: match[5],
      logo_color: match[6],
      pricing_model: match[7]
    }));
  } catch {
    tools = [];
  }
  const bySlug = new Map(tools.map((item) => [item.slug, item]));
  bySlug.set(tool.slug, {
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    target_keyword: tool.target_keyword,
    logo_color: tool.logo_color,
    pricing_model: tool.pricing_model
  });
  const body = [...bySlug.values()].map((item) => `    [
        'slug' => ${phpString(item.slug)},
        'name' => ${phpString(item.name)},
        'description' => ${phpString(item.description)},
        'category' => ${phpString(item.category)},
        'target_keyword' => ${phpString(item.target_keyword)},
        'logo_color' => ${phpString(item.logo_color)},
        'pricing_model' => ${phpString(item.pricing_model)},
    ],`).join("\n");
  await writeFile(registryPath, `<?php\nreturn [\n${body}\n];\n`);
}

async function logRun(result) {
  const path = await writeJson("latest-log.json", result);
  return runJson(phpBin, ["scripts/automation-db.php", "log-run", path]);
}

function refreshSeoFiles({ upload = false } = {}) {
  const args = ["scripts/generate-seo-files.php"];
  if (upload) args.push("--upload");
  return runJson(phpBin, args);
}

function categoryFor(kind) {
  if (kind.includes("json") || kind.includes("regex")) return "data";
  if (kind.includes("invoice") || kind.includes("contract")) return "documents";
  if (kind.includes("screenshot")) return "images";
  return "workflow";
}

function pricingFor(kind) {
  return kind.includes("invoice") ? "subscription" : "ads";
}

function colorFor(category) {
  return { data: "#145A32", documents: "#12355B", images: "#9A4D00", workflow: "#7B241C" }[category] ?? "#1F3A5F";
}

function descriptionFor(kind, differentiationPoints = []) {
  const base = (() => {
    if (kind === "maintenance-checklist") return "Generate a clean maintenance checklist from task names and frequencies, then copy it into your workflow.";
    if (kind === "json-formatter") return "Format pasted JSON, catch syntax errors, and copy clean output without uploading data.";
    if (kind === "invoice") return "Calculate invoice line item totals and copy a clean summary.";
    return "Generate a focused browser-based output for a common business workflow.";
  })();
  if (differentiationPoints.length === 0) return base;
  return `${base} Built to address common competitor complaints: ${differentiationPoints.slice(0, 2).join(" ")}`;
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function titleCase(value) {
  return String(value).replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

function phpString(value) {
  return JSON.stringify(String(value));
}

function phpArray(value) {
  if (Array.isArray(value)) {
    return "[" + value.map(phpArray).join(", ") + "]";
  }
  if (value && typeof value === "object") {
    return "[" + Object.entries(value).map(([key, val]) => `${phpString(key)} => ${phpArray(val)}`).join(", ") + "]";
  }
  if (value === null) return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return phpString(value);
}
