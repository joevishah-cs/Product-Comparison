export interface DashboardInsights {
  positioningSummary: string[];
  positioningGaps: string[];
  scorecards: { label: string; leader: string; description: string }[];
  takeaways: {
    fact: string;
    interpretation: string;
    message: string;
    validation: string;
  };
}

export function parseDashboardInsights(raw: string | null | undefined): DashboardInsights {
  const positioningSummary: string[] = [];
  const positioningGaps: string[] = [];
  const scorecards: { label: string; leader: string; description: string }[] = [];
  const takeaways = {
    fact: "",
    interpretation: "",
    message: "",
    validation: "",
  };

  if (!raw) return { positioningSummary, positioningGaps, scorecards, takeaways };

  const lines = raw.split("\n");
  let currentSection = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.includes("VERIFIED DAIKIN EDGES") || trimmed.includes("POSITIONING SUMMARY")) {
      currentSection = "edges";
    } else if (trimmed.includes("COMPETITIVE GAPS") || trimmed.includes("ADDRESS")) {
      currentSection = "gaps";
    } else if (trimmed.includes("ADVANTAGE SCORECARDS")) {
      currentSection = "scorecards";
    } else if (trimmed.includes("MARKETING TAKEAWAYS")) {
      currentSection = "takeaways";
    } else if (trimmed.includes("VERIFIED FACT")) {
      currentSection = "fact";
    } else if (trimmed.includes("COMPETITIVE INTERPRETATION")) {
      currentSection = "interpretation";
    } else if (trimmed.includes("SUGGESTED MARKETING")) {
      currentSection = "message";
    } else if (trimmed.includes("CLAIM REQUIRING")) {
      currentSection = "validation";
    } else if (currentSection === "edges" && trimmed.startsWith("-")) {
      positioningSummary.push(trimmed.replace(/^-\s*/, ""));
    } else if (currentSection === "gaps" && trimmed.startsWith("-")) {
      positioningGaps.push(trimmed.replace(/^-\s*/, ""));
    } else if (currentSection === "scorecards" && trimmed.includes(":")) {
      const [label, value] = trimmed.split(":").map((s) => s.trim());
      if (label && value) {
        scorecards.push({ label, leader: value.split("-")[0].trim(), description: value });
      }
    } else if (currentSection === "fact" && trimmed.length > 0) {
      takeaways.fact = trimmed.length > takeaways.fact.length ? trimmed : takeaways.fact;
    } else if (currentSection === "interpretation" && trimmed.length > 0) {
      takeaways.interpretation = trimmed;
    } else if (currentSection === "message" && trimmed.length > 0) {
      takeaways.message = trimmed;
    } else if (currentSection === "validation" && trimmed.length > 0) {
      takeaways.validation = trimmed;
    }
  }

  return { positioningSummary, positioningGaps, scorecards, takeaways };
}

export interface ParsedInsightSection {
  title: string;
  lines: Array<{ text: string; level: number }>;
}

// Matches "1) TITLE", "2. TITLE:", "3) TITLE - rest", "4) TITLE (parenthetical)",
// with or without a colon/dash/parenthetical/end-of-line after the title.
const HEADER_PATTERN = /^\s*\d+[).]\s*([A-Z][A-Z /]{2,40}?)\s*(?::\s*(.*)|-\s*(.*)|\((.*)\)\s*$|$)/;
// A bold-ish sub-heading inside a section, e.g. "Disadvantages:", "For fit-2:"
const SUBHEADING_PATTERN = /^[A-Za-z][A-Za-z0-9 /'-]{0,40}:\s*$/;

function normalizeSectionTitle(title: string | undefined): string {
  return (title ?? "").trim().replace(/\s+/g, " ").toUpperCase();
}

export function parseInsights(raw: string | null | undefined): ParsedInsightSection[] {
  if (!raw) return [];

  const lines = raw.split("\n");

  const sections: ParsedInsightSection[] = [];
  let current: ParsedInsightSection | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    const headerMatch = line.match(HEADER_PATTERN);
    if (headerMatch) {
      if (current) sections.push(current);
      current = { title: normalizeSectionTitle(headerMatch[1]), lines: [] };
      // Only one of the colon/dash/parenthetical alternation branches matches;
      // pick whichever captured group actually has content.
      const rest = (headerMatch[2] || headerMatch[3] || headerMatch[4] || "").trim();
      if (rest) {
        current.lines.push({ text: rest, level: 0 });
      }
      continue;
    }

    if (!current) {
      current = { title: "AI ANALYSIS", lines: [] };
    }

    const trimmed = line.trim();
    const indentMatch = rawLine.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const isBullet = trimmed.startsWith("-") || trimmed.startsWith("•");
    const isSubheading = !isBullet && SUBHEADING_PATTERN.test(trimmed);
    const level = isSubheading ? 0 : isBullet ? (indent > 2 ? 2 : 1) : 0;
    const text = trimmed.replace(/^[-•]+\s*/, "");
    if (text) current.lines.push({ text, level });
  }

  if (current) sections.push(current);
  return sections;
}
