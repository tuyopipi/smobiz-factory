<!--
Press release draft. NOT published on nurevo.jp (docs/ is outside public/ and
is never deployed). Every figure comes from the study run of 2026-10-24
(experiments/webmcp-canary/study/) and matches the guide article
src/content/aeo-signals-ai-answers-study.mjs. Do not add figures that are not
in that report, and do not name the businesses measured.
Before sending: fill in the release date, confirm the article URLs are live,
and have a second person check the numbers against the report.
-->

# プレスリリース（案）

**報道関係者各位**
**2026年10月○日**
**Bestie.合同会社**

## サイトの中のAEO対策は、AIの回答への登場を予測しなかった ―― 地域事業者62件をPerplexityで計測した調査結果を公開

AEO（回答エンジン最適化）ツール「Nurevo」を提供するBestie.合同会社は、自社のAI読みやすさスコア（構造化データ・llms.txt・AIクローラーの許可などを0〜100点で評価）が、地域事業者がAIの回答に登場する割合と関係するかを調べた調査の結果を公開しました。日本の地域事業者62件について、スコアと、Perplexityがおすすめを尋ねる質問への回答でその事業者の名前を挙げる・自社サイトを引用する割合との間に、関係は見られませんでした（Spearmanの順位相関 ρ＝0.03、95%信頼区間 −0.23〜0.28、p＝0.834）。

当社の製品にとって不利な結果ですが、判定基準をデータ収集の前に決め、結果にかかわらず公開すると決めていたため、方法・数値・限界とあわせて公開します。

### 調査結果のポイント

- **スコアと登場率の相関は ρ＝0.03**。業種・都市を調整した偏相関も 0.03（p＝0.845）、層内の並べ替え検定でも 0.03（p＝0.829）でした。事前に決めた基準による判定は「支持されない」です。
- **業種・都市の固定効果つきロジスティック回帰**（準二項補正）では、スコアが1標準偏差（18.81点）高いときのオッズは ×1.01（95%信頼区間 0.62〜1.64、p＝0.972）でした。
- **スコアの構成要素**（構造化データ・網羅性・読みやすさ・llms.txt・一貫性・クローラー等のゲート）も、多重検定（Holm法）の補正後はいずれも関係が見られませんでした（補正後 p＝1.000）。
- 店名を含まない質問への回答で事業者が登場した割合は全体で **21.0%**、62件中 **25件** が少なくとも1回登場しました。
- 登場率は、スコアよりも業種・都市によって大きく異なりました（例：都市別で東京31.1%、札幌9.8%。記述的な数字で、差の検定はしていません）。

### 当社の受け止め

構造化データなどサイトの中の対策は、AIが住所・営業時間・電話番号などの事実を正しく読むために役立ちます。一方で今回の結果は、それだけではAIにおすすめとして名前を挙げられるのに十分ではないことを示唆しています。口コミや地図の掲載、地域メディア、他サイトでの言及など、サイトの外の情報源が大きく影響しているというのが当社の作業仮説ですが、今回の調査ではこれを測っておらず、検証は今後の課題です。

これを受け、当社はAI読みやすさスコアを「AIの回答に登場するかの予測」としては示さず、登場そのものを直接計測する方針をとります。Proプランでは Perplexity での登場率を計測しており（ベータ）、Free・Standardのサイト向けにも月1回の小さな登場チェックを追加しています。また、実際に計測したAIでの表示状況を組み合わせるスコアの第2版を開発しています。

### 調査の概要

| 項目 | 内容 |
|---|---|
| 対象 | 自社の公式サイトを持つ日本の地域事業者72件を抽出し、スコアを計算できなかった10件を除く62件を分析 |
| 層別 | 5業種（歯科・飲食・美容・士業〈税理士〉・宿泊）× 4都市（東京・大阪・福岡・札幌） |
| AI | Perplexity（Agent API、プリセット「fast」）のみ |
| 質問 | 事業者ごとに、店名を含まない「発見系」の質問3問と、店名を挙げる「名指し」の質問1問。各3回 |
| 登場の定義 | 回答に名前が含まれる、または引用元に自社ドメインがある |
| 分析 | Spearmanの順位相関、業種・都市を固定効果とした偏相関、層別並べ替え検定、準二項ロジスティック回帰 |
| 計測日 | 2026年10月24日 |

