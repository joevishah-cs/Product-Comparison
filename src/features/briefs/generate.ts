import type { Product } from "@/data/types";
import { buildComparison, buildScorecards, type ComparisonResult } from "@/features/compare/engine";
import { buildTakeaways } from "@/features/compare/MarketingTakeaways";
import { SOURCE_DOCUMENTS, coverageFor } from "@/data/catalog";
import { UNAVAILABLE, formatDate } from "@/lib/utils";

export type BriefFormat =
  | "competition_brief"
  | "weekly_newsletter"
  | "dealer_summary"
  | "executive_brief"
  | "product_one_pager"
  | "competitive_faq";

export type Audience = "Homeowner" | "Dealer" | "Product marketing" | "Executive";

export const BRIEF_FORMATS: { value: BriefFormat; label: string; description: string }[] = [
  { value: "competition_brief", label: "Competition brief", description: "Full positioning picture with edges, gaps and evidence." },
  { value: "weekly_newsletter", label: "Weekly competitive newsletter", description: "Short digest for a recurring internal send." },
  { value: "dealer_summary", label: "Dealer-ready summary", description: "What a dealer says in the living room, with the proof behind it." },
  { value: "executive_brief", label: "Executive brief", description: "Where we lead, where we trail, and what needs a decision." },
  { value: "product_one_pager", label: "Product one-pager", description: "A single product's verified specification sheet." },
  { value: "competitive_faq", label: "Competitive FAQ", description: "The objections that come up, and the source-backed answers." },
];

export const AUDIENCES: Audience[] = ["Homeowner", "Dealer", "Product marketing", "Executive"];

export interface BriefSection {
  kind:
    | "VERIFIED FACT"
    | "COMPETITIVE ANALYSIS"
    | "INTERNAL RECOMMENDATION"
    | "SUGGESTED MESSAGE"
    | "CLAIM REQUIRING VALIDATION"
    | "INFORMATION UNAVAILABLE";
  heading: string;
  lines: string[];
  citations: string[];
}

export interface GeneratedBriefDoc {
  title: string;
  format: BriefFormat;
  audience: Audience;
  generatedAt: string;
  sections: BriefSection[];
  sourceList: string[];
  internalOnly: boolean;
}

function sourceList(products: Product[]): string[] {
  const docIds = new Set(products.map((p) => p.documentId));
  return SOURCE_DOCUMENTS.filter((d) => docIds.has(d.id)).map(
    (d) => `${d.fileName} — ${d.scope} (imported ${formatDate(d.importedAt)})`,
  );
}

function audienceTone(audience: Audience): string {
  switch (audience) {
    case "Homeowner":
      return "Written for a homeowner: no acronyms without explanation, comfort and cost before specifications.";
    case "Dealer":
      return "Written for a dealer: the answer, the number behind it, and the objection it defuses.";
    case "Executive":
      return "Written for an executive: position, exposure, and what needs a decision.";
    default:
      return "Written for product marketing: claim, evidence, and what still needs validation.";
  }
}

