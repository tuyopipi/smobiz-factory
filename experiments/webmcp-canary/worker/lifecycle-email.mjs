/**
 * Lifecycle email: the messages sent around a site's life, not at sign-in.
 *
 *   welcome         once per member, when their first site is created
 *   not_connected   wp sites still unpaired 24 h and 72 h after creation,
 *                   from the hourly cron (worker/schedule.mjs), so each
 *                   arrives within about an hour of being due; two at
 *                   most, then it stops
 *   payment_failed  invoice.payment_failed, once per failing invoice
 *   plan_ended      customer.subscription.deleted for a site that was paid
 *
 * Every send is claimed first in lifecycle_emails (0038) under
 * (scope, subject_id, kind, step), so a retried webhook, a repeated cron run or
 * a run that died half way can never send the same message twice. Delivery is
 * at most once: a send that fails after the claim is recorded as failed, not
 * retried, because the provider may have accepted it before the error.
 *
 * Nothing here may break the caller. While 0038 is unapplied the claim fails,
 * and the email is skipped; checkout, the webhook and the cron carry on.
 *
 * not_connected is the one non-transactional message. It carries a signed
 * one-click unsubscribe link and the List-Unsubscribe headers, and an opt-out
 * (lifecycle_email_opt_outs) suppresses reminders only.
 */
import { normalizeEmailLocale, loadEmailPreferences } from "./email-i18n.mjs";
import { resolveSitePlan, normalizePlan } from "./billing-plan.mjs";

export const DASHBOARD_ORIGIN = "https://nurevo.jp";
export const HOUR_MS = 3600e3;
export const REMINDER_STEPS = [
  { step: "1", afterMs: 24 * HOUR_MS },
  { step: "2", afterMs: 72 * HOUR_MS },
];
// A site older than this that is still unpaired (or was unbound later) is not
// chased: a first reminder two weeks late would be noise, not help.
export const REMINDER_WINDOW_MS = 14 * 24 * HOUR_MS;
export const REMINDER_BATCH_LIMIT = 100;
export const UNSUBSCRIBE_PATH = "/api/email/unsubscribe";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fill = (template, vars) => String(template).replace(/\{(\w+)\}/g, (_, key) => (vars[key] ?? ""));

/* ------------------------------------------------------------------ *
 * Copy. Product names stay as they are in every language.
 * ------------------------------------------------------------------ */

