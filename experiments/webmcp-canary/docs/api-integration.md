# Nurevo AEO API連携ガイド

WordPressプラグインを利用できない自作サイト向けの連携方法です。サーバーから最新設定を取得し、返されたJSON-LDをHTMLの`<head>`へ出力します。

> **GTMおよびブラウザ側JavaScriptではAEO schemaを配信できません。必ずサーバー側で実装してください。** AIクローラはJavaScriptを実行しない場合があります。`/api/tag/config`はアプリケーションサーバー、SSR層、またはオリジンから呼び出し、最初のHTMLレスポンスに`<script type="application/ld+json">`を含めてください。

レスポンスには`ruleset_version`が含まれます。サイトキーごとに60秒キャッシュし、再検証中は最長4分まで古い成功結果を利用できます。エラーレスポンスはキャッシュしません。これにより毎ページ表示でNurevoへ接続せず、中央rulesetの変更を数分以内に反映できます。

## Node / Next.js App Router

Next.jsのData Cacheへ60秒保存する例です。Server Componentまたはserver-onlyモジュールに置いてください。

```tsx
const NUREVO_ORIGIN = "https://nurevo.jp";
const SITE_KEY = process.env.NUREVO_SITE_KEY!;

export async function NurevoJsonLd() {
  const response = await fetch(
    `${NUREVO_ORIGIN}/api/tag/config?k=${encodeURIComponent(SITE_KEY)}`,
    { next: { revalidate: 60 } },
  );
  if (!response.ok) return null; // Do not cache/render an error as schema.

  const config = await response.json();
  if (!config.jsonld) return null;
  const json = JSON.stringify(config.jsonld).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      data-aeo-ruleset-version={config.ruleset_version}
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
```

ルートlayoutの`<head>`から`<NurevoJsonLd />`を描画します。Next.js以外の常駐Nodeサーバーでは、成功レスポンスを有効期限60秒のメモリキャッシュへ保存してください。複数インスタンスで共有する場合はRedisなどを利用します。

## PHP

APCuを60秒のサーバー側キャッシュとして利用する例です。APCuが利用できない環境では、フレームワークのサーバーキャッシュを同じTTLで利用してください。

```php
<?php
$siteKey = getenv('NUREVO_SITE_KEY');
$cacheKey = 'nurevo_aeo_' . hash('sha256', $siteKey);
$config = function_exists('apcu_fetch') ? apcu_fetch($cacheKey) : false;

if ($config === false) {
    $url = 'https://nurevo.jp/api/tag/config?k=' . rawurlencode($siteKey);
    $context = stream_context_create(['http' => [
        'timeout' => 2,
        'ignore_errors' => true,
    ]]);
    $body = @file_get_contents($url, false, $context);
    $candidate = is_string($body) ? json_decode($body, true) : null;
    if (is_array($candidate) && !empty($candidate['ok'])) {
        $config = $candidate;
        if (function_exists('apcu_store')) apcu_store($cacheKey, $config, 60);
    }
}

if (is_array($config) && !empty($config['jsonld'])) {
    $json = json_encode(
        $config['jsonld'],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES |
        JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
    );
    echo '<script type="application/ld+json" data-aeo-ruleset-version="' .
        (int) $config['ruleset_version'] . '">' . $json . '</script>';
}
?>
```

ブラウザでページを読み込んだ後ではなく、サーバーが`<head>`を生成するときに実行します。

## 汎用擬似コード

```text
function renderNurevoSchema(siteKey):
    cacheKey = "nurevo-aeo:" + sha256(siteKey)
    config = serverCache.get(cacheKey)

    if config is missing:
        response = HTTP_GET(
            "https://nurevo.jp/api/tag/config?k=" + urlEncode(siteKey),
            timeout = 2 seconds
        )
        if response.status != 200:
            return ""                    # Never cache an error response.
        config = parseJSON(response.body)
        serverCache.put(cacheKey, config, ttl = 60 seconds)

    if config.jsonld is missing:
        return ""

    safeJSON = JSON.stringify(config.jsonld).replace("<", "\\u003c")
    return '<script type="application/ld+json">' + safeJSON + '</script>'

document.head += renderNurevoSchema(NUREVO_SITE_KEY)
```

## 任意のクローラ来訪通知

AIクローラのUser-Agentをサーバー側で判定し、一致した場合だけ`POST /api/tag/hit?k=<site_key>`を呼ぶと来訪を計測できます。通知には元のUser-Agentを渡しますが、Nurevoが保存するのはサイト、日付、8種のクローラID、集計件数だけです。IPアドレス、ページURL、本文、フォーム値などのPIIは保存しません。通知失敗はページ表示を止めないよう無視してください。

### Node / Next.js

サーバーのrequest handlerやmiddlewareから呼びます。ブラウザへ配信するコードには入れません。

```ts
const AI_CRAWLER = /GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|PerplexityBot|Google-Extended|Applebot-Extended|Bytespider/i;

export async function reportNurevoHit(request: Request) {
  const ua = request.headers.get("user-agent") || "";
  if (!AI_CRAWLER.test(ua)) return;
  try {
    await fetch(
      `https://nurevo.jp/api/tag/hit?k=${encodeURIComponent(process.env.NUREVO_SITE_KEY!)}`,
      { method: "POST", headers: { "user-agent": ua }, signal: AbortSignal.timeout(1000) },
    );
  } catch {
    // Optional telemetry: never fail the page render.
  }
}
```

プラットフォームに`waitUntil`やレスポンス後タスクがある場合は、`reportNurevoHit(request)`をそこへ登録するとページ応答を待たせません。

### PHP

```php
<?php
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
$bots = '/GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|PerplexityBot|Google-Extended|Applebot-Extended|Bytespider/i';
if ($ua && preg_match($bots, $ua)) {
    $url = 'https://nurevo.jp/api/tag/hit?k=' . rawurlencode(getenv('NUREVO_SITE_KEY'));
    $context = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => "User-Agent: " . str_replace(["\r", "\n"], '', $ua) . "\r\n",
        'content' => '',
        'timeout' => 1,
        'ignore_errors' => true,
    ]]);
    @file_get_contents($url, false, $context); // 失敗は描画へ伝播させない
}
?>
```

### 汎用擬似コード

```text
ua = incomingRequest.header("User-Agent")
if ua matches one of the 8 Nurevo AI crawler names:
    backgroundTask(
        HTTP_POST(
            "https://nurevo.jp/api/tag/hit?k=" + urlEncode(NUREVO_SITE_KEY),
            headers = { "User-Agent": ua },
            timeout = 1 second
        ).ignoreFailure()
    )
```

## 静的JSON-LD

JSON-LDの手貼りは軽量な選択肢として残しますが、自動更新されず、クローラ来訪も計測できません。常にactive rulesetへ追従し来訪を計測するには、WordPressプラグインまたはこのサーバー側API連携を利用してください。