export function generateBrief(
  format: BriefFormat,
  audience: Audience,
  products: Product[],
  focusProductId?: string,
): GeneratedBriefDoc {
  const result = buildComparison(products);
  const sections: BriefSection[] = [];
  const generatedAt = new Date().toISOString();

  const daikinNames = result.daikinProducts.map((p) => p.displayName).join(", ") || "no Daikin product selected";
  const compNames = result.competitorProducts.map((p) => p.displayName).join(", ") || "no competitor selected";

  sections.push({
    kind: "VERIFIED FACT",
    heading: "Scope of this document",
    lines: [
      `Daikin products in scope: ${daikinNames}.`,
      `Competitors in scope: ${compNames}.`,
      `${result.attributesCompared} attributes carry a verified source value across this selection; overall source coverage is ${result.dataConfidence}%.`,
      audienceTone(audience),
    ],
    citations: [],
  });

  if (format === "product_one_pager") {
    const focus = products.find((p) => p.id === focusProductId) ?? result.daikinProducts[0] ?? products[0];
    return productOnePager(focus, result, audience, generatedAt);
  }

  /* Verified facts */
  if (result.edges.length) {
    sections.push({
      kind: "VERIFIED FACT",
      heading: "What the sources record",
      lines: result.edges.map(
        (e) => `${e.attributeLabel}: ${e.daikinProduct.displayName} records ${e.daikinValue.display}.`,
      ),
      citations: result.edges.map((e) => e.citation),
    });
    sections.push({
      kind: "COMPETITIVE ANALYSIS",
      heading: "How that compares",
      lines: result.edges.map((e) =>
        e.marginLabel
          ? `${e.attributeLabel}: ${e.marginLabel} than the closest of the ${e.beatenCompetitors.length} selected competitor${e.beatenCompetitors.length === 1 ? "" : "s"} with a recorded value.`
          : `${e.attributeLabel}: listed as available on Daikin, listed as not available on ${e.beatenCompetitors.length} selected competitor${e.beatenCompetitors.length === 1 ? "" : "s"}.`,
      ),
      citations: result.edges.map((e) => e.citation),
    });
  } else {
    sections.push({
      kind: "INFORMATION UNAVAILABLE",
      heading: "No calculated Daikin advantage",
      lines: [
        "This selection produces no attribute where a Daikin value beats every selected competitor that has a recorded value.",
      ],
      citations: [],
    });
  }

  if (result.gaps.length) {
    sections.push({
      kind: "COMPETITIVE ANALYSIS",
      heading: "Where a competitor currently leads",
      lines: result.gaps.map((g) => `${g.attributeLabel}: ${g.headline}`),
      citations: result.gaps.map((g) => g.citation),
    });
    sections.push({
      kind: "INTERNAL RECOMMENDATION",
      heading: "Recommended actions",
      lines: result.gaps.map((g) => `${g.attributeLabel}: ${g.suggestedAction}`),
      citations: [],
    });
  }

  const takeaways = buildTakeaways(products, result);
  const messages = takeaways.filter((t) => t.kind === "SUGGESTED MARKETING MESSAGE");
  if (messages.length) {
    sections.push({
      kind: "SUGGESTED MESSAGE",
      heading: audience === "Homeowner" ? "How to say it to a homeowner" : "Suggested messaging",
      lines: messages.map((m) => m.text),
      citations: messages.map((m) => m.source).filter((s): s is string => Boolean(s)),
    });
  }

  if (result.validations.length || result.crossFamily) {
    sections.push({
      kind: "CLAIM REQUIRING VALIDATION",
      heading: "Before this leaves the building",
      lines: [
        ...(result.crossFamily
          ? ["This selection mixes equipment types that are rated on different attributes. Do not present them as equivalent."]
          : []),
        ...result.validations.map((v) => `${v.attributeLabel}: ${v.reason}`),
        "A blank source cell is reported as “Information unavailable”. It is never interpreted as a “No”, and must not be used to claim exclusivity.",
      ],
      citations: [],
    });
  }

  /* Format-specific framing */
  if (format === "weekly_newsletter") {
    sections.unshift({
      kind: "VERIFIED FACT",
      heading: "This week in competitive intelligence",
      lines: [
        `${result.edges.length} verified Daikin edge${result.edges.length === 1 ? "" : "s"} and ${result.gaps.length} improvement opportunit${result.gaps.length === 1 ? "y" : "ies"} across ${products.length} products under review.`,
        result.edges[0]
          ? `Lead story — ${result.edges[0].attributeLabel}: ${result.edges[0].headline}`
          : "Lead story: no calculated advantage in the current product set — see the gap analysis below.",
      ],
      citations: result.edges[0] ? [result.edges[0].citation] : [],
    });
  }

  if (format === "executive_brief") {
    const scorecards = buildScorecards(products, result);
    sections.push({
      kind: "COMPETITIVE ANALYSIS",
      heading: "Category leadership at a glance",
      lines: scorecards.map(
        (c) => `${c.title}: ${c.winner ? `${c.winner.displayName} (${c.value})` : UNAVAILABLE}`,
      ),
      citations: scorecards.map((c) => c.citation).filter((c): c is string => Boolean(c)),
    });
    sections.push({
      kind: "INTERNAL RECOMMENDATION",
      heading: "What needs a decision",
      lines: [
        result.gaps.length
          ? `${result.gaps.length} attribute${result.gaps.length === 1 ? "" : "s"} where a competitor leads on a published figure. The exposure is highest where the gap is visible on a spec sheet a dealer can hand over.`
          : "No competitor currently leads on a comparable published figure in this selection.",
        result.validations.length
          ? `${result.validations.length} attribute${result.validations.length === 1 ? "" : "s"} cannot be compared because a source value is missing. Closing those gaps is a cheap way to strengthen the claim set.`
          : "Source coverage is complete for every compared attribute in this selection.",
      ],
      citations: [],
    });
  }

  if (format === "competitive_faq") {
    sections.push({
      kind: "SUGGESTED MESSAGE",
      heading: "Questions you will be asked",
      lines: buildFaq(result),
      citations: result.edges.map((e) => e.citation).slice(0, 4),
    });
  }

  if (format === "dealer_summary") {
    sections.push({
      kind: "SUGGESTED MESSAGE",
      heading: "One-line answers for the doorstep",
      lines: [
        result.edges[0]
          ? `If they ask why Daikin: "${result.edges[0].attributeLabel} — ${result.edges[0].daikinValue.display}, and I can show you where that number comes from."`
          : "If they ask why Daikin: bring the specification sheet — this selection has no single calculated headline advantage.",
        result.gaps[0]
          ? `If they raise ${result.gaps[0].attributeLabel}: acknowledge the number, then move to what it means installed. ${result.gaps[0].suggestedAction}`
          : "If they raise a competitor number: ask which condition it was measured at before conceding.",
        "If they ask about anything not on the sheet: say you will confirm it. Never fill a gap with a guess.",
      ],
      citations: [],
    });
  }

  return {
    title: titleFor(format, products),
    format,
    audience,
    generatedAt,
    sections,
    sourceList: sourceList(products),
    internalOnly: audience !== "Homeowner",
  };
}

