import { randomUUID } from "node:crypto";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PlatformAdapter } from "../adapters/platform.js";
import { DecisionService } from "../decisions/decisionService.js";
import { DemandValidator } from "../demand/validator.js";
import { DocumentStore } from "../db/firestore.js";
import { CandidateHistoryService } from "../generation/candidateHistory.js";
import { ProductCandidateGenerator } from "../generation/candidateGenerator.js";
import { FingerprintService } from "../generation/fingerprint.js";
import { MetricsSnapshot, ProductRecord } from "../types.js";
import { nowIso } from "../utils/env.js";
import { reviewShipCandidate } from "./autoApproval.js";
import { CandidateFeedbackScorer } from "./candidateFeedback.js";

export interface PipelineResult {
  generated: number;
  demandPassed: number;
  duplicates: number;
  decisionsCreated: number;
  ranked: number;
  selectedCandidateSlug?: string;
  selectedFinalScore?: number;
  feedbackApplied: boolean;
  autoApproved: boolean;
  submitted: boolean;
  autoApprovalReasons?: string[];
  selectedFromHistory: boolean;
  selectedOverallScore?: number;
}

export interface FactoryPipelineOptions {
  autoApprove: boolean;
}

export class FactoryPipeline {
  constructor(
    private readonly generator: ProductCandidateGenerator,
    private readonly demandValidator: DemandValidator,
    private readonly fingerprintService: FingerprintService,
    private readonly products: DocumentStore<ProductRecord>,
    private readonly metrics: DocumentStore<MetricsSnapshot>,
    private readonly adapter: PlatformAdapter,
    private readonly decisions: DecisionService,
    private readonly feedbackScorer = new CandidateFeedbackScorer(products, metrics),
    private readonly options: FactoryPipelineOptions = { autoApprove: false },
    private readonly candidateHistory?: CandidateHistoryService
  ) {}

  async run(count: number): Promise<PipelineResult> {
    const hints = await this.feedbackScorer.generationHints();
    const candidates = await this.generator.generate({ count, focusAreas: hints.focusAreas, avoidNames: hints.avoidNames });
    const result: PipelineResult = {
      generated: candidates.length,
      demandPassed: 0,
      duplicates: 0,
      decisionsCreated: 0,
      ranked: 0,
      feedbackApplied: false,
      autoApproved: false,
      submitted: false,
      selectedFromHistory: false
    };
    const eligible: Array<{
      candidate: (typeof candidates)[number];
      evidence: Awaited<ReturnType<DemandValidator["validate"]>>;
      fingerprint: string;
    }> = [];
    const scoredCandidates: Array<{
      candidate: (typeof candidates)[number];
      evidence: Awaited<ReturnType<DemandValidator["validate"]>>;
    }> = [];

    for (const candidate of candidates) {
      const evidence = await this.demandValidator.validate(candidate);
      scoredCandidates.push({ candidate, evidence });
      if (!evidence.passed) continue;
      result.demandPassed += 1;

      const fingerprint = await this.fingerprintService.check(candidate);
      if (fingerprint.duplicate) {
        result.duplicates += 1;
        continue;
      }

      eligible.push({ candidate, evidence, fingerprint: fingerprint.fingerprint });
    }

    const historyRecords = this.candidateHistory ? await this.candidateHistory.recordMany(scoredCandidates) : [];
    const bestRecord = this.candidateHistory ? await this.candidateHistory.chooseBestCandidate(historyRecords) : undefined;
    if (bestRecord) result.selectedOverallScore = bestRecord.overallScore;

    const ranked = await this.feedbackScorer.rank(eligible);
    result.ranked = ranked.length;
    result.feedbackApplied = ranked.some((item) => item.feedbackApplied);
    let selected = ranked[0];
    if (bestRecord && (!selected || bestRecord.candidate.slug !== selected.candidate.slug)) {
      const evidence = await this.demandValidator.validate(bestRecord.candidate);
      const fingerprint = await this.fingerprintService.check(bestRecord.candidate);
      selected = {
        candidate: bestRecord.candidate,
        evidence,
        fingerprint: fingerprint.fingerprint,
        demandScore: evidence.prelaunchScore,
        feedbackScore: 0,
        finalScore: bestRecord.overallScore,
        feedbackApplied: false,
        feedbackMatches: 0
      };
      result.selectedFromHistory = !historyRecords.some((record) => record.candidate.slug === bestRecord.candidate.slug);
    }
    if (!selected) return result;

    const build = await this.adapter.build(selected.candidate);
    const outputDir = await mkdtemp(join(tmpdir(), "smobiz-package-"));
    const packaged = await this.adapter.package(build, outputDir);
    const now = nowIso();
    const product: ProductRecord = {
      id: randomUUID(),
      candidate: selected.candidate,
      fingerprint: selected.fingerprint,
      status: "pending_ship",
      createdAt: now,
      updatedAt: now
    };
    await this.products.save("products", product);
    const decision = await this.decisions.create({
      type: "ship",
      product,
      candidate: selected.candidate,
      evidence: {
        ...selected.evidence,
        ranking: {
          finalScore: selected.finalScore,
          demandScore: selected.demandScore,
          feedbackScore: selected.feedbackScore,
          feedbackApplied: selected.feedbackApplied,
          feedbackMatches: selected.feedbackMatches
        }
      },
      revenueRangeUsd: selected.evidence.profitability.revenueRangeUsd,
      revenueBreakdown: {
        lowUsd: selected.evidence.profitability.revenueRangeUsd.low,
        highUsd: selected.evidence.profitability.revenueRangeUsd.high,
        packageSha256: packaged.sha256,
        finalScore: selected.finalScore,
        feedbackScore: selected.feedbackScore
      },
      diffFromExisting: "Top-ranked validated candidate after demand score and historical feedback."
    });
    result.decisionsCreated = 1;
    result.selectedCandidateSlug = selected.candidate.slug;
    result.selectedFinalScore = selected.finalScore;
    if (this.options.autoApprove) {
      const review = reviewShipCandidate(selected.candidate, build);
      result.autoApprovalReasons = review.reasons;
      if (review.passed) {
        await this.decisions.updateStatus(decision.id, "approved");
        const submission = await this.adapter.submit(packaged, build.storeListing);
        await this.products.save("products", { ...product, status: "published", updatedAt: nowIso() });
        result.autoApproved = true;
        result.submitted = submission.status === "submitted";
      }
    }
    return result;
  }
}
