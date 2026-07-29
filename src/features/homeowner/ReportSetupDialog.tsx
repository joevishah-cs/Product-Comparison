import { Sparkles, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductVisual } from "@/components/common/ProductVisual";
import type { Product } from "@/data/types";
import { PRIORITIES } from "./homeownerEngine";
import { useHomeowner } from "./HomeownerProvider";

export function ReportSetupDialog({
  open,
  onOpenChange,
  daikinProducts,
  competitorProducts,
  unitSelections,
  onGenerate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  daikinProducts: Product[];
  competitorProducts: Product[];
  unitSelections: Record<string, number>;
  onGenerate: () => void;
}) {
  const { config, update, togglePriority, useRecommendedPriorities } = useHomeowner();

  const recommended =
    daikinProducts.find((p) => p.id === config.recommendedProductId) ?? daikinProducts[0] ?? null;

  const includedCompetitors = config.competitorIds.length
    ? config.competitorIds
    : competitorProducts.map((p) => p.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Create homeowner report</DialogTitle>
        <DialogDescription>
          Everything here is optional except the product selection. The report is generated from the same
          verified data and customer reviews as the technical comparison.
        </DialogDescription>

        <form
          className="mt-5 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            update({
              recommendedProductId: recommended?.id ?? null,
              competitorIds: includedCompetitors,
            });
            onGenerate();
          }}
        >
          {/* Recommended product */}
          <fieldset>
            <legend className="text-sm font-semibold text-navy-700">Recommended Daikin product</legend>
            {daikinProducts.length === 0 ? (
              <p className="mt-2 rounded-xl bg-caution-50 p-3 text-sm text-caution-700">
                No Daikin product is in the current comparison. Add one to generate a homeowner report.
              </p>
            ) : (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {daikinProducts.map((p) => {
                  const active = (config.recommendedProductId ?? daikinProducts[0].id) === p.id;
                  const tons = unitSelections[p.id];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => update({ recommendedProductId: p.id })}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                        active
                          ? "border-daikin-500 bg-daikin-50 ring-1 ring-inset ring-daikin-300"
                          : "border-edge bg-white hover:border-daikin-300",
                      )}
                    >
                      <ProductVisual product={p} size="xs" />
                      <span className="min-w-0">
                        <span className="block truncate text-[0.9375rem] font-semibold text-navy-900">
                          {p.model}
                        </span>
                        <span className="block text-sm text-navy-500">
                          {tons ? `${tons} ton` : p.tonnages ? "Unit size not selected" : "Model-level only"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>

          {/* Competitors */}
          <fieldset>
            <legend className="text-sm font-semibold text-navy-700">Competitor products to include</legend>
            {competitorProducts.length === 0 ? (
              <p className="mt-2 rounded-xl bg-caution-50 p-3 text-sm text-caution-700">
                No competitor is selected. Add at least one so the report has something to compare against.
              </p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {competitorProducts.map((p) => {
                  const checked = includedCompetitors.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-edge px-3 hover:bg-navy-50"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          update({
                            competitorIds:
                              v === true
                                ? [...includedCompetitors, p.id]
                                : includedCompetitors.filter((id) => id !== p.id),
                          })
                        }
                        aria-label={`Include ${p.displayName}`}
                      />
                      <ProductVisual product={p} size="xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-navy-900">{p.model}</span>
                        <span className="block text-xs text-navy-500">{p.brand}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>

          {/* Priorities */}
          <fieldset>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <legend className="text-sm font-semibold text-navy-700">
                What matters most to this homeowner?
              </legend>
              <Button type="button" variant="ghost" size="sm" onClick={useRecommendedPriorities}>
                <Sparkles aria-hidden />
                Use recommended priorities
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRIORITIES.map((p) => {
                const active = config.priorities.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => togglePriority(p.key)}
                    className={cn(
                      "min-h-[40px] rounded-full border px-3.5 text-sm font-medium transition-colors",
                      active
                        ? "border-daikin-500 bg-daikin-600 text-white"
                        : "border-edge bg-white text-navy-600 hover:border-daikin-300 hover:text-daikin-700",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-navy-400">
              Select as many as apply. Priorities shape which evidence is surfaced first — they are never
              scored or weighted numerically.
            </p>
          </fieldset>

          {/* Personalisation */}
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-semibold text-navy-700">
              Personalise the report <span className="font-normal text-navy-400">(all optional)</span>
            </legend>
            <div>
              <Label htmlFor="ho-name">Homeowner name</Label>
              <Input
                id="ho-name"
                value={config.homeownerName}
                onChange={(e) => update({ homeownerName: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="ho-location">Location or climate</Label>
              <Input
                id="ho-location"
                value={config.location}
                onChange={(e) => update({ location: e.target.value })}
                placeholder="e.g. Atlanta, GA — humid summers"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="ho-dealer">Dealer name</Label>
              <Input
                id="ho-dealer"
                value={config.dealerName}
                onChange={(e) => update({ dealerName: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="ho-rep">Sales representative</Label>
              <Input
                id="ho-rep"
                value={config.repName}
                onChange={(e) => update({ repName: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </fieldset>

          <div>
            <Label htmlFor="ho-note">
              Personalised note <span className="font-normal text-navy-400">(optional)</span>
            </Label>
            <Textarea
              id="ho-note"
              value={config.personalNote}
              onChange={(e) => update({ personalNote: e.target.value })}
              placeholder="A short note to the homeowner. This is the only free text in the report — specifications, ratings and review content cannot be edited."
              className="mt-1.5 min-h-[80px]"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-edge pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={daikinProducts.length === 0}>
              <FileText aria-hidden />
              Generate homeowner report
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
