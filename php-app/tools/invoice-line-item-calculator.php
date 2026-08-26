<?php

require_once __DIR__ . '/../inc/template.php';

$tool = [
    'slug' => 'invoice-line-item-calculator',
    'name' => 'Invoice Line Item Calculator',
    'description' => 'Calculate invoice line item totals and copy a clean summary.',
    'category' => 'documents',
    'target_keyword' => 'invoice generator for freelancers',
    'logo_color' => '#12355B',
    'pricing_model' => 'subscription',
    'price_amount_cents' => null,
    'price_currency' => 'usd',
    'price_interval' => 'one_time',
    'price_id' => null,
    'stripe_price_id' => null,
    'stripe_product_id' => null,
];

$lang = current_lang();
$isJa = $lang === 'ja';
$labels = $isJa ? [
    'client' => 'クライアント名',
    'invoice' => '請求書番号',
    'item' => '明細項目',
    'quantity' => '数量',
    'rate' => '単価',
    'tax' => '税率 %',
    'add' => '明細を追加',
    'build' => '請求額を計算',
    'copy' => '概要をコピー',
    'help' => '請求明細、数量、単価、税率を入力して、ブラウザ内で合計額を計算します。',
    'explanation' => 'フリーランス向けに、請求書送付前の明細合計、税額、総額を計算し、コピーしやすい概要を作成します。',
] : [
    'client' => 'Client name',
    'invoice' => 'Invoice number',
    'item' => 'Line item',
    'quantity' => 'Quantity',
    'rate' => 'Rate',
    'tax' => 'Tax %',
    'add' => 'Add line item',
    'build' => 'Calculate invoice',
    'copy' => 'Copy summary',
    'help' => 'Add invoice line items, quantity, rate, and tax to calculate totals in your browser.',
    'explanation' => 'This calculator helps freelancers prepare invoice totals before sending an invoice. It totals line items, applies tax, and creates a copy-ready summary.',
];

$toolHtml = <<<HTML
<label for="client-input">{$labels['client']}</label>
<input id="client-input" value="Acme LLC">
<label for="invoice-input">{$labels['invoice']}</label>
<input id="invoice-input" value="INV-1001">
<div class="tool-layout">
  <div>
    <label for="item-input">{$labels['item']}</label>
    <input id="item-input" value="Landing page design">
  </div>
  <div>
    <label for="quantity-input">{$labels['quantity']}</label>
    <input id="quantity-input" type="number" min="0" step="0.01" value="1">
  </div>
  <div>
    <label for="rate-input">{$labels['rate']}</label>
    <input id="rate-input" type="number" min="0" step="0.01" value="1500">
  </div>
</div>
<label for="tax-input">{$labels['tax']}</label>
<input id="tax-input" type="number" min="0" step="0.01" value="0">
<div class="actions">
  <button id="add-line" type="button">{$labels['add']}</button>
  <button id="calculate-invoice" type="button">{$labels['build']}</button>
  <button id="copy-invoice" type="button">{$labels['copy']}</button>
</div>
<p id="invoice-status" class="inline-help">{$labels['help']}</p>
<table id="invoice-lines">
  <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
  <tbody></tbody>
</table>
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
  ].join('\\n');
  statusEl.textContent = 'Invoice total calculated.';
}

document.querySelector('#add-line').addEventListener('click', () => {
  const item = inputs.item.value.trim();
  if (item) lines.push({ item, quantity: numberValue(inputs.quantity), rate: numberValue(inputs.rate) });
  renderLines();
  calculateInvoice();
});
document.querySelector('#calculate-invoice').addEventListener('click', calculateInvoice);
document.querySelector('#copy-invoice').addEventListener('click', async () => {
  if (!output.value) calculateInvoice();
  await navigator.clipboard.writeText(output.value);
});
for (const input of Object.values(inputs)) input.addEventListener('input', calculateInvoice);
renderLines();
calculateInvoice();
</script>
HTML;

$codeHtml = '<textarea rows="8" readonly>Invoice subtotal, tax, total, and line item summary</textarea>';

render_tool_page($tool, [
    'seo_title' => [
        'en' => 'Invoice Generator For Freelancers | Free Online Tool',
        'ja' => 'Invoice Line Item Calculator | 無料オンラインツール',
    ],
    'seo_description' => [
        'en' => 'Calculate invoice line item totals, tax, and a copy-ready invoice summary for freelance work.',
        'ja' => 'フリーランス業務向けに、請求明細の小計、税額、総額、コピーしやすい概要を計算します。',
    ],
    'h1' => ['en' => 'Invoice Generator For Freelancers', 'ja' => 'Invoice Line Item Calculator'],
    'inline_help' => ['en' => $labels['help'], 'ja' => $labels['help']],
    'explanation' => ['en' => $labels['explanation'], 'ja' => $labels['explanation']],
    'tool_html' => $toolHtml,
    'code_html' => $codeHtml,
    'faq' => [
        ['question' => 'Does this create a final legal invoice?', 'answer' => 'No. It calculates invoice totals and creates a copy-ready summary you can paste into your invoice system.'],
        ['question' => 'Is data uploaded?', 'answer' => 'No. The calculation runs in your browser.'],
    ],
]);
