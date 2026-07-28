import { INGESTED_DATA } from "@/lib/data/ingestedData";

export type AdvisorAnswer = { answer: string; citations: string[]; analysis: string };

const valuesFor = (model: string, label: string): string | undefined => {
  const product = INGESTED_DATA.products.find((candidate) => candidate.model.toLowerCase() === model.toLowerCase());
  return product ? (product.attributes as Record<string, string>)[label] : undefined;
};

export function answerDemoQuestion(question: string): AdvisorAnswer {
  const q = question.toLowerCase();
  if (q.includes("top three") || q.includes("strongest advantage") || q.includes("defensible")) {
    return { answer: "VERIFIED PRODUCT FACT: the FIT battlecard lists R-32, 115V / 240V air-handler matchup, and 12-year parts and replacement coverage for the shown Daikin FIT variants. CALCULATED COMPARISON: these source-backed attributes create the strongest defensible Daikin signals in the selected comparison. AI ANALYTICAL INSIGHT: use warranty and installation flexibility when they match the audience. SUGGESTED MARKETING MESSAGE: ‘Lead every product conversation with proof that fits the application.’ CLAIM REQUIRING VALIDATION: do not state blanket efficiency superiority without model-specific values.", citations: ["Daikin FIT Battlecard.pdf • p. 1 • Refrigerant, Air Handler Matchup, Warranty"], analysis: "The answer separates source facts, calculated comparison context, and suggested language." };
  }
  if (q.includes("marketing") || q.includes("campaign") || q.includes("headline") || q.includes("pitch") || q.includes("position")) {
    return { answer: "VERIFIED PRODUCT FACT: the supplied FIT battlecard lists R-32 for the three Daikin FIT variants, 115V / 240V air-handler matchup, and 12-year parts and replacement coverage. COMPETITIVE ANALYSIS: these attributes can support a marketing differentiation narrative when the audience values installation flexibility and warranty coverage. MARKETING RECOMMENDATION: lead with the relevant verified attribute, then state its practical relevance without claiming universal superiority. SUGGESTED MESSAGE: ‘More proof behind every Daikin conversation.’ CLAIM REQUIRING VALIDATION: confirm current program terms, registration requirements, and market availability before external use.", citations: ["Daikin FIT Battlecard.pdf • p. 1 • Refrigerant, Air Handler Matchup, Warranty"], analysis: "The response explicitly separates source facts from analysis, recommendation, suggested copy, and validation items." };
  }
  if (q.includes("threat") || q.includes("risk") || q.includes("avoid")) {
    return { answer: "COMPETITIVE ANALYSIS: the source set contains competitors with higher listed SEER2 values in selected cases, so broad efficiency-leadership claims should not be used without model-specific evidence. INFORMATION UNAVAILABLE: several workbook cooling and qualitative fields are blank, while other cells show formula errors. MARKETING RECOMMENDATION: position verified Daikin benefits at the selected product level and keep an evidence drawer attached to external-facing claims.", citations: ["Daikin FIT Battlecard.pdf • p. 1 • SEER2", "Competitor comparison.xlsx • Comparison!I5:L5"], analysis: "This identifies a positioning risk from available values and refuses to fill the missing source fields." };
  }
  if (q.includes("warranty")) {
    return { answer: "The FIT battlecard lists the three Daikin FIT variants with 12-year parts and 12-year replacement coverage. Most shown competitors list 10-year parts and 10-year compressor coverage. Validate registration terms before external use.", citations: ["Daikin FIT Battlecard.pdf • p. 1 • Warranty"], analysis: "This is a source-grounded feature comparison; warranty terms can vary by registration and market." };
  }
  if (q.includes("sound") || q.includes("quiet")) {
    return { answer: "The battlecard lists Daikin FIT sound performance as approximately 45 dBA for DH6VS and DH7VS, and approximately 47 dBA for DH9VS Aurora. It also labels these variants as extremely quiet.", citations: ["Daikin FIT Battlecard.pdf • p. 1 • Sound Performance"], analysis: "Values are retained as approximate source values, not normalized test-condition comparisons." };
  }
  if (q.includes("r-32") || q.includes("refrigerant")) {
    return { answer: "The supplied battlecard identifies the DH6VS FIT, DH7VS FIT, and DH9VS FIT Aurora as R-32 products. It also shows selected competitive products with R-32 and R-454B; refrigerant alone is treated as contextual rather than automatically better.", citations: ["Daikin FIT Battlecard.pdf • p. 1 • Refrigerant"], analysis: "No automatic winner is assigned to refrigerant choice." };
  }
  if (q.includes("cold") || q.includes("5f") || q.includes("heating")) {
    return { answer: "For Daikin FIT, the battlecard shows heating operating range of -10°F to 70°F across the three listed variants. The hydronic comparison workbook separately lists Daikin UPRA043DAVK at -18°F lowest ambient and 31,000 BTU/h minimum heating capacity at its lowest ambient condition.", citations: ["Daikin FIT Battlecard.pdf • p. 1 • Heating Operating Range", "Competitor comparison.xlsx • Comparison!F7, D17"], analysis: "These are different product families and should not be treated as like-for-like equipment." };
  }
  const fitSeer = valuesFor("DH6VS FIT", "SEER2");
  return { answer: `I can answer from the imported materials only. One verified example: the battlecard lists DH6VS FIT at ${fitSeer ?? "information unavailable"}. Tell me the products or criterion you want to compare and I’ll cite the underlying row.`, citations: ["Daikin FIT Battlecard.pdf • p. 1"], analysis: "The mock advisor exposes only imported product attributes and flags missing values rather than estimating them." };
}
