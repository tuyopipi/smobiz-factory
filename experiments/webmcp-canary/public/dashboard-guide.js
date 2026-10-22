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
 },
 "zh": {
  "tab": "指南",
  "title": "导入指南",
  "intro": "从添加网站到让 AI 读取信息，共五个步骤。",
  "steps": [
   [
    "1",
    "添加网站",
    "点击“添加网站”，选择 WordPress、其他网站或还没有网站。",
    "sites"
   ],
   [
    "2",
    "按类型设置",
    "WordPress：插件和配对码。其他网站：粘贴 JSON-LD、llms.txt 和 robots.txt 行。没有网站：填写托管页面网址。",
    "guide-install"
   ],
   [
    "3",
    "填写店铺信息",
    "在网站详情中填写名称、地址、电话、营业时间等并保存。",
    "guide-checklist"
   ],
   [
    "4",
    "运行诊断",
    "“运行诊断”会显示 AEO 分数和每一项的修改方法。",
    "guide-scan"
   ],
   [
    "5",
    "选择方案（可选）",
    "Standard 会自动跟进最新标准。",
    "guide-payment"
   ]
  ],
  "articles": [
   [
    "guide-install",
    "如何选择导入方式",
    "“添加网站”首先询问网站类型。\nWordPress → 安装插件并用配对码连接。\n其他网站（Wix、STUDIO、手写 HTML 等）→ 把准备好的 JSON-LD、llms.txt 和 robots.txt 行放到网站上。\n还没有网站 → Nurevo 创建托管页面（/s/），填到 Google 商家资料等处。"
   ],
   [
    "guide-wp",
    "WordPress 插件",
    "1. WordPress 后台 → 插件 → 安装插件，搜索“Nurevo AEO”→ 安装 → 启用。\n2. 在本控制台的网站详情中点击“生成配对码”。\n3. 在 WordPress 后台 → Nurevo AEO → 设置 中粘贴并保存。\n4. 确认同一页面的“输出此网站面向 AI 的信息”已打开。\n5. 查看公开页面源代码，确认 application/ld+json 中有 LocalBusiness（如使用缓存插件请清除缓存）。"
   ],
   [
    "guide-tag",
    "非WordPress网站",
    "将生成的JSON-LD直接贴入head（不要通过GTM），把llms.txt上传到网站根目录，并在robots.txt中追加相应行。修改店铺信息后请重新复制。可选的tag.js仅在运行JavaScript时生效（统计、AI代理），不运行JavaScript的爬虫看不到它。"
   ],
   [
    "guide-hosted",
    "托管页面、GBP 与 Instagram",
    "将 /s/slug 放到 Google 商家网站和 Instagram。"
   ],
   [
    "guide-checklist",
    "店铺信息",
    "在网站详情的表单中填写名称、地址、电话、营业时间、业种等并保存。WordPress 网站也会由插件同步。只有您填写的真实信息会提供给 AI。"
   ],
   [
    "guide-scan",
    "诊断与扫描",
    "在网站详情点击“运行诊断”，会显示 AEO 分数和诊断项目，每项都有修改方法（所有方案可用）。按优先级排列的修改清单是 Pro 功能。“扫描（免费）”只检查 HTML 中是否有标签和 schema。"
   ],
   [
    "guide-member",
    "成员注册",
    "通过邀请链接选择店铺、介绍人或代理商，等待审核。"
   ]
  ]
 },
 "tw": {
  "tab": "指南",
  "title": "導入指南",
  "intro": "從新增網站到讓 AI 讀取資訊，共五個步驟。",
  "steps": [
   [
    "1",
    "新增網站",
    "按「新增網站」，選擇 WordPress、其他網站或還沒有網站。",
    "sites"
   ],
   [
    "2",
    "依類型設定",
    "WordPress：外掛與配對碼。其他網站：貼上 JSON-LD、llms.txt 與 robots.txt 行。沒有網站：填寫託管頁面網址。",
    "guide-install"
   ],
   [
    "3",
    "填寫店家資訊",
    "在網站詳情填寫名稱、地址、電話、營業時間等並儲存。",
    "guide-checklist"
   ],
   [
    "4",
    "執行診斷",
    "「執行診斷」會顯示 AEO 分數與每一項的修正方式。",
    "guide-scan"
   ],
   [
    "5",
    "選擇方案（選填）",
    "Standard 會自動跟上最新標準。",
    "guide-payment"
   ]
  ],
  "articles": [
   [
    "guide-install",
    "如何選擇導入方式",
    "「新增網站」會先詢問網站類型。\nWordPress → 安裝外掛並以配對碼連線。\n其他網站（Wix、STUDIO、自行撰寫的 HTML 等）→ 將準備好的 JSON-LD、llms.txt 與 robots.txt 行放到網站上。\n還沒有網站 → Nurevo 建立託管頁面（/s/），填到 Google 商家檔案等處。"
   ],
   [
    "guide-wp",
    "WordPress 外掛",
    "1. WordPress 後台 → 外掛 → 安裝外掛，搜尋「Nurevo AEO」→ 安裝 → 啟用。\n2. 在本控制台的網站詳情按「產生配對碼」。\n3. 在 WordPress 後台 → Nurevo AEO → 設定 貼上並儲存。\n4. 確認同一頁面的「輸出此網站給 AI 的資訊」已開啟。\n5. 檢視公開頁面原始碼，確認 application/ld+json 中有 LocalBusiness（若使用快取外掛請清除快取）。"
   ],
   [
    "guide-tag",
    "非WordPress網站",
    "將產生的JSON-LD直接貼入head（不要透過GTM），把llms.txt上傳到網站根目錄，並在robots.txt追加相應行。修改店家資訊後請重新複製。選用的tag.js只在執行JavaScript時運作（統計、AI代理），不執行JavaScript的爬蟲看不到。"
   ],
   [
    "guide-hosted",
    "託管頁面、GBP 與 Instagram",
    "將 /s/slug 放到 Google 商家網站和 Instagram。"
   ],
   [
    "guide-checklist",
    "店家資訊",
    "在網站詳情的表單填寫名稱、地址、電話、營業時間、業種等並儲存。WordPress 網站也會由外掛同步。只有您填寫的真實資訊會提供給 AI。"
   ],
   [
    "guide-scan",
    "診斷與掃描",
    "在網站詳情按「執行診斷」，會顯示 AEO 分數與診斷項目，每項都有修正方式（所有方案皆可）。依優先順序排列的修正清單是 Pro 功能。「掃描（免費）」只檢查 HTML 中是否有標籤與 schema。"
   ],
   [
    "guide-member",
    "成員註冊",
    "透過邀請連結選擇店舖、介紹人或代理商，等待審核。"
   ]
  ]
 },
 "ko": {
  "tab": "가이드",
  "title": "도입 가이드",
  "intro": "사이트 추가부터 AI가 정보를 읽는 상태까지 5단계입니다.",
  "steps": [
   [
    "1",
    "사이트 추가",
    "\"사이트 추가\"를 누르고 WordPress, 그 밖의 웹사이트, 아직 웹사이트가 없음 중에서 고릅니다.",
    "sites"
   ],
   [
    "2",
    "유형에 맞게 설정",
    "WordPress: 플러그인과 페어링 코드. 그 밖의 사이트: JSON-LD, llms.txt, robots.txt 줄 붙여넣기. 웹사이트가 없으면 호스트 페이지 URL을 등록합니다.",
    "guide-install"
   ],
   [
    "3",
    "매장 정보 입력",
    "사이트 상세에서 이름, 주소, 전화, 영업시간 등을 입력해 저장합니다.",
    "guide-checklist"
   ],
   [
    "4",
    "진단 실행",
    "\"진단 실행\"으로 AEO 점수와 항목별 수정 방법을 확인합니다.",
    "guide-scan"
   ],
   [
    "5",
    "플랜 선택(선택)",
    "Standard는 최신 기준을 자동으로 따라갑니다.",
    "guide-payment"
   ]
  ],
  "articles": [
   [
    "guide-install",
    "설치 방식 고르기",
    "\"사이트 추가\"는 먼저 사이트 유형을 묻습니다.\nWordPress → 플러그인을 설치하고 페어링 코드로 연결합니다.\n그 밖의 웹사이트(Wix, STUDIO, 직접 만든 HTML 등) → 준비된 JSON-LD, llms.txt, robots.txt 줄을 사이트에 넣습니다.\n아직 웹사이트가 없음 → Nurevo가 호스트 페이지(/s/)를 만들고 Google 비즈니스 프로필 등에 등록합니다."
   ],
   [
    "guide-wp",
    "WordPress 플러그인",
    "1. WordPress 관리자 → 플러그인 → 새로 추가에서 \"Nurevo AEO\" 검색 → 설치 → 활성화.\n2. 이 대시보드의 사이트 상세에서 \"페어링 코드 발급\"을 누릅니다.\n3. WordPress 관리자 → Nurevo AEO → 설정에 코드를 붙여 넣고 저장합니다.\n4. 같은 화면에서 \"이 사이트의 AI용 정보 출력\"이 켜져 있는지 확인합니다.\n5. 공개 페이지 소스에서 application/ld+json 안의 LocalBusiness를 확인합니다(캐시 플러그인을 쓰면 캐시를 비우세요)."
   ],
   [
    "guide-tag",
    "WordPress 이외",
    "생성된 JSON-LD를 head에 직접 붙이고(GTM 경유 불가), llms.txt를 사이트 루트에 올리고, robots.txt에 줄을 추가합니다. 매장 정보를 바꾸면 다시 복사하세요. 선택 사항인 tag.js는 JavaScript가 실행될 때만 동작하며(측정, AI 에이전트), JavaScript를 실행하지 않는 크롤러에는 보이지 않습니다."
   ],
   [
    "guide-hosted",
    "호스트 페이지와 GBP",
    "/s/slug를 Google 및 Instagram에 붙입니다."
   ],
   [
    "guide-checklist",
    "매장 정보",
    "사이트 상세 양식에 이름, 주소, 전화, 영업시간, 업종 등을 입력해 저장합니다. WordPress는 플러그인으로도 동기화됩니다. 입력한 실제 정보만 AI에 전달됩니다."
   ],
   [
    "guide-scan",
    "진단과 스캔",
    "사이트 상세의 \"진단 실행\"은 AEO 점수와 진단 항목을 보여 주며, 항목마다 수정 방법이 있습니다(모든 플랜). 우선순위가 매겨진 수정 목록은 Pro 기능입니다. \"스캔(무료)\"은 HTML에 태그와 schema가 있는지만 확인합니다."
   ],
   [
    "guide-member",
    "멤버 등록",
    "초대 링크에서 역할을 선택하고 승인을 기다립니다."
   ]
  ]
 },
 "es": {
  "tab": "Guía",
  "title": "Guía de instalación",
  "intro": "Cinco pasos desde añadir un sitio hasta que la IA pueda leer la información.",
  "steps": [
   [
    "1",
    "Añadir un sitio",
    "Pulsa \"Añadir un sitio\" y elige WordPress, Otro sitio web o Aún sin sitio web.",
    "sites"
   ],
   [
    "2",
    "Configurarlo según su tipo",
    "WordPress: el plugin y un código de emparejamiento. Otros sitios: pega el JSON-LD, el llms.txt y las líneas de robots.txt. Sin sitio: publica la URL de la página alojada.",
    "guide-install"
   ],
   [
    "3",
    "Completar los datos de la tienda",
    "Introduce nombre, dirección, teléfono, horario, etc. en la página del sitio y guarda.",
    "guide-checklist"
   ],
   [
    "4",
    "Ejecutar un diagnóstico",
    "\"Ejecutar un diagnóstico\" muestra la puntuación AEO y cómo corregir cada punto.",
    "guide-scan"
   ],
   [
    "5",
    "Elegir un plan (opcional)",
    "Standard sigue automáticamente los criterios más recientes.",
    "guide-payment"
   ]
  ],
  "articles": [
   [
    "guide-install",
    "Cómo elegir la instalación",
    "\"Añadir un sitio\" empieza preguntando qué sitio es.\nWordPress → instala el plugin y conéctalo con un código de emparejamiento.\nOtro sitio web (Wix, STUDIO, Squarespace, HTML propio…) → coloca en el sitio el JSON-LD, el llms.txt y las líneas de robots.txt preparados.\nAún sin sitio web → Nurevo crea una página alojada (/s/) para tu Perfil de Empresa de Google y similares."
   ],
   [
    "guide-wp",
    "Plugin de WordPress",
    "1. Administrador de WordPress → Plugins → Añadir nuevo, busca \"Nurevo AEO\" → Instalar → Activar.\n2. En la página del sitio de este panel, pulsa \"Emitir un código de emparejamiento\".\n3. Pega el código en Nurevo AEO → Ajustes y guarda.\n4. En la misma pantalla, comprueba que \"Publicar información para IA de este sitio\" está activado.\n5. Mira el código fuente de una página pública y busca LocalBusiness en application/ld+json (vacía la caché si usas un plugin de caché)."
   ],
   [
    "guide-tag",
    "Sin WordPress",
    "Pega el JSON-LD generado directamente en head (no con GTM), sube llms.txt a la raíz del sitio y añade las líneas de robots.txt. Cópialos de nuevo si cambias los datos. La etiqueta tag.js opcional solo funciona donde se ejecuta JavaScript (medición, agentes de IA); los rastreadores que no ejecutan JavaScript no la ven."
   ],
   [
    "guide-hosted",
    "Página alojada, GBP e Instagram",
    "Publica /s/slug en Google e Instagram."
   ],
   [
    "guide-checklist",
    "Datos de la tienda",
    "Completa nombre, dirección, teléfono, horario, tipo de negocio, etc. en el formulario de la página del sitio y guarda. En WordPress, el plugin también los sincroniza. Solo se entrega a la IA la información real que introduces."
   ],
   [
    "guide-scan",
    "Diagnóstico y escaneo",
    "\"Ejecutar un diagnóstico\" en la página del sitio muestra la puntuación AEO y los puntos revisados, cada uno con cómo corregirlo (en todos los planes). La lista de correcciones priorizada es parte de Pro. \"Escanear (gratis)\" solo comprueba que la etiqueta y el schema estén en el HTML."
   ],
   [
    "guide-member",
    "Registro de miembros",
    "Usa el enlace de invitación y espera la aprobación."
   ]
  ]
 },
 "fr": {
  "tab": "Guide",
  "title": "Guide de mise en place",
  "intro": "Cinq étapes, de l’ajout d’un site à des informations lisibles par l’IA.",
  "steps": [
   [
    "1",
    "Ajouter un site",
    "Cliquez sur « Ajouter un site » et choisissez WordPress, Autre site web ou Pas encore de site.",
    "sites"
   ],
   [
    "2",
    "Configurer selon le type",
    "WordPress : l’extension et un code d’appairage. Autres sites : collez le JSON-LD, le llms.txt et les lignes robots.txt. Sans site : indiquez l’URL de la page hébergée.",
    "guide-install"
   ],
   [
    "3",
    "Renseigner le commerce",
    "Saisissez le nom, l’adresse, le téléphone, les horaires, etc. sur la page du site et enregistrez.",
    "guide-checklist"
   ],
   [
    "4",
    "Lancer un diagnostic",
    "« Lancer un diagnostic » affiche le score AEO et comment corriger chaque point.",
    "guide-scan"
   ],
   [
    "5",
    "Choisir une offre (facultatif)",
    "Standard suit automatiquement les derniers critères.",
    "guide-payment"
   ]
  ],
  "articles": [
   [
    "guide-install",
    "Choisir la mise en place",
    "« Ajouter un site » commence par demander de quel site il s’agit.\nWordPress → installez l’extension et connectez-la avec un code d’appairage.\nAutre site web (Wix, STUDIO, Squarespace, HTML écrit à la main…) → placez sur le site le JSON-LD, le llms.txt et les lignes robots.txt préparés.\nPas encore de site → Nurevo crée une page hébergée (/s/) à indiquer sur votre fiche d’établissement Google, etc."
   ],
   [
    "guide-wp",
    "Extension WordPress",
    "1. Administration WordPress → Extensions → Ajouter, recherchez « Nurevo AEO » → Installer → Activer.\n2. Sur la page du site de ce tableau de bord, cliquez sur « Émettre un code d’appairage ».\n3. Collez le code dans Nurevo AEO → Réglages et enregistrez.\n4. Sur le même écran, vérifiez que « Publier les informations destinées à l’IA pour ce site » est activé.\n5. Affichez la source d’une page publique et cherchez LocalBusiness dans application/ld+json (videz le cache si vous utilisez une extension de cache)."
   ],
   [
    "guide-tag",
    "Hors WordPress",
    "Collez le JSON-LD généré directement dans head (pas via GTM), déposez llms.txt à la racine du site et ajoutez les lignes robots.txt. Recopiez-les après toute modification. La balise tag.js facultative ne fonctionne que si JavaScript s’exécute (mesure, agents IA) ; les robots qui n’exécutent pas JavaScript ne la voient pas."
   ],
   [
    "guide-hosted",
    "Page hébergée, GBP et Instagram",
    "Ajoutez /s/slug à Google et Instagram."
   ],
   [
    "guide-checklist",
    "Informations du commerce",
    "Renseignez le nom, l’adresse, le téléphone, les horaires, le type d’activité, etc. dans le formulaire de la page du site et enregistrez. Sous WordPress, l’extension les synchronise aussi. Seules les informations réelles que vous saisissez sont transmises à l’IA."
   ],
   [
    "guide-scan",
    "Diagnostic et analyse",
    "« Lancer un diagnostic » sur la page du site affiche le score AEO et les points vérifiés, chacun avec sa correction (avec toutes les offres). La liste de corrections priorisée fait partie de Pro. « Analyser (gratuit) » vérifie seulement que la balise et le schema sont dans le HTML."
   ],
   [
    "guide-member",
    "Inscription membre",
    "Utilisez le lien d’invitation et attendez la validation."
   ]
  ]
 },
 "de": {
  "tab": "Leitfaden",
  "title": "Einrichtungsleitfaden",
  "intro": "Fünf Schritte vom Hinzufügen einer Website bis zu Informationen, die KI lesen kann.",
  "steps": [
   [
    "1",
    "Website hinzufügen",
    "„Website hinzufügen“ drücken und WordPress, Andere Website oder Noch keine Website wählen.",
    "sites"
   ],
   [
    "2",
    "Je nach Typ einrichten",
    "WordPress: Plugin und Kopplungscode. Andere Websites: JSON-LD, llms.txt und robots.txt-Zeilen einfügen. Ohne Website: die URL der gehosteten Seite eintragen.",
    "guide-install"
   ],
   [
    "3",
    "Geschäftsdaten eintragen",
    "Name, Adresse, Telefon, Öffnungszeiten usw. auf der Website-Seite eintragen und speichern.",
    "guide-checklist"
   ],
   [
    "4",
    "Diagnose ausführen",
    "„Diagnose ausführen“ zeigt den AEO-Score und wie jeder Punkt zu beheben ist.",
    "guide-scan"
   ],
   [
    "5",
    "Tarif wählen (optional)",
    "Standard folgt automatisch den neuesten Kriterien.",
    "guide-payment"
   ]
  ],
  "articles": [
   [
    "guide-install",
    "Die passende Einrichtung",
    "„Website hinzufügen“ fragt zuerst, um welche Website es geht.\nWordPress → Plugin installieren und mit einem Kopplungscode verbinden.\nAndere Website (Wix, STUDIO, Squarespace, eigenes HTML …) → das vorbereitete JSON-LD, die llms.txt und die robots.txt-Zeilen auf die Website legen.\nNoch keine Website → Nurevo erstellt eine gehostete Seite (/s/) für das Google-Unternehmensprofil o. Ä."
   ],
   [
    "guide-wp",
    "WordPress-Plugin",
    "1. WordPress-Admin → Plugins → Installieren, nach „Nurevo AEO“ suchen → Jetzt installieren → Aktivieren.\n2. Auf der Website-Seite in diesem Dashboard „Kopplungscode ausstellen“ drücken.\n3. Code in Nurevo AEO → Einstellungen einfügen und speichern.\n4. Auf derselben Seite prüfen, dass „KI-bezogene Informationen für diese Website ausgeben“ eingeschaltet ist.\n5. Im Quelltext einer öffentlichen Seite nach LocalBusiness in application/ld+json suchen (bei einem Cache-Plugin den Cache leeren)."
   ],
   [
    "guide-tag",
    "Ohne WordPress",
    "Das erzeugte JSON-LD direkt in den head einfügen (nicht über GTM), llms.txt ins Stammverzeichnis hochladen und die robots.txt-Zeilen ergänzen. Nach Änderungen erneut kopieren. Das optionale tag.js wirkt nur, wo JavaScript läuft (Messung, KI-Agenten); Crawler ohne JavaScript sehen es nicht."
   ],
   [
    "guide-hosted",
    "Gehostete Seite, GBP und Instagram",
    "/s/slug bei Google und Instagram eintragen."
   ],
   [
    "guide-checklist",
    "Geschäftsdaten",
    "Name, Adresse, Telefon, Öffnungszeiten, Branche usw. im Formular der Website-Seite eintragen und speichern. Bei WordPress synchronisiert sie auch das Plugin. An KI gehen nur die echten Angaben, die Sie eintragen."
   ],
   [
    "guide-scan",
    "Diagnose und Scan",
    "„Diagnose ausführen“ auf der Website-Seite zeigt den AEO-Score und die Prüfpunkte, jeweils mit Lösung (in jedem Tarif). Die priorisierte Korrekturliste gehört zu Pro. „Scannen (kostenlos)“ prüft nur, ob Tag und Schema im HTML stehen."
   ],
   [
    "guide-member",
    "Mitglied registrieren",
    "Einladungslink verwenden und Freigabe abwarten."
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
 ],
 "zh": [
  "guide-payment",
  "支付与计费",
  "在网站详情的“当前方案”中，自己的网站点击“打开付款页面”，客户的网站则“复制链接”发送给对方。卡片信息由 Stripe 安全管理，Nurevo 不保存。更改方案、取消或更换付款方式，请在网站详情的“更改或管理方案”（Stripe 管理页面）中操作。WordPress 插件会在下次同步时读取方案。"
 ],
 "tw": [
  "guide-payment",
  "付款與計費",
  "在網站詳情的「目前方案」中，自己的網站按「開啟付款頁面」，客戶的網站則「複製連結」傳給對方。卡片資訊由 Stripe 安全管理，Nurevo 不保存。變更方案、取消或更換付款方式，請在網站詳情的「變更或管理方案」（Stripe 管理頁面）操作。WordPress 外掛會在下次同步時讀取方案。"
 ],
 "ko": [
  "guide-payment",
  "결제 및 청구",
  "사이트 상세의 \"현재 플랜\"에서 자사 사이트는 \"결제 페이지 열기\", 고객 사이트는 \"링크 복사\"로 보내 주세요. 카드 정보는 Stripe가 안전하게 관리하며 Nurevo는 보관하지 않습니다. 플랜 변경, 해지, 결제 수단 변경은 사이트 상세의 \"플랜 변경·관리\"(Stripe 관리 화면)에서 할 수 있습니다. WordPress 플러그인은 다음 동기화 때 플랜을 읽습니다."
 ],
 "es": [
  "guide-payment",
  "Pagos y facturación",
  "En \"Plan actual\" de la página del sitio, pulsa \"Abrir página de pago\" para tu propio sitio, o \"Copiar enlace\" y envíalo a tu cliente. Stripe protege los datos de la tarjeta y Nurevo no los guarda. Para cambiar de plan, cancelar o cambiar el método de pago, usa \"Cambiar o gestionar el plan\" en la página del sitio (el portal de Stripe). El plugin de WordPress recoge el plan en su próxima sincronización."
 ],
 "fr": [
  "guide-payment",
  "Paiement et facturation",
  "Dans « Offre actuelle » sur la page du site, cliquez sur « Ouvrir la page de paiement » pour votre propre site, ou « Copier le lien » et envoyez-le à votre client. Stripe protège les données de carte ; Nurevo ne les conserve pas. Pour changer d’offre, résilier ou changer de moyen de paiement, utilisez « Modifier ou gérer l’offre » sur la page du site (le portail Stripe). L’extension WordPress prend en compte l’offre à sa prochaine synchronisation."
 ],
 "de": [
  "guide-payment",
  "Zahlung und Abrechnung",
  "Unter „Aktueller Tarif“ auf der Website-Seite drücken Sie für Ihre eigene Website „Zahlungsseite öffnen“ oder kopieren für einen Kunden den Link und senden ihn. Stripe verwaltet die Kartendaten sicher; Nurevo speichert sie nicht. Tarif ändern, kündigen oder Zahlungsmethode ändern: über „Tarif ändern oder verwalten“ auf der Website-Seite (Stripe-Portal). Das WordPress-Plugin übernimmt den Tarif bei der nächsten Synchronisierung."
 ]
};
  const GUIDE_UI = {
    ja: { more: '詳しく見る', articles: '記事' }, en: { more: 'Learn more', articles: 'Articles' },
    zh: { more: '了解更多', articles: '文章' }, tw: { more: '了解更多', articles: '文章' },
    ko: { more: '자세히 보기', articles: '도움말' }, es: { more: 'Más información', articles: 'Artículos' },
    fr: { more: 'En savoir plus', articles: 'Articles' }, de: { more: 'Mehr erfahren', articles: 'Artikel' }
  };
  const langNow = () => (document.querySelector('#lang') || {}).value || (() => { try { return localStorage.getItem('nrv-dash-lang'); } catch (_) { return null; } })() || 'ja';
  const current = () => GUIDE[langNow()] || GUIDE.ja;
  function syncGuideTab() {
    const label = document.querySelector('[data-k="guide"]');
    if (label) label.textContent = current().tab;
  }
  function link(label, target) {
    return target === 'sites' ? `<a href="#" class="btn primary guide-action" data-guide-view="sites">${esc(label)}</a>` : `<a href="#${esc(target)}" class="btn guide-action">${esc(label)}</a>`;
  }
  function render() {
    const d = current();
    const ui = GUIDE_UI[langNow()] || GUIDE_UI.ja;
    syncGuideTab();
    document.querySelectorAll('.nav').forEach((n) => n.classList.toggle('active', n.dataset.view === 'guide'));
    // The slot the dashboard renders for this view, falling back to #main for
    // any caller that has not provided one.
    const main = document.querySelector('#nrv-guide-slot') || document.querySelector('#main');
    if (!main) return;
    const articles = d.articles.concat([PAYMENT[langNow()] || PAYMENT.ja]);
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
