import * as React from "react";
import { X, Filter, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ReviewRecord, ReviewSentiment, ReviewSource } from "@/data/review-types";
import type { ProductReviewSummary } from "./reviewEngine";
import { ReviewCard, MatchLevelBadge } from "./ReviewPrimitives";

export interface ReviewDrawerFilter {
  productId?: string;
  theme?: string;
  sentiment?: ReviewSentiment;
}

const SENTIMENTS: { value: ReviewSentiment | "all"; label: string }[] = [
  { value: "all", label: "All ratings" },
  { value: "positive", label: "Positive (4–5★)" },
  { value: "neutral", label: "Neutral (3★)" },
  { value: "negative", label: "Negative (1–2★)" },
];

export function ReviewDrawer({
  open,
  onClose,
  summaries,
  source,
  initialFilter,
}: {
  open: boolean;
  onClose: () => void;
  summaries: ProductReviewSummary[];
  source: ReviewSource;
  initialFilter?: ReviewDrawerFilter;
}) {
  const [productId, setProductId] = React.useState<string>("all");
  const [sentiment, setSentiment] = React.useState<ReviewSentiment | "all">("all");
  const [theme, setTheme] = React.useState<string>("all");
  const [subject, setSubject] = React.useState<string>("all");
  const [rating, setRating] = React.useState<string>("all");
  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) return;
    setProductId(initialFilter?.productId ?? "all");
    setTheme(initialFilter?.theme ?? "all");
    setSentiment(initialFilter?.sentiment ?? "all");
    setSubject("all");
    setRating("all");
    setFrom("");
    setTo("");
  }, [open, initialFilter]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const themeLabels = React.useMemo(
    () => Object.fromEntries(source.themeDefinitions.map((d) => [d.key, d.label])),
    [source],
  );

  const withData = summaries.filter((s) => s.count > 0);

  const rows = React.useMemo(() => {
    const scoped = productId === "all" ? withData : withData.filter((s) => s.product.id === productId);
    const seen = new Set<string>();
    const out: { review: ReviewRecord; summary: ProductReviewSummary }[] = [];

    for (const summary of scoped) {
      for (const review of summary.reviews) {
        const key = `${summary.product.id}:${review.id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (sentiment !== "all" && review.sentiment !== sentiment) continue;
        if (theme !== "all" && !review.themes.includes(theme)) continue;
        if (subject !== "all" && !review.subjects.includes(subject)) continue;
        if (rating !== "all" && String(review.rating) !== rating) continue;
        if (from && (!review.date || review.date < from)) continue;
        if (to && (!review.date || review.date > to)) continue;

        out.push({ review, summary });
      }
    }
    return out.sort((a, b) => (b.review.date ?? "").localeCompare(a.review.date ?? ""));
  }, [withData, productId, sentiment, theme, subject, rating, from, to]);

  const [limit, setLimit] = React.useState(30);
  React.useEffect(() => setLimit(30), [productId, sentiment, theme, subject, rating, from, to]);

  if (!open) return null;

  return (
    <div className="no-print fixed inset-0 z-[110]">
      <button
        type="button"
        aria-label="Close review details"
        onClick={onClose}
        className="absolute inset-0 bg-navy-950/45 backdrop-blur-[2px]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Review details"
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l border-edge bg-white shadow-pop"
      >
        <header className="flex items-start justify-between gap-3 border-b border-edge p-5">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-navy-900">Review details</h2>
            <p className="mt-1 text-sm text-navy-500">
              {rows.length} of {withData.reduce((n, s) => n + s.count, 0)} matching reviews · shown verbatim
              from {source.sourceFile}
            </p>
          </div>
          <Button variant="ghost" size="iconSm" onClick={onClose} aria-label="Close review details">
            <X aria-hidden />
          </Button>
        </header>

        <div className="space-y-3 border-b border-edge bg-navy-50/60 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-500">
            <Filter className="size-3.5" aria-hidden /> Filters
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-navy-600">Product</span>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="h-11 w-full rounded-xl border border-edge bg-white px-3 text-sm text-navy-800 focus:border-daikin-500 focus:outline-none focus:ring-2 focus:ring-daikin-500/25"
              >
                <option value="all">All products with review data</option>
                {withData.map((s) => (
                  <option key={s.product.id} value={s.product.id}>
                    {s.product.displayName} ({s.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-navy-600">Theme</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="h-11 w-full rounded-xl border border-edge bg-white px-3 text-sm text-navy-800 focus:border-daikin-500 focus:outline-none focus:ring-2 focus:ring-daikin-500/25"
              >
                <option value="all">All themes</option>
                {source.themeDefinitions.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-navy-600">Feedback is about</span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-11 w-full rounded-xl border border-edge bg-white px-3 text-sm text-navy-800 focus:border-daikin-500 focus:outline-none focus:ring-2 focus:ring-daikin-500/25"
              >
                <option value="all">Anything</option>
                {source.subjectDefinitions.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-navy-600">Star rating</span>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="h-11 w-full rounded-xl border border-edge bg-white px-3 text-sm text-navy-800 focus:border-daikin-500 focus:outline-none focus:ring-2 focus:ring-daikin-500/25"
              >
                <option value="all">Any rating</option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={String(r)}>
                    {r} star{r === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-navy-600">From</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-11 w-full rounded-xl border border-edge bg-white px-3 text-sm text-navy-800 focus:border-daikin-500 focus:outline-none focus:ring-2 focus:ring-daikin-500/25"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-navy-600">To</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-11 w-full rounded-xl border border-edge bg-white px-3 text-sm text-navy-800 focus:border-daikin-500 focus:outline-none focus:ring-2 focus:ring-daikin-500/25"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by sentiment">
            {SENTIMENTS.map((s) => (
              <button
                key={s.value}
                type="button"
                aria-pressed={sentiment === s.value}
                onClick={() => setSentiment(s.value)}
                className={cn(
                  "min-h-[38px] rounded-xl border px-3 text-sm font-semibold transition-colors",
                  sentiment === s.value
                    ? "border-daikin-600 bg-daikin-600 text-white"
                    : "border-edge bg-white text-navy-600 hover:border-daikin-300",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-navy-500">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            The export records no verified-purchase status, source platform, helpful votes or sub-ratings,
            so those filters are not offered rather than being approximated.
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4 scroll-shadow">
          {rows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-edge p-10 text-center text-base text-navy-500">
              No reviews match these filters.
            </p>
          ) : (
            <>
              {rows.slice(0, limit).map(({ review, summary }) => (
                <ReviewCard
                  key={`${summary.product.id}-${review.id}`}
                  review={review}
                  matchLevel={summary.matchLevel}
                  themeLabels={themeLabels}
                />
              ))}
              {rows.length > limit && (
                <Button variant="secondary" className="w-full" onClick={() => setLimit((l) => l + 30)}>
                  Show {Math.min(30, rows.length - limit)} more of {rows.length - limit} remaining
                </Button>
              )}
            </>
          )}
        </div>

        <footer className="border-t border-edge bg-navy-50/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {withData.map((s) => (
              <MatchLevelBadge key={s.product.id} matchLevel={s.matchLevel} count={s.count} />
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-navy-500">
            Customer reviews reflect individual experiences and may relate to equipment, installation,
            contractor service, home conditions, climate, maintenance, or personal expectations. Reviews are
            not guarantees of future performance.
          </p>
        </footer>
      </aside>
    </div>
  );
}

export function useReviewDrawer() {
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<ReviewDrawerFilter | undefined>();

  const show = React.useCallback((f?: ReviewDrawerFilter) => {
    setFilter(f);
    setOpen(true);
  }, []);

  const hide = React.useCallback(() => setOpen(false), []);

  return { open, filter, show, hide };
}
