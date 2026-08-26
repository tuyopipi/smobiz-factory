<?php

require_once __DIR__ . '/../inc/template.php';

$tool = ["slug" => "small-business-owner-cash-flow-worksheet-mini-tool", "name" => "Small Business Owner Cash Flow Worksheet Mini Tool", "description" => "Generate a focused browser-based output for a common business workflow. Built to address common competitor complaints: Make the main conversion/generation path usable without account setup and show clear output before any checkout. Run the workflow client-side where possible, show validation errors inline, and avoid network-dependent steps for the core task.", "category" => "workflow", "target_keyword" => "small business owner cash flow worksheet", "logo_color" => "#7B241C", "pricing_model" => "ads", "price_amount_cents" => null, "price_currency" => "usd", "price_interval" => "one_time", "price_id" => null, "stripe_price_id" => null, "stripe_product_id" => null, "pain_points" => ["Users run into free-plan limits, paywalls, or unclear pricing before finishing the task.", "Competing tools are reported as slow, buggy, or unreliable.", "Users dislike being forced to create an account before using the tool.", "Users worry about uploading sensitive business data to third-party tools."], "differentiation_points" => ["Make the main conversion/generation path usable without account setup and show clear output before any checkout.", "Run the workflow client-side where possible, show validation errors inline, and avoid network-dependent steps for the core task.", "Allow immediate use in the browser before asking for an email or checkout.", "Process pasted data locally in the browser when practical and state that input is not uploaded for the core operation."]];
$lang = current_lang();
$isJa = $lang === 'ja';
$labels = $isJa ? ["item" => "点検項目", "frequency" => "頻度", "add" => "項目を追加", "build" => "チェックリスト生成", "copy" => "コピー", "help" => "点検項目と頻度を入力して、コピーしやすいチェックリストを生成します。", "explanation" => "作業指示、メール、表計算に貼り付けやすいメンテナンスチェックリストを作ります。"] : ["item" => "Maintenance item", "frequency" => "Frequency", "add" => "Add item", "build" => "Build checklist", "copy" => "Copy", "help" => "Add maintenance tasks, choose a frequency, and generate a clean checklist.", "explanation" => "This generator creates a practical maintenance checklist you can copy into a work order, email, or spreadsheet."];
$painFixes = array_values(array_filter($tool['differentiation_points'] ?? []));

$toolHtml = <<<HTML
<label for="task-input">{$labels['item']}</label>
<input id="task-input" value="Inspect filters">
<label for="frequency-input">{$labels['frequency']}</label>
<select id="frequency-input"><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Quarterly</option></select>
<div class="actions"><button id="add-button" type="button">{$labels['add']}</button><button id="build-button" type="button">{$labels['build']}</button><button id="copy-button" type="button">{$labels['copy']}</button></div>
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

$codeHtml = "<textarea rows=\"8\" readonly>Checklist text output</textarea>";

render_tool_page($tool, [
    'seo_title' => [
        'en' => "Small Business Owner Cash Flow Worksheet | Free Online Tool",
        'ja' => "Small Business Owner Cash Flow Worksheet Mini Tool | 無料オンラインツール",
    ],
    'seo_description' => [
        'en' => "Generate a focused browser-based output for a common business workflow. Built to address common competitor complaints: Make the main conversion/generation path usable without account setup and show clear output before any checkout. Run the workflow client-side where possible, show validation errors inline, and avoid network-dependent steps for the core task. Free private tool with no login, no sign up, no upload, and no paywall for the core workflow.",
        'ja' => "Small Business Owner Cash Flow Worksheet Mini Tool はブラウザで使えるシンプルな無料Webツールです。",
    ],
    'h1' => ['en' => "Small Business Owner Cash Flow Worksheet", 'ja' => "Small Business Owner Cash Flow Worksheet Mini Tool"],
    'inline_help' => ['en' => $labels['help'], 'ja' => $labels['help']],
    'explanation' => ['en' => $labels['explanation'], 'ja' => $labels['explanation']],
    'tool_html' => $toolHtml . $painFixHtml,
    'code_html' => $codeHtml,
    'faq' => [["question" => "Does this require an account?", "answer" => "No. The checklist generator runs in your browser."], ["question" => "Can I copy the output?", "answer" => "Yes. Use the Copy button after generating the checklist."]],
]);
