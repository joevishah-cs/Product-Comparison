import { Star, ShieldQuestion, Wrench, Users, LifeBuoy, Package, Cpu } from "lucide-react";
import { AiTag } from "@/components/common/AiTag";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Explain } from "@/components/ui/tooltip";
import type { MatchLevel, ReviewRecord } from "@/data/review-types";
import { MATCH_LEVEL_LABEL, MATCH_LEVEL_NOTE } from "@/data/review-types";
import { CONFIDENCE_LABEL, type Confidence } from "./reviewEngine";

export function StarRating({
  value,
  size = "md",
  showValue = false,
  className,
}: {
  value: number | null;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}) {
  if (value === null) {
    return <span className="text-sm text-navy-400">Not rated</span>;
  }
  const px = size === "lg" ? "size-6" : size === "sm" ? "size-3.5" : "size-[18px]";
  const rounded = Math.round(value * 2) / 2;

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="flex" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = rounded >= i;
          const half = !filled && rounded >= i - 0.5;
          return (
            <span key={i} className="relative">
              <Star className={cn(px, "text-navy-200")} fill="currentColor" aria-hidden />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? "50%" : "100%" }}
                  aria-hidden
                >
                  <Star className={cn(px, "text-amber-400")} fill="currentColor" />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showValue && (
        <span
          className={cn(
            "font-bold text-navy-900",
            size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base",
          )}
        >
          {value.toFixed(1)}
        </span>
      )}
    </span>
  );
}

export function MatchLevelBadge({
  matchLevel,
  count,
  size = "sm",
}: {
  matchLevel: MatchLevel;
  count?: number;
  size?: "sm" | "md";
}) {
  const variant =
    matchLevel === "exact_unit" || matchLevel === "exact_model"
      ? "verified"
      : matchLevel === "none"
        ? "neutral"
        : "caution";

  return (
    <Explain content={MATCH_LEVEL_NOTE[matchLevel]}>
      <span tabIndex={0} className="inline-flex">
        <Badge variant={variant} size={size}>
          <ShieldQuestion aria-hidden />
          {MATCH_LEVEL_LABEL[matchLevel]}
          {typeof count === "number" && matchLevel !== "none" ? ` · ${count}` : ""}
        </Badge>
      </span>
    </Explain>
  );
}

export function ConfidenceBadge({ confidence, count }: { confidence: Confidence; count: number }) {
  const variant =
    confidence === "strong" ? "verified" : confidence === "moderate" ? "daikin" : "caution";
  return (
    <Explain
      content={`${CONFIDENCE_LABEL[confidence]} — based on ${count} matching ${count === 1 ? "review" : "reviews"}. A high average from a small sample is not treated as stronger than a slightly lower average from a large one.`}
    >
      <span tabIndex={0} className="inline-flex">
        <Badge variant={variant} size="sm">
          {CONFIDENCE_LABEL[confidence]}
        </Badge>
      </span>
    </Explain>
  );
}

const SUBJECT_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  equipment: { label: "Equipment", icon: Cpu },
  installation: { label: "Installation", icon: Wrench },
  dealer: { label: "Dealer / contractor", icon: Users },
  service: { label: "Service", icon: LifeBuoy },
  delivery: { label: "Delivery", icon: Package },
};

export function SubjectChips({ subjects }: { subjects: string[] }) {
  if (!subjects.length) return null;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <AiTag />
      {subjects.map((s) => {
        const meta = SUBJECT_META[s];
        if (!meta) return null;
        const Icon = meta.icon;
        return (
          <Badge key={s} variant="outline" size="sm">
            <Icon aria-hidden />
            {meta.label}
          </Badge>
        );
      })}
    </span>
  );
}

/** A single review, always shown verbatim. Text is never edited, merged or trimmed. */
export function ReviewCard({
  review,
  matchLevel,
  themeLabels,
  compact = false,
  showSubjects = true,
}: {
  review: ReviewRecord;
  matchLevel: MatchLevel;
  themeLabels: Record<string, string>;
  compact?: boolean;
  showSubjects?: boolean;
}) {
  const tone =
    review.sentiment === "positive"
      ? "border-verified-500/20 bg-verified-50/40"
      : review.sentiment === "neutral"
        ? "border-caution-500/20 bg-caution-50/40"
        : "border-risk-500/20 bg-risk-50/40";

  return (
    <article className={cn("rounded-2xl border p-4", tone)}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <StarRating value={review.rating} size="sm" showValue />
        <span className="text-xs text-navy-500">{review.date ? formatDate(review.date) : "Date not recorded"}</span>
      </header>

      {review.title && (
        <h4 className="mt-2 text-[0.9375rem] font-bold leading-snug text-navy-900">{review.title}</h4>
      )}

      {review.text ? (
        <blockquote
          className={cn(
            "mt-1.5 border-l-2 border-navy-200 pl-3 text-[0.9375rem] leading-relaxed text-navy-700",
            compact && "line-clamp-5",
          )}
        >
          {review.text}
        </blockquote>
      ) : (
        <p className="mt-1.5 text-sm italic text-navy-400">The reviewer left a rating without written feedback.</p>
      )}

      <footer className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-black/5 pt-2.5">
        <MatchLevelBadge matchLevel={matchLevel} />
        <span className="text-xs text-navy-500">{review.productName || review.productId}</span>
        {showSubjects && <SubjectChips subjects={review.subjects} />}
        {review.themes.length > 0 && (
          <span className="flex flex-wrap items-center gap-1">
            {!showSubjects && <AiTag />}
            {review.themes.slice(0, 4).map((t) => (
              <span key={t} className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-navy-500">
                {themeLabels[t] ?? t}
              </span>
            ))}
          </span>
        )}
      </footer>
    </article>
  );
}

export function NoReviewData({ productName }: { productName?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-edge bg-navy-50/50 p-6 text-center">
      <p className="text-base font-semibold text-navy-600">No approved user-review data available</p>
      {productName && (
        <p className="mt-1 text-sm text-navy-500">
          The imported review export contains no reviews matching {productName}.
        </p>
      )}
    </div>
  );
}
