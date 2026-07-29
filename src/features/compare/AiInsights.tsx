import * as React from "react";
import {
  Sparkles,
  ShieldCheck,
  TriangleAlert,
  MessagesSquare,
  Target,
  ListChecks,
  Copy,
  Check,
} from "lucide-react";
import { cn, copyText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AiTag } from "@/components/common/AiTag";
import { useToast } from "@/components/ui/toast";
import type { Product } from "@/data/types";
import type { ReviewSource } from "@/data/review-types";
import {
  MIN_REPORTABLE,
  summarizeSelection,
  type ProductReviewSummary,
} from "@/features/reviews/reviewEngine";
import type { ComparisonResult } from "./engine";

/**
 * AI Competitive Insights — a generated executive read of the whole comparison,
 * synthesising the calculated technical result with the matched review evidence.
 * Every line is derived deterministically from the same records the rest of the
 * page shows; the wording is machine-generated and marked as such.
 */

interface Insight {
  id: string;
  kind:
    | "EXECUTIVE READ"
    | "LEAD WITH"
    | "WATCH OUT"
    | "REVIEW SIGNAL"
    | "NEXT ACTIONS";
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  labelTone: string;
  body: string;
  bullets?: string[];
  citations: string[];
}

function buildInsights(
  result: ComparisonResult,
  summaries: ProductReviewSummary[],
): Insight[] {
  const insights: Insight[] = [];
  const daikin = result.daikinProducts;
  const comps = result.competitorProducts;
  const lead = result.edges[0];
  const worstGap = result.gaps.find((g) => g.kind === "leads");
  const reviewLead = summaries.filter((s) => s.count > 0).sort((a, b) => b.count - a.count)[0];

  /* ---- executive read ---- */
  const readParts: string[] = [];
  if (!daikin.length) {
    readParts.push("No Daikin product is selected, so there is no Daikin position to assess.");
  } else if (!comps.length) {
    readParts.push(
      `${daikin.map((p) => p.model).join(" and ")} ${daikin.length === 1 ? "is" : "are"} selected with no competitor, so this is a specification review rather than a competitive read.`,
    );
  } else {
    const posture =
      result.edges.length > result.gaps.filter((g) => g.kind === "leads").length * 2
        ? "a strong position"
        : result.edges.length > 0
          ? "a defensible but contested position"
          : "a difficult position on published figures";
    readParts.push(
      `Against ${comps.map((p) => `${p.brand} ${p.model}`).join(" and ")}, the selected Daikin ${daikin.length === 1 ? "product holds" : "products hold"} ${posture}: ${result.edges.length} verified ${result.edges.length === 1 ? "edge" : "edges"} against ${result.gaps.filter((g) => g.kind === "leads").length} attribute${result.gaps.filter((g) => g.kind === "leads").length === 1 ? "" : "s"} where a competitor leads, with ${result.dataConfidence}% of attribute cells carrying a verified value.`,
    );
    if (lead) {
      readParts.push(
        lead.marginLabel
          ? `The single strongest card is ${lead.attributeLabel.toLowerCase()} — ${lead.marginLabel} than the closest competitor.`
          : `The single strongest card is ${lead.attributeLabel.toLowerCase()}, listed on Daikin and not on the compared products.`,
      );
    }
    if (reviewLead && reviewLead.count >= MIN_REPORTABLE) {
      readParts.push(
        `Customer evidence is one-sided but substantial: ${reviewLead.count} matching reviews for ${reviewLead.product.model} averaging ${reviewLead.averageRating?.toFixed(2)}, with no approved review data for the competitors.`,
      );
    }
  }
  insights.push({
    id: "read",
    kind: "EXECUTIVE READ",
    icon: Sparkles,
    tone: "border-daikin-200 bg-gradient-to-br from-daikin-50/80 to-white",
    labelTone: "text-daikin-800",
    body: readParts.join(" "),
    citations: lead ? [lead.citation] : [],
  });

  /* ---- lead with ---- */
  if (result.edges.length) {
    insights.push({
      id: "lead",
      kind: "LEAD WITH",
      icon: ShieldCheck,
      tone: "border-verified-500/25 bg-verified-50/60",
      labelTone: "text-verified-700",
      body: "The edges most likely to survive scrutiny in a bid, ranked by measured margin:",
      bullets: result.edges.slice(0, 4).map((e) =>
        e.marginLabel
          ? `${e.attributeLabel} — ${e.daikinValue.display}, ${e.marginLabel} than the closest compared product.`
          : `${e.attributeLabel} — listed on ${e.daikinProduct.model}; not listed on ${e.beatenCompetitors.length} compared product${e.beatenCompetitors.length === 1 ? "" : "s"}.`,
      ),
      citations: result.edges.slice(0, 4).map((e) => e.citation),
    });
  }

  /* ---- watch out ---- */
  const leads = result.gaps.filter((g) => g.kind === "leads");
  if (leads.length) {
    insights.push({
      id: "risk",
      kind: "WATCH OUT",
      icon: TriangleAlert,
      tone: "border-caution-500/25 bg-caution-50/60",
      labelTone: "text-caution-700",
      body: `Where the compared products win on paper — expect ${worstGap ? `${worstGap.leadingProduct.brand} to open with ${worstGap.attributeLabel.toLowerCase()}` : "these to be raised first"}:`,
      bullets: leads.slice(0, 4).map((g) =>
        `${g.attributeLabel}: ${g.leadingProduct.model} lists ${g.leadingValue.display} vs ${g.affectedValue.display}${g.marginLabel ? ` (${g.marginLabel})` : ""}.`,
      ),
      citations: leads.slice(0, 4).map((g) => g.citation),
    });
  }

  /* ---- review signal ---- */
  if (reviewLead && reviewLead.count > 0) {
    const topThemes = reviewLead.themes
      .filter((t) => t.total >= MIN_REPORTABLE)
      .slice(0, 3);
    const critical = reviewLead.sentimentCounts.neutral + reviewLead.sentimentCounts.negative;
    const bullets = [
      `${reviewLead.product.model}: ${reviewLead.averageRating?.toFixed(2)} across ${reviewLead.count} ${reviewLead.matchLabel.toLowerCase()} (${reviewLead.positivePct}% positive).`,
      ...(topThemes.length
        ? [
            `Most-mentioned topics: ${topThemes.map((t) => `${t.label.toLowerCase()} (${t.total})`).join(", ")} — quiet operation corroborating the specification is the strongest tech-plus-voice story.`,
          ]
        : []),
      ...(critical > 0
        ? [
            `${critical} critical review${critical === 1 ? "" : "s"}: ${reviewLead.nonEquipmentConcerns.length} about installation, dealer or service; ${reviewLead.equipmentConcerns.length} about the equipment itself.`,
          ]
        : []),
      ...(summaries.some((s) => s.count === 0)
        ? [
            `No approved review data for ${summaries
              .filter((s) => s.count === 0)
              .map((s) => s.product.model)
              .join(", ")} — ratings cannot be compared across the selection and must not be presented as a ranking.`,
          ]
        : []),
    ];
    insights.push({
      id: "reviews",
      kind: "REVIEW SIGNAL",
      icon: MessagesSquare,
      tone: "border-edge bg-white",
      labelTone: "text-navy-700",
      body: "What the matched customer evidence adds — and where it stops:",
      bullets,
      citations: [],
    });
  }

  /* ---- next actions ---- */
  const actions: string[] = [];
  if (worstGap) actions.push(worstGap.suggestedAction);
  if (result.validations.length) {
    actions.push(
      `${result.validations.length} attribute${result.validations.length === 1 ? "" : "s"} cannot be compared because a source value is missing — closing those is the cheapest way to strengthen the claim set.`,
    );
  }
  if (reviewLead && summaries.some((s) => s.count === 0)) {
    actions.push(
      "Source an approved competitor review dataset so review comparisons stop being one-sided.",
    );
  }
  if (lead) {
    actions.push(
      `Build the homeowner story around ${lead.attributeLabel.toLowerCase()} and let the review evidence carry the second beat.`,
    );
  }
  if (actions.length) {
    insights.push({
      id: "actions",
      kind: "NEXT ACTIONS",
      icon: ListChecks,
      tone: "border-navy-200 bg-navy-50/60",
      labelTone: "text-navy-700",
      body: "Recommended moves, in order of leverage:",
      bullets: actions.slice(0, 4),
      citations: [],
    });
  }

  return insights;
}