const COPY = {
  ja: {
    sign: "Nurevo AEO",
    open: "ダッシュボードでサイトを開く",
    welcome: {
      subject: "{site} の次のステップ（Nurevo AEO）",
      intro: "{site} を Nurevo AEO に追加していただき、ありがとうございます。あと少しで、AIアシスタントがサイトの情報を読み取れるようになります。",
      wp: [
        "WordPress の管理画面で「プラグイン > 新規追加」を開き、「Nurevo AEO」を検索します。",
        "プラグインをインストールして、有効化します。",
        "Nurevo のダッシュボードでサイトを開き、ペアリングコードをコピーして、プラグインに貼り付けます。",
      ],
      static: [
        "Nurevo のダッシュボードでサイトのパネルを開きます。",
        "表示されている JSON-LD、llms.txt、robots.txt の行をコピーします。",
        "JSON-LD はページの HTML に、llms.txt はサイトのルートに、robots の行は robots.txt に追加します。",
      ],
      hosted: "Nurevo のページの準備ができました。ページの URL は次のとおりです：",
      hostedAfter: "プロフィールや SNS からリンクしてご利用ください。内容はダッシュボードでいつでも編集できます。",
    },
    reminder: {
      subject1: "{site} はまだ接続されていません",
      subject2: "再送：{site} はまだ接続されていません",
      intro: "{site} は Nurevo AEO に追加されていますが、WordPress プラグインとの接続がまだ完了していません。次の点をご確認ください。",
      checklist: [
        "Nurevo AEO プラグインがインストールされ、有効になっていること（WordPress の「プラグイン」）。",
        "「Nurevo AEO > 設定」で「このサイトのAI向け情報を出力する」がオンになっていること。",
        "WordPress のサイトアドレス（「設定 > 一般」）が {site} と一致していること。",
      ],
      reissue: "確認できたら、ペアリングコードをプラグインに貼り付けてください。コードの有効期限が切れている場合は、こちらから新しいコードを発行できます：",
      last: "このご案内は今回が最後です。",
      unsubscribe: "このようなリマインダーが不要な場合は、こちらから配信を停止できます：",
    },
    paymentFailed: {
      subject: "{site} のお支払いができませんでした",
      intro: "{site} の Nurevo AEO プランについて、最新のお支払いを処理できませんでした。Stripe が数日かけてお支払いを再試行します。その間もサイトは引き続きご利用いただけます。",
      action: "お支払い方法を更新するには、ダッシュボードでサイトを開き、「支払いを管理」を選んでください。",
      ignore: "すでに更新済みの場合は、このメールは無視してください。",
    },
    planEnded: {
      subject: "{site} の Nurevo AEO プランが終了しました",
      intro: "{site} の {plan} プランが終了し、サイトは Free プランになりました。",
      keepsTitle: "Free プランでも、次の機能は引き続きご利用いただけます。",
      keeps: [
        "AI向け情報の出力（インストール時点の基準で継続します）",
        "AEO スコアのチェック",
      ],
      resubscribe: "もう一度ご契約いただく場合は、ダッシュボードでサイトを開き、プランを選んでください。",
    },
  },
  en: {
    sign: "Nurevo AEO",
    open: "Open your site in the dashboard",
    welcome: {
      subject: "Next step for {site} on Nurevo AEO",
      intro: "Thanks for adding {site} to Nurevo AEO. One more step and AI assistants can start reading your site.",
      wp: [
        "In WordPress, go to Plugins > Add New and search for \"Nurevo AEO\".",
        "Install and activate the plugin.",
        "Open your site in the Nurevo dashboard, copy the pairing code and paste it into the plugin.",
      ],
      static: [
        "Open your site panel in the Nurevo dashboard.",
        "Copy the JSON-LD, the llms.txt and the robots.txt lines shown there.",
        "Add the JSON-LD to your page HTML, llms.txt to your site root and the lines to robots.txt.",
      ],
      hosted: "Your Nurevo page is ready. Here is its URL:",
      hostedAfter: "Link to it from your profiles and social accounts. You can edit the details in the dashboard at any time.",
    },
    reminder: {
      subject1: "{site} isn't connected yet",
      subject2: "Reminder: {site} still isn't connected",
      intro: "{site} is in Nurevo AEO, but the WordPress plugin hasn't connected yet. A quick check:",
      checklist: [
        "The Nurevo AEO plugin is installed and active (Plugins in WordPress).",
        "In Nurevo AEO > Settings, \"Output AI-facing information for this site\" is ON.",
        "The site address in WordPress (Settings > General) matches {site}.",
      ],
      reissue: "Then paste a pairing code into the plugin. If your code has expired, you can issue a new one here:",
      last: "This is the last reminder we'll send about this.",
      unsubscribe: "Don't want these reminders? Unsubscribe here:",
    },
    paymentFailed: {
      subject: "Payment failed for {site}",
      intro: "We couldn't take the latest payment for your Nurevo AEO plan on {site}. Stripe will retry over the next few days, and your site keeps working in the meantime.",
      action: "To update your payment method, open your site in the dashboard and choose \"Manage billing\".",
      ignore: "If you've already updated it, you can ignore this email.",
    },
    planEnded: {
      subject: "Your Nurevo AEO plan for {site} has ended",
      intro: "Your {plan} plan for {site} has ended, and the site is now on the Free plan.",
      keepsTitle: "On Free you still have:",
      keeps: [
        "AI-facing output, at the criteria from when you installed",
        "The AEO score check",
      ],
      resubscribe: "To subscribe again, open your site in the dashboard and choose a plan.",
    },
  },
  zh: {
    sign: "Nurevo AEO",
    open: "在控制台中打开您的网站",
    welcome: {
      subject: "{site} 的下一步（Nurevo AEO）",
      intro: "感谢您将 {site} 添加到 Nurevo AEO。只需再完成一步，AI 助手就能开始读取您的网站信息。",
      wp: [
        "在 WordPress 后台打开“插件 > 安装插件”，搜索“Nurevo AEO”。",
        "安装并启用该插件。",
        "在 Nurevo 控制台中打开您的网站，复制配对码并粘贴到插件中。",
      ],
      static: [
        "在 Nurevo 控制台中打开网站面板。",
        "复制其中显示的 JSON-LD、llms.txt 和 robots.txt 内容。",
        "将 JSON-LD 加入页面 HTML，将 llms.txt 放在网站根目录，并把相应行加入 robots.txt。",
      ],
      hosted: "您的 Nurevo 页面已准备就绪，网址如下：",
      hostedAfter: "您可以在个人资料和社交账号中链接到它，也可以随时在控制台中编辑内容。",
    },
    reminder: {
      subject1: "{site} 尚未连接",
      subject2: "提醒：{site} 仍未连接",
      intro: "{site} 已添加到 Nurevo AEO，但 WordPress 插件尚未完成连接。请检查以下几点：",
      checklist: [
        "Nurevo AEO 插件已安装并启用（WordPress 的“插件”）。",
        "在“Nurevo AEO > 设置”中，“为此站点输出面向 AI 的信息”已开启。",
        "WordPress 中的站点地址（“设置 > 常规”）与 {site} 一致。",
      ],
      reissue: "然后将配对码粘贴到插件中。如果配对码已过期，可以在这里重新获取：",
      last: "这是我们关于此事的最后一次提醒。",
      unsubscribe: "不想再收到此类提醒？点击此处退订：",
    },
    paymentFailed: {
      subject: "{site} 付款失败",
      intro: "我们未能收取 {site} 的 Nurevo AEO 方案的最近一笔费用。Stripe 会在接下来几天内重试，在此期间您的网站仍可正常使用。",
      action: "如需更新付款方式，请在控制台中打开您的网站，然后选择“管理付款”。",
      ignore: "如果您已更新，请忽略此邮件。",
    },
    planEnded: {
      subject: "{site} 的 Nurevo AEO 方案已结束",
      intro: "{site} 的 {plan} 方案已结束，网站现已切换为 Free 方案。",
      keepsTitle: "Free 方案仍包括：",
      keeps: [
        "面向 AI 的信息输出（沿用安装时的标准）",
        "AEO 分数检查",
      ],
      resubscribe: "如需重新订阅，请在控制台中打开您的网站并选择方案。",
    },
  },
  "zh-tw": {
    sign: "Nurevo AEO",
    open: "在主控台開啟您的網站",
    welcome: {
      subject: "{site} 的下一個步驟（Nurevo AEO）",
      intro: "感謝您將 {site} 加入 Nurevo AEO。只要再完成一個步驟，AI 助理就能開始讀取您的網站資訊。",
      wp: [
        "在 WordPress 控制台開啟「外掛 > 安裝外掛」，搜尋「Nurevo AEO」。",
        "安裝並啟用外掛。",
        "在 Nurevo 主控台開啟您的網站，複製配對碼並貼到外掛中。",
      ],
      static: [
        "在 Nurevo 主控台開啟網站面板。",
        "複製其中顯示的 JSON-LD、llms.txt 與 robots.txt 內容。",
        "將 JSON-LD 加入頁面 HTML，將 llms.txt 放在網站根目錄，並把相應的行加入 robots.txt。",
      ],
      hosted: "您的 Nurevo 頁面已準備就緒，網址如下：",
      hostedAfter: "您可以在個人檔案與社群帳號中連結到它，也可以隨時在主控台編輯內容。",
    },
    reminder: {
      subject1: "{site} 尚未連線",
      subject2: "提醒：{site} 仍未連線",
      intro: "{site} 已加入 Nurevo AEO，但 WordPress 外掛尚未完成連線。請確認以下幾點：",
      checklist: [
        "Nurevo AEO 外掛已安裝並啟用（WordPress 的「外掛」）。",
        "在「Nurevo AEO > 設定」中，「為此網站輸出給 AI 的資訊」已開啟。",
        "WordPress 的網站網址（「設定 > 一般」）與 {site} 一致。",
      ],
      reissue: "接著將配對碼貼到外掛中。如果配對碼已過期，可以在這裡重新發行：",
      last: "這是我們關於此事的最後一次提醒。",
      unsubscribe: "不想再收到這類提醒？請點此取消訂閱：",
    },
    paymentFailed: {
      subject: "{site} 付款失敗",
      intro: "我們無法收取 {site} 的 Nurevo AEO 方案的最近一筆款項。Stripe 會在接下來幾天內重試，在此期間您的網站仍可正常運作。",
      action: "若要更新付款方式，請在主控台開啟您的網站，然後選擇「管理付款」。",
      ignore: "如果您已更新，請忽略此郵件。",
    },
    planEnded: {
      subject: "{site} 的 Nurevo AEO 方案已結束",
      intro: "{site} 的 {plan} 方案已結束，網站現已改為 Free 方案。",
      keepsTitle: "Free 方案仍包含：",
      keeps: [
        "面向 AI 的資訊輸出（沿用安裝時的標準）",
        "AEO 分數檢查",
      ],
      resubscribe: "若要重新訂閱，請在主控台開啟您的網站並選擇方案。",
    },
  },
  ko: {
    sign: "Nurevo AEO",
    open: "대시보드에서 사이트 열기",
    welcome: {
      subject: "{site}의 다음 단계 (Nurevo AEO)",
      intro: "{site}을(를) Nurevo AEO에 추가해 주셔서 감사합니다. 한 단계만 더 하면 AI 어시스턴트가 사이트 정보를 읽을 수 있습니다.",
      wp: [
        "WordPress 관리자에서 \"플러그인 > 새로 추가\"를 열고 \"Nurevo AEO\"를 검색합니다.",
        "플러그인을 설치하고 활성화합니다.",
        "Nurevo 대시보드에서 사이트를 열고 페어링 코드를 복사해 플러그인에 붙여 넣습니다.",
      ],
      static: [
        "Nurevo 대시보드에서 사이트 패널을 엽니다.",
        "표시된 JSON-LD, llms.txt, robots.txt 줄을 복사합니다.",
        "JSON-LD는 페이지 HTML에, llms.txt는 사이트 루트에, 해당 줄은 robots.txt에 추가합니다.",
      ],
      hosted: "Nurevo 페이지가 준비되었습니다. 페이지 URL은 다음과 같습니다:",
      hostedAfter: "프로필과 SNS에서 링크해 사용하세요. 내용은 대시보드에서 언제든지 수정할 수 있습니다.",
    },
    reminder: {
      subject1: "{site}이(가) 아직 연결되지 않았습니다",
      subject2: "다시 알림: {site}이(가) 아직 연결되지 않았습니다",
      intro: "{site}은(는) Nurevo AEO에 추가되었지만 WordPress 플러그인이 아직 연결되지 않았습니다. 다음을 확인해 주세요:",
      checklist: [
        "Nurevo AEO 플러그인이 설치되어 활성화되어 있는지 (WordPress의 \"플러그인\").",
        "\"Nurevo AEO > 설정\"에서 \"이 사이트의 AI용 정보 출력\"이 켜져 있는지.",
        "WordPress의 사이트 주소(\"설정 > 일반\")가 {site}와(과) 일치하는지.",
      ],
      reissue: "그다음 페어링 코드를 플러그인에 붙여 넣어 주세요. 코드가 만료되었다면 여기에서 새 코드를 발급할 수 있습니다:",
      last: "이 안내는 이번이 마지막입니다.",
      unsubscribe: "이런 알림을 받고 싶지 않으시면 여기에서 수신을 거부할 수 있습니다:",
    },
    paymentFailed: {
      subject: "{site}의 결제에 실패했습니다",
      intro: "{site}의 Nurevo AEO 플랜에 대한 최근 결제를 처리하지 못했습니다. Stripe가 며칠 동안 결제를 다시 시도하며, 그동안 사이트는 계속 정상적으로 작동합니다.",
      action: "결제 수단을 변경하려면 대시보드에서 사이트를 열고 \"결제 관리\"를 선택해 주세요.",
      ignore: "이미 변경하셨다면 이 메일은 무시하셔도 됩니다.",
    },
    planEnded: {
      subject: "{site}의 Nurevo AEO 플랜이 종료되었습니다",
      intro: "{site}의 {plan} 플랜이 종료되어 사이트가 Free 플랜으로 전환되었습니다.",
      keepsTitle: "Free 플랜에서도 다음 기능은 계속 이용할 수 있습니다:",
      keeps: [
        "AI 대상 정보 출력 (설치 시점의 기준으로 유지)",
        "AEO 점수 확인",
      ],
      resubscribe: "다시 구독하려면 대시보드에서 사이트를 열고 플랜을 선택해 주세요.",
    },
  },
  es: {
    sign: "Nurevo AEO",
    open: "Abrir tu sitio en el panel",
    welcome: {
      subject: "Siguiente paso para {site} en Nurevo AEO",
      intro: "Gracias por añadir {site} a Nurevo AEO. Con un paso más, los asistentes de IA podrán empezar a leer tu sitio.",
      wp: [
        "En WordPress, ve a Plugins > Añadir nuevo y busca \"Nurevo AEO\".",
        "Instala y activa el plugin.",
        "Abre tu sitio en el panel de Nurevo, copia el código de emparejamiento y pégalo en el plugin.",
      ],
      static: [
        "Abre el panel de tu sitio en Nurevo.",
        "Copia el JSON-LD, el llms.txt y las líneas de robots.txt que aparecen ahí.",
        "Añade el JSON-LD al HTML de la página, llms.txt a la raíz del sitio y las líneas a robots.txt.",
      ],
      hosted: "Tu página de Nurevo está lista. Esta es su URL:",
      hostedAfter: "Enlázala desde tus perfiles y redes sociales. Puedes editar los datos en el panel cuando quieras.",
    },
    reminder: {
      subject1: "{site} aún no está conectado",
      subject2: "Recordatorio: {site} sigue sin conectarse",
      intro: "{site} está en Nurevo AEO, pero el plugin de WordPress aún no se ha conectado. Una comprobación rápida:",
      checklist: [
        "El plugin Nurevo AEO está instalado y activo (Plugins en WordPress).",
        "En Nurevo AEO > Ajustes, \"Generar información para la IA en este sitio\" está activado.",
        "La dirección del sitio en WordPress (Ajustes > Generales) coincide con {site}.",
      ],
      reissue: "Después, pega un código de emparejamiento en el plugin. Si tu código ha caducado, puedes generar uno nuevo aquí:",
      last: "Este es el último recordatorio que te enviaremos sobre esto.",
      unsubscribe: "¿No quieres recibir estos recordatorios? Date de baja aquí:",
    },
    paymentFailed: {
      subject: "No se pudo cobrar el pago de {site}",
      intro: "No hemos podido cobrar el último pago de tu plan de Nurevo AEO para {site}. Stripe volverá a intentarlo durante los próximos días y, mientras tanto, tu sitio sigue funcionando.",
      action: "Para actualizar tu método de pago, abre tu sitio en el panel y elige \"Gestionar pagos\".",
      ignore: "Si ya lo has actualizado, puedes ignorar este correo.",
    },
    planEnded: {
      subject: "Tu plan de Nurevo AEO para {site} ha terminado",
      intro: "Tu plan {plan} para {site} ha terminado y el sitio ahora está en el plan Free.",
      keepsTitle: "Con Free sigues teniendo:",
      keeps: [
        "La información para IA, con los criterios del momento de la instalación",
        "La comprobación de la puntuación AEO",
      ],
      resubscribe: "Para volver a suscribirte, abre tu sitio en el panel y elige un plan.",
    },
  },
  fr: {
    sign: "Nurevo AEO",
    open: "Ouvrir votre site dans le tableau de bord",
    welcome: {
      subject: "Prochaine étape pour {site} sur Nurevo AEO",
      intro: "Merci d’avoir ajouté {site} à Nurevo AEO. Encore une étape, et les assistants IA pourront commencer à lire votre site.",
      wp: [
        "Dans WordPress, allez dans Extensions > Ajouter une extension et recherchez « Nurevo AEO ».",
        "Installez puis activez l’extension.",
        "Ouvrez votre site dans le tableau de bord Nurevo, copiez le code d’appairage et collez-le dans l’extension.",
      ],
      static: [
        "Ouvrez le panneau de votre site dans le tableau de bord Nurevo.",
        "Copiez le JSON-LD, le llms.txt et les lignes robots.txt qui y sont affichés.",
        "Ajoutez le JSON-LD au HTML de la page, llms.txt à la racine du site et les lignes à robots.txt.",
      ],
      hosted: "Votre page Nurevo est prête. Voici son adresse :",
      hostedAfter: "Ajoutez-en le lien sur vos profils et réseaux sociaux. Vous pouvez modifier les informations à tout moment dans le tableau de bord.",
    },
    reminder: {
      subject1: "{site} n’est pas encore connecté",
      subject2: "Rappel : {site} n’est toujours pas connecté",
      intro: "{site} est bien dans Nurevo AEO, mais l’extension WordPress n’est pas encore connectée. Une petite vérification :",
      checklist: [
        "L’extension Nurevo AEO est installée et activée (Extensions dans WordPress).",
        "Dans Nurevo AEO > Réglages, « Générer les informations destinées à l’IA pour ce site » est activé.",
        "L’adresse du site dans WordPress (Réglages > Général) correspond à {site}.",
      ],
      reissue: "Collez ensuite un code d’appairage dans l’extension. Si votre code a expiré, vous pouvez en obtenir un nouveau ici :",
      last: "C’est le dernier rappel que nous vous envoyons à ce sujet.",
      unsubscribe: "Vous ne souhaitez plus recevoir ces rappels ? Désinscrivez-vous ici :",
    },
    paymentFailed: {
      subject: "Échec du paiement pour {site}",
      intro: "Nous n’avons pas pu encaisser le dernier paiement de votre offre Nurevo AEO pour {site}. Stripe va réessayer dans les prochains jours, et votre site continue de fonctionner en attendant.",
      action: "Pour mettre à jour votre moyen de paiement, ouvrez votre site dans le tableau de bord et choisissez « Gérer la facturation ».",
      ignore: "Si vous l’avez déjà mis à jour, vous pouvez ignorer cet e-mail.",
    },
    planEnded: {
      subject: "Votre offre Nurevo AEO pour {site} a pris fin",
      intro: "Votre offre {plan} pour {site} a pris fin, et le site est maintenant sur l’offre Free.",
      keepsTitle: "Avec Free, vous conservez :",
      keeps: [
        "Les informations destinées aux IA, selon les critères en vigueur lors de l’installation",
        "La vérification du score AEO",
      ],
      resubscribe: "Pour vous réabonner, ouvrez votre site dans le tableau de bord et choisissez une offre.",
    },
  },
  de: {
    sign: "Nurevo AEO",
    open: "Website im Dashboard öffnen",
    welcome: {
      subject: "Nächster Schritt für {site} bei Nurevo AEO",
      intro: "Danke, dass Sie {site} zu Nurevo AEO hinzugefügt haben. Noch ein Schritt, dann können KI-Assistenten Ihre Website lesen.",
      wp: [
        "Öffnen Sie in WordPress „Plugins > Installieren“ und suchen Sie nach „Nurevo AEO“.",
        "Installieren und aktivieren Sie das Plugin.",
        "Öffnen Sie Ihre Website im Nurevo-Dashboard, kopieren Sie den Kopplungscode und fügen Sie ihn im Plugin ein.",
      ],
      static: [
        "Öffnen Sie das Panel Ihrer Website im Nurevo-Dashboard.",
        "Kopieren Sie das dort angezeigte JSON-LD, die llms.txt und die robots.txt-Zeilen.",
        "Fügen Sie das JSON-LD in das HTML der Seite ein, die llms.txt in das Stammverzeichnis und die Zeilen in die robots.txt.",
      ],
      hosted: "Ihre Nurevo-Seite ist bereit. Das ist ihre Adresse:",
      hostedAfter: "Verlinken Sie sie in Ihren Profilen und sozialen Netzwerken. Die Angaben können Sie jederzeit im Dashboard ändern.",
    },
    reminder: {
      subject1: "{site} ist noch nicht verbunden",
      subject2: "Erinnerung: {site} ist immer noch nicht verbunden",
      intro: "{site} ist in Nurevo AEO angelegt, aber das WordPress-Plugin ist noch nicht verbunden. Bitte prüfen Sie kurz:",
      checklist: [
        "Das Plugin Nurevo AEO ist installiert und aktiviert (Plugins in WordPress).",
        "Unter „Nurevo AEO > Einstellungen“ ist „KI-relevante Informationen für diese Website ausgeben“ eingeschaltet.",
        "Die Website-Adresse in WordPress (Einstellungen > Allgemein) stimmt mit {site} überein.",
      ],
      reissue: "Fügen Sie danach einen Kopplungscode im Plugin ein. Ist Ihr Code abgelaufen, können Sie hier einen neuen erstellen:",
      last: "Das ist unsere letzte Erinnerung dazu.",
      unsubscribe: "Sie möchten diese Erinnerungen nicht mehr erhalten? Hier abmelden:",
    },
    paymentFailed: {
      subject: "Zahlung für {site} fehlgeschlagen",
      intro: "Die letzte Zahlung für Ihren Nurevo AEO-Tarif für {site} konnte nicht eingezogen werden. Stripe versucht es in den nächsten Tagen erneut; Ihre Website läuft in der Zwischenzeit weiter.",
      action: "Um Ihre Zahlungsmethode zu aktualisieren, öffnen Sie Ihre Website im Dashboard und wählen Sie „Zahlungen verwalten“.",
      ignore: "Wenn Sie sie bereits aktualisiert haben, können Sie diese E-Mail ignorieren.",
    },
    planEnded: {
      subject: "Ihr Nurevo AEO-Tarif für {site} ist beendet",
      intro: "Ihr {plan}-Tarif für {site} ist beendet, und die Website nutzt jetzt den Free-Tarif.",
      keepsTitle: "Mit Free behalten Sie:",
      keeps: [
        "Die Ausgabe für KI, nach den Kriterien zum Zeitpunkt der Installation",
        "Die Prüfung des AEO-Scores",
      ],
      resubscribe: "Um erneut zu abonnieren, öffnen Sie Ihre Website im Dashboard und wählen Sie einen Tarif.",
    },
  },
};