function buildFaq(result: ComparisonResult): string[] {
  const faq: string[] = [];
  const quiet = result.edges.find((e) => e.attributeKey === "sound_level");
  if (quiet) {
    faq.push(
      `Q: Is it really quieter, or is that marketing?\nA: ${quiet.daikinValue.display} is the recorded figure, ${quiet.marginLabel ?? ""} than the closest product in this comparison. The source note adds that quiet-mode ratings are not included, so the real-world figure is not worse than this.`,
    );
  }
  const warranty = result.edges.find((e) => e.attributeKey === "warranty");
  if (warranty) {
    faq.push(
      `Q: Everyone offers ten years. What is different?\nA: ${warranty.daikinValue.display}. The term is one thing; the remedy is another. Ask a competitor whether their coverage repairs a compressor or replaces the unit.`,
    );
  }
  for (const gap of result.gaps.slice(0, 2)) {
    faq.push(
      `Q: A competitor showed me a better ${gap.attributeLabel} number. Is that true?\nA: Yes — ${gap.leadingValue.display} is what their sheet records. ${gap.suggestedAction}`,
    );
  }
  if (!faq.length) {
    faq.push(
      "Q: What can you prove?\nA: Only what the imported source documents record. Anything they do not record is reported as “Information unavailable” rather than answered.",
    );
  }
  return faq;
}

function productOnePager(
  focus: Product,
  result: ComparisonResult,
  audience: Audience,
  generatedAt: string,
): GeneratedBriefDoc {
  const coverage = coverageFor(focus);
  const verified = Object.values(focus.attributes).filter((v) => v.status === "verified");
  const missing = Object.values(focus.attributes).filter((v) => v.status !== "verified");
  const edges = result.edges.filter((e) => e.daikinProduct.id === focus.id);

  const sections: BriefSection[] = [
    {
      kind: "VERIFIED FACT",
      heading: `${focus.displayName} — recorded specifications`,
      lines: verified
        .slice(0, 24)
        .map((v) => `${v.attributeKey}: ${v.display}`),
      citations: Array.from(new Set(verified.slice(0, 24).map((v) => v.source.citation))).slice(0, 6),
    },
    {
      kind: "COMPETITIVE ANALYSIS",
      heading: "Position in this comparison",
      lines: edges.length
        ? edges.map((e) => `${e.attributeLabel}: ${e.headline}`)
        : ["This product carries no calculated advantage over the selected competitors."],
      citations: edges.map((e) => e.citation),
    },
    {
      kind: "INFORMATION UNAVAILABLE",
      heading: "Not recorded in the source",
      lines: missing.length
        ? [`${missing.length} attributes have no recorded value: ${missing.slice(0, 12).map((v) => v.attributeKey).join(", ")}${missing.length > 12 ? ", and others" : ""}.`]
        : ["Every attribute for this product carries a recorded source value."],
      citations: [],
    },
    {
      kind: "CLAIM REQUIRING VALIDATION",
      heading: "Before external use",
      lines: [
        `Source coverage for this product is ${coverage.pct}% (${coverage.verified} of ${coverage.total} attributes).`,
        "Missing values are absences of data, not negatives. Do not phrase any claim as an exclusivity where a competitor value is simply unrecorded.",
      ],
      citations: [],
    },
  ];

  return {
    title: `${focus.displayName} — product one-pager`,
    format: "product_one_pager",
    audience,
    generatedAt,
    sections,
    sourceList: sourceList([focus]),
    internalOnly: audience !== "Homeowner",
  };
}

function titleFor(format: BriefFormat, products: Product[]): string {
  const label = BRIEF_FORMATS.find((f) => f.value === format)?.label ?? "Brief";
  const names = products.map((p) => p.model).slice(0, 3).join(" vs ");
  return `${label} — ${names}${products.length > 3 ? ` +${products.length - 3}` : ""}`;
}

export function briefToText(doc: GeneratedBriefDoc): string {
  const lines: string[] = [
    doc.title.toUpperCase(),
    `Format: ${BRIEF_FORMATS.find((f) => f.value === doc.format)?.label}`,
    `Audience: ${doc.audience}`,
    `Generated: ${new Date(doc.generatedAt).toLocaleString("en-US")}`,
    doc.internalOnly ? "INTERNAL USE ONLY — not for external distribution." : "Cleared for customer-facing use after marketing review.",
    "",
  ];

  for (const section of doc.sections) {
    lines.push(`[${section.kind}] ${section.heading}`);
    for (const line of section.lines) lines.push(`  ${line}`);
    if (section.citations.length) {
      lines.push("  Sources:");
      for (const c of Array.from(new Set(section.citations))) lines.push(`    - ${c}`);
    }
    lines.push("");
  }

  lines.push("SOURCE DOCUMENTS");
  for (const s of doc.sourceList) lines.push(`  - ${s}`);
  lines.push("");
  lines.push('Values the source does not record are reported as "Information unavailable" and are never interpreted as "No".');

  return lines.join("\n");
}
