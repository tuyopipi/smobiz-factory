/**
 * Where to actually fix this site.
 *
 * A score tells an operator they have a problem. This tells them which thing
 * to go and change, in the order worth changing it. That ordering is the whole
 * value: eight checks all saying "needs work" is not advice.
 *
 * Every item here comes from something measured or stored - a diagnosis that
 * ran, a profile field that is empty, a property the current criteria score and
 * this site's schema does not carry. Nothing is generated to fill the list. A
 * site with nothing wrong gets an empty list, which is the correct answer and
 * reads better than invented busywork.
 *
 * Pure. The caller supplies the diagnosis, the profile and the criteria.
 */

/**
 * Severity of each source, highest first.
 *
 * A gate check is first because failing one caps the score at 15 however good
 * everything else is - fixing anything else first is wasted work. Then the
 * things that block being understood at all, then the things that improve an
 * answer that already works.
 */
const PRIORITY = Object.freeze({
  gate_blocked: 100,
  schema_missing: 80,
  check_bad: 70,
  criteria_lag: 60,
  profile_missing: 50,
  check_warn: 30,
  stored: 20,
});

/** Checks that cap the score until they pass. Mirrors AEO_CHECKS[].gate. */
const GATE_CHECKS = Object.freeze(["ai_crawlers_allowed", "edge_access", "server_rendered_html"]);

/**
 * What each scored property is called, and what filling it actually does.
 *
 * Keyed by the lowercase property name the scorer tests for. A property with
 * no entry still produces an item - it just carries the raw name, which is
 * better than silently dropping a criterion the site is being marked down on.
 * The words live in COPY below, one block per dashboard language.
 */
const PROPERTY_GUIDE = Object.freeze({
  name: { field: "name" },
  url: { field: "url" },
  address: { field: "address" },
  streetaddress: { field: "address" },
  telephone: { field: "phone" },
  openinghours: { field: "hours" },
  geo: { field: "geo" },
  description: { field: "description" },
  email: { field: "email" },
});

/** The dashboard's eight languages, in the codes this module answers in. */
export const RECOMMENDATION_LANGS = Object.freeze(["ja", "en", "zh", "zh-TW", "ko", "es", "fr", "de"]);

/**
 * Any language tag (?lang, Accept-Language, a diagnosis catalog code such as
 * es-MX or de-CH, or the dashboard's "tw") to one of the eight. Nothing at
 * all means Japanese, which is what this advice always was; anything else
 * unsupported means English.
 */
export function resolveRecommendationLang(requested) {
  const value = String(requested ?? "").trim().toLowerCase().replace(/_/g, "-");
  if (value === "") return "ja";
  const parts = value.split("-");
  if (parts[0] === "tw" || (parts[0] === "zh" && parts.slice(1).some((p) => ["tw", "hk", "mo", "hant"].includes(p)))) return "zh-TW";
  return RECOMMENDATION_LANGS.includes(parts[0]) ? parts[0] : "en";
}

/**
 * The Japanese reasons other jobs store in aeo_site_recommendations, by an id
 * this module translates them under. The geo ones are geocoder's GEO_REASONS;
 * scripts/test-recommendations-i18n.mjs checks all of these against the jobs'
 * source so a reworded job does not silently fall back to Japanese.
 */
export const STORED_REASON_JA = Object.freeze({
  learning_missing: "最新AEO rulesetの必須・推奨schema項目に、顧客確認が必要な店舗情報が不足しています。",
  autofix_missing: "公開情報の不足です。既存データのみ抽出し、不明な事実はオーナーに確認します。",
  geo_imprecise: "住所が番地まで特定できないため、位置情報（geo）を自動で付けていません。番地・建物名まで含む住所を入力すると自動で補完されます。",
  geo_not_found: "住所から位置情報（geo）が見つかりませんでした。住所の表記をご確認ください。",
  geo_error: "位置情報（geo）の取得に一時的に失敗しました。時間をおいて自動で再試行します。",
  geo_unconfigured: "位置情報（geo）の自動補完は現在設定されていません。",
  geo_rate_limited: "位置情報（geo）の取得が本日の上限に達しました。翌日以降に自動で再試行します。",
});

