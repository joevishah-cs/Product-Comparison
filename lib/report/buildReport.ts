export interface ComparisonAttribute {
  key: string;
  label: string;
  category: string;
  direction: string;
  values: Record<string, { raw: string; numeric: number | null; source: string | null }>;
}

export interface ComparisonData {
  products: Array<{ id: string; brand: string; model: string }>;
  attributes: ComparisonAttribute[];
  scores: Array<{ productId: string; score: number; strengths: string[]; weaknesses: string[] }>;
  overallSimilarity: number;
}

export interface DashboardInsights {
  positioningSummary: string[];
  positioningGaps: string[];
  scorecards: { label: string; leader: string; description: string }[];
  takeaways: { fact: string; interpretation: string; message: string; validation: string };
}

export interface InsightSection {
  title: string;
  lines: Array<{ text: string; level: number }>;
}

export type Verdict = "better" | "comparable" | "behind" | "unknown";

export interface TechnicalRow {
  label: string;
  category: string;
  daikin: string;
  competitor: string;
  verdict: Verdict;
}

export interface GapRow {
  capability: string;
  daikinStatus: string;
  recommendation: string;
}

export interface ReportData {
  daikinProduct: { id: string; brand: string; model: string } | null;
  competitorProducts: Array<{ id: string; brand: string; model: string }>;
  generatedDate: string;
  overallSimilarity: number;
  overallScore: number;
  executiveSummary: string;
  productOverview: Array<{ item: string; daikin: string; competitor: string }>;
  technicalRows: TechnicalRow[];
  strengths: string[];
  weaknesses: string[];
  differentiators: string[];
  recommendedMessaging: string[];
  targetAudience: string[];
  topSellingPoints: string[];
  objection: string;
  suggestedResponse: string;
  gapRows: GapRow[];
  recommendedPositioning: string;
  suggestedMarketingFocus: string;
}

const KEY_METRIC_KEYS = ["SEER2", "EER2", "HSPF2", "Sound level", "Warranty", "Heating operating range", "Cooling operating range"];

function verdictFor(attr: ComparisonAttribute, daikinId: string, competitorId: string): Verdict {
  const daikinVal = attr.values[daikinId];
  const compVal = attr.values[competitorId];
  if (!daikinVal || !compVal) return "unknown";

  const canCompareNumerically =
    (attr.direction === "higher" || attr.direction === "lower") &&
    daikinVal.numeric !== null &&
    compVal.numeric !== null;

  if (canCompareNumerically) {
    if (daikinVal.numeric === compVal.numeric) return "comparable";
    const daikinWins = attr.direction === "higher" ? daikinVal.numeric! > compVal.numeric! : daikinVal.numeric! < compVal.numeric!;
    return daikinWins ? "better" : "behind";
  }

  const dRaw = daikinVal.raw.trim().toLowerCase();
  const cRaw = compVal.raw.trim().toLowerCase();
  if (dRaw === cRaw) return "comparable";
  if (dRaw === "yes" && cRaw === "no") return "better";
  if (dRaw === "no" && cRaw === "yes") return "behind";
  return "comparable";
}