### 調査の限界

- 1時点の横断研究であり、因果関係（スコアを上げれば登場が増えるか）は示していません。
- 62件では、およそ |ρ|≥0.35 の相関しか確実には検出できません。より弱い関係がある可能性は否定できません。
- Perplexityのみ・1時点の結果で、ChatGPT・Gemini・GoogleのAIによる概要などには当てはまりません。
- 口コミ数・知名度・広告・開業年数などの要因は観測しておらず、調整したのは業種と都市のみです。
- 対象はWeb検索で選んだため、見つかりやすい事業者に偏っています。スコアが「緑」（高得点）のサイトは含まれていませんでした。
- 計測した事業者の名前・サイトは公開しません。

### 調査レポート

- 日本語：https://nurevo.jp/ja/guide/aeo-signals-ai-answers-study/
- English: https://nurevo.jp/guide/aeo-signals-ai-answers-study/

### Nurevoについて

Nurevoは、AI検索（ChatGPT・Perplexityなど）がWebサイトをどう読んでいるかを測り、引用される土台（サーバー側の構造化データ・llms.txt・AIクローラーの許可）を整えるAEOツールです。WordPressプラグイン「Nurevo AEO」、またはタグ1行で導入できます。
https://nurevo.jp/

### 会社概要

- 会社名：Bestie.合同会社
- 所在地：東京都
- 事業内容：AEOツール「Nurevo」の開発・提供

### 本件に関するお問い合わせ

Bestie.合同会社 Nurevo担当
メール：info@nurevo.jp

---

# Press release (draft, English)

**Bestie.合同会社 | October ○, 2026**

## On-site AEO signals did not predict appearing in AI answers: Nurevo publishes a study of 62 local businesses measured on Perplexity

Bestie.合同会社, maker of the AEO (answer engine optimization) tool Nurevo, has published a study testing whether its own AI-readability score, which rates on-site signals such as structured data, llms.txt and AI crawler access from 0 to 100, is related to how often local businesses appear in AI answers. Across 62 local businesses in Japan, the score showed no relationship with how often Perplexity named a business or cited its website when asked for recommendations (Spearman ρ = 0.03, 95% CI −0.23 to 0.28, p = 0.834).

The result is unfavourable to the company's own product. The criteria were set before the data was collected and the company committed to publishing the outcome either way.

**Key findings**

- ρ = 0.03 between the score and the appearance rate; 0.03 after adjusting for industry and city (p = 0.845). Verdict under the pre-set criteria: not supported.
- Logistic regression with industry and city fixed effects (quasi-binomial): odds ×1.01 per one standard deviation (18.81 points) of score (95% CI 0.62 to 1.64, p = 0.972).
- No component of the score was related to appearance after Holm correction (p = 1.000 for each).
- Businesses appeared in 21.0% of answers to questions that did not name them; 25 of 62 appeared at least once.

**What Nurevo is changing:** the AI-readability score will not be presented as a predictor of appearing in AI answers. Nurevo measures appearance directly (the Pro plan's Perplexity measurement, in beta, and a small monthly check being added for Free and Standard sites) and is developing a second version of the score that blends measured AI visibility with on-site signals.

**Limitations:** cross-sectional; with 62 businesses only correlations of about |ρ| ≥ 0.35 could be detected reliably; one engine (Perplexity, "fast" preset) measured on 2026-10-24; reviews, brand recognition and other off-site factors were not observed. The names of the businesses measured are not published.

**Full study:** https://nurevo.jp/guide/aeo-signals-ai-answers-study/ (Japanese: https://nurevo.jp/ja/guide/aeo-signals-ai-answers-study/)

**Contact:** Bestie.合同会社, info@nurevo.jp