export function AiCompetitiveInsights({
  products,
  result,
  reviewSource,
  onAsk,
}: {
  products: Product[];
  result: ComparisonResult;
  reviewSource: ReviewSource | null;
  onAsk: () => void;
}) {
  const { notify } = useToast();
  const [copied, setCopied] = React.useState(false);

  const summaries = React.useMemo(
    () => (reviewSource ? summarizeSelection(reviewSource, products) : []),
    [reviewSource, products],
  );
  const insights = React.useMemo(
    () => buildInsights(result, summaries),
    [result, summaries],
  );

  const asText = React.useCallback(() => {
    return insights
      .map(
        (i) =>
          `[${i.kind}]\n${i.body}${i.bullets ? `\n${i.bullets.map((b) => `• ${b}`).join("\n")}` : ""}${
            i.citations.length ? `\nSources:\n${Array.from(new Set(i.citations)).map((c) => `  - ${c}`).join("\n")}` : ""
          }`,
      )
      .join("\n\n")
      .concat("\n\nAI-assisted summary generated from the product comparison and review data. Internal use only.");
  }, [insights]);

  return (
    <section aria-label="AI competitive insights" className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-bold text-navy-900">
            <span className="grid size-9 place-items-center rounded-xl bg-daikin-600 text-white">
              <Sparkles className="size-5" aria-hidden />
            </span>
            AI competitive insights
            <AiTag kind="generated" />
          </h2>
          <p className="mt-1.5 max-w-4xl text-base text-navy-500">
            A generated executive read of this selection — synthesised from the calculated comparison and
            the matched customer reviews, never from anything outside them.
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              const ok = await copyText(asText());
              if (ok) {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
                notify("AI insights copied.");
              } else notify("Could not access the clipboard.", "warning");
            }}
          >
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            Copy insights
          </Button>
          <Button variant="secondary" onClick={onAsk}>
            <Target aria-hidden />
            Ask a follow-up
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          return (
            <article
              key={insight.id}
              className={cn(
                "rounded-2xl border p-5 shadow-card",
                insight.tone,
                idx === 0 && "lg:col-span-2",
              )}
            >
              <p className={cn("flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider", insight.labelTone)}>
                <Icon className="size-4" aria-hidden />
                {insight.kind}
                <AiTag kind="generated" />
              </p>
              <p className={cn("mt-2 leading-relaxed text-navy-800", idx === 0 ? "text-[1.0625rem]" : "text-[0.9375rem]")}>
                {insight.body}
              </p>
              {insight.bullets && (
                <ul className="mt-2.5 space-y-1.5">
                  {insight.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-[0.9375rem] leading-relaxed text-navy-700">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-current opacity-40" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {insight.citations.length > 0 && (
                <ul className="mt-3 space-y-0.5 border-t border-black/5 pt-2.5">
                  {Array.from(new Set(insight.citations)).map((c) => (
                    <li key={c} className="text-xs leading-relaxed text-navy-400">
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>

      <p className="flex items-center gap-2 text-xs text-navy-400">
        <Badge variant="caution" size="sm">
          Internal use only
        </Badge>
        AI-assisted summary generated from the product comparison and review data. It updates the moment the
        selection changes and is never based on information outside the imported sources.
      </p>
    </section>
  );
}