const UNSUBSCRIBE_PAGE = {
  ja: ["リマインダーの配信停止", "接続リマインダーの配信を停止しますか？ お支払いやご契約に関するメールは引き続きお送りします。", "配信を停止する", "配信を停止しました。今後、接続リマインダーはお送りしません。", "このリンクは無効です。"],
  en: ["Unsubscribe from reminders", "Stop connection reminders? Emails about your billing and plan will still be sent.", "Unsubscribe", "You're unsubscribed. We won't send connection reminders any more.", "This link is not valid."],
  zh: ["退订提醒", "要停止接收连接提醒吗？有关账单和方案的邮件仍会照常发送。", "退订", "已退订。我们将不再发送连接提醒。", "此链接无效。"],
  "zh-tw": ["取消訂閱提醒", "要停止接收連線提醒嗎？有關帳單與方案的郵件仍會照常寄送。", "取消訂閱", "已取消訂閱。我們將不再寄送連線提醒。", "此連結無效。"],
  ko: ["알림 수신 거부", "연결 알림을 그만 받으시겠습니까? 결제와 플랜에 관한 메일은 계속 발송됩니다.", "수신 거부", "수신 거부되었습니다. 앞으로 연결 알림을 보내지 않습니다.", "유효하지 않은 링크입니다."],
  es: ["Darse de baja de los recordatorios", "¿Dejar de recibir recordatorios de conexión? Seguirás recibiendo los correos sobre facturación y tu plan.", "Darme de baja", "Te has dado de baja. Ya no te enviaremos recordatorios de conexión.", "Este enlace no es válido."],
  fr: ["Se désinscrire des rappels", "Ne plus recevoir les rappels de connexion ? Les e-mails concernant la facturation et votre offre continueront d’être envoyés.", "Me désinscrire", "C’est fait. Nous ne vous enverrons plus de rappels de connexion.", "Ce lien n’est pas valide."],
  de: ["Erinnerungen abbestellen", "Keine Verbindungserinnerungen mehr erhalten? E-Mails zu Abrechnung und Tarif senden wir weiterhin.", "Abbestellen", "Erledigt. Wir senden Ihnen keine Verbindungserinnerungen mehr.", "Dieser Link ist ungültig."],
};

