# AEO score v2 — AI対応度 × AI登場度（score_version `aeo-v2`）

Implementation: `worker/aeo-score-v2.mjs` · storage: migration `nurevo-impl/db/0048_aeo_score_v2.sql` · tests: `scripts/test-score-v2.mjs`

## なぜ変えるのか / Why

検証スタディで、サイト上のAEOスコア（schema / coverage / legibility / llms.txt / consistency + gate）と Perplexity での実際の登場率のあいだに、測定可能な相関は見つかりませんでした。nurevo.jp は 97/100 でありながら、登場率は 0% でした。サイトの準備だけで作った見出しの数字は、測っていないこと（AIに実際に紹介されるか）まで約束しているように読めてしまいます。

The validation study found no measurable correlation between the on-site score and Perplexity appearance. v2 keeps the on-site score, unchanged, as one of two sub-scores and blends in what AI answers actually say — shrunk so that a handful of answers barely moves the headline.

## 用語 / Terms

| 日本語 | English | 中身 |
|---|---|---|
| AEOスコア（総合） | AEO score (headline) | v2 の見出しの数字。下の2つを混ぜたもの |
| AI対応度（サイト上の準備） | AI readiness (on-site) | これまでのAEOスコアそのもの（同じアルゴリズム・同じ `score_model_version`） |
| AI登場度（実測） | AI visibility (measured) | 実際のAIの回答で名前が出た／サイトが引用された度合い |
| 信頼度の重み | credibility weight | 回答数が少ないほど小さくなる、AI登場度の効き具合 |

## 式 / Formula

Inputs, pooled over the **90 days** up to the diagnosis (`VISIBILITY_WINDOW_DAYS`):

- every **discovery** answer of the **headline engine (Perplexity)** from Pro measurement runs (`aeo_sov_runs.detail_json.by_engine`; branded control questions and other engines are excluded — the headline rate is never pooled across engines), and
- every answer of the **free monthly AI check** (3 answers) for Free / Standard sites (`aeo_free_checks`).

Failed probes are not answers and are not counted.

```
n         = answers received
appeared  = answers that named the business OR cited its site
cited     = answers that cited its site

p      = (0.75 · appeared + 0.25 · cited) / n        per-answer value: named only = 0.75, cited = 1.0
V      = 100 · WilsonCentre(p, n)                    AI visibility (AI登場度), z = 1.96
       = 100 · (p + z²/2n) / (1 + z²/n)
w      = n / (n + K),  K = 20 answers                credibility weight
share  = 0.5 · w                                     visibility's share of the headline
AEO    = round( R · (1 − share) + V · share )        R = AI readiness (AI対応度)
```

- **No measurement (n = 0):** `AEO = R`, labelled “AI readiness only — AI visibility not measured yet / AI対応度のみ（AI登場度は未測定）”. Nothing is shown for the visibility number (it is `null`, never 0).
- **No readiness (diagnosis failed):** no headline; the visibility is still reported.
- **Bands** (green / yellow / red) use the readiness thresholds on the headline: green ≥ 80, yellow ≥ 50, else red. Every surface (dashboard, reports, plugin gauge, admin bar) bands the headline.

### Choices and why

