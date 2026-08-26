<?php

require_once __DIR__ . '/../inc/template.php';

$tool = ["slug" => "client-intake-checklist-builder", "name" => "Client Intake Checklist Builder", "description" => "Generate a focused browser-based output for a common business workflow. Built to address common competitor complaints: Make the main conversion/generation path usable without account setup and show clear output before any checkout. Run the workflow client-side where possible, show validation errors inline, and avoid network-dependent steps for the core task.", "category" => "workflow", "target_keyword" => "agency client onboarding checklist", "logo_color" => "#7B241C", "pricing_model" => "ads", "price_amount_cents" => null, "price_currency" => "usd", "price_interval" => "one_time", "price_id" => null, "stripe_price_id" => null, "stripe_product_id" => null, "pain_points" => ["Users run into free-plan limits, paywalls, or unclear pricing before finishing the task.", "Competing tools are reported as slow, buggy, or unreliable.", "Users run into free-plan limits, paywalls, or unclear pricing before finishing the task.", "Competing tools are reported as slow, buggy, or unreliable."], "differentiation_points" => ["Make the main conversion/generation path usable without account setup and show clear output before any checkout.", "Run the workflow client-side where possible, show validation errors inline, and avoid network-dependent steps for the core task.", "Make the main conversion/generation path usable without account setup and show clear output before any checkout.", "Run the workflow client-side where possible, show validation errors inline, and avoid network-dependent steps for the core task."]];
$lang = current_lang();
$isJa = $lang === 'ja';
$labels = $isJa ? ["item" => "クライアント書類/タスク", "frequency" => "繰り返し頻度", "add" => "項目を追加", "build" => "チェックリスト生成", "copy" => "フォロー文をコピー", "help" => "繰り返し使うクライアント対応項目を追加し、チェックリストとフォロー文を生成します。", "explanation" => "社内システム連携なしで、クライアント受付、書類回収、フォローアップを標準化するブラウザ完結ツールです。"] : ["item" => "Client document or task", "frequency" => "Repeat cadence", "add" => "Add item", "build" => "Build checklist", "copy" => "Copy follow-up", "help" => "Add repeat client tasks or documents, then generate a reusable checklist and follow-up message.", "explanation" => "This browser-only tool helps small professional services teams standardize recurring client intake, document collection, and follow-up without connecting to internal systems."];
$painFixes = array_values(array_filter($tool['differentiation_points'] ?? []));

$toolHtml = <<<HTML
<label for="task-input">{$labels['item']}</label>
<input id="task-input" value="Request signed engagement letter">
<label for="freq-input">{$labels['frequency']}</label>
<input id="freq-input" value="Every new client">
<div class="actions">
  <button id="add-task" type="button">{$labels['add']}</button>
  <button id="build-list" type="button">{$labels['build']}</button>
  <button id="copy-list" type="button">{$labels['copy']}</button>
</div>
<p id="status" class="inline-help">{$labels['help']}</p>
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
</script>
HTML;

$painFixHtml = '';
if (count($painFixes) > 0) {
    $items = '';
    foreach ($painFixes as $fix) {
        $items .= '<li>' . h((string) $fix) . '</li>';
    }
    $painFixHtml = '<section class="tool-shell"><h2>Why this is simpler</h2><ul>' . $items . '</ul></section>';
}

$codeHtml = "<textarea rows=\"8\" readonly>Reusable client checklist and follow-up message</textarea>";

render_tool_page($tool, [
    'seo_title' => [
        'en' => "Agency Client Onboarding Checklist | Free Online Tool",
        'ja' => "Client Intake Checklist Builder | 無料オンラインツール",
    ],
    'seo_description' => [
        'en' => "Generate a focused browser-based output for a common business workflow. Built to address common competitor complaints: Make the main conversion/generation path usable without account setup and show clear output before any checkout. Run the workflow client-side where possible, show validation errors inline, and avoid network-dependent steps for the core task. Free private tool with no login, no sign up, no upload, and no paywall for the core workflow.",
        'ja' => "Client Intake Checklist Builder はブラウザで使えるシンプルな無料Webツールです。",
    ],
    'h1' => ['en' => "Agency Client Onboarding Checklist", 'ja' => "Client Intake Checklist Builder"],
    'inline_help' => ['en' => $labels['help'], 'ja' => $labels['help']],
    'explanation' => ['en' => $labels['explanation'], 'ja' => $labels['explanation']],
    'tool_html' => $toolHtml . $painFixHtml,
    'code_html' => $codeHtml,
    'faq' => [["question" => "Does this connect to my CRM or client files?", "answer" => "No. It runs in the browser and does not connect to internal systems."], ["question" => "Can I reuse it every month or for every client?", "answer" => "Yes. It is designed for repeat client intake and document collection workflows."]],
]);
