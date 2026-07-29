import * as React from "react";
import { ArrowUpRight, ArrowDownRight, Minus, Lightbulb, CircleSlash } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { InfoTip } from "@/components/ui/tooltip";
import { AiTag } from "@/components/common/AiTag";

export type BetterDirection = "higher" | "lower" | "none";

export function DirectionBadge({ direction }: { direction: BetterDirection }) {
  if (direction === "none") {
    return (
      <Badge variant="outline" size="sm">
        <Minus aria-hidden />
        Neither higher nor lower is inherently better
      </Badge>
    );
  }
  return (
    <Badge variant="daikin" size="sm">
      {direction === "higher" ? <ArrowUpRight aria-hidden /> : <ArrowDownRight aria-hidden />}
      {direction === "higher" ? "Higher is better" : "Lower is better"}
    </Badge>
  );
}

export function ChartCard({
  title,
  subtitle,
  direction,
  glossaryTerm,
  glossary,
  meaning,
  sources,
  unavailableNote,
  children,
  className,
  actions,
}: {
  title: string;
  subtitle?: string;
  direction: BetterDirection;
  glossaryTerm?: string;
  glossary?: string;
  meaning: React.ReactNode;
  sources: string[];
  unavailableNote?: string | null;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  const uniqueSources = Array.from(new Set(sources));

  return (
    <section
      className={cn("flex flex-col rounded-2xl border border-edge bg-white p-6 shadow-card", className)}
      aria-label={title}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1 text-lg font-semibold text-navy-900">
            {title}
            {glossary && glossaryTerm && <InfoTip label={glossaryTerm}>{glossary}</InfoTip>}
          </h3>
          {subtitle && <p className="mt-0.5 text-sm text-navy-500">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <DirectionBadge direction={direction} />
        </div>
      </header>

      <div className="mt-5 flex-1">{children}</div>

      {unavailableNote && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-caution-50 px-3.5 py-2.5 text-sm text-caution-700">
          <CircleSlash className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{unavailableNote}</span>
        </p>
      )}

      <div className="mt-5 rounded-xl bg-daikin-50/60 p-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-daikin-800">
          <Lightbulb className="size-4" aria-hidden />
          What this means
          <AiTag kind="generated" />
        </p>
        <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-navy-700">{meaning}</p>
      </div>

      <footer className="mt-3 space-y-1">
        {uniqueSources.map((s) => (
          <p key={s} className="text-xs leading-relaxed text-navy-400">
            Source: {s}
          </p>
        ))}
      </footer>
    </section>
  );
}
