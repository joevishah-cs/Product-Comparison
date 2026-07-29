import * as React from "react";
import { ShieldCheck, Calculator, Megaphone, AlertTriangle, Copy, Check, Lock, Globe } from "lucide-react";
import { cn, copyText } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { AiTag } from "@/components/common/AiTag";
import type { AttributeValue, Product } from "@/data/types";
import type { ComparisonResult } from "./engine";

export type TakeawayKind =
  | "VERIFIED PRODUCT FACT"
  | "COMPETITIVE INTERPRETATION"
  | "SUGGESTED MARKETING MESSAGE"
  | "CLAIM REQUIRING VALIDATION";

export interface Takeaway {
  id: string;
  kind: TakeawayKind;
  text: string;
  source: string | null;
  usage: "external" | "internal";
}

const STYLE: Record<TakeawayKind, { icon: React.ComponentType<{ className?: string }>; card: string; label: string }> = {
  "VERIFIED PRODUCT FACT": {
    icon: ShieldCheck,
    card: "border-verified-500/25 bg-verified-50/70",
    label: "text-verified-700",
  },
  "COMPETITIVE INTERPRETATION": {
    icon: Calculator,
    card: "border-daikin-200 bg-daikin-50/70",
    label: "text-daikin-800",
  },
  "SUGGESTED MARKETING MESSAGE": {
    icon: Megaphone,
    card: "border-edge bg-white",
    label: "text-navy-700",
  },
  "CLAIM REQUIRING VALIDATION": {
    icon: AlertTriangle,
    card: "border-caution-500/25 bg-caution-50/70",
    label: "text-caution-700",
  },
};

export function buildTakeaways(products: Product[], result: ComparisonResult): Takeaway[] {
  const takeaways: Takeaway[] = [];
  const lead = result.edges[0];

  if (lead) {
    takeaways.push({
      id: "fact-lead",
      kind: "VERIFIED PRODUCT FACT",
      text: `${lead.daikinProduct.displayName} records ${lead.attributeLabel} of ${lead.daikinValue.display} in the imported source.`,
      source: lead.citation,
      usage: "external",
    });
    takeaways.push({
      id: "interp-lead",
      kind: "COMPETITIVE INTERPRETATION",
      text: lead.marginLabel
        ? `Across the ${lead.beatenCompetitors.length} selected competitor${lead.beatenCompetitors.length === 1 ? "" : "s"} with a recorded value, ${lead.daikinProduct.model} is ${lead.marginLabel}. ${lead.unvalidatedCompetitors.length ? `${lead.unvalidatedCompetitors.length} further competitor${lead.unvalidatedCompetitors.length === 1 ? " has" : "s have"} no recorded value and ${lead.unvalidatedCompetitors.length === 1 ? "is" : "are"} excluded from the claim.` : "Every selected competitor carries a recorded value, so the comparison is complete."}`
        : `${lead.attributeLabel} is listed as available on Daikin and listed as not available on ${lead.beatenCompetitors.length} selected competitor${lead.beatenCompetitors.length === 1 ? "" : "s"}.`,
      source: lead.citation,
      usage: "internal",
    });
    takeaways.push({
      id: "message-lead",
      kind: "SUGGESTED MARKETING MESSAGE",
      text: messageFor(lead.attributeKey, customerValue(lead.attributeKey, lead.daikinValue), lead.daikinProduct.displayName),
      source: lead.citation,
      usage: "external",
    });
  } else {
    takeaways.push({
      id: "fact-none",
      kind: "VERIFIED PRODUCT FACT",
      text: "The current selection produces no attribute where a Daikin value beats every selected competitor with a recorded value.",
      source: null,
      usage: "internal",
    });
  }

  const gap = result.gaps[0];
  if (gap) {
    takeaways.push({
      id: "interp-gap",
      kind: "COMPETITIVE INTERPRETATION",
      text: `${gap.attributeLabel}: ${gap.headline} ${gap.suggestedAction}`,
      source: gap.citation,
      usage: "internal",
    });
  }

  if (result.validations.length) {
    takeaways.push({
      id: "validation",
      kind: "CLAIM REQUIRING VALIDATION",
      text: `${result.validations.length} attribute${result.validations.length === 1 ? "" : "s"} in this comparison (${result.validations
        .slice(0, 4)
        .map((v) => v.attributeLabel)
        .join(", ")}${result.validations.length > 4 ? ", and others" : ""}) have at least one blank source cell. Do not state or imply “only Daikin” on these until the missing values are confirmed — a blank is not a “No”.`,
      source: null,
      usage: "internal",
    });
  }

  if (result.crossFamily) {
    takeaways.push({
      id: "validation-cross",
      kind: "CLAIM REQUIRING VALIDATION",
      text: "This selection mixes inverter ducted split heat pumps with air-to-water heat pumps. They are rated on different attributes and must not be presented as directly equivalent.",
      source: null,
      usage: "internal",
    });
  }

  const daikinQuiet = products.filter((p) => p.isDaikin && p.attributes.sound_level?.status === "verified");
  if (daikinQuiet.length) {
    takeaways.push({
      id: "validation-sound",
      kind: "CLAIM REQUIRING VALIDATION",
      text: "The battlecard notes that quiet-mode ratings are not included in the recorded sound levels, and does not record the measurement distance or condition. Confirm the rating basis with product marketing before any sound claim is used externally.",
      source: 'Daikin FIT Battlecard.pdf · p.1 · row "Sound Performance" · comment column',
      usage: "internal",
    });
  }

  return takeaways;
}