/*
 * The words, per language. Japanese is the original copy and must not change
 * by a byte: scripts/test-recommendations-i18n.mjs holds it to a golden file.
 *
 * props    - [label, why it matters] per scored property
 * fields   - labels for the other profile fields the learning job names
 *            (null: show the label the job stored, as Japanese always has)
 * *Title   - item title builders; *Detail - the sentence after the "why"
 * sep      - what joins the "why" and that sentence
 * stored   - titles of stored rows by kind
 * reasons  - STORED_REASON_JA in this language (null: show as stored)
 */
const COPY = Object.freeze({
  ja: {
    props: {
      name: ["店舗名", "AIが店を特定できません。"],
      url: ["サイトURL", "回答からサイトへ誘導できません。"],
      address: ["住所", "場所を尋ねられても答えられません。"],
      streetaddress: ["住所の構造化（PostalAddress）", "住所が文字列のままだと、AIは番地を文章から推測するしかありません。"],
      telephone: ["電話番号", "連絡手段を答えられません。"],
      openinghours: ["営業時間", "「今開いていますか」に答えられません。"],
      geo: ["緯度・経度", "「近くの店」として検索されにくくなります。"],
      description: ["紹介文", "どんな店かを説明できません。"],
      email: ["メールアドレス", "電話以外の連絡手段を答えられません。"],
    },
    fields: null,
    sep: " ",
    profileTitle: (l) => `${l}を入力`,
    profileDetail: "店舗情報に入力すると出力されます。",
    criteriaTitle: (l) => `${l}が最新基準で出力されていません`,
    criteriaDetail: "値は入力済みです。Standardにすると最新の判定基準に自動追従して出力されます。",
    schemaTitle: (l) => `${l}がschemaに出力されていません`,
    schemaDetail: "値は入力済みです。出力設定を確認してください。",
    stored: { missing_customer_data: "店舗情報の確認が必要です", geo_unresolved: "位置情報（geo）を自動補完できませんでした" },
    reasons: null,
  },
  en: {
    props: {
      name: ["Business name", "AI cannot identify your business."],
      url: ["Website URL", "Answers cannot send people to your site."],
      address: ["Address", "AI cannot say where you are when asked."],
      streetaddress: ["Structured address (PostalAddress)", "While the address is plain text, AI has to guess the street details from the wording."],
      telephone: ["Phone number", "AI cannot tell people how to contact you."],
      openinghours: ["Opening hours", "AI cannot answer “Are you open now?”"],
      geo: ["Latitude and longitude", "You are less likely to come up in “near me” searches."],
      description: ["Description", "AI cannot explain what kind of business you are."],
      email: ["Email address", "AI cannot offer a way to contact you other than by phone."],
    },
    fields: { additionaltype: "Business type", pricerange: "Price range", image: "Image", potentialaction: "Booking URL" },
    sep: " ",
    profileTitle: (l) => `${l} is missing`,
    profileDetail: "It is published once you enter it in your business profile.",
    criteriaTitle: (l) => `${l} is not published to the latest criteria`,
    criteriaDetail: "The value is already entered. On Standard it is published automatically to the latest scoring criteria.",
    schemaTitle: (l) => `${l} is not in your schema`,
    schemaDetail: "The value is already entered. Check your output settings.",
    stored: { missing_customer_data: "Your business details need checking", geo_unresolved: "Location (geo) could not be filled in automatically" },
    reasons: {
      learning_missing: "Business details that need your confirmation are missing from the required and recommended schema items of the latest AEO ruleset.",
      autofix_missing: "Public information is missing. Only existing data is extracted; anything unknown is confirmed with the owner.",
      geo_imprecise: "The address does not go down to the street number, so location (geo) was not added automatically. Enter the address including the street number and building name and it will be filled in automatically.",
      geo_not_found: "No location (geo) was found for the address. Please check how the address is written.",
      geo_error: "Fetching the location (geo) failed temporarily. It will be retried automatically later.",
      geo_unconfigured: "Automatic location (geo) completion is not configured at the moment.",
      geo_rate_limited: "Today’s limit for fetching location (geo) has been reached. It will be retried automatically from tomorrow.",
    },
  },
  zh: {
    props: {
      name: ["店铺名称", "AI 无法识别您的店铺。"],
      url: ["网站 URL", "无法从回答中引导用户访问您的网站。"],
      address: ["地址", "被问到位置时无法回答。"],
      streetaddress: ["结构化地址（PostalAddress）", "地址只是一段文字时，AI 只能从文字中推测门牌号。"],
      telephone: ["电话号码", "无法回答联系方式。"],
      openinghours: ["营业时间", "无法回答“现在营业吗”。"],
      geo: ["经纬度", "更难作为“附近的店”被搜索到。"],
      description: ["简介", "无法说明这是一家什么样的店。"],
      email: ["邮箱地址", "无法回答电话以外的联系方式。"],
    },
    fields: { additionaltype: "行业类型", pricerange: "价格区间", image: "图片", potentialaction: "预约 URL" },
    sep: "",
    profileTitle: (l) => `请填写${l}`,
    profileDetail: "在店铺信息中填写后即会输出。",
    criteriaTitle: (l) => `${l}未按最新标准输出`,
    criteriaDetail: "值已填写。升级到 Standard 后会自动按最新判定标准输出。",
    schemaTitle: (l) => `${l}未输出到 schema`,
    schemaDetail: "值已填写。请检查输出设置。",
    stored: { missing_customer_data: "需要确认店铺信息", geo_unresolved: "无法自动补全位置信息（geo）" },
    reasons: {
      learning_missing: "最新 AEO ruleset 的必需和推荐 schema 项目中，缺少需要您确认的店铺信息。",
      autofix_missing: "公开信息不足。仅提取现有数据，不明确的事实将向店主确认。",
      geo_imprecise: "地址未精确到门牌号，因此未自动添加位置信息（geo）。输入包含门牌号和建筑名称的地址后将自动补全。",
      geo_not_found: "未能根据地址找到位置信息（geo）。请检查地址的写法。",
      geo_error: "获取位置信息（geo）暂时失败。稍后将自动重试。",
      geo_unconfigured: "位置信息（geo）自动补全目前未配置。",
      geo_rate_limited: "今日获取位置信息（geo）已达上限。将于次日起自动重试。",
    },
  },
  "zh-TW": {
    props: {
      name: ["店家名稱", "AI 無法辨識您的店家。"],
      url: ["網站 URL", "無法從回答中引導使用者造訪您的網站。"],
      address: ["地址", "被問到位置時無法回答。"],
      streetaddress: ["結構化地址（PostalAddress）", "地址只是一段文字時，AI 只能從文字中推測門牌號碼。"],
      telephone: ["電話號碼", "無法回答聯絡方式。"],
      openinghours: ["營業時間", "無法回答「現在有營業嗎」。"],
      geo: ["經緯度", "較難以「附近的店」被搜尋到。"],
      description: ["簡介", "無法說明這是一家什麼樣的店。"],
      email: ["電子郵件地址", "無法回答電話以外的聯絡方式。"],
    },
    fields: { additionaltype: "行業類型", pricerange: "價格區間", image: "圖片", potentialaction: "預約 URL" },
    sep: "",
    profileTitle: (l) => `請填寫${l}`,
    profileDetail: "在店家資訊中填寫後即會輸出。",
    criteriaTitle: (l) => `${l}未依最新標準輸出`,
    criteriaDetail: "值已填寫。升級至 Standard 後會自動依最新判定標準輸出。",
    schemaTitle: (l) => `${l}未輸出到 schema`,
    schemaDetail: "值已填寫。請檢查輸出設定。",
    stored: { missing_customer_data: "需要確認店家資訊", geo_unresolved: "無法自動補全位置資訊（geo）" },
    reasons: {
      learning_missing: "最新 AEO ruleset 的必要與建議 schema 項目中，缺少需要您確認的店家資訊。",
      autofix_missing: "公開資訊不足。僅擷取現有資料，不明確的事實將向店主確認。",
      geo_imprecise: "地址未精確到門牌號碼，因此未自動加入位置資訊（geo）。輸入包含門牌號碼與建築名稱的地址後將自動補全。",
      geo_not_found: "無法根據地址找到位置資訊（geo）。請確認地址的寫法。",
      geo_error: "取得位置資訊（geo）暫時失敗。稍後將自動重試。",
      geo_unconfigured: "位置資訊（geo）自動補全目前未設定。",
      geo_rate_limited: "今日取得位置資訊（geo）已達上限。將於隔日起自動重試。",
    },
  },
  ko: {
    props: {
      name: ["매장명", "AI가 매장을 특정할 수 없습니다."],
      url: ["사이트 URL", "답변에서 사이트로 안내할 수 없습니다."],
      address: ["주소", "위치를 물어도 답할 수 없습니다."],
      streetaddress: ["주소 구조화(PostalAddress)", "주소가 문자열 그대로이면 AI는 번지를 문장에서 추측할 수밖에 없습니다."],
      telephone: ["전화번호", "연락 방법을 답할 수 없습니다."],
      openinghours: ["영업시간", "“지금 영업 중인가요?”에 답할 수 없습니다."],
      geo: ["위도·경도", "‘근처 매장’으로 검색되기 어려워집니다."],
      description: ["소개문", "어떤 매장인지 설명할 수 없습니다."],
      email: ["이메일 주소", "전화 외의 연락 방법을 답할 수 없습니다."],
    },
    fields: { additionaltype: "업종", pricerange: "가격대", image: "이미지", potentialaction: "예약 URL" },
    sep: " ",
    profileTitle: (l) => `${l} 입력`,
    profileDetail: "매장 정보에 입력하면 출력됩니다.",
    criteriaTitle: (l) => `${l}: 최신 기준으로 출력되지 않음`,
    criteriaDetail: "값은 입력되어 있습니다. Standard로 변경하면 최신 판정 기준에 자동으로 맞춰 출력됩니다.",
    schemaTitle: (l) => `${l}: schema에 출력되지 않음`,
    schemaDetail: "값은 입력되어 있습니다. 출력 설정을 확인해 주세요.",
    stored: { missing_customer_data: "매장 정보 확인이 필요합니다", geo_unresolved: "위치 정보(geo)를 자동으로 보완하지 못했습니다" },
    reasons: {
      learning_missing: "최신 AEO ruleset의 필수·권장 schema 항목에 고객 확인이 필요한 매장 정보가 부족합니다.",
      autofix_missing: "공개 정보가 부족합니다. 기존 데이터만 추출하며, 불명확한 사실은 오너에게 확인합니다.",
      geo_imprecise: "주소가 번지까지 특정되지 않아 위치 정보(geo)를 자동으로 추가하지 않았습니다. 번지·건물명까지 포함한 주소를 입력하면 자동으로 보완됩니다.",
      geo_not_found: "주소로 위치 정보(geo)를 찾지 못했습니다. 주소 표기를 확인해 주세요.",
      geo_error: "위치 정보(geo)를 가져오는 데 일시적으로 실패했습니다. 잠시 후 자동으로 다시 시도합니다.",
      geo_unconfigured: "위치 정보(geo) 자동 보완은 현재 설정되어 있지 않습니다.",
      geo_rate_limited: "오늘의 위치 정보(geo) 조회 한도에 도달했습니다. 다음 날 이후 자동으로 다시 시도합니다.",
    },
  },
  es: {
    props: {
      name: ["Nombre del negocio", "La IA no puede identificar tu negocio."],
      url: ["URL del sitio", "Las respuestas no pueden llevar a la gente a tu sitio."],
      address: ["Dirección", "La IA no puede decir dónde estás cuando se lo preguntan."],
      streetaddress: ["Dirección estructurada (PostalAddress)", "Si la dirección es solo texto, la IA tiene que deducir la calle y el número a partir de él."],
      telephone: ["Teléfono", "La IA no puede decir cómo contactarte."],
      openinghours: ["Horario", "La IA no puede responder «¿Está abierto ahora?»."],
      geo: ["Latitud y longitud", "Es menos probable que aparezcas en búsquedas «cerca de mí»."],
      description: ["Descripción", "La IA no puede explicar qué tipo de negocio eres."],
      email: ["Correo electrónico", "La IA no puede ofrecer otra forma de contacto que el teléfono."],
    },
    fields: { additionaltype: "Tipo de negocio", pricerange: "Rango de precios", image: "Imagen", potentialaction: "URL de reserva" },
    sep: " ",
    profileTitle: (l) => `Falta: ${l}`,
    profileDetail: "Se publicará en cuanto lo introduzcas en la información del negocio.",
    criteriaTitle: (l) => `${l}: no se publica según los criterios más recientes`,
    criteriaDetail: "El valor ya está introducido. Con Standard se publica siguiendo automáticamente los criterios de puntuación más recientes.",
    schemaTitle: (l) => `${l}: no aparece en el schema`,
    schemaDetail: "El valor ya está introducido. Revisa la configuración de salida.",
    stored: { missing_customer_data: "Hay que revisar la información del negocio", geo_unresolved: "No se pudo completar automáticamente la ubicación (geo)" },
    reasons: {
      learning_missing: "Faltan datos del negocio que necesitan tu confirmación en los elementos de schema obligatorios y recomendados del ruleset AEO más reciente.",
      autofix_missing: "Falta información pública. Solo se extraen datos existentes; lo que no se sabe se confirma con el propietario.",
      geo_imprecise: "La dirección no llega al número de la calle, así que no se añadió la ubicación (geo) automáticamente. Introduce la dirección con el número y el nombre del edificio y se completará sola.",
      geo_not_found: "No se encontró la ubicación (geo) a partir de la dirección. Revisa cómo está escrita.",
      geo_error: "No se pudo obtener la ubicación (geo) por un fallo temporal. Se volverá a intentar automáticamente más tarde.",
      geo_unconfigured: "El completado automático de la ubicación (geo) no está configurado por ahora.",
      geo_rate_limited: "Se alcanzó el límite diario para obtener la ubicación (geo). Se volverá a intentar automáticamente a partir de mañana.",
    },
  },
  fr: {
    props: {
      name: ["Nom de l’établissement", "L’IA ne peut pas identifier votre établissement."],
      url: ["URL du site", "Les réponses ne peuvent pas renvoyer vers votre site."],
      address: ["Adresse", "L’IA ne peut pas indiquer où vous trouver."],
      streetaddress: ["Adresse structurée (PostalAddress)", "Tant que l’adresse reste du texte libre, l’IA doit deviner la rue et le numéro."],
      telephone: ["Numéro de téléphone", "L’IA ne peut pas indiquer comment vous contacter."],
      openinghours: ["Horaires d’ouverture", "L’IA ne peut pas répondre à « Est-ce ouvert maintenant ? »."],
      geo: ["Latitude et longitude", "Vous apparaîtrez moins dans les recherches « à proximité »."],
      description: ["Description", "L’IA ne peut pas expliquer quel type d’établissement vous êtes."],
      email: ["Adresse e-mail", "L’IA ne peut proposer aucun autre moyen de contact que le téléphone."],
    },
    fields: { additionaltype: "Type d’activité", pricerange: "Gamme de prix", image: "Image", potentialaction: "URL de réservation" },
    sep: " ",
    profileTitle: (l) => `À renseigner : ${l}`,
    profileDetail: "Il sera publié dès que vous le renseignerez dans les informations de l’établissement.",
    criteriaTitle: (l) => `${l} : non publié selon les critères les plus récents`,
    criteriaDetail: "La valeur est déjà renseignée. Avec Standard, elle est publiée en suivant automatiquement les critères de notation les plus récents.",
    schemaTitle: (l) => `${l} : absent du schema`,
    schemaDetail: "La valeur est déjà renseignée. Vérifiez les paramètres de publication.",
    stored: { missing_customer_data: "Les informations de l’établissement doivent être vérifiées", geo_unresolved: "La position (geo) n’a pas pu être complétée automatiquement" },
    reasons: {
      learning_missing: "Des informations sur l’établissement nécessitant votre confirmation manquent dans les éléments de schema obligatoires et recommandés du dernier ruleset AEO.",
      autofix_missing: "Des informations publiques manquent. Seules les données existantes sont extraites ; tout fait inconnu est confirmé auprès du propriétaire.",
      geo_imprecise: "L’adresse ne précise pas le numéro de rue, la position (geo) n’a donc pas été ajoutée automatiquement. Saisissez l’adresse avec le numéro et le nom du bâtiment pour qu’elle soit complétée automatiquement.",
      geo_not_found: "Aucune position (geo) n’a été trouvée pour cette adresse. Vérifiez sa rédaction.",
      geo_error: "La récupération de la position (geo) a échoué temporairement. Elle sera retentée automatiquement plus tard.",
      geo_unconfigured: "Le complément automatique de la position (geo) n’est pas configuré pour le moment.",
      geo_rate_limited: "La limite quotidienne de récupération de la position (geo) est atteinte. Elle sera retentée automatiquement à partir de demain.",
    },
  },
  de: {
    props: {
      name: ["Name des Geschäfts", "Die KI kann Ihr Geschäft nicht eindeutig erkennen."],
      url: ["Website-URL", "Antworten können nicht auf Ihre Website verweisen."],
      address: ["Adresse", "Die KI kann auf die Frage nach Ihrem Standort nicht antworten."],
      streetaddress: ["Strukturierte Adresse (PostalAddress)", "Solange die Adresse reiner Text ist, muss die KI Straße und Hausnummer aus dem Text erraten."],
      telephone: ["Telefonnummer", "Die KI kann nicht sagen, wie man Sie erreicht."],
      openinghours: ["Öffnungszeiten", "Die KI kann „Haben Sie gerade geöffnet?“ nicht beantworten."],
      geo: ["Breiten- und Längengrad", "Sie erscheinen seltener bei Suchen nach „in der Nähe“."],
      description: ["Beschreibung", "Die KI kann nicht erklären, was für ein Geschäft Sie sind."],
      email: ["E-Mail-Adresse", "Die KI kann keinen anderen Kontaktweg als das Telefon nennen."],
    },
    fields: { additionaltype: "Branche", pricerange: "Preisspanne", image: "Bild", potentialaction: "Buchungs-URL" },
    sep: " ",
    profileTitle: (l) => `${l} eintragen`,
    profileDetail: "Sobald Sie es in den Geschäftsdaten eintragen, wird es ausgegeben.",
    criteriaTitle: (l) => `${l} wird nicht nach den neuesten Kriterien ausgegeben`,
    criteriaDetail: "Der Wert ist bereits eingetragen. Mit Standard wird er automatisch nach den neuesten Bewertungskriterien ausgegeben.",
    schemaTitle: (l) => `${l} fehlt im Schema`,
    schemaDetail: "Der Wert ist bereits eingetragen. Prüfen Sie die Ausgabeeinstellungen.",
    stored: { missing_customer_data: "Ihre Geschäftsdaten müssen geprüft werden", geo_unresolved: "Der Standort (geo) konnte nicht automatisch ergänzt werden" },
    reasons: {
      learning_missing: "In den Pflicht- und empfohlenen Schema-Angaben des neuesten AEO-Rulesets fehlen Geschäftsdaten, die Sie bestätigen müssen.",
      autofix_missing: "Öffentliche Informationen fehlen. Es werden nur vorhandene Daten übernommen; Unbekanntes wird beim Inhaber erfragt.",
      geo_imprecise: "Die Adresse nennt keine Hausnummer, daher wurde der Standort (geo) nicht automatisch ergänzt. Geben Sie die Adresse mit Hausnummer und Gebäudename ein, dann wird er automatisch ergänzt.",
      geo_not_found: "Zur Adresse wurde kein Standort (geo) gefunden. Bitte prüfen Sie die Schreibweise der Adresse.",
      geo_error: "Der Standort (geo) konnte vorübergehend nicht abgerufen werden. Es wird später automatisch erneut versucht.",
      geo_unconfigured: "Die automatische Ergänzung des Standorts (geo) ist derzeit nicht eingerichtet.",
      geo_rate_limited: "Das Tageslimit für den Abruf des Standorts (geo) ist erreicht. Ab morgen wird automatisch erneut versucht.",
    },
  },
});

