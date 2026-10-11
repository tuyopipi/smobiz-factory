export const ENTITY_SCHEMA_FIELDS = Object.freeze({
  "LocalBusiness": {
    "name": true,
    "address": true,
    "telephone": true,
    "openingHoursSpecification": true,
    "geo": true,
    "priceRange": true,
    "url": true,
    "sameAs": true
  },
  "Product": {
    "name": true,
    "image": true,
    "description": true,
    "brand": true,
    "sku": true,
    "offers.price": true,
    "offers.priceCurrency": true,
    "offers.availability": true,
    "aggregateRating": true
  },
  "Service": {
    "name": true,
    "description": true,
    "provider": true,
    "areaServed": true,
    "serviceType": true,
    "offers.price": true
  },
  "Article": {
    "headline": true,
    "author": true,
    "datePublished": true,
    "dateModified": true,
    "image": true,
    "publisher": true
  },
  "WebSite": {
    "name": true,
    "url": true
  },
  "FAQPage": {
    "mainEntity": true
  },
  "Organization": {
    "sameAs": true
  }
});
const KEYS = ["name", "address", "telephone", "openingHoursSpecification", "geo", "priceRange", "url", "sameAs", "image", "description", "brand", "sku", "offers.price", "offers.priceCurrency", "offers.availability", "aggregateRating", "provider", "areaServed", "serviceType", "headline", "author", "datePublished", "dateModified", "publisher", "mainEntity"];
const MEANINGS = {
  ja: '正式な名称。|所在地の住所。|連絡用の電話番号。|曜日ごとの営業日時。|所在地の緯度と経度。|おおよその価格帯。|公式ページのURL。|同じ事業者を示す公式SNS等のURL。|商品や記事を表す画像のURL。|商品やサービスの内容説明。|商品のブランド名。|商品を識別する管理コード。|販売・提供価格（無料は0）。|価格の通貨コード（JPY等）。|在庫・販売可否（InStock等）。|実際のレビューに基づく評価と件数。|サービスを提供する事業者。|サービスを提供する地域。|提供するサービスの種類。|記事のタイトル。|記事を書いた人・組織。|記事を公開した日時。|記事を最後に更新した日時。|記事を発行する組織。|質問とそれに対応する回答。',
  en: 'Official name.|Postal address of the location.|Contact phone number.|Opening times for each day.|Latitude and longitude of the location.|Approximate price range.|URL of the official page.|Official social or profile URLs identifying the same business.|URL of an image depicting the product or article.|Description of the product or service.|Product brand name.|Inventory code identifying the product.|Sale or service price (0 for free).|Currency code for the price, such as JPY.|Stock or sale status, such as InStock.|Rating and count based on real reviews.|Business providing the service.|Geographic area served.|Kind of service offered.|Title of the article.|Person or organization that wrote the article.|Date and time the article was published.|Date and time of the last article update.|Organization publishing the article.|Questions with their corresponding answers.',
  zh: '正式名称。|所在地的邮政地址。|联系电话。|每天的营业时间。|所在地的纬度和经度。|大致价格范围。|官方页面网址。|标识同一企业的官方社交或资料网址。|商品或文章的图片网址。|商品或服务的内容描述。|商品品牌名称。|识别商品的库存编号。|销售或服务价格（免费为0）。|价格的货币代码，如JPY。|库存或销售状态，如InStock。|基于真实评论的评分和数量。|提供服务的企业。|服务覆盖地区。|提供的服务类型。|文章标题。|撰写文章的个人或组织。|文章发布日期和时间。|文章最后更新日期和时间。|发布文章的组织。|问题及其对应答案。',
  'zh-TW': '正式名稱。|所在地的郵政地址。|聯絡電話。|每天的營業時間。|所在地的緯度與經度。|大致價格範圍。|官方頁面網址。|識別同一企業的官方社群或資料網址。|商品或文章的圖片網址。|商品或服務的內容描述。|商品品牌名稱。|識別商品的庫存編號。|銷售或服務價格（免費為0）。|價格的貨幣代碼，如JPY。|庫存或銷售狀態，如InStock。|基於真實評論的評分與數量。|提供服務的企業。|服務涵蓋地區。|提供的服務類型。|文章標題。|撰寫文章的個人或組織。|文章發布日期與時間。|文章最後更新日期與時間。|發布文章的組織。|問題及其對應答案。',
  ko: '공식 이름.|소재지 우편 주소.|연락 전화번호.|요일별 영업시간.|소재지 위도와 경도.|대략적인 가격 범위.|공식 페이지 URL.|동일 업체를 식별하는 공식 SNS 또는 프로필 URL.|상품이나 글을 나타내는 이미지 URL.|상품 또는 서비스 설명.|상품 브랜드명.|상품을 식별하는 재고 코드.|판매 또는 서비스 가격(무료는 0).|JPY 등의 가격 통화 코드.|InStock 등의 재고 또는 판매 상태.|실제 리뷰 기반 평점과 리뷰 수.|서비스 제공 업체.|서비스 제공 지역.|제공하는 서비스 종류.|글 제목.|글을 작성한 사람 또는 조직.|글 게시 날짜와 시간.|글의 마지막 수정 날짜와 시간.|글을 발행하는 조직.|질문과 해당 답변.',
  es: 'Nombre oficial.|Dirección postal del lugar.|Teléfono de contacto.|Horario de apertura por día.|Latitud y longitud del lugar.|Rango aproximado de precios.|URL de la página oficial.|URLs oficiales de redes o perfiles de la misma empresa.|URL de una imagen del producto o artículo.|Descripción del producto o servicio.|Marca del producto.|Código de inventario que identifica el producto.|Precio de venta o servicio (0 si es gratis).|Código de moneda del precio, como JPY.|Estado de stock o venta, como InStock.|Valoración y cantidad basadas en reseñas reales.|Empresa que presta el servicio.|Área geográfica atendida.|Clase de servicio ofrecido.|Título del artículo.|Persona u organización que escribió el artículo.|Fecha y hora de publicación del artículo.|Fecha y hora de la última actualización.|Organización que publica el artículo.|Preguntas con sus respuestas correspondientes.',
  fr: 'Nom officiel.|Adresse postale du lieu.|Numéro de téléphone de contact.|Horaires d’ouverture par jour.|Latitude et longitude du lieu.|Gamme de prix approximative.|URL de la page officielle.|URLs de profils ou réseaux officiels de la même entreprise.|URL d’une image du produit ou de l’article.|Description du produit ou du service.|Marque du produit.|Code de stock identifiant le produit.|Prix de vente ou du service (0 si gratuit).|Code de devise du prix, comme JPY.|État du stock ou de la vente, comme InStock.|Note et nombre fondés sur des avis réels.|Entreprise fournissant le service.|Zone géographique desservie.|Type de service proposé.|Titre de l’article.|Personne ou organisation ayant écrit l’article.|Date et heure de publication de l’article.|Date et heure de la dernière mise à jour.|Organisation publiant l’article.|Questions et leurs réponses correspondantes.',
  de: 'Offizieller Name.|Postanschrift des Standorts.|Telefonnummer für Kontakt.|Öffnungszeiten pro Wochentag.|Breiten- und Längengrad des Standorts.|Ungefähre Preisspanne.|URL der offiziellen Seite.|Offizielle Profil- oder Social-Media-URLs desselben Unternehmens.|URL eines Bildes zum Produkt oder Artikel.|Beschreibung des Produkts oder Dienstes.|Markenname des Produkts.|Bestandscode zur Identifikation des Produkts.|Verkaufs- oder Dienstpreis (0 bei kostenlos).|Währungscode des Preises, etwa JPY.|Bestands- oder Verkaufsstatus, etwa InStock.|Bewertung und Anzahl aus echten Rezensionen.|Unternehmen, das den Dienst anbietet.|Geografisches Servicegebiet.|Art des angebotenen Dienstes.|Titel des Artikels.|Person oder Organisation, die den Artikel verfasst hat.|Datum und Uhrzeit der Veröffentlichung.|Datum und Uhrzeit der letzten Aktualisierung.|Organisation, die den Artikel veröffentlicht.|Fragen mit den zugehörigen Antworten.'
};
const LABELS = {
  "ja": "名称|住所|電話番号|営業時間|位置情報|価格帯|URL|公式プロフィール|画像|説明|ブランド|商品コード|価格|通貨|在庫状況|総合評価|提供者|提供地域|サービス種別|見出し|著者|公開日|更新日|発行者|質問と回答",
  "en": "Name|Address|Phone|Opening hours|Location|Price range|URL|Official profiles|Image|Description|Brand|SKU|Price|Currency|Availability|Rating|Provider|Service area|Service type|Headline|Author|Publication date|Modification date|Publisher|Questions and answers",
  "zh": "名称|地址|电话号码|营业时间|位置|价格范围|网址|官方资料|图片|描述|品牌|商品编号|价格|货币|库存状态|综合评分|提供者|服务地区|服务类型|标题|作者|发布日期|修改日期|发布者|问题与回答",
  "zh-TW": "名稱|地址|電話號碼|營業時間|位置|價格範圍|網址|官方資料|圖片|描述|品牌|商品編號|價格|貨幣|庫存狀態|綜合評分|提供者|服務地區|服務類型|標題|作者|發布日期|修改日期|發布者|問題與回答",
  "ko": "이름|주소|전화번호|영업시간|위치|가격대|URL|공식 프로필|이미지|설명|브랜드|상품 코드|가격|통화|재고 상태|평점|제공자|서비스 지역|서비스 유형|제목|작성자|게시일|수정일|발행자|질문과 답변",
  "es": "Nombre|Dirección|Teléfono|Horario|Ubicación|Rango de precios|URL|Perfiles oficiales|Imagen|Descripción|Marca|SKU|Precio|Moneda|Disponibilidad|Valoración|Proveedor|Área de servicio|Tipo de servicio|Titular|Autor|Fecha de publicación|Fecha de modificación|Editor|Preguntas y respuestas",
  "fr": "Nom|Adresse|Téléphone|Horaires|Localisation|Gamme de prix|URL|Profils officiels|Image|Description|Marque|SKU|Prix|Devise|Disponibilité|Évaluation|Prestataire|Zone desservie|Type de service|Titre|Auteur|Date de publication|Date de modification|Éditeur|Questions et réponses",
  "de": "Name|Adresse|Telefon|Öffnungszeiten|Standort|Preisspanne|URL|Offizielle Profile|Bild|Beschreibung|Marke|Artikelnummer|Preis|Währung|Verfügbarkeit|Bewertung|Anbieter|Servicegebiet|Serviceart|Überschrift|Autor|Veröffentlichungsdatum|Änderungsdatum|Herausgeber|Fragen und Antworten"
};
const TEXT = {
  "ja": [
    "{label}をAIに伝える公開データです。",
    "Nurevo → 設定 → 店舗・組織情報で設定し、該当ページに公開してください。",
    "WooCommerce → 商品編集で設定してください。評価は実際のレビューから出力されます。",
    "Nurevo → 設定 → 予約可能なサービスと掲載ページで設定してください。",
    "WordPress → 投稿編集とSEOプラグインの設定で公開してください。",
    "Nurevo → 設定 → よくある質問で質問と回答を設定してください。",
    "{filled}/{total}項目を公開しています。",
    "本文に名称・説明を明記し、見出しとFAQを追加してください。"
  ],
  "en": [
    "Published data that tells AI the {label}.",
    "Set this in Nurevo → Business information and publish it on the relevant page.",
    "Set this in WooCommerce → Edit product. Ratings come from real reviews.",
    "Set this in Nurevo → Services and the service page.",
    "Publish this in WordPress → Edit post and your SEO plugin settings.",
    "Add questions and answers in Nurevo → FAQ.",
    "{filled}/{total} fields published.",
    "State the name and description in page text; add headings and FAQ."
  ],
  "zh": [
    "向AI提供{label}的公开数据。",
    "在 Nurevo → 基本信息中设置并发布到相关页面。",
    "在 WooCommerce → 编辑商品中设置。评分来自真实评论。",
    "在 Nurevo → 服务及服务页面中设置。",
    "在 WordPress → 编辑文章及SEO插件中发布。",
    "在 Nurevo → FAQ 中添加问题和回答。",
    "已发布 {filled}/{total} 项。",
    "在正文中写明名称和描述，并添加标题和FAQ。"
  ],
  "zh-TW": [
    "向AI提供{label}的公開資料。",
    "在 Nurevo → 基本資訊中設定並發布到相關頁面。",
    "在 WooCommerce → 編輯商品中設定。評分來自真實評論。",
    "在 Nurevo → 服務及服務頁面中設定。",
    "在 WordPress → 編輯文章及SEO外掛中發布。",
    "在 Nurevo → FAQ 中新增問題與回答。",
    "已發布 {filled}/{total} 項。",
    "在內文中寫明名稱和描述，並新增標題和FAQ。"
  ],
  "ko": [
    "AI에 {label} 정보를 제공하는 공개 데이터입니다.",
    "Nurevo → 기본 정보에서 설정하고 해당 페이지에 게시하세요.",
    "WooCommerce → 상품 편집에서 설정하세요. 평점은 실제 리뷰에서 생성됩니다.",
    "Nurevo → 서비스와 서비스 페이지에서 설정하세요.",
    "WordPress → 글 편집 및 SEO 플러그인 설정에서 게시하세요.",
    "Nurevo → FAQ에서 질문과 답변을 추가하세요.",
    "{filled}/{total}개 항목이 게시되었습니다.",
    "본문에 이름과 설명을 명시하고 제목과 FAQ를 추가하세요."
  ],
  "es": [
    "Datos publicados que indican a la IA: {label}.",
    "Configúralo en Nurevo → Información del negocio y publícalo en la página correspondiente.",
    "Configúralo en WooCommerce → Editar producto. Las valoraciones proceden de reseñas reales.",
    "Configúralo en Nurevo → Servicios y en la página del servicio.",
    "Publícalo en WordPress → Editar entrada y en tu plugin SEO.",
    "Añade preguntas y respuestas en Nurevo → FAQ.",
    "{filled}/{total} campos publicados.",
    "Escribe el nombre y la descripción en el texto; añade encabezados y FAQ."
  ],
  "fr": [
    "Données publiées indiquant à l’IA : {label}.",
    "Configurez ce champ dans Nurevo → Informations de l’entreprise et publiez-le sur la page concernée.",
    "Configurez ce champ dans WooCommerce → Modifier le produit. Les notes proviennent d’avis réels.",
    "Configurez ce champ dans Nurevo → Services et sur la page du service.",
    "Publiez ce champ dans WordPress → Modifier l’article et votre extension SEO.",
    "Ajoutez les questions et réponses dans Nurevo → FAQ.",
    "{filled}/{total} champs publiés.",
    "Indiquez le nom et la description dans le texte ; ajoutez des titres et une FAQ."
  ],
  "de": [
    "Veröffentlichte Daten informieren KI über: {label}.",
    "In Nurevo → Unternehmensinformationen einstellen und auf der entsprechenden Seite veröffentlichen.",
    "In WooCommerce → Produkt bearbeiten einstellen. Bewertungen stammen aus echten Rezensionen.",
    "In Nurevo → Dienstleistungen und auf der Serviceseite einstellen.",
    "In WordPress → Beitrag bearbeiten und im SEO-Plugin veröffentlichen.",
    "Fragen und Antworten in Nurevo → FAQ hinzufügen.",
    "{filled}/{total} Felder veröffentlicht.",
    "Name und Beschreibung im Text angeben; Überschriften und FAQ ergänzen."
  ]
};
export function fieldLang(requested) {
  const lang = String(requested || 'en').replace('_','-').toLowerCase();
  return lang === 'zh-tw' || lang === 'zh-hant' ? 'zh-TW' : LABELS[lang] ? lang : LABELS[lang.split('-')[0]] ? lang.split('-')[0] : 'en';
}
export function localizeFields(fields, requested) {
  const lang = fieldLang(requested), labels = LABELS[lang].split('|'), text = TEXT[lang];
  return fields.map(item => {
    const key = item.field === 'openingHours' || item.field === 'openinghours' ? 'openingHoursSpecification' : item.field;
    const index = KEYS.indexOf(key);
    const label = labels[index] || item.field;
    const hint = item.entityType === 'Product' ? 2 : item.entityType === 'Service' ? 3 : item.entityType === 'Article' ? 4 : item.entityType === 'FAQPage' ? 5 : 1;
    const supported = item.entityType === 'LocalBusiness' ? ['name','address','telephone','openingHours','openingHoursSpecification','url'].includes(item.field)
      : item.entityType === 'Service' ? ['name','provider','serviceType','offers.price'].includes(item.field)
      : !['sameAs','brand'].includes(item.field);
    return {...item, label, description: MEANINGS[lang].split('|')[index] || text[0].replace('{label}',label), howTo: supported ? text[hint] : UNSUPPORTED[lang]};
  });
}
export function fieldsSummary(fields, requested) {
  return TEXT[fieldLang(requested)][6].replace('{filled}', fields.filter(f => f.present).length).replace('{total}',fields.length);
}
export function textHint(requested) { return TEXT[fieldLang(requested)][7]; }

const UNSUPPORTED = {
  ja: 'Nurevoにはこの項目の専用入力欄がありません。対応するSEOプラグインの構造化データ設定で、実際の情報を公開してください。',
  en: 'Nurevo has no dedicated input for this field. Publish the real information using a compatible SEO plugin’s structured data settings.',
  zh: 'Nurevo没有此项的专用输入框。请在兼容的SEO插件结构化数据设置中发布真实信息。',
  'zh-TW': 'Nurevo沒有此項的專用輸入欄。請在相容的SEO外掛結構化資料設定中發布真實資訊。',
  ko: 'Nurevo에는 이 항목의 전용 입력란이 없습니다. 호환되는 SEO 플러그인의 구조화 데이터 설정에서 실제 정보를 게시하세요.',
  es: 'Nurevo no tiene un campo específico. Publica la información real en los ajustes de datos estructurados de un plugin SEO compatible.',
  fr: 'Nurevo ne dispose pas de champ dédié. Publiez les informations réelles dans les réglages de données structurées d’une extension SEO compatible.',
  de: 'Nurevo hat kein eigenes Eingabefeld dafür. Veröffentlichen Sie echte Angaben über die strukturierten Daten eines kompatiblen SEO-Plugins.'
};
