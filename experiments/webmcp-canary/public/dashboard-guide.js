(function () {
  'use strict';

  // Keep this content data-driven so new articles can be added without changing
  // the dashboard rendering code.
  const GUIDE = {
    ja: {
      tab: 'ガイド', title: '導入ガイド', intro: '登録からAIに拾われる状態まで、5つのステップで進めます。',
      steps: [
        ['1', '店舗を登録', '店名＋エリアで検索し、Googleマップの候補を選びます。', 'sites'],
        ['2', 'おすすめを確認', 'NurevoがWordPress・静的貼り付け・ホストのおすすめを自動判定します。', 'guide-registration'],
        ['3', '提案に沿って導入', 'WPはプラグイン、ホストは作業なし、その他のサイトはJSON-LD・llms.txt・robots.txtの行を直接置きます。', 'guide-install'],
        ['4', 'スキャン（無料）', 'スキャンでHTMLにschemaが入っているかを確認します。', 'guide-scan'],
        ['5', 'チェックリストを完了', 'すべて✓になれば、AIに情報が届く状態です。', 'guide-checklist']
      ],
      articles: [
        ['guide-registration', 'サイト登録の手順', 'サイトタブで「サイト登録」を押し、店名＋エリアで検索します。候補を選ぶと店名、業種、住所、電話、営業時間、価格帯が自動入力されます。導入方式を選び、登録を完了してください。'],
        ['guide-member', 'メンバー登録の手順', '招待URLからメールアドレスと役割（店舗・個人紹介者・代理店）を登録します。登録後は管理者の承認待ちとなります。'],
        ['guide-wp', '① WordPressプラグイン：何を・どうするか', '何をするか：プラグインがLocalBusiness情報をサーバー側で出力し、AIに読まれる状態にします。\n手順 1. nurevo-webmcp.zipをダウンロード。\n2. WP管理画面→プラグイン→新規追加→アップロード→インストール→有効化。\n3. Nurevo設定欄に当該サイトキーを入力して保存。\n4. 公開ページのソースでapplication/ld+jsonとLocalBusinessを確認。\n5. キャッシュ系プラグインのキャッシュをクリア。'],
        ['guide-tag', '② ホストページ /s/：何を・どうするか', '何をするか：Nurevoがschema入りの店専用ページを生成します。インストール不要です。\n手順 1. サイト詳細のNurevoホストURLをコピー。\n2. Googleビジネスプロフィールの「ウェブサイト」欄に貼付け。\n3. Instagramプロフィールのウェブサイト欄に貼付け。\n4. URLを開いて店情報を確認。'],
        ['guide-hosted', '③ WordPress以外：静的貼り付け', '何をするか：完成済みのJSON-LD・llms.txt・robots.txtの行をサイトに直接置きます。HTMLに最初から入るため、JavaScriptを実行しないAIクローラーにも届きます。\n手順 1. サイト詳細の「JSON-LD」をコピーし、<head>に直接貼付け（Wix/STUDIO/ペライチ等はカスタムコードの<head>欄）。GTM経由は不可。\n2. 「llms.txt」をコピーし、サイトのルートにllms.txtとしてアップロード。\n3. 「robots.txt に追記する行」をrobots.txtに追記（AI検索クローラーのみ許可。学習用クローラーの設定は変えません）。\n4. 公開し、ソースでapplication/ld+jsonを確認。\n5. 店舗情報を変えたら、JSON-LDとllms.txtをコピーし直して貼り替え（静的なので自動更新されません）。\n※JSタグ（tag.js）/GTMはブラウザでJavaScriptが動くときだけ働きます。計測とJavaScriptを実行するブラウザ／AIエージェント向けの補助用で、JavaScriptを実行しないクローラーには届きません。']
      ]
    },
    en: { tab:'Guide', title:'Getting started', intro:'Follow five steps from registration to AI-ready information.', steps:[['1','Register a store','Search by store name and area, then choose a Google Maps result.','sites'],['2','Review the recommendation','Nurevo recommends WordPress, static paste, or hosted automatically.','guide-registration'],['3','Set up the recommendation','Use the plugin, snippet, or hosted page as indicated.','guide-install'],['4','Run the free scan','Check that the schema is in your HTML.','guide-scan'],['5','Complete the checklist','All checks complete means your information is AI-ready.','guide-checklist']], articles:[['guide-registration','Site registration','Open Sites, search by name and area, choose a Places result, then select an install type.'],['guide-member','Member registration','Use the invitation URL to choose Store, Referrer, or Agency. Approval follows registration.'],['guide-wp','WordPress plugin','Download the plugin from the site detail page, activate it, and enter the site key.'],['guide-tag','Not on WordPress','Paste the generated JSON-LD directly into <head> (not via Google Tag Manager), upload llms.txt to the site root and add the robots.txt lines. Copy them again after changing store info. The optional tag.js only works where JavaScript runs (measurement, AI agents); crawlers that do not run JavaScript never see it.'],['guide-hosted','Hosted page, GBP and Instagram','Copy /s/slug to the Google Business Profile website field and Instagram profile.']]},
    zh: { tab:'指南', title:'导入指南', intro:'从注册到让 AI 找到您的信息，共五个步骤。', steps:[['1','注册店铺','按店名和地区搜索并选择地图结果','sites'],['2','确认建议','自动建议 WordPress、静态粘贴或托管页面','guide-registration'],['3','按建议设置','使用插件、代码片段或托管页面','guide-install'],['4','免费扫描','确认标签和 schema','guide-scan'],['5','完成清单','全部完成后即可被 AI 读取','guide-checklist']], articles:[['guide-registration','注册网站','在网站页搜索并选择 Places 结果，再选择导入方式。'],['guide-member','成员注册','通过邀请链接选择店铺、介绍人或代理商，等待审核。'],['guide-wp','WordPress 插件','下载并启用插件，输入网站密钥。'],['guide-tag','非WordPress网站','将生成的JSON-LD直接贴入head（不要通过GTM），把llms.txt上传到网站根目录，并在robots.txt中追加相应行。修改店铺信息后请重新复制。可选的tag.js仅在运行JavaScript时生效（统计、AI代理），不运行JavaScript的爬虫看不到它。'],['guide-hosted','托管页面、GBP 与 Instagram','将 /s/slug 放到 Google 商家网站和 Instagram。']]},
    tw: { tab:'指南', title:'導入指南', intro:'從註冊到讓 AI 找到您的資訊，共五個步驟。', steps:[['1','註冊店舖','按店名和地區搜尋並選擇地圖結果','sites'],['2','確認建議','自動建議 WordPress、靜態貼上或託管頁面','guide-registration'],['3','按建議設定','使用外掛、程式片段或託管頁面','guide-install'],['4','免費掃描','確認標籤和 schema','guide-scan'],['5','完成清單','全部完成後即可被 AI 讀取','guide-checklist']], articles:[['guide-registration','註冊網站','在網站頁搜尋並選擇 Places 結果，再選擇導入方式。'],['guide-member','成員註冊','透過邀請連結選擇店舖、介紹人或代理商，等待審核。'],['guide-wp','WordPress 外掛','下載並啟用外掛，輸入網站金鑰。'],['guide-tag','非WordPress網站','將產生的JSON-LD直接貼入head（不要透過GTM），把llms.txt上傳到網站根目錄，並在robots.txt追加相應行。修改店家資訊後請重新複製。選用的tag.js只在執行JavaScript時運作（統計、AI代理），不執行JavaScript的爬蟲看不到。'],['guide-hosted','託管頁面、GBP 與 Instagram','將 /s/slug 放到 Google 商家網站和 Instagram。']]},
    ko: { tab:'가이드', title:'도입 가이드', intro:'등록부터 AI가 정보를 찾는 상태까지 5단계입니다.', steps:[['1','매장 등록','매장명과 지역으로 검색하고 지도 결과를 선택합니다.','sites'],['2','추천 확인','WordPress, 정적 붙여넣기 또는 호스트를 자동 추천합니다.','guide-registration'],['3','설치 진행','플러그인, 스니펫 또는 호스트 페이지를 사용합니다.','guide-install'],['4','무료 스캔','태그와 schema를 확인합니다.','guide-scan'],['5','체크리스트 완료','모두 완료되면 AI가 읽을 수 있습니다.','guide-checklist']], articles:[['guide-registration','사이트 등록','검색 결과를 선택하고 설치 방식을 고릅니다.'],['guide-member','멤버 등록','초대 링크에서 역할을 선택하고 승인을 기다립니다.'],['guide-wp','WordPress 플러그인','플러그인을 활성화하고 사이트 키를 입력합니다.'],['guide-tag','WordPress 이외','생성된 JSON-LD를 head에 직접 붙이고(GTM 경유 불가), llms.txt를 사이트 루트에 올리고, robots.txt에 줄을 추가합니다. 매장 정보를 바꾸면 다시 복사하세요. 선택 사항인 tag.js는 JavaScript가 실행될 때만 동작하며(측정, AI 에이전트), JavaScript를 실행하지 않는 크롤러에는 보이지 않습니다.'],['guide-hosted','호스트 페이지와 GBP','/s/slug를 Google 및 Instagram에 붙입니다.']]},
    es: { tab:'Guía', title:'Guía de instalación', intro:'Cinco pasos para que la información esté lista para la IA.', steps:[['1','Registrar','Busca por nombre y zona y elige un resultado.','sites'],['2','Ver recomendación','Nurevo recomienda WordPress, pegado estático u hospedaje.','guide-registration'],['3','Configurar','Usa el plugin, snippet o página alojada.','guide-install'],['4','Escanear gratis','Comprueba la etiqueta y schema.','guide-scan'],['5','Completar lista','Cuando todo está marcado, la IA puede encontrarlo.','guide-checklist']], articles:[['guide-registration','Registro del sitio','Elige un resultado de Places y el tipo de instalación.'],['guide-member','Registro de miembros','Usa el enlace de invitación y espera la aprobación.'],['guide-wp','Plugin de WordPress','Activa el plugin e introduce la clave.'],['guide-tag','Sin WordPress','Pega el JSON-LD generado directamente en head (no con GTM), sube llms.txt a la raíz del sitio y añade las líneas de robots.txt. Cópialos de nuevo si cambias los datos. La etiqueta tag.js opcional solo funciona donde se ejecuta JavaScript (medición, agentes de IA); los rastreadores que no ejecutan JavaScript no la ven.'],['guide-hosted','Página alojada, GBP e Instagram','Publica /s/slug en Google e Instagram.']]},
    fr: { tab:'Guide', title:'Guide de mise en place', intro:'Cinq étapes pour rendre vos informations accessibles à l’IA.', steps:[['1','Enregistrer','Recherchez par nom et zone puis choisissez un résultat.','sites'],['2','Voir la recommandation','Nurevo recommande WordPress, collage statique ou hébergement.','guide-registration'],['3','Installer','Utilisez le plugin, le snippet ou la page hébergée.','guide-install'],['4','Scanner gratuitement','Vérifiez la balise et le schema.','guide-scan'],['5','Terminer la liste','Quand tout est validé, l’IA peut vous trouver.','guide-checklist']], articles:[['guide-registration','Enregistrer un site','Choisissez un résultat Places puis le type d’installation.'],['guide-member','Inscription membre','Utilisez le lien d’invitation et attendez la validation.'],['guide-wp','Plugin WordPress','Activez le plugin et saisissez la clé du site.'],['guide-tag','Hors WordPress','Collez le JSON-LD généré directement dans head (pas via GTM), déposez llms.txt à la racine du site et ajoutez les lignes robots.txt. Recopiez-les après toute modification. La balise tag.js facultative ne fonctionne que si JavaScript s’exécute (mesure, agents IA) ; les robots qui n’exécutent pas JavaScript ne la voient pas.'],['guide-hosted','Page hébergée, GBP et Instagram','Ajoutez /s/slug à Google et Instagram.']]},
    de: { tab:'Leitfaden', title:'Einrichtungsleitfaden', intro:'Fünf Schritte bis Ihre Informationen von KI gefunden werden.', steps:[['1','Standort registrieren','Nach Name und Gebiet suchen und Ergebnis auswählen.','sites'],['2','Empfehlung prüfen','Nurevo empfiehlt WordPress, statisches Einfügen oder Hosting.','guide-registration'],['3','Einrichten','Plugin, Snippet oder gehostete Seite verwenden.','guide-install'],['4','Kostenlos scannen','Tag und Schema prüfen.','guide-scan'],['5','Checkliste abschließen','Wenn alles erledigt ist, ist die Information KI-bereit.','guide-checklist']], articles:[['guide-registration','Website registrieren','Places-Ergebnis wählen und Installationstyp auswählen.'],['guide-member','Mitglied registrieren','Einladungslink verwenden und Freigabe abwarten.'],['guide-wp','WordPress-Plugin','Plugin aktivieren und Site-Key eingeben.'],['guide-tag','Ohne WordPress','Das erzeugte JSON-LD direkt in den head einfügen (nicht über GTM), llms.txt ins Stammverzeichnis hochladen und die robots.txt-Zeilen ergänzen. Nach Änderungen erneut kopieren. Das optionale tag.js wirkt nur, wo JavaScript läuft (Messung, KI-Agenten); Crawler ohne JavaScript sehen es nicht.'],['guide-hosted','Gehostete Seite, GBP und Instagram','/s/slug bei Google und Instagram eintragen.']]}
  };

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const PAYMENT = {
    ja: ['guide-payment', '支払い・課金', '店舗詳細で「支払いリンクを共有」を押し、店舗へリンクを送ります。店舗がStripeの決済ページで自分のカードを入力すると毎月自動課金されます。カード情報はStripeが安全に管理し、Nurevoは保持しません。直接契約・紹介契約とも、支払いは店舗が行います。解約はお問い合わせください。'],
    en: ['guide-payment', 'Payments and billing', 'Choose “Share payment link” on the site detail page and send it to the store. The store enters its own card on Stripe Checkout and is billed monthly. Stripe stores card details securely; Nurevo does not. The store pays directly, including referred stores. Contact us to cancel.'],
    zh: ['guide-payment', '支付与计费', '在店铺详情点击“分享支付链接”并发送给店铺。店铺在 Stripe 输入自己的卡片后按月自动扣款。卡片信息由 Stripe 安全管理，Nurevo 不保存。支付由店铺承担。取消请联系我们。'],
    tw: ['guide-payment', '付款與計費', '在店舖詳情點擊「分享付款連結」並傳給店舖。店舖在 Stripe 輸入自己的卡片後按月自動扣款。卡片資訊由 Stripe 安全管理，Nurevo 不保存。付款由店舖承擔。取消請聯絡我們。'],
    ko: ['guide-payment', '결제 및 청구', '사이트 상세에서 “결제 링크 공유”를 눌러 매장에 보냅니다. 매장이 Stripe에서 자신의 카드를 입력하면 매월 자동 결제됩니다. 카드 정보는 Stripe가 안전하게 관리하며 Nurevo는 보관하지 않습니다. 결제는 매장이 직접 합니다. 해지는 문의해 주세요.'],
    es: ['guide-payment', 'Pagos y facturación', 'Pulsa “Compartir enlace de pago” en el detalle del sitio y envíalo a la tienda. La tienda introduce su tarjeta en Stripe y se factura cada mes. Stripe protege los datos y Nurevo no los guarda. El pago lo realiza la tienda. Contacta para cancelar.'],
    fr: ['guide-payment', 'Paiement et facturation', 'Cliquez sur « Partager le lien de paiement » dans le détail du site et envoyez-le au commerce. Le commerce saisit sa carte dans Stripe Checkout et est débité chaque mois. Stripe protège les données et Nurevo ne les conserve pas. Le commerce paie lui-même. Contactez-nous pour résilier.'],
    de: ['guide-payment', 'Zahlung und Abrechnung', 'Klicken Sie im Standortdetail auf „Zahlungslink teilen“ und senden Sie ihn an das Geschäft. Das Geschäft gibt seine Karte bei Stripe ein und wird monatlich belastet. Stripe verwaltet die Kartendaten sicher; Nurevo speichert sie nicht. Das Geschäft zahlt selbst. Zur Kündigung kontaktieren Sie uns.']
  };
  const GUIDE_UI = {
    ja: { more: '詳しく見る', articles: '記事' }, en: { more: 'Learn more', articles: 'Articles' },
    zh: { more: '了解更多', articles: '文章' }, tw: { more: '了解更多', articles: '文章' },
    ko: { more: '자세히 보기', articles: '도움말' }, es: { more: 'Más información', articles: 'Artículos' },
    fr: { more: 'En savoir plus', articles: 'Articles' }, de: { more: 'Mehr erfahren', articles: 'Artikel' }
  };
  const current = () => GUIDE[(document.querySelector('#lang') || {}).value || localStorage.getItem('nrv-dash-lang') || 'ja'] || GUIDE.ja;
  function syncGuideTab() {
    const label = document.querySelector('[data-k="guide"]');
    if (label) label.textContent = current().tab;
  }
  function link(label, target) {
    return target === 'sites' ? `<a href="#" class="btn primary guide-action" data-guide-view="sites">${esc(label)}</a>` : `<a href="#${esc(target)}" class="btn guide-action">${esc(label)}</a>`;
  }
  function render() {
    const d = current();
    const ui = GUIDE_UI[(document.querySelector('#lang') || {}).value || 'ja'] || GUIDE_UI.ja;
    syncGuideTab();
    document.querySelectorAll('.nav').forEach((n) => n.classList.toggle('active', n.dataset.view === 'guide'));
    // The slot the dashboard renders for this view, falling back to #main for
    // any caller that has not provided one.
    const main = document.querySelector('#nrv-guide-slot') || document.querySelector('#main');
    if (!main) return;
    const articles = d.articles.concat([PAYMENT[(document.querySelector('#lang') || {}).value || 'ja'] || PAYMENT.ja]);
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
  document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'lang') {
      localStorage.setItem('nrv-dash-lang', e.target.value);
      if (document.querySelector('.nrv-guide')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        render();
      } else {
        // Let the dashboard's normal language handler update summary/sites;
        // refresh the Guide label after that render completes.
        setTimeout(syncGuideTab, 0);
      }
    }
  }, true);
  syncGuideTab();
  const style = document.createElement('style');
  style.textContent = '.nrv-guide{padding:clamp(18px,3vw,28px)}.nrv-guide-steps{display:grid;gap:14px}.nrv-guide-step{display:grid;grid-template-columns:42px 1fr;gap:14px;align-items:start;padding:16px;border:1px solid #e7e2f1;border-radius:14px;background:#fff}.nrv-guide-num{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#6f4df6;color:#fff;font-weight:800}.nrv-guide-step h2{margin:0 0 4px;font-size:16px}.nrv-guide-step p{margin:0 0 10px;color:#5b6472}.nrv-guide-articles{margin-top:18px}.nrv-guide-articles>h2{margin:0 0 12px}.nrv-guide-articles article{padding:14px 0;border-top:1px solid #e7e9f1;scroll-margin-top:20px}.nrv-guide-articles h3{margin:0 0 5px;font-size:15px}.nrv-guide-articles p{margin:0;color:#5b6472}.places-modal>div{max-height:calc(100vh - 32px);overflow:auto;padding:clamp(18px,4vw,28px)}.places-modal h2{margin:0 0 8px}.places-modal form label{display:grid;gap:6px;margin:14px 0;font-weight:700}.places-modal .input,.places-modal select{width:100%;min-height:42px}.places-modal .option-card{display:block;cursor:pointer}.places-modal .option-card span{display:flex;align-items:center;gap:7px}.places-modal .btn{margin-top:8px}.places-modal #places-results{margin-top:12px}.places-modal #places-results .btn{white-space:normal;line-height:1.4}.places-modal #places-proposal{padding:10px 12px;border-radius:10px;background:#f2eeff;color:#4b31c6;font-weight:700}@media(max-width:560px){.nrv-guide-step{grid-template-columns:32px 1fr;padding:12px;gap:10px}.nrv-guide-num{width:30px;height:30px}.places-modal>div{width:100%;padding:16px}.places-modal .option-card small{margin-left:0}.places-modal .btn{width:100%}}';
  document.head.appendChild(style);
})();