/** The copy for a locale, falling back to en and then ja. */
export function lifecycleCopy(locale) {
  return COPY[normalizeEmailLocale(locale)] || COPY.en || COPY.ja;
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

function siteLabel(site = {}) {
  const raw = String(site.website_uri || site.url || "").trim();
  if (raw) return raw.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return site.slug ? `nurevo.jp/s/${site.slug}` : "your site";
}

export function siteDashboardUrl(site, origin = DASHBOARD_ORIGIN) {
  return `${origin}/dashboard#site:${encodeURIComponent(site.id)}`;
}

function render(lang, blocks) {
  const text = [];
  const html = [];
  for (const block of blocks) {
    if (block.p) { text.push(block.p); html.push(`<p>${escapeHtml(block.p)}</p>`); }
    if (block.ol) {
      text.push(block.ol.map((item, i) => `${i + 1}. ${item}`).join("\n"));
      html.push(`<ol>${block.ol.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`);
    }
    if (block.ul) {
      text.push(block.ul.map((item) => `- ${item}`).join("\n"));
      html.push(`<ul>${block.ul.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
    }
    if (block.link) {
      text.push(block.label ? `${block.label}\n${block.link}` : block.link);
      html.push(`<p><a href="${escapeHtml(block.link)}">${escapeHtml(block.label || block.link)}</a></p>`);
    }
    if (block.small) {
      text.push(block.small);
      html.push(`<p style="color:#666;font-size:12px">${escapeHtml(block.small)}</p>`);
    }
    if (block.smallLink) {
      text.push(block.smallLink);
      html.push(`<p style="color:#666;font-size:12px"><a href="${escapeHtml(block.smallLink)}">${escapeHtml(block.smallLink)}</a></p>`);
    }
  }
  const htmlLang = lang === "zh-tw" ? "zh-TW" : lang;
  return {
    text: text.join("\n\n"),
    html: `<html lang="${htmlLang}"><body>${html.join("")}</body></html>`,
  };
}

function langOf(locale) {
  const lang = normalizeEmailLocale(locale);
  return COPY[lang] ? lang : "en";
}

export function welcomeEmail({ locale, site, origin = DASHBOARD_ORIGIN }) {
  const lang = langOf(locale);
  const c = lifecycleCopy(lang);
  const vars = { site: siteLabel(site) };
  const blocks = [{ p: fill(c.welcome.intro, vars) }];
  const type = String(site.install_type || "");
  if (type === "wp") blocks.push({ ol: c.welcome.wp.map((s) => fill(s, vars)) });
  else if (type === "hosted") {
    blocks.push({ p: c.welcome.hosted }, { link: site.slug ? `${origin}/s/${site.slug}` : siteDashboardUrl(site, origin) }, { p: c.welcome.hostedAfter });
  } else blocks.push({ ol: c.welcome.static.map((s) => fill(s, vars)) });
  blocks.push({ link: siteDashboardUrl(site, origin), label: c.open }, { p: c.sign });
  return { subject: fill(c.welcome.subject, vars), ...render(lang, blocks) };
}

export function reminderEmail({ locale, site, step, unsubscribeUrl, origin = DASHBOARD_ORIGIN }) {
  const lang = langOf(locale);
  const c = lifecycleCopy(lang);
  const vars = { site: siteLabel(site) };
  const blocks = [
    { p: fill(c.reminder.intro, vars) },
    { ul: c.reminder.checklist.map((s) => fill(s, vars)) },
    { p: c.reminder.reissue },
    { link: siteDashboardUrl(site, origin), label: c.open },
  ];
  if (String(step) === "2") blocks.push({ p: c.reminder.last });
  blocks.push({ p: c.sign });
  if (unsubscribeUrl) blocks.push({ small: c.reminder.unsubscribe }, { smallLink: unsubscribeUrl });
  const subject = fill(String(step) === "2" ? c.reminder.subject2 : c.reminder.subject1, vars);
  return { subject, ...render(lang, blocks) };
}

export function paymentFailedEmail({ locale, site, origin = DASHBOARD_ORIGIN }) {
  const lang = langOf(locale);
  const c = lifecycleCopy(lang);
  const vars = { site: siteLabel(site) };
  return {
    subject: fill(c.paymentFailed.subject, vars),
    ...render(lang, [
      { p: fill(c.paymentFailed.intro, vars) },
      { p: c.paymentFailed.action },
      { link: siteDashboardUrl(site, origin), label: c.open },
      { p: c.paymentFailed.ignore },
      { p: c.sign },
    ]),
  };
}

export function planEndedEmail({ locale, site, previousPlan, origin = DASHBOARD_ORIGIN }) {
  const lang = langOf(locale);
  const c = lifecycleCopy(lang);
  const plan = normalizePlan(previousPlan) === "pro" ? "Pro" : "Standard";
  const vars = { site: siteLabel(site), plan };
  return {
    subject: fill(c.planEnded.subject, vars),
    ...render(lang, [
      { p: fill(c.planEnded.intro, vars) },
      { p: c.planEnded.keepsTitle },
      { ul: c.planEnded.keeps },
      { p: c.planEnded.resubscribe },
      { link: siteDashboardUrl(site, origin), label: c.open },
      { p: c.sign },
    ]),
  };
}

/* ------------------------------------------------------------------ *
 * Who it goes to, and in which language
 * ------------------------------------------------------------------ */

export function mailConfigured(env) {
  return !!(String(env?.RESEND_API_KEY || "").trim() && String(env?.MAIL_FROM || "").trim() && env?.DB);
}

/**
 * The member's stored language: their explicit preference, else the locale
 * they registered with, else the language of their most recent magic link
 * (0037), else en. Any of these lookups may fail on an older schema.
 */
export async function memberEmailLocale(env, member) {
  const email = String(member?.email || "");
  let prefs = {};
  try { prefs = email ? await loadEmailPreferences(env, email) : {}; } catch { prefs = {}; }
  const stored = normalizeEmailLocale(prefs?.language) || normalizeEmailLocale(prefs?.registration_locale);
  if (stored) return stored;
  if (member?.id) {
    try {
      const row = await env.DB.prepare(
        "SELECT locale FROM sessions WHERE member_id=? AND locale IS NOT NULL ORDER BY expires_at DESC LIMIT 1",
      ).bind(member.id).first();
      const fromLink = normalizeEmailLocale(row?.locale);
      if (fromLink) return fromLink;
    } catch { /* 0037 not applied */ }
    try {
      const row = await env.DB.prepare(
        "SELECT t.locale FROM auth_tokens t JOIN accounts a ON a.id=t.account_id WHERE a.member_id=? AND t.locale IS NOT NULL ORDER BY t.expires_at DESC LIMIT 1",
      ).bind(member.id).first();
      const fromLink = normalizeEmailLocale(row?.locale);
      if (fromLink) return fromLink;
    } catch { /* 0037 not applied, or no accounts table */ }
  }
  return "en";
}

/** The site's owner, or failing that the org's first active admin. */
export async function siteRecipient(env, site) {
  if (site?.owner_member_id) {
    const owner = await env.DB.prepare("SELECT id,email,status FROM members WHERE id=? LIMIT 1").bind(site.owner_member_id).first();
    if (owner?.email && owner.status !== "disabled") return owner;
  }
  if (!site?.org_id) return null;
  const fallback = await env.DB.prepare(
    "SELECT id,email,status FROM members WHERE org_id=? AND status='active' ORDER BY CASE WHEN role='admin' THEN 0 ELSE 1 END, created_at LIMIT 1",
  ).bind(site.org_id).first();
  return fallback?.email ? fallback : null;
}

/* ------------------------------------------------------------------ *
 * Idempotency ledger (0038)
 * ------------------------------------------------------------------ */

/**
 * Claim (scope, subject, kind, step) before sending. "claimed" means this call
 * owns the send; "duplicate" means it was claimed before; "unavailable" means
 * the ledger could not be written (0038 unapplied, D1 down) and the email must
 * be skipped, since sending without a claim could repeat.
 */
export async function claimLifecycleEmail(env, { scope, subjectId, kind, step, email, now = Date.now() }) {
  try {
    const result = await env.DB.prepare(
      "INSERT OR IGNORE INTO lifecycle_emails (scope,subject_id,kind,step,email,status,created_at) VALUES (?,?,?,?,?,'claimed',?)",
    ).bind(scope, String(subjectId), kind, String(step), email || null, now).run();
    return Number(result?.meta?.changes || 0) === 1 ? "claimed" : "duplicate";
  } catch (error) {
    console.warn("lifecycle_email_ledger_unavailable", JSON.stringify({ kind, message: String(error?.message || error).slice(0, 200) }));
    return "unavailable";
  }
}

async function settleLifecycleEmail(env, { scope, subjectId, kind, step }, status, detail = null) {
  try {
    await env.DB.prepare(
      "UPDATE lifecycle_emails SET status=?, detail=?, sent_at=? WHERE scope=? AND subject_id=? AND kind=? AND step=?",
    ).bind(status, detail ? String(detail).slice(0, 200) : null, Date.now(), scope, String(subjectId), kind, String(step)).run();
  } catch { /* the claim stands either way, which is what prevents a resend */ }
}

async function releaseLifecycleEmail(env, { scope, subjectId, kind, step }) {
  try {
    await env.DB.prepare("DELETE FROM lifecycle_emails WHERE scope=? AND subject_id=? AND kind=? AND step=? AND status='claimed'")
      .bind(scope, String(subjectId), kind, String(step)).run();
  } catch { /* stays claimed: no resend, which is the safe side */ }
}

/* ------------------------------------------------------------------ *
 * Sending
 * ------------------------------------------------------------------ */

/** POST to Resend. Never throws. */
export async function sendResendEmail(env, { to, subject, text, html, headers, idempotencyKey }) {
  const apiKey = String(env.RESEND_API_KEY || "").trim();
  const from = String(env.MAIL_FROM || "").trim();
  if (!apiKey || !from) return { ok: false, code: "mail_provider_not_configured" };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
      },
      body: JSON.stringify({ from, to: [to], subject, text, html, ...(headers ? { headers } : {}) }),
    });
    if (response.ok) return { ok: true };
    let detail = {};
    try { detail = await response.json(); } catch { detail = {}; }
    return { ok: false, status: response.status, code: detail?.name || `http_${response.status}` };
  } catch (error) {
    return { ok: false, code: "network_error", message: String(error?.message || error) };
  }
}

/**
 * Claim, build, send, record. Returns a short status string and never throws.
 * A 429 from the provider is a definite non-send, so its claim is released for
 * the next run; any other failure keeps the claim (marked failed), because the
 * provider may have accepted the message before the error reached us.
 */
export async function deliverLifecycleEmail(env, { scope, subjectId, kind, step, to, build, headers, optOutCheck = false }) {
  const key = { scope, subjectId, kind, step };
  try {
    if (!mailConfigured(env)) return "not_configured";
    const claim = await claimLifecycleEmail(env, { ...key, email: to || null });
    if (claim !== "claimed") return claim;
    // Recorded rather than skipped, so a site with nobody to write to does not
    // come back in every cron run and use up its limit.
    if (!to) { await settleLifecycleEmail(env, key, "suppressed", "no_recipient"); return "no_recipient"; }
    if (optOutCheck) {
      let opted = true;
      try { opted = await isOptedOut(env, to); } catch { opted = true; }
      if (opted) { await settleLifecycleEmail(env, key, "suppressed", "opted_out"); return "opted_out"; }
    }
    const message = await build();
    const result = await sendResendEmail(env, {
      to, ...message, headers: headers ? await headers() : undefined,
      idempotencyKey: `nurevo-${scope}-${subjectId}-${kind}-${step}`.slice(0, 256),
    });
    if (result.ok) { await settleLifecycleEmail(env, key, "sent"); return "sent"; }
    if (result.status === 429) { await releaseLifecycleEmail(env, key); return "rate_limited"; }
    await settleLifecycleEmail(env, key, "failed", result.code);
    console.error("lifecycle_email_failed", JSON.stringify({ kind, step: String(step), code: result.code }));
    return "failed";
  } catch (error) {
    console.error("lifecycle_email_error", JSON.stringify({ kind, message: String(error?.message || error).slice(0, 200) }));
    await settleLifecycleEmail(env, key, "failed", "exception");
    return "error";
  }
}

/** Run a lifecycle task off the request path when possible; never rejects. */
export function runInBackground(ctx, task) {
  const safe = Promise.resolve().then(task).catch((error) => {
    console.error("lifecycle_email_background_error", JSON.stringify({ message: String(error?.message || error).slice(0, 200) }));
  });
  if (ctx?.waitUntil) { ctx.waitUntil(safe); return undefined; }
  return safe;
}

/* ------------------------------------------------------------------ *
 * 1. Welcome / next step
 * ------------------------------------------------------------------ */

export async function sendWelcomeEmail(env, { memberId, siteId, origin } = {}) {
  if (!mailConfigured(env) || !memberId || !siteId) return "not_configured";
  try {
    // Only the member's first site. Members who created sites before this
    // shipped are not welcomed on their next one.
    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM sites WHERE owner_member_id=?").bind(memberId).first();
    if (Number(count?.n || 0) !== 1) return "not_first_site";
    const site = await env.DB.prepare("SELECT id,org_id,url,website_uri,slug,install_type,owner_member_id FROM sites WHERE id=? LIMIT 1").bind(siteId).first();
    const member = await env.DB.prepare("SELECT id,email,status FROM members WHERE id=? LIMIT 1").bind(memberId).first();
    if (!site || !member?.email) return "no_recipient";
    return await deliverLifecycleEmail(env, {
      scope: "member", subjectId: member.id, kind: "welcome", step: "1", to: member.email,
      build: async () => welcomeEmail({ locale: await memberEmailLocale(env, member), site, origin }),
    });
  } catch (error) {
    console.error("lifecycle_welcome_error", JSON.stringify({ message: String(error?.message || error).slice(0, 200) }));
    return "error";
  }
}

/* ------------------------------------------------------------------ *
 * 3 and 4. Billing
 * ------------------------------------------------------------------ */

const SITE_COLUMNS = "id,org_id,url,website_uri,slug,install_type,owner_member_id,plan,manual_plan,stripe_subscription_id,stripe_customer_id";

/** Which site an invoice or subscription belongs to. */
export async function billingSite(env, { siteId, subscriptionId, customerId }) {
  if (siteId) {
    const row = await env.DB.prepare(`SELECT ${SITE_COLUMNS} FROM sites WHERE id=? LIMIT 1`).bind(siteId).first();
    if (row) return row;
  }
  if (subscriptionId) {
    const row = await env.DB.prepare(`SELECT ${SITE_COLUMNS} FROM sites WHERE stripe_subscription_id=? LIMIT 1`).bind(subscriptionId).first();
    if (row) return row;
  }
  if (customerId) {
    const row = await env.DB.prepare(`SELECT ${SITE_COLUMNS} FROM sites WHERE stripe_customer_id=? LIMIT 1`).bind(customerId).first();
    if (row) return row;
  }
  return null;
}

/** invoice.payment_failed: once per failing invoice, not per Stripe retry. */
export async function sendPaymentFailedEmail(env, { site, invoiceId, origin } = {}) {
  if (!mailConfigured(env) || !site) return "not_configured";
  const member = await siteRecipient(env, site);
  return deliverLifecycleEmail(env, {
    scope: "site", subjectId: site.id, kind: "payment_failed", step: invoiceId || "invoice", to: member?.email,
    build: async () => paymentFailedEmail({ locale: await memberEmailLocale(env, member), site, origin }),
  });
}

/**
 * customer.subscription.deleted: only when the site was on a paid plan before
 * the event and is on Free after it. A manual grant that keeps the site paid
 * means the plan did not end, so nothing is said.
 */
export async function sendPlanEndedEmail(env, { before, after, orgManualPlan = null, subscriptionId, origin } = {}) {
  if (!mailConfigured(env) || !before) return "not_configured";
  const previousPlan = normalizePlan(before.plan);
  if (!["standard", "pro"].includes(previousPlan)) return "was_not_paid";
  const now = resolveSitePlan(after || { ...before, plan: "free" }, { manual_plan: orgManualPlan });
  if (now !== "free") return "still_paid";
  const member = await siteRecipient(env, before);
  return deliverLifecycleEmail(env, {
    scope: "site", subjectId: before.id, kind: "plan_ended", step: subscriptionId || before.stripe_subscription_id || "subscription", to: member?.email,
    build: async () => planEndedEmail({ locale: await memberEmailLocale(env, member), site: before, previousPlan, origin }),
  });
}

/* ------------------------------------------------------------------ *
 * 2. Not connected yet (scheduled)
 * ------------------------------------------------------------------ */

/** The reminder step due for a site created at createdAt, or null. */
export function dueReminderStep(createdAt, now = Date.now()) {
  const age = now - Number(createdAt || 0);
  if (!createdAt || age > REMINDER_WINDOW_MS) return null;
  let due = null;
  for (const { step, afterMs } of REMINDER_STEPS) if (age >= afterMs) due = step;
  return due;
}

/**
 * One bounded pass. A wp site is connected once paired (pairing_code_used_at)
 * or bound (bound_at); either stops the reminders. Sites already handled for
 * their due step are excluded in SQL, so a run never spends its limit on them
 * and a run that stopped half way picks up where it left off without resending.
 * Only the step that is due now is sent: a site first seen at 80 h gets the
 * 72 h reminder alone, so no site ever receives more than two.
 */
export async function runLifecycleReminders(env, { now = Date.now(), limit, spacingMs } = {}) {
  const max = Math.max(1, Math.min(Number(limit || env?.LIFECYCLE_EMAIL_CRON_LIMIT || REMINDER_BATCH_LIMIT), 500));
  const spacing = Number(spacingMs ?? env?.LIFECYCLE_EMAIL_SPACING_MS ?? 550);
  const summary = { considered: 0, sent: 0, failed: 0, suppressed: 0, skipped: null };
  if (!mailConfigured(env)) { summary.skipped = "mail_not_configured"; return summary; }
  if (!String(env.EMAIL_UNSUBSCRIBE_SECRET || "").trim()) { summary.skipped = "unsubscribe_secret_missing"; return summary; }
  const first = now - REMINDER_STEPS[0].afterMs;
  const second = now - REMINDER_STEPS[1].afterMs;
  let rows;
  try {
    ({ results: rows } = await env.DB.prepare(
      `SELECT s.id,s.org_id,s.url,s.website_uri,s.slug,s.install_type,s.owner_member_id,s.created_at FROM sites s
        WHERE s.install_type='wp' AND s.bound_at IS NULL AND s.pairing_code_used_at IS NULL
          AND s.created_at<=? AND s.created_at>=?
          AND NOT EXISTS (SELECT 1 FROM lifecycle_emails e WHERE e.scope='site' AND e.subject_id=s.id
                AND e.kind='not_connected' AND e.step=(CASE WHEN s.created_at<=? THEN '2' ELSE '1' END))
        ORDER BY s.created_at LIMIT ?`,
    ).bind(first, now - REMINDER_WINDOW_MS, second, max).all());
  } catch (error) {
    summary.skipped = /no such table/i.test(String(error?.message || error)) ? "table_missing" : "query_failed";
    console.warn("lifecycle_reminders_skipped", JSON.stringify({ reason: summary.skipped }));
    return summary;
  }
  for (const site of rows || []) {
    const step = dueReminderStep(site.created_at, now);
    if (!step) continue;
    summary.considered += 1;
    let member = null;
    try { member = await siteRecipient(env, site); } catch { member = null; }
    const status = await deliverLifecycleEmail(env, {
      scope: "site", subjectId: site.id, kind: "not_connected", step, to: member?.email, optOutCheck: true,
      build: async () => {
        const locale = await memberEmailLocale(env, member);
        return reminderEmail({ locale, site, step, unsubscribeUrl: await unsubscribeUrl(env, member.email, locale) });
      },
      headers: async () => {
        const link = await unsubscribeUrl(env, member.email);
        return { "List-Unsubscribe": `<${link}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
      },
    });
    if (status === "sent") summary.sent += 1;
    else if (status === "opted_out") summary.suppressed += 1;
    else if (status === "rate_limited") { summary.skipped = "rate_limited"; break; }
    else if (status === "unavailable") { summary.skipped = "table_missing"; break; }
    else if (status === "no_recipient") summary.suppressed += 1;
    else if (status !== "duplicate") summary.failed += 1;
    if (spacing > 0 && status === "sent") await new Promise((resolve) => setTimeout(resolve, spacing));
  }
  return summary;
}

