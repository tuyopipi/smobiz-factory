import { randomUUID } from "node:crypto";
import { DocumentStore } from "../db/firestore.js";
import { CandidateScoreRecord, DemandEvidence, ProductCandidate } from "../types.js";
import { nowIso } from "../utils/env.js";

export interface CandidateScoreInput {
  candidate: ProductCandidate;
  evidence: DemandEvidence;
}

export class CandidateHistoryService {
  constructor(private readonly history: DocumentStore<CandidateScoreRecord>) {}

  async record(input: CandidateScoreInput): Promise<CandidateScoreRecord> {
    const record = toRecord(input);
    return this.history.save("candidate_scores", record);
  }

  async recordMany(inputs: CandidateScoreInput[]): Promise<CandidateScoreRecord[]> {
    const records: CandidateScoreRecord[] = [];
    for (const input of inputs) {
      records.push(await this.record(input));
    }
    return records;
  }

  async best(): Promise<CandidateScoreRecord | undefined> {
    const records = await this.history.list("candidate_scores");
    return records.sort((a, b) => b.overallScore - a.overallScore || b.createdAt.localeCompare(a.createdAt))[0];
  }

  async chooseBestCandidate(newRecords: CandidateScoreRecord[]): Promise<CandidateScoreRecord | undefined> {
    const bestNew = [...newRecords].sort((a, b) => b.overallScore - a.overallScore)[0];
    const bestHistorical = await this.best();
    if (!bestNew) return bestHistorical;
    if (!bestHistorical || bestNew.overallScore > bestHistorical.overallScore) return bestNew;
    return bestHistorical;
  }
}

export function toRecord(input: CandidateScoreInput): CandidateScoreRecord {
  const gapScore = Number(input.candidate.marketResearch?.gapScore ?? 0);
  const implementationFitScore = Number(input.candidate.marketResearch?.implementationFitScore ?? 0.5);
  const profitabilityScore = input.evidence.profitability.score;
  const prelaunchScore = input.evidence.prelaunchScore;
  return {
    id: randomUUID(),
    candidate: input.candidate,
    prelaunchScore,
    profitabilityScore,
    gapScore,
    implementationFitScore,
    overallScore: overallScore({ prelaunchScore, profitabilityScore, gapScore, implementationFitScore }),
    rationale: input.evidence.profitability.rationale,
    reasons: input.evidence.reasons,
    createdAt: nowIso()
  };
}

function overallScore(scores: {
  prelaunchScore: number;
  profitabilityScore: number;
  gapScore: number;
  implementationFitScore: number;
}): number {
  return (
    scores.prelaunchScore * 0.45 +
    scores.profitabilityScore * 0.3 +
    scores.gapScore * 0.15 +
    scores.implementationFitScore * 0.1
  );
}