/** Exposed for the completeness test. */
export const RECOMMENDATION_COPY = COPY;

const REASON_ID_BY_JA = new Map(Object.entries(STORED_REASON_JA).map(([id, ja]) => [ja, id]));

const text = (value) => String(value == null ? "" : value).trim();

/** A field the learning job named, in the asked language when it is known. */
function fieldLabel(copy, field) {
  const schema = text(field?.schema).toLowerCase();
  const known = copy.fields && (copy.fields[schema] || copy.props[schema]?.[0]);
  return known || text(field?.label) || text(field?.key);
}

/**
 * Which scored properties this site's published schema does not carry.
 *
 * `publishedProps` is what the diagnosis found. Anything the criteria score and
 * the page does not publish is a concrete, named gap - and the most useful kind
 * of advice we can give, because it is exactly what the score deducted for.
 */
export function missingScoredProps(scoredProps = [], publishedProps = []) {
  const published = new Set((publishedProps || []).map((p) => text(p).toLowerCase()));
  return (scoredProps || [])
    .map((p) => text(p).toLowerCase())
    .filter(Boolean)
    .filter((p) => !published.has(p));
}

/**
 * Build the list.
 *
 * checks        - the latest diagnosis, localised: [{ id, status, label, message }]
 * profile       - the canonical store profile, to say whether a gap is a
 *                 missing value or a missing output
 * scoredProps   - what the criteria in force score
 * publishedProps- what this site's schema was found to publish
 * plan          - the site's tier, so criteria lag can be named as such
 * stored        - rows from aeo_site_recommendations
 */