- **Wilson interval centre, not lower bound.** The lower bound would penalise *being measured*: a site that appears in 10 of 10 answers would get V = 72 and a lower headline than an unmeasured site with the same readiness. The centre shrinks small samples symmetrically towards 50% (uncertain) — 0/10 gives V = 14, 10/10 gives V = 86 — and converges to the observed rate as n grows. The interval itself is returned (`visibility.interval`) for display.
- **Credibility weight `n / (n + 20)`.** Small samples barely move the headline (1 answer: ≤ 1 point; the free check's 3 answers: ≈ 6.5 % weight); 20 answers give half the full weight; about 13 weekly Pro runs of 10 answers give 87 %.
- **50 / 50 at full credibility.** Readiness is what the owner can act on directly; visibility is the outcome. Neither alone should own the headline.
- **Citation bonus.** An answer that names the business counts 0.75; one that cites the site (named or not) counts 1.0. Named and cited both count, citation a little more, because a cited source is what an AI answer can be checked against.
- **Pooling within 90 days.** Recent runs are combined with equal weight, so one noisy run is not the whole story and a long-gone run does not linger.

### Example — nurevo.jp

Readiness R = 97, 0 of 10 Perplexity answers named or cited it:

```
p = 0;  V = 100 · (1.92/10) / (1 + 3.84/10) = 13.9 → 14
w = 10/30 = 0.333;  share = 0.167
AEO = 97 · 0.833 + 13.9 · 0.167 = 83   (green, was 97)
```

After three weekly runs at 0/10 (n = 30): V = 6, share = 0.30 → **AEO 70 (yellow)**. After ~13 runs (n = 130): **AEO 56**. With the free check only (0 of 3): **AEO 93**.

## 保存とバージョン / Storage and versions

- `aeo_scores.score` keeps its meaning — **AI readiness** — with the same algorithm and `score_model_version`, so its history stays comparable across v1 and v2.
- New columns (0048): `score_version` (`'aeo-v2'`; `NULL` = a v1 row whose headline was `score`), `headline_score`, `visibility_score`, `visibility_answers`, `visibility_json` (counts, weight, share, interval, window).
- Each diagnosis stores the headline computed from the evidence *as of its scan time*. Before 0048 is applied the store writes the readiness score exactly as before, and the headline is computed when read (`currentAeoScore`) from the same inputs.
- **Trend charts never join versions.** The dashboard draws v1 points and v2 points as separate segments, marks the switch on the chart and says it in words; a change (“↗ +3”) is only stated between two points of the same version. The agency report charts the latest point's version only and, when last month's baseline was v1, says why there is no change figure.

## どこに出るか / Where it is shown (same numbers everywhere)

| Surface | Source |
|---|---|
| Dashboard site panel, AEO metrics panel | `GET /api/sites/:id/aeo-metrics` → `aeo_score`, per-row `score_version`, `score_version_switches` |
| Pro report (dashboard) | `GET /api/sites/:id/sov/report` → `report.aeo_score` |
| Monthly owner report | `GET /api/sites/:id/monthly-report` → `aeo_score` (as of the period's latest diagnosis) |
| Agency client report | `collectReportData` → the month's last diagnosis, 8 languages |
| WordPress plugin (AEO screen, dashboard widget, admin bar, `nurevo/get-aeo-score` ability) | `GET /api/sites/:id/aeo-score` → `score` / `band` are the headline; `readiness`, `visibility`, `score_version`, `basis` alongside |

The public URL diagnosis (`/api/aeo/score`, unregistered sites) has no measurement and is unchanged; the plugin labels such a score “AI readiness only”.

Each surface shows: the headline, both sub-scores, “based on N AI answers”, and the variability notice — or “AI visibility not measured yet”.

## 限界 / Limitations

- **Small samples.** 10 answers per Pro run and 3 per free check are small. The shrinkage keeps them from swinging the headline, but V itself is an estimate with a wide interval.
- **One engine.** Only the headline engine (Perplexity) feeds V. ChatGPT and other engines are shown per engine in the Pro report but do not move the score.
- **Question choice drives V.** V reflects the questions asked. Owners can edit Pro question sets; an edited set measures something different from the default.
- **Brand detection.** Named / cited come from the mention parser and the citation URL list; aliases that the parser does not know are missed.
- **Variability.** AI answers vary with time and model. The same site can score differently a week apart with nothing changed on it.
- **Not causal.** v2 does not claim that readiness causes visibility (the study found no such correlation); it reports both, so the headline does not promise what was not measured.
- **Free check vs Pro.** Free/Standard sites have at most 3 answers a month, so their headline is almost entirely readiness — by design.
- **Retroactivity.** Old (v1) points are not recomputed; only the latest diagnosis of a pre-0048 row is combined on read, and it is labelled v2.
