import { execFileSync } from "node:child_process";
import { OpenAiTextClient } from "../dist/src/generation/candidateGenerator.js";
import { DataDrivenCandidateGenerator } from "../dist/src/generation/dataDrivenCandidateGenerator.js";
import { CandidateHistoryService } from "../dist/src/generation/candidateHistory.js";
import { PublicChromeStoreProvider, GoogleSuggestProvider, AnthropicProfitabilityScorer } from "../dist/src/demand/providers.js";
import { DemandValidator } from "../dist/src/demand/validator.js";
import { FirestoreRestStore } from "../dist/src/db/firestore.js";
import { FingerprintService } from "../dist/src/generation/fingerprint.js";
import { CandidateFeedbackScorer } from "../dist/src/orchestrator/candidateFeedback.js";

const projectId = process.env.PROJECT_ID ?? "dogmap-476906";
const count = Number(process.env.DRY_RUN_COUNT ?? 3);

class GcloudTokenProvider {
  async getAccessToken() {
    return execFileSync("gcloud", ["auth", "print-access-token"], { encoding: "utf8" }).trim();
  }
}

function secret(name) {
  return execFileSync("gcloud", ["secrets", "versions", "access", "latest", "--secret", name, "--project", projectId], {
    encoding: "utf8"
  }).trim();
}

function shortCandidate(candidate) {
  return {
    name: candidate.name,
    slug: candidate.slug,
    niche: candidate.niche,
    targetUser: candidate.targetUser,
    keywords: candidate.keywords,
    permissions: candidate.permissions
  };
}

console.log(`[dry-run] project=${projectId} count=${count}`);
const anthropicKey = secret("ANTHROPIC_API_KEY");
const openAiKey = secret("OPENAI_API_KEY");
console.log(`[secret] ANTHROPIC_API_KEY loaded=${anthropicKey.length > 0} length=${anthropicKey.length}`);
console.log(`[secret] OPENAI_API_KEY loaded=${openAiKey.length > 0} length=${openAiKey.length}`);

const tokenProvider = new GcloudTokenProvider();
const products = new FirestoreRestStore(projectId, "(default)", tokenProvider);
const metrics = new FirestoreRestStore(projectId, "(default)", tokenProvider);
const candidateScores = new FirestoreRestStore(projectId, "(default)", tokenProvider);
const history = new CandidateHistoryService(candidateScores);
const feedbackScorer = new CandidateFeedbackScorer(products, metrics);
const hints = await feedbackScorer.generationHints();
console.log("[feedback] generationHints=", JSON.stringify(hints, null, 2));

const generator = new DataDrivenCandidateGenerator(
  new OpenAiTextClient(openAiKey),
  new GoogleSuggestProvider(),
  new PublicChromeStoreProvider()
);
const candidates = await generator.generate({ count, focusAreas: hints.focusAreas, avoidNames: hints.avoidNames });
console.log(`[generation] candidates=${candidates.length}`);
candidates.forEach((candidate, index) => {
  console.log(`[candidate:${index + 1}]`, JSON.stringify(shortCandidate(candidate), null, 2));
});

const demand = new DemandValidator(
  new PublicChromeStoreProvider(),
  new GoogleSuggestProvider(),
  new AnthropicProfitabilityScorer({ apiKey: anthropicKey })
);
const fingerprintService = new FingerprintService(products);
const eligible = [];
const scored = [];

for (const candidate of candidates) {
  console.log(`[validate:start] ${candidate.slug}`);
  const evidence = await demand.validate(candidate);
  const fingerprint = await fingerprintService.check(candidate);
  scored.push({ candidate, evidence });
  console.log(
    `[validate:result] ${candidate.slug} passed=${evidence.passed} prelaunchScore=${evidence.prelaunchScore.toFixed(3)} profitability=${evidence.profitability.score.toFixed(3)} duplicate=${fingerprint.duplicate}`
  );
  console.log(
    `[validate:evidence] ${candidate.slug}`,
    JSON.stringify(
      {
        search: evidence.search.map((signal) => ({ keyword: signal.keyword, score: signal.score, suggestions: signal.suggestions.slice(0, 5) })),
        chromeStore: evidence.chromeStore,
        profitability: evidence.profitability,
        reasons: evidence.reasons
      },
      null,
      2
    )
  );
  if (evidence.passed && !fingerprint.duplicate) {
    eligible.push({ candidate, evidence, fingerprint: fingerprint.fingerprint });
  }
}

const historyRecords = await history.recordMany(scored);
const bestRecord = await history.chooseBestCandidate(historyRecords);
if (bestRecord) {
  const isHistorical = !historyRecords.some((record) => record.candidate.slug === bestRecord.candidate.slug);
  console.log("[best]", JSON.stringify({
    source: isHistorical ? "historical" : "new",
    slug: bestRecord.candidate.slug,
    name: bestRecord.candidate.name,
    overallScore: bestRecord.overallScore,
    prelaunchScore: bestRecord.prelaunchScore,
    profitabilityScore: bestRecord.profitabilityScore,
    gapScore: bestRecord.gapScore,
    implementationFitScore: bestRecord.implementationFitScore,
    rationale: bestRecord.rationale
  }, null, 2));
  const evidence = await demand.validate(bestRecord.candidate);
  const fingerprint = await fingerprintService.check(bestRecord.candidate);
  const existingIndex = eligible.findIndex((item) => item.candidate.slug === bestRecord.candidate.slug);
  if (existingIndex >= 0) eligible.splice(existingIndex, 1);
  eligible.unshift({ candidate: bestRecord.candidate, evidence, fingerprint: fingerprint.fingerprint, forcedBest: true, overallScore: bestRecord.overallScore });
}

const ranked = await feedbackScorer.rank(eligible);
if (eligible[0]?.forcedBest) {
  const forced = eligible[0];
  const forcedIndex = ranked.findIndex((item) => item.candidate.slug === forced.candidate.slug);
  if (forcedIndex >= 0) {
    const [item] = ranked.splice(forcedIndex, 1);
    ranked.unshift({ ...item, finalScore: forced.overallScore });
  }
}
console.log(`[ranking] eligible=${eligible.length} ranked=${ranked.length}`);
ranked.forEach((item, index) => {
  console.log(
    `[rank:${index + 1}] ${item.candidate.slug} final=${item.finalScore.toFixed(3)} demand=${item.demandScore.toFixed(3)} feedback=${item.feedbackScore.toFixed(3)} feedbackApplied=${item.feedbackApplied} matches=${item.feedbackMatches}`
  );
});

if (!ranked[0]) {
  console.log("[selected] none");
  process.exitCode = 2;
} else {
  console.log("[selected]", JSON.stringify({
    slug: ranked[0].candidate.slug,
    name: ranked[0].candidate.name,
    finalScore: ranked[0].finalScore,
    demandScore: ranked[0].demandScore,
    feedbackScore: ranked[0].feedbackScore,
    feedbackApplied: ranked[0].feedbackApplied
  }, null, 2));
}
