import { ChromeAdapter } from "./adapters/chrome.js";
import { SecretManagerProvider } from "./config/secrets.js";
import { DecisionService } from "./decisions/decisionService.js";
import { AnthropicProfitabilityScorer, GoogleSuggestProvider, PublicChromeStoreProvider } from "./demand/providers.js";
import { DemandValidator } from "./demand/validator.js";
import { FirestoreRestStore } from "./db/firestore.js";
import { CandidateHistoryService } from "./generation/candidateHistory.js";
import { OpenAiTextClient } from "./generation/candidateGenerator.js";
import { DataDrivenCandidateGenerator } from "./generation/dataDrivenCandidateGenerator.js";
import { FingerprintService } from "./generation/fingerprint.js";
import { createApiServer } from "./http/server.js";
import { MetricsService } from "./metrics/judgment.js";
import { DoubleDownWorkflow } from "./orchestrator/doubleDown.js";
import { FactoryPipeline } from "./orchestrator/pipeline.js";
import { CandidateScoreRecord, Decision, MetricsSnapshot, ProductRecord } from "./types.js";
import { booleanEnv } from "./utils/env.js";

async function main(): Promise<void> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT ?? "dogmap-476906";
  const port = Number(process.env.PORT ?? 8080);
  const secrets = new SecretManagerProvider(projectId);
  const firestoreProducts = new FirestoreRestStore<ProductRecord>(projectId);
  const firestoreDecisions = new FirestoreRestStore<Decision>(projectId);
  const firestoreMetrics = new FirestoreRestStore<MetricsSnapshot>(projectId);
  const firestoreCandidateScores = new FirestoreRestStore<CandidateScoreRecord>(projectId);
  const openAiKey = await secrets.get("OPENAI_API_KEY");
  const anthropicKey = await secrets.get("ANTHROPIC_API_KEY");
  const chromeCredentials = async () => ({
    clientId: await secrets.get("CHROME_CLIENT_ID"),
    clientSecret: await secrets.get("CHROME_CLIENT_SECRET"),
    refreshToken: await secrets.get("CHROME_REFRESH_TOKEN"),
    publisherId: await secrets.get("CHROME_PUBLISHER_ID")
  });
  const chromeAdapter = new ChromeAdapter(undefined, chromeCredentials);
  const decisions = new DecisionService(firestoreDecisions);
  const pipeline = new FactoryPipeline(
    new DataDrivenCandidateGenerator(new OpenAiTextClient(openAiKey), new GoogleSuggestProvider(), new PublicChromeStoreProvider()),
    new DemandValidator(
      new PublicChromeStoreProvider(),
      new GoogleSuggestProvider(),
      new AnthropicProfitabilityScorer({ apiKey: anthropicKey })
    ),
    new FingerprintService(firestoreProducts),
    firestoreProducts,
    firestoreMetrics,
    chromeAdapter,
    decisions,
    undefined,
    { autoApprove: booleanEnv("AUTO_APPROVE", false) },
    new CandidateHistoryService(firestoreCandidateScores)
  );
  const metricsService = new MetricsService(firestoreMetrics);
  const doubleDown = new DoubleDownWorkflow(firestoreProducts, metricsService, decisions, chromeAdapter);
  const server = createApiServer({
    decisions,
    pipeline,
    metrics: metricsService,
    decisionsApiKey: process.env.DECISIONS_API_KEY,
    doubleDown
  });
  server.listen(port, () => {
    console.log(`smobiz-factory listening on ${port} for project ${projectId}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