/** Customer-facing copy uses the measured figure rather than the source's own
 *  qualitative prefix (e.g. "Extremely Quiet, ~45dBA" reads as "45 dBA"). */
function customerValue(attributeKey: string, value: AttributeValue): string {
  if (attributeKey === "sound_level" && value.numeric !== null) return `${value.numeric} dBA`;
  return value.display;
}

function messageFor(attributeKey: string, value: string, product: string): string {
  switch (attributeKey) {
    case "sound_level":
      return `"At ${value}, ${product} sits at about the level of a quiet room. You can stand next to it and hold a normal conversation — which matters when the unit is outside a bedroom window."`;
    case "warranty":
      return `"${product} is backed by ${value}. Ask what happens in year eleven: a parts warranty pays for a part, a replacement warranty replaces the unit."`;
    case "seer2":
      return `"${product} is rated up to ${value} SEER2 — that is cooling efficiency you feel every month of the summer, not just on the spec sheet."`;
    case "cop_5f":
      return `"At 5°F outside, ${product} still returns a COP of ${value} — it is moving more heat into your home than the electricity it draws, on the coldest mornings of the year."`;
    case "charge_verification":
      return `"${product} lets your installer confirm the refrigerant charge is exactly right without guesswork. Correct charge is the single biggest driver of the efficiency you actually get."`;
    case "slow_loss_alerting":
      return `"If refrigerant ever starts leaking slowly, ${product} tells your contractor before you notice a comfort problem — and long before it damages the compressor."`;
    case "cloud_alerts":
      return `"${product} reports faults to your contractor in real time, so in many cases they know what is wrong before the van leaves the shop."`;
    case "air_handler_matchup":
      return `"${product} offers an indoor unit that runs on a standard household circuit, which can save running a new dedicated line through a finished house."`;
    default:
      return `"${product} records ${value} for this attribute — a difference you can point to on the specification sheet."`;
  }
}

export function MarketingTakeaways({
  products,
  result,
}: {
  products: Product[];
  result: ComparisonResult;
}) {
  const takeaways = React.useMemo(() => buildTakeaways(products, result), [products, result]);
  const { notify } = useToast();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  return (
    <section aria-label="Marketing takeaways" className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold text-navy-900">Marketing takeaways</h2>
        <p className="mt-1.5 max-w-4xl text-base text-navy-500">
          Ready-to-use lines drawn from this comparison, each labelled by what kind of statement it is and
          whether it is safe to use outside the company.
        </p>
      </header>

      <ul className="grid gap-4 lg:grid-cols-2">
        {takeaways.map((t) => {
          const style = STYLE[t.kind];
          const Icon = style.icon;
          return (
            <li key={t.id} className={cn("rounded-2xl border p-5 shadow-card", style.card)}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className={cn("flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider", style.label)}>
                  <Icon className="size-4" aria-hidden />
                  {t.kind}
                  {(t.kind === "COMPETITIVE INTERPRETATION" || t.kind === "SUGGESTED MARKETING MESSAGE") && (
                    <AiTag kind="generated" />
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={t.usage === "internal" ? "caution" : "outline"} size="sm">
                    {t.usage === "internal" ? <Lock aria-hidden /> : <Globe aria-hidden />}
                    {t.usage === "internal" ? "Internal use only" : "Cleared for external use"}
                  </Badge>
                  <button
                    type="button"
                    aria-label={`Copy this ${t.kind.toLowerCase()}`}
                    onClick={async () => {
                      const ok = await copyText(
                        `${t.kind}\n${t.text}${t.source ? `\n\nSource: ${t.source}` : ""}${t.usage === "internal" ? "\n\nINTERNAL USE ONLY — not for external distribution." : ""}`,
                      );
                      if (ok) {
                        setCopiedId(t.id);
                        window.setTimeout(() => setCopiedId(null), 1800);
                        notify("Copied to clipboard.");
                      } else notify("Could not access the clipboard.", "warning");
                    }}
                    className="rounded-lg p-2 text-navy-400 transition-colors hover:bg-white/70 hover:text-navy-700"
                  >
                    {copiedId === t.id ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-[0.9375rem] leading-relaxed text-navy-800">{t.text}</p>
              {t.source && <p className="mt-3 text-xs leading-relaxed text-navy-400">Source: {t.source}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
