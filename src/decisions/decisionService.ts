import { randomUUID } from "node:crypto";
import { DocumentStore } from "../db/firestore.js";
import { Decision, DecisionType, DemandEvidence, ProductCandidate, ProductRecord } from "../types.js";
import { nowIso } from "../utils/env.js";

export class DecisionService {
  constructor(private readonly decisions: DocumentStore<Decision>) {}

  async create(input: {
    type: DecisionType;
    product: ProductRecord;
    candidate: ProductCandidate;
    evidence: DemandEvidence | Record<string, unknown>;
    revenueRangeUsd: { low: number; high: number };
    revenueBreakdown: Record<string, number | string>;
    diffFromExisting: string;
  }): Promise<Decision> {
    const now = nowIso();
    const decision: Decision = {
      id: randomUUID(),
      type: input.type,
      status: "pending",
      productId: input.product.id,
      preview: {
        name: input.candidate.name,
        slug: input.candidate.slug,
        platform: input.candidate.platform,
        permissions: input.candidate.permissions,
        storeListingSummary: input.candidate.solution
      },
      evidence: input.evidence,
      revenueRangeUsd: input.revenueRangeUsd,
      revenueBreakdown: input.revenueBreakdown,
      diffFromExisting: input.diffFromExisting,
      createdAt: now,
      updatedAt: now
    };
    return this.decisions.save("decisions", decision);
  }

  async listPending(): Promise<Decision[]> {
    return this.decisions.query("decisions", "status", "pending");
  }

  async updateStatus(id: string, status: Decision["status"]): Promise<Decision> {
    const existing = await this.decisions.get("decisions", id);
    if (!existing) throw new Error(`Decision not found: ${id}`);
    return this.decisions.save("decisions", { ...existing, status, updatedAt: nowIso() });
  }
}