/* ------------------------------------------------------------------ *
 * Unsubscribe
 * ------------------------------------------------------------------ */

const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (value) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4)), (c) => c.charCodeAt(0));

async function unsubscribeMac(secret, email) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`nurevo-unsubscribe-v1:reminders:${email.toLowerCase()}`)));
}

/** <base64url(email)>.<base64url(HMAC-SHA256)>; no expiry, like any unsubscribe link. */
export async function unsubscribeToken(env, email) {
  const secret = String(env.EMAIL_UNSUBSCRIBE_SECRET || "").trim();
  if (!secret || !email) return null;
  const normalized = String(email).trim().toLowerCase();
  return `${b64url(new TextEncoder().encode(normalized))}.${b64url(await unsubscribeMac(secret, normalized))}`;
}

export async function verifyUnsubscribeToken(env, token) {
  const secret = String(env.EMAIL_UNSUBSCRIBE_SECRET || "").trim();
  const [emailPart, macPart, extra] = String(token || "").split(".");
  if (!secret || !emailPart || !macPart || extra !== undefined) return null;
  try {
    const email = new TextDecoder().decode(fromB64url(emailPart));
    const expected = await unsubscribeMac(secret, email);
    const given = fromB64url(macPart);
    if (given.length !== expected.length) return null;
    let diff = 0;
    for (let i = 0; i < given.length; i += 1) diff |= given[i] ^ expected[i];
    return diff === 0 && email.includes("@") ? email : null;
  } catch {
    return null;
  }
}

