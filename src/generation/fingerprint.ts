import { createHash } from "node:crypto";
import { DocumentStore } from "../db/firestore.js";
import { ProductCandidate, ProductRecord } from "../types.js";

export interface FingerprintCheck {
  fingerprint: string;
  duplicate: boolean;
  matchedProduct?: ProductRecord;
  similarity: number;
}

export class FingerprintService {
  constructor(private readonly products: DocumentStore<ProductRecord>, private readonly duplicateThreshold = 0.82) {}

  async check(candidate: ProductCandidate): Promise<FingerprintCheck> {
    const tokens = tokenSet(candidate);
    const fingerprint = stableFingerprint(tokens);
    const existing = await this.products.list("products");
    let best: ProductRecord | undefined;
    let bestSimilarity = 0;
    for (const product of existing) {
      const similarity = jaccard(tokens, tokenSet(product.candidate));
      if (similarity > bestSimilarity) {
        best = product;
        bestSimilarity = similarity;
      }
    }
    return {
      fingerprint,
      duplicate: bestSimilarity >= this.duplicateThreshold,
      matchedProduct: bestSimilarity >= this.duplicateThreshold ? best : undefined,
      similarity: bestSimilarity
    };
  }
}

export function tokenSet(candidate: ProductCandidate): Set<string> {
  const text = [
    candidate.name,
    candidate.niche,
    candidate.targetUser,
    candidate.problem,
    candidate.solution,
    ...candidate.keywords,
    ...candidate.permissions
  ].join(" ");
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2)
  );
}

export function stableFingerprint(tokens: Set<string>): string {
  return createHash("sha256").update([...tokens].sort().join("|")).digest("hex");
}

export function jaccard(left: Set<string>, right: Set<string>): number {
  const union = new Set([...left, ...right]);
  if (union.size === 0) return 0;
  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  return intersection / union.size;
}