export function buildReport(
  comparison: ComparisonData,
  dashboard: DashboardInsights | null,
  insightSections: InsightSection[],
  battlecardText: string
): ReportData {
  const daikinProduct = comparison.products.find((p) => p.brand === "Daikin") ?? null;
  const competitorProducts = comparison.products.filter((p) => p.id !== daikinProduct?.id);
  const primaryCompetitor = competitorProducts[0];

  const daikinScore = daikinProduct ? comparison.scores.find((s) => s.productId === daikinProduct.id) : undefined;
  const overallScore = daikinScore?.score ?? 50;

  const productOverview: Array<{ item: string; daikin: string; competitor: string }> = [];
  if (daikinProduct && primaryCompetitor) {
    productOverview.push({ item: "Brand", daikin: daikinProduct.brand, competitor: primaryCompetitor.brand });

    const categoryAttr = comparison.attributes.find((a) => a.key === "Chassis Type");
    if (categoryAttr) {
      productOverview.push({
        item: "Chassis Type",
        daikin: categoryAttr.values[daikinProduct.id]?.raw ?? "—",
        competitor: categoryAttr.values[primaryCompetitor.id]?.raw ?? "—",
      });
    }

    const refrigerantAttr = comparison.attributes.find((a) => a.key === "Refrigerant");
    if (refrigerantAttr) {
      productOverview.push({
        item: "Refrigerant",
        daikin: refrigerantAttr.values[daikinProduct.id]?.raw ?? "—",
        competitor: refrigerantAttr.values[primaryCompetitor.id]?.raw ?? "—",
      });
    }
  }

  const technicalRows: TechnicalRow[] = [];
  if (daikinProduct && primaryCompetitor) {
    const orderedAttrs = [
      ...KEY_METRIC_KEYS.map((k) => comparison.attributes.find((a) => a.key === k)).filter((a): a is ComparisonAttribute => !!a),
      ...comparison.attributes.filter((a) => !KEY_METRIC_KEYS.includes(a.key)),
    ];

    for (const attr of orderedAttrs) {
      const daikinVal = attr.values[daikinProduct.id];
      const compVal = attr.values[primaryCompetitor.id];
      if (!daikinVal && !compVal) continue;

      technicalRows.push({
        label: attr.label,
        category: attr.category,
        daikin: daikinVal?.raw ?? "—",
        competitor: compVal?.raw ?? "—",
        verdict: verdictFor(attr, daikinProduct.id, primaryCompetitor.id),
      });
    }
  }

  const strengths = technicalRows.filter((r) => r.verdict === "better").map((r) => r.label);
  const weaknesses = technicalRows.filter((r) => r.verdict === "behind").map((r) => r.label);

  const differentiators = strengths
    .slice(0, 4)
    .map((label) => `${daikinProduct?.model ?? "Daikin"} leads on ${label.toLowerCase()}`);

  const shortMessage = (dashboard?.takeaways.message || "").split(/[.\n]/)[0]?.trim();
  const recommendedMessaging =
    strengths.length > 0
      ? strengths.slice(0, 3).map((label) => label)
      : shortMessage
      ? [shortMessage]
      : ["Reliability and total cost of ownership"];

  const targetAudience = strengths.length > 0
    ? ["Premium homeowners", "Energy-conscious customers"]
    : ["Value-conscious customers"];

  const topSellingPoints = strengths.slice(0, 3).map((s) => `Better ${s.toLowerCase()}`);
  const objectionMatch = battlecardText.match(/Objection:\s*"?([^"\n]+)"?/i);
  const responseMatch = battlecardText.match(/Response:\s*"?([^"\n]+)"?/i);
  const objection = objectionMatch?.[1]?.trim() || weaknesses[0] || "Higher upfront cost";
  const suggestedResponse =
    responseMatch?.[1]?.trim() ||
    "Lower lifetime operating cost and extended warranty coverage offset the higher initial investment.";

  const gapRows: GapRow[] = weaknesses.slice(0, 5).map((w) => ({
    capability: w,
    daikinStatus: "Behind selected competitor",
    recommendation: "Consider for future roadmap or portfolio positioning",
  }));

  const daikinName = daikinProduct?.model ?? "Daikin";
  const competitorName = primaryCompetitor?.model ?? "the competitor";
  const executiveSummary =
    dashboard?.takeaways.interpretation ||
    `This report compares ${daikinName} with ${competitorName}. Based on technical specifications, product documentation, and AI analysis, ${daikinName} demonstrates advantages in ${
      strengths.slice(0, 3).join(", ").toLowerCase() || "several evaluated attributes"
    }, while ${competitorName} shows relative strength in ${weaknesses.slice(0, 2).join(", ").toLowerCase() || "select areas"}.`;

  const recommendedPositioning = strengths.length >= weaknesses.length ? "Premium Residential Market" : "Value-Driven Market";
  const suggestedMarketingFocus = strengths.slice(0, 2).join(" + ") || "Reliability + Total Cost of Ownership";

  return {
    daikinProduct,
    competitorProducts,
    generatedDate: "",
    overallSimilarity: comparison.overallSimilarity,
    overallScore,
    executiveSummary,
    productOverview,
    technicalRows,
    strengths,
    weaknesses,
    differentiators,
    recommendedMessaging,
    targetAudience,
    topSellingPoints,
    objection,
    suggestedResponse,
    gapRows,
    recommendedPositioning,
    suggestedMarketingFocus,
  };
}