export async function unsubscribeUrl(env, email, locale) {
  const token = await unsubscribeToken(env, email);
  if (!token) return null;
  const origin = String(env.PUBLIC_ORIGIN || DASHBOARD_ORIGIN).replace(/\/+$/, "");
  const lang = normalizeEmailLocale(locale);
  return `${origin}${UNSUBSCRIBE_PATH}?t=${encodeURIComponent(token)}${lang ? `&l=${encodeURIComponent(lang)}` : ""}`;
}

/** Throws when the table is missing; callers treat that as "do not send". */
export async function isOptedOut(env, email) {
  const row = await env.DB.prepare("SELECT 1 AS x FROM lifecycle_email_opt_outs WHERE email=? AND category='reminders' LIMIT 1")
    .bind(String(email).toLowerCase()).first();
  return !!row;
}

export async function recordOptOut(env, email) {
  await env.DB.prepare("INSERT OR IGNORE INTO lifecycle_email_opt_outs (email,category,created_at) VALUES (?, 'reminders', ?)")
    .bind(String(email).toLowerCase(), Date.now()).run();
}

function unsubscribePage(lang, status, body, action) {
  const [title, prompt, button, done, invalid] = UNSUBSCRIBE_PAGE[lang] || UNSUBSCRIBE_PAGE.en;
  const message = body === "done" ? done : body === "invalid" ? invalid : prompt;
  const form = body === "prompt"
    ? `<form method="post" action="${escapeHtml(action)}"><button type="submit">${escapeHtml(button)}</button></form>`
    : "";
  const htmlLang = lang === "zh-tw" ? "zh-TW" : lang;
  return new Response(
    `<!doctype html><html lang="${htmlLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title><style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 16px;line-height:1.6}button{font:inherit;padding:.5rem 1rem}</style></head><body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>${form}</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } },
  );
}

/**
 * GET shows a confirmation with one button (mail scanners prefetch links, so
 * GET never records anything); POST records the opt-out. RFC 8058 one-click
 * clients POST "List-Unsubscribe=One-Click" to the same URL.
 */
export async function handleUnsubscribe(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== UNSUBSCRIBE_PATH) return null;
  const lang = normalizeEmailLocale(url.searchParams.get("l")) || "en";
  if (!["GET", "POST"].includes(request.method)) return new Response("method_not_allowed", { status: 405, headers: { allow: "GET, POST" } });
  const email = await verifyUnsubscribeToken(env, url.searchParams.get("t"));
  if (!email) return unsubscribePage(lang, 400, "invalid", "");
  if (request.method === "GET") return unsubscribePage(lang, 200, "prompt", `${url.pathname}${url.search}`);
  try {
    await recordOptOut(env, email);
  } catch (error) {
    console.error("lifecycle_unsubscribe_failed", JSON.stringify({ message: String(error?.message || error).slice(0, 200) }));
    return unsubscribePage(lang, 503, "prompt", `${url.pathname}${url.search}`);
  }
  return unsubscribePage(lang, 200, "done", "");
}
