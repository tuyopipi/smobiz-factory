import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const pain = await import(pathToFileURL(join(process.cwd(), "scripts/discovery-pain.mjs")).href) as any;

test("competitor pain scoring rewards proven competitors with concrete complaints", () => {
  const result = pain.scoreCompetitorPain(
    ["smallpdf"],
    [{
      competitor: "smallpdf",
      alternativeDemand: 8,
      negativeSearchDemand: 11,
      reviewComplaintMentions: 3,
      snippets: ["Users complain about limits, ads, watermark, and slow uploads."],
      painPoints: pain.extractPainPoints("limits ads watermark slow uploads login required")
    }],
    {
      topToolResults: 5,
      knownCompetitorMentions: 4
    }
  );

  assert.ok(result.competitorPainScore > 0.6);
  assert.ok(result.painPoints.some((value: string) => value.includes("ads")));
  assert.ok(result.differentiationPoints.some((value: string) => value.includes("watermark") || value.includes("ad-light")));
});

test("opportunity score can select competitor pain even when thinness gap is modest", () => {
  const opportunity = pain.combineOpportunityScore(0.28, 0.74, true);
  assert.ok(opportunity > 0.6);
});

test("competitor identification uses search examples and known brands", () => {
  const competitors = pain.identifyCompetitors("pdf converter", {
    competitors: ["smallpdf"],
    examples: ["Adobe Acrobat Online PDF Converter - Fast PDF tools", "Best free PDF tools"]
  });

  assert.ok(competitors.includes("smallpdf"));
  assert.ok(competitors.includes("adobe"));
});

test("competitor relevance removes broad travel booking brands from cleaner booking forms", () => {
  const competitors = pain.filterRelevantCompetitors(
    "booking form for cleaners",
    ["booking.com", "airbnb", "cleaning booking form builder"],
    {
      examples: [
        "Booking.com | Official site | The best hotels, flights, car rentals",
        "Cleaning booking form builder for maid services and cleaners"
      ]
    }
  );

  assert.deepEqual(competitors, ["cleaning booking form builder"]);
});

test("competitor relevance removes generic image/search brands from image resize niches", () => {
  const competitors = pain.filterRelevantCompetitors(
    "image resize for linkedin",
    ["google images", "pixabay", "linkedin image resizer"],
    {
      examples: [
        "Google Images. The most comprehensive image search on the web.",
        "LinkedIn image resizer tool for profile, banner, post dimensions"
      ]
    }
  );

  assert.deepEqual(competitors, ["linkedin image resizer"]);
});
