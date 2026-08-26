<?php

require_once __DIR__ . '/../inc/template.php';

$tool = [
    'slug' => 'csv-to-json-converter',
    'name' => 'CSV to JSON Converter',
    'description' => 'Convert pasted CSV into formatted JSON, infer basic field types, and copy export-ready output.',
    'category' => 'data',
    'target_keyword' => 'csv to json converter',
    'logo_color' => '#145A32',
];

$lang = current_lang();
$isJa = $lang === 'ja';

$labels = $isJa ? [
    'input' => 'CSVを貼り付け',
    'placeholder' => "name,email,active\nAda,ada@example.com,true\nGrace,grace@example.com,false",
    'convert' => 'JSONに変換',
    'copy' => 'コピー',
    'sample' => 'サンプルを入れる',
    'array' => 'JSON配列',
    'records' => 'レコード数',
    'help' => '1行目をヘッダーとして扱います。数値、true/false、空欄を自動で型変換します。',
] : [
    'input' => 'Paste CSV',
    'placeholder' => "name,email,active\nAda,ada@example.com,true\nGrace,grace@example.com,false",
    'convert' => 'Convert to JSON',
    'copy' => 'Copy',
    'sample' => 'Load sample',
    'array' => 'JSON array',
    'records' => 'records',
    'help' => 'The first row is treated as headers. Numbers, true/false, and blank cells are converted automatically.',
];

$toolHtml = <<<HTML
<label for="csv-input">{$labels['input']}</label>
<textarea id="csv-input" rows="10" placeholder="{$labels['placeholder']}"></textarea>
<div class="actions">
  <button id="convert-button" type="button">{$labels['convert']}</button>
  <button id="copy-button" type="button">{$labels['copy']}</button>
  <button id="sample-button" type="button">{$labels['sample']}</button>
</div>
<p id="csv-status" class="inline-help">{$labels['help']}</p>
<label for="json-output">{$labels['array']}</label>
<textarea id="json-output" rows="14" readonly></textarea>
<script>
const csvInput = document.querySelector('#csv-input');
const jsonOutput = document.querySelector('#json-output');
const statusEl = document.querySelector('#csv-status');
const sample = `name,email,active,monthly_spend
Ada Lovelace,ada@example.com,true,120
Grace Hopper,grace@example.com,false,85.5`;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted && char === '"' && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ',') {
      row.push(cell);
      cell = '';
    } else if (!quoted && (char === '\\n' || char === '\\r')) {
      if (char === '\\r' && next === '\\n') i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  return rows;
}

function normalizeValue(value) {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === 'true';
  if (/^-?\\d+(?:\\.\\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function convert() {
  const rows = parseCsv(csvInput.value);
  if (rows.length < 2) {
    jsonOutput.value = '[]';
    statusEl.textContent = 'Add a header row and at least one data row.';
    return;
  }
  const headers = rows[0].map((header, index) => header.trim() || `column_\${index + 1}`);
  const records = rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, normalizeValue(row[index] || '')])));
  jsonOutput.value = JSON.stringify(records, null, 2);
  statusEl.textContent = `\${records.length} {$labels['records']} converted.`;
}

document.querySelector('#convert-button').addEventListener('click', convert);
document.querySelector('#copy-button').addEventListener('click', async () => {
  if (!jsonOutput.value) convert();
  await navigator.clipboard.writeText(jsonOutput.value);
  statusEl.textContent = 'Copied JSON.';
});
document.querySelector('#sample-button').addEventListener('click', () => {
  csvInput.value = sample;
  convert();
});
csvInput.value = sample;
convert();
</script>
HTML;

$codeHtml = '<textarea rows="9" readonly>{
  "input": "CSV text",
  "output": "JSON array",
  "runsInBrowser": true
}</textarea>';

render_tool_page($tool, [
    'seo_title' => [
        'en' => 'CSV to JSON Converter | Free Online Tool',
        'ja' => 'CSV to JSON Converter | 無料オンライン変換ツール',
    ],
    'seo_description' => [
        'en' => 'Convert CSV to JSON online. Paste CSV, infer basic types, format JSON, and copy export-ready output without installing software.',
        'ja' => 'CSVをJSONにオンライン変換します。CSVを貼り付けるだけで、基本型を推定し、整形済みJSONをコピーできます。',
    ],
    'h1' => [
        'en' => 'CSV to JSON Converter',
        'ja' => 'CSV to JSON Converter',
    ],
    'inline_help' => [
        'en' => 'Paste CSV with a header row, then convert it into formatted JSON in your browser.',
        'ja' => 'ヘッダー行つきCSVを貼り付けると、ブラウザ内で整形済みJSONに変換します。',
    ],
    'explanation' => [
        'en' => 'This tool converts CSV rows into a JSON array. It handles quoted cells, commas inside quotes, blank values, numbers, and booleans. Processing happens in the browser.',
        'ja' => 'このツールはCSV行をJSON配列に変換します。引用符つきセル、引用符内のカンマ、空欄、数値、真偽値に対応し、処理はブラウザ内で完結します。',
    ],
    'tool_html' => $toolHtml,
    'code_html' => $codeHtml,
    'faq' => [
        [
            'question' => $isJa ? 'データはサーバーに送信されますか?' : 'Is my data uploaded?',
            'answer' => $isJa ? 'いいえ。変換はブラウザ内のJavaScriptで実行されます。' : 'No. Conversion runs in your browser with JavaScript.',
        ],
        [
            'question' => $isJa ? '1行目は何として扱われますか?' : 'How is the first row used?',
            'answer' => $isJa ? '1行目はJSONオブジェクトのキー名として扱います。' : 'The first row becomes the JSON object keys.',
        ],
    ],
]);
