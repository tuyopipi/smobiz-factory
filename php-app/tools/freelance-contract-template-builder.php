<?php

require_once __DIR__ . '/../inc/template.php';

$tool = [
    'slug' => 'freelance-contract-template-builder',
    'name' => 'Freelance Contract Template Builder',
    'description' => 'Build a plain-English freelance contract draft from project scope, fee, deadline, revisions, and ownership choices.',
    'category' => 'documents',
    'target_keyword' => 'contract template generator',
    'logo_color' => '#12355B',
    'pricing_model' => 'ads',
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
    'contractor' => '受託者名',
    'scope' => '業務範囲',
    'fee' => '報酬',
    'deadline' => '納期',
    'revisions' => '修正回数',
    'ownership' => '成果物の権利',
    'build' => '契約書たたき台を生成',
    'copy' => 'コピー',
    'help' => '項目を入力すると、プレーン英語のフリーランス契約書たたき台を生成します。法的助言ではありません。',
    'explanation' => 'スコープ、報酬、納期、修正回数、成果物の権利を整理した契約書ドラフトを作ります。実際の契約前に専門家レビューを推奨します。',
] : [
    'client' => 'Client name',
    'contractor' => 'Contractor name',
    'scope' => 'Project scope',
    'fee' => 'Fee',
    'deadline' => 'Deadline',
    'revisions' => 'Included revisions',
    'ownership' => 'Deliverable ownership',
    'build' => 'Build contract draft',
    'copy' => 'Copy',
    'help' => 'Fill the fields to generate a plain-English freelance contract draft. This is not legal advice.',
    'explanation' => 'Create a structured draft covering scope, fees, deadlines, revisions, and ownership. Have a qualified professional review important contracts.',
];

$toolHtml = <<<HTML
<label for="client">{$labels['client']}</label>
<input id="client" value="Acme LLC">
<label for="contractor">{$labels['contractor']}</label>
<input id="contractor" value="Jordan Smith">
<label for="scope">{$labels['scope']}</label>
<textarea id="scope" rows="4">Design and deliver a landing page, including one homepage layout and responsive CSS.</textarea>
<label for="fee">{$labels['fee']}</label>
<input id="fee" value="$1,500 fixed fee">
<label for="deadline">{$labels['deadline']}</label>
<input id="deadline" value="August 30, 2026">
<label for="revisions">{$labels['revisions']}</label>
<input id="revisions" value="Two rounds of revisions">
<label for="ownership">{$labels['ownership']}</label>
<select id="ownership">
  <option>Client owns final paid deliverables</option>
  <option>Contractor retains reusable methods and pre-existing materials</option>
  <option>Ownership transfers after final payment</option>
</select>
<div class="actions">
  <button id="build-contract" type="button">{$labels['build']}</button>
  <button id="copy-contract" type="button">{$labels['copy']}</button>
</div>
<p id="contract-status" class="inline-help">{$labels['help']}</p>
<textarea id="contract-output" rows="18" readonly></textarea>
<script>
const fields = {
  client: document.querySelector('#client'),
  contractor: document.querySelector('#contractor'),
  scope: document.querySelector('#scope'),
  fee: document.querySelector('#fee'),
  deadline: document.querySelector('#deadline'),
  revisions: document.querySelector('#revisions'),
  ownership: document.querySelector('#ownership')
};
const output = document.querySelector('#contract-output');
const statusEl = document.querySelector('#contract-status');

function buildContract() {
  const client = fields.client.value.trim() || '[Client]';
  const contractor = fields.contractor.value.trim() || '[Contractor]';
  const scope = fields.scope.value.trim() || '[Project scope]';
  const fee = fields.fee.value.trim() || '[Fee]';
  const deadline = fields.deadline.value.trim() || '[Deadline]';
  const revisions = fields.revisions.value.trim() || '[Included revisions]';
  const ownership = fields.ownership.value.trim();
  output.value = [
    'Freelance Services Agreement Draft',
    '',
    `This draft agreement is between \${client} ("Client") and \${contractor} ("Contractor").`,
    '',
    '1. Scope of Work',
    scope,
    '',
    '2. Fee and Payment',
    `Client will pay Contractor: \${fee}. Unless otherwise agreed, payment is due according to the invoice terms stated by Contractor.`,
    '',
    '3. Timeline',
    `The expected delivery deadline is: \${deadline}. Timeline changes should be confirmed in writing by both parties.`,
    '',
    '4. Revisions',
    `\${revisions} are included in the fee. Additional revisions may require a separate quote or written approval.`,
    '',
    '5. Ownership',
    ownership,
    '',
    '6. Independent Contractor',
    'Contractor is an independent contractor and is responsible for their own taxes, tools, and working methods.',
    '',
    '7. Review Note',
    'This generated draft is for planning and communication only. It is not legal advice. Have a qualified professional review important agreements.'
  ].join('\\n');
  statusEl.textContent = 'Contract draft generated.';
}

document.querySelector('#build-contract').addEventListener('click', buildContract);
document.querySelector('#copy-contract').addEventListener('click', async () => {
  if (!output.value) buildContract();
  await navigator.clipboard.writeText(output.value);
  statusEl.textContent = 'Copied contract draft.';
});
for (const element of Object.values(fields)) {
  element.addEventListener('input', buildContract);
}
buildContract();
</script>
HTML;

$codeHtml = '<textarea rows="9" readonly>{
  "type": "contract-draft",
  "fields": ["client", "contractor", "scope", "fee", "deadline", "revisions", "ownership"],
  "legalAdvice": false
}</textarea>';

render_tool_page($tool, [
    'seo_title' => [
        'en' => 'Contract Template Generator | Free Online Tool',
        'ja' => 'Freelance Contract Template Builder | 無料オンラインツール',
    ],
    'seo_description' => [
        'en' => 'Generate a plain-English freelance contract draft from project scope, fee, deadline, revisions, and ownership terms.',
        'ja' => '業務範囲、報酬、納期、修正回数、権利条件からフリーランス契約書のたたき台を生成します。',
    ],
    'h1' => ['en' => 'Contract Template Generator', 'ja' => 'Freelance Contract Template Builder'],
    'inline_help' => ['en' => $labels['help'], 'ja' => $labels['help']],
    'explanation' => ['en' => $labels['explanation'], 'ja' => $labels['explanation']],
    'tool_html' => $toolHtml,
    'code_html' => $codeHtml,
    'faq' => [
        ['question' => 'Is this legal advice?', 'answer' => 'No. It is a drafting helper for a plain-English starting point. Have important contracts reviewed by a qualified professional.'],
        ['question' => 'Does this require an account?', 'answer' => 'No. The draft generator runs in your browser.'],
    ],
]);