export function buildSiteRecommendations({
  checks = [],
  profile = {},
  scoredProps = [],
  publishedProps = [],
  plan = "free",
  stored = [],
  lang,
} = {}) {
  // lang: any tag; omitted means Japanese, the original and default wording.
  const copy = COPY[resolveRecommendationLang(lang)];
  const label = (prop) => copy.props[prop]?.[0] || prop;
  const why = (prop) => copy.props[prop]?.[1] || "";
  const joined = (first, second) => (first ? `${first}${copy.sep}${second}` : second);
  const items = [];
  const seen = new Set();
  const push = (item) => {
    const key = `${item.kind}:${item.target || item.id || ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  };

  /* -------- failing checks, gates first -------- */

  for (const check of Array.isArray(checks) ? checks : []) {
    const id = text(check?.id);
    const status = text(check?.status).toUpperCase();
    if (!id || (status !== "BAD" && status !== "WARN")) continue;
    // A check we could not run (e.g. the edge probe timed out) has nothing for
    // the owner to fix; it is reported in the checklist, not as advice.
    if (check?.unknown === true) continue;
    const gate = GATE_CHECKS.includes(id);
    push({
      kind: gate && status === "BAD" ? "gate_blocked" : status === "BAD" ? "check_bad" : "check_warn",
      id,
      target: id,
      priority: gate && status === "BAD" ? PRIORITY.gate_blocked : status === "BAD" ? PRIORITY.check_bad : PRIORITY.check_warn,
      title: text(check?.label) || id,
      detail: text(check?.message),
      // A gate failure is worth saying out loud: nothing else moves the score
      // until it passes.
      blocking: gate && status === "BAD",
      status,
    });
  }

  /* -------- properties the criteria score and the page does not publish -------- */

  for (const prop of missingScoredProps(scoredProps, publishedProps)) {
    const guide = PROPERTY_GUIDE[prop];
    const field = guide?.field;
    const value = field ? profile?.[field] : undefined;
    const hasValue = field === "geo"
      ? profile?.lat != null && profile?.lng != null
      : text(value) !== "";
    // Two quite different problems wearing the same symptom. If the operator
    // never entered the value, telling them to "publish it" is useless; if
    // they did, the value is sitting in the profile and the site is simply not
    // entitled to publish it yet.
    if (!hasValue) {
      push({
        kind: "profile_missing",
        id: `profile:${prop}`,
        target: prop,
        priority: PRIORITY.profile_missing,
        title: copy.profileTitle(label(prop)),
        detail: joined(why(prop), copy.profileDetail),
        field: field || null,
        status: "BAD",
      });
    } else if (plan === "free") {
      push({
        kind: "criteria_lag",
        id: `criteria:${prop}`,
        target: prop,
        priority: PRIORITY.criteria_lag,
        title: copy.criteriaTitle(label(prop)),
        detail: joined(why(prop), copy.criteriaDetail),
        field: field || null,
        upgrade: "standard",
        status: "WARN",
      });
    } else {
      push({
        kind: "schema_missing",
        id: `schema:${prop}`,
        target: prop,
        priority: PRIORITY.schema_missing,
        title: copy.schemaTitle(label(prop)),
        detail: joined(why(prop), copy.schemaDetail),
        field: field || null,
        status: "BAD",
      });
    }
  }

  /* -------- what the learning job recorded -------- */

  for (const row of Array.isArray(stored) ? stored : []) {
    let detail = {};
    try { detail = typeof row?.detail_json === "string" ? JSON.parse(row.detail_json) : (row?.detail_json || {}); } catch { detail = {}; }
    const missing = Array.isArray(detail.missing_fields) ? detail.missing_fields : [];
    // Everything this row names is already covered, item by item, by the two
    // passes above - so adding it again would pad the list rather than inform
    // it. It only earns a place when it says something they did not.
    if (missing.length && missing.every((field) => seen.has(`profile_missing:${text(field?.schema).toLowerCase()}`))) continue;
    push({
      kind: "stored",
      id: `stored:${text(row?.kind) || "recommendation"}`,
      target: text(row?.kind),
      priority: PRIORITY.stored,
      title: Object.hasOwn(copy.stored, text(row?.kind)) ? copy.stored[text(row?.kind)] : text(row?.kind),
      // The jobs store their reason in Japanese. A known one is given in the
      // asked language; anything else is shown as stored.
      detail: copy.reasons?.[REASON_ID_BY_JA.get(text(detail.reason))] || text(detail.reason),
      fields: missing.map((field) => fieldLabel(copy, field)).filter(Boolean),
      status: "WARN",
    });
  }

  items.sort((a, b) => b.priority - a.priority || String(a.id).localeCompare(String(b.id)));
  return {
    plan,
    count: items.length,
    blocking: items.filter((item) => item.blocking).length,
    scored_props: (scoredProps || []).map((p) => text(p).toLowerCase()).filter(Boolean),
    items,
  };
}
