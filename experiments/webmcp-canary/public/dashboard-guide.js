(function () {
  'use strict';

  // Keep this content data-driven so new articles can be added without changing
  // the dashboard rendering code.
  const GUIDE = {
 "ja": {
  "tab": "ガイド",
  "title": "導入ガイド",
  "intro": "登録からAIに読まれる状態まで、5つのステップで進めます。",
  "steps": [
   [
    "1",
    "サイトを追加",
    "「サイトを追加」を押し、WordPress／その他のサイト／サイトがまだない、から選びます。",
    "sites"
   ],
   [
    "2",
    "種類に合わせて導入",
    "WordPressはプラグインとペアリングコード、その他のサイトはJSON-LD・llms.txt・robots.txtの行を貼り付け、サイトがない場合はホストページのURLを載せます。",
    "guide-install"
   ],
   [
    "3",
    "店舗情報を入力",
    "サイト詳細で名称・住所・電話・営業時間などを入力して保存します。",
    "guide-checklist"
   ],
   [
    "4",
    "診断する",
    "「診断を実行」でAEOスコアと、項目ごとの直し方を確認します。",
    "guide-scan"
   ],
   [
    "5",
    "プランを選ぶ（任意）",
    "Standardで最新の基準に自動で追従します。",
    "guide-payment"
   ]
  ],
  "articles": [
   [
    "guide-install",
    "導入方式の選び方",
    "「サイトを追加」で最初にサイトの種類を選びます。\nWordPress → プラグインを入れ、ペアリングコードで接続します。\nその他のサイト（Wix・STUDIO・ペライチ・自作HTMLなど） → 用意されたJSON-LD・llms.txt・robots.txtの行をサイトに置きます。\nサイトがまだない → Nurevoのホストページ（/s/）を作り、Googleビジネスプロフィールなどに載せます。"
   ],
   [
    "guide-wp",
    "① WordPressプラグイン",
    "手順 1. WordPress管理画面→プラグイン→新規追加で「Nurevo AEO」を検索→インストール→有効化。\n2. ダッシュボードのサイト詳細で「ペアリングコードを発行」。\n3. WordPress管理画面→Nurevo AEO→設定にコードを貼って保存。\n4. 同じ画面で「このサイトのAI向け情報を出力する」がオンになっていることを確認。\n5. 公開ページのソースで application/ld+json と LocalBusiness を確認（キャッシュ系プラグインがあればキャッシュをクリア）。"
   ],
   [
    "guide-tag",
    "② WordPress以外：静的貼り付け",
    "何をするか：完成済みのJSON-LD・llms.txt・robots.txtの行をサイトに直接置きます。HTMLに最初から入るため、JavaScriptを実行しないAIクローラーにも届きます。\n手順 1. サイト詳細の「JSON-LD」をコピーし、<head>に直接貼付け（Wix/STUDIO/ペライチ等はカスタムコードの<head>欄）。GTM経由は不可。\n2. 「llms.txt」をコピーし、サイトのルートにllms.txtとしてアップロード。\n3. 「robots.txt に追記する行」をrobots.txtに追記（AI検索クローラーのみ許可。学習用クローラーの設定は変えません）。\n4. 公開し、ソースでapplication/ld+jsonを確認。\n5. 店舗情報を変えたら、JSON-LDとllms.txtをコピーし直して貼り替え（静的なので自動更新されません）。\n※JSタグ（tag.js）/GTMはブラウザでJavaScriptが動くときだけ働きます。計測とJavaScriptを実行するブラウザ／AIエージェント向けの補助用で、JavaScriptを実行しないクローラーには届きません。"
   ],
   [
    "guide-hosted",
    "③ ホストページ /s/",
    "何をするか：Nurevoがschema入りの店専用ページを生成します。インストール不要です。\n手順 1. サイト詳細のNurevoホストURLをコピー。\n2. Googleビジネスプロフィールの「ウェブサイト」欄に貼付け。\n3. Instagramプロフィールのウェブサイト欄に貼付け。\n4. URLを開いて店情報を確認。"
   ],
   [
    "guide-checklist",
    "店舗情報の入力",
    "サイト詳細のフォームで名称・住所・電話・営業時間・業種などを入力して保存します。WordPressの場合はプラグインからも同期されます。AIに渡すのは入力した実際の情報だけです。"
   ],
   [
    "guide-scan",
    "診断とスキャン",
    "サイト詳細の「診断を実行」で、AEOスコアと診断項目が表示されます。各項目には直し方が書かれています（どのプランでも見られます）。優先順位つきの修正リストはProの機能です。「スキャン（無料）」は、HTMLにタグとschemaが入っているかだけを確認します。"
   ],
   [
    "guide-member",
    "メンバー登録の手順",
    "招待URLからメールアドレスと役割（店舗・個人紹介者・代理店）を登録します。登録後は管理者の承認待ちとなります。"
   ]
  ]
 },
 "en": {
  "tab": "Guide",
  "title": "Getting started",
  "intro": "Five steps from adding a site to information AI can read.",
  "steps": [
   [
    "1",
    "Add a site",
    "Press \"Add a site\" and choose WordPress, Other website or No website yet.",
    "sites"
   ],
   [
    "2",
    "Set it up for its type",
    "WordPress: the plugin and a pairing code. Other websites: paste the JSON-LD, llms.txt and robots.txt lines. No website: list the hosted page URL.",
    "guide-install"
   ],
   [
    "3",
    "Fill in the store info",
    "Enter the name, address, phone, hours and so on on the site page and save.",
    "guide-checklist"
   ],
   [
    "4",
    "Run a diagnosis",
    "\"Run a diagnosis\" shows the AEO score and how to fix each item.",
    "guide-scan"
   ],
   [
    "5",
    "Choose a plan (optional)",
    "Standard keeps up with the latest criteria automatically.",
    "guide-payment"
   ]
  ],
  "articles": [
   [
    "guide-install",
    "Choosing how to set up",
    "\"Add a site\" starts by asking which site it is.\nWordPress → install the plugin and connect it with a pairing code.\nOther website (Wix, STUDIO, Squarespace, hand-written HTML…) → put the prepared JSON-LD, llms.txt and robots.txt lines on the site.\nNo website yet → Nurevo creates a hosted page (/s/) to list on Google Business Profile and similar."
   ],
   [
    "guide-wp",
    "WordPress plugin",
    "1. WordPress admin → Plugins → Add New, search for \"Nurevo AEO\" → Install → Activate.\n2. On the site page in this dashboard, press \"Issue a pairing code\".\n3. Paste the code into Nurevo AEO → Settings in WordPress admin and save.\n4. On the same screen, make sure \"Output AI-facing information for this site\" is ON.\n5. View the source of a public page and look for LocalBusiness in application/ld+json (clear the cache if you use a caching plugin)."
   ],
   [
    "guide-tag",
    "Not on WordPress",
    "Paste the generated JSON-LD directly into <head> (not via Google Tag Manager), upload llms.txt to the site root and add the robots.txt lines. Copy them again after changing store info. The optional tag.js only works where JavaScript runs (measurement, AI agents); crawlers that do not run JavaScript never see it."
   ],
   [
    "guide-hosted",
    "Hosted page, GBP and Instagram",
    "Copy /s/slug to the Google Business Profile website field and Instagram profile."
   ],
   [
    "guide-checklist",
    "Store information",
    "Fill in the name, address, phone, hours, business type and so on in the form on the site page and save. On WordPress the plugin also syncs it. Only the real information you enter is given to AI."
   ],
   [
    "guide-scan",
    "Diagnosis and scan",
    "\"Run a diagnosis\" on the site page shows the AEO score and the checks, each with how to fix it (on every plan). The prioritised fix list is part of Pro. \"Scan (free)\" only checks that the tag and schema are in the HTML."
   ],
   [
    "guide-member",
    "Member registration",
    "Use the invitation URL to choose Store, Referrer, or Agency. Approval follows registration."
   ]
  ]
 }
};

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Cancellation and plan changes are self-service in the Stripe portal.
  const PAYMENT = {
 "ja": [
  "guide-payment",
  "支払い・課金",
  "サイト詳細の「現在のプラン」で、自社のサイトなら「支払いページを開く」、顧客のサイトなら「リンクをコピー」して送ります。カード情報はStripeが安全に管理し、Nurevoは保持しません。プランの変更・解約・支払い方法の変更は、サイト詳細の「プランを変更・管理」（Stripeの管理画面）から行えます。WordPressプラグインは次回の同期でプランを読み込みます。"
 ],
 "en": [
  "guide-payment",
  "Payments and billing",
  "Under \"Current plan\" on the site page, press \"Open payment page\" for your own site, or \"Copy link\" and send it to a client. Stripe stores card details securely; Nurevo does not. To change plan, cancel or update the payment method, use \"Change or manage plan\" on the site page (the Stripe portal). The WordPress plugin picks up the plan on its next sync."
 ]
};
  const GUIDE_UI = {
    ja: {"more":"詳しく見る","articles":"記事"}, en: {"more":"Learn more","articles":"Articles"}
  };
  // The dashboard's language. Japanese and English are above; any other
  // language comes from the dashboard's dictionary file for it
  // (public/dashboard-i18n/<code>.json, keys guide.content.*, guide.payment.*,
  // guide.ui.*), falling back to English string by string.
  const langNow = () => {
    try { if (window.nrvI18n) return window.nrvI18n.lang(); } catch (_) {}
    return (document.querySelector('#lang') || {}).value || (() => { try { return localStorage.getItem('nrv-dash-lang'); } catch (_) { return null; } })() || 'ja';
  };
  const pick = (table, prefix) => {
    const l = langNow();
    if (table[l]) return table[l];
    return window.nrvI18n && typeof window.nrvI18n.tree === 'function' ? window.nrvI18n.tree(prefix, table.en, table.ja, l) : table.en;
  };
  const current = () => pick(GUIDE, 'guide.content');
  function syncGuideTab() {
    const label = document.querySelector('[data-k="guide"]');
    if (label) label.textContent = current().tab;
  }
  function link(label, target) {
    return target === 'sites' ? `<a href="#" class="btn primary guide-action" data-guide-view="sites">${esc(label)}</a>` : `<a href="#${esc(target)}" class="btn guide-action">${esc(label)}</a>`;
  }
  function render() {
    const d = current();
    const ui = pick(GUIDE_UI, 'guide.ui');
    syncGuideTab();
    document.querySelectorAll('.nav').forEach((n) => n.classList.toggle('active', n.dataset.view === 'guide'));
    // The slot the dashboard renders for this view, falling back to #main for
    // any caller that has not provided one.
    const main = document.querySelector('#nrv-guide-slot') || document.querySelector('#main');
    if (!main) return;
    const articles = d.articles.concat([pick(PAYMENT, 'guide.payment')]);
    main.innerHTML = `<div class="top"><h1>${esc(d.title)}</h1><div class="who">${esc(d.intro)}</div></div><div class="card panel nrv-guide"><div class="nrv-guide-steps">${d.steps.map((s) => `<div class="nrv-guide-step"><div class="nrv-guide-num">${esc(s[0])}</div><div><h2>${esc(s[1])}</h2><p>${esc(s[2])}</p>${link(ui.more, s[3])}</div></div>`).join('')}</div></div><div class="card panel nrv-guide-articles" id="guide-articles"><h2>${esc(d.tab)}${esc(ui.articles)}</h2>${articles.map((a) => `<article id="${esc(a[0])}"><h3>${esc(a[1])}</h3><p>${esc(a[2]).replace(/\n/g, '<br>')}</p></article>`).join('')}</div>`;
    main.querySelectorAll('.guide-action').forEach((a) => a.addEventListener('click', (e) => {
      if (a.dataset.guideView) {
        e.preventDefault();
        const nav = document.querySelector(`.nav[data-view="${a.dataset.guideView}"]`);
        if (nav) nav.click();
      }
    }));
  }
  /*
   * The dashboard owns which view is showing; this only fills it.
   *
   * This used to intercept clicks on its own tab in the capture phase, paint
   * #main itself and stop the event - so the dashboard never learned that the
   * view had changed and never re-bound the navigation. Signed in that was
   * merely inconsistent; signed out it was a dead end, because the only paint
   * that ever attached handlers had been skipped.
   */
  window.__nrvRenderGuide = render;
  // The dashboard handles the language change and, when the guide is the
  // view showing, renders it again through __nrvRenderGuide once that
  // language's words are loaded. This used to stop the event and paint the
  // guide itself, so the dashboard never learned the new language.
  document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'lang') setTimeout(syncGuideTab, 0);
  }, true);
  syncGuideTab();
  const style = document.createElement('style');
  style.textContent = '.nrv-guide{padding:clamp(18px,3vw,28px)}.nrv-guide-steps{display:grid;gap:14px}.nrv-guide-step{display:grid;grid-template-columns:42px 1fr;gap:14px;align-items:start;padding:16px;border:1px solid #e7e2f1;border-radius:14px;background:#fff}.nrv-guide-num{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#6f4df6;color:#fff;font-weight:800}.nrv-guide-step h2{margin:0 0 4px;font-size:16px}.nrv-guide-step p{margin:0 0 10px;color:#5b6472}.nrv-guide-articles{margin-top:18px}.nrv-guide-articles>h2{margin:0 0 12px}.nrv-guide-articles article{padding:14px 0;border-top:1px solid #e7e9f1;scroll-margin-top:20px}.nrv-guide-articles h3{margin:0 0 5px;font-size:15px}.nrv-guide-articles p{margin:0;color:#5b6472}.places-modal>div{max-height:calc(100vh - 32px);overflow:auto;padding:clamp(18px,4vw,28px)}.places-modal h2{margin:0 0 8px}.places-modal form label{display:grid;gap:6px;margin:14px 0;font-weight:700}.places-modal .input,.places-modal select{width:100%;min-height:42px}.places-modal .option-card{display:block;cursor:pointer}.places-modal .option-card span{display:flex;align-items:center;gap:7px}.places-modal .btn{margin-top:8px}.places-modal #places-results{margin-top:12px}.places-modal #places-results .btn{white-space:normal;line-height:1.4}.places-modal #places-proposal{padding:10px 12px;border-radius:10px;background:#f2eeff;color:#4b31c6;font-weight:700}@media(max-width:560px){.nrv-guide-step{grid-template-columns:32px 1fr;padding:12px;gap:10px}.nrv-guide-num{width:30px;height:30px}.places-modal>div{width:100%;padding:16px}.places-modal .option-card small{margin-left:0}.places-modal .btn{width:100%}}';
  document.head.appendChild(style);
})();
