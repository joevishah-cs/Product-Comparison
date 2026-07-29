import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { History, Trophy, DatabaseZap, ArrowRight, ShieldCheck, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductSearch } from "@/features/selection/ProductSearch";
import { SelectedProducts } from "@/features/selection/SelectedProducts";
import { useSelection } from "@/features/selection/SelectionProvider";
import { ProductVisual } from "@/components/common/ProductVisual";
import {
  PRODUCTS,
  PRODUCT_BY_ID,
  SOURCE_DOCUMENTS,
  ATTRIBUTE_DEFINITIONS,
  coverageFor,
  EXCLUDED_CELLS,
} from "@/data/catalog";
import { buildComparison } from "@/features/compare/engine";
import { formatDate } from "@/lib/utils";

export function DashboardPage() {
  const { selected, recentComparisons, replaceAll, recordComparison } = useSelection();
  const navigate = useNavigate();

  const differentiators = React.useMemo(() => {
    const daikin = PRODUCTS.filter((p) => p.isDaikin && p.equipmentType === "ducted_split_hp");
    const comps = PRODUCTS.filter((p) => !p.isDaikin && p.equipmentType === "ducted_split_hp");
    return buildComparison([...daikin, ...comps]).edges.slice(0, 4);
  }, []);

  const coverage = React.useMemo(() => {
    const totals = PRODUCTS.map((p) => coverageFor(p));
    const verified = totals.reduce((s, c) => s + c.verified, 0);
    const total = totals.reduce((s, c) => s + c.total, 0);
    return { verified, total, pct: Math.round((verified / total) * 100) };
  }, []);

  return (
    <div className="space-y-8">
      <header className="animate-fade-up">
        <p className="eyebrow">Daikin Competitive Marketing Intelligence</p>
        <h1 className="mt-3 max-w-4xl text-balance text-3xl font-bold leading-tight text-navy-900 sm:text-4xl">
          Which products would you like to compare?
        </h1>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-navy-500">
          Search once across Daikin and competitor models, select units where source data supports them,
          then compare.
        </p>
      </header>

      <div className="relative z-20">
        <ProductSearch />
      </div>

      <SelectedProducts />

      <section aria-label="Quick access" className="grid gap-5 lg:grid-cols-3">
        {/* Recently compared */}
        <article className="rounded-2xl border border-edge bg-white p-6 shadow-card">
          <header className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-navy-100 text-navy-600">
              <History className="size-[18px]" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold text-navy-900">Recently compared</h2>
          </header>

          {recentComparisons.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-edge bg-navy-50/50 p-5 text-center text-sm text-navy-500">
              Run your first comparison and it will appear here for one-click reopening.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {recentComparisons.map((r) => {
                const products = r.productIds.map((id) => PRODUCT_BY_ID[id]).filter(Boolean);
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        replaceAll(r.productIds);
                        recordComparison();
                        navigate("/compare");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl border border-edge p-3 text-left transition-colors hover:border-daikin-300 hover:bg-daikin-50/50"
                    >
                      <div className="flex -space-x-2">
                        {products.slice(0, 3).map((p) => (
                          <img
                            key={p.id}
                            src={p.image}
                            alt=""
                            className="size-9 rounded-lg border-2 border-white object-cover"
                          />
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy-900">
                          {products.map((p) => p.model).join(" vs ")}
                        </p>
                        <p className="text-xs text-navy-400">{formatDate(r.at)}</p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-navy-400" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        {/* Strongest differentiators */}
        <article className="rounded-2xl border border-edge bg-white p-6 shadow-card">
          <header className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-verified-50 text-verified-600">
              <Trophy className="size-[18px]" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold text-navy-900">Strongest differentiators</h2>
          </header>
          <p className="mt-2 text-sm text-navy-500">
            Calculated across every Daikin FIT model and all 19 competitor models in the battlecard.
          </p>
          <ul className="mt-4 space-y-2.5">
            {differentiators.map((edge) => (
              <li key={edge.id} className="rounded-xl border border-verified-500/20 bg-verified-50/60 p-3">
                <p className="text-sm font-bold text-verified-700">{edge.attributeLabel}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-navy-700">
                  {edge.marginLabel
                    ? `${edge.daikinValue.display} — ${edge.marginLabel} than the closest competitor.`
                    : "Listed on Daikin FIT; not listed on competitors with a recorded value."}
                </p>
              </li>
            ))}
          </ul>
          <Link
            to="/compare"
            className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-daikin-700 hover:text-daikin-800"
          >
            See the full positioning summary
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </article>

        {/* Product data coverage */}
        <article className="rounded-2xl border border-edge bg-white p-6 shadow-card">
          <header className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-daikin-50 text-daikin-700">
              <DatabaseZap className="size-[18px]" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold text-navy-900">Product data coverage</h2>
          </header>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-navy-50 p-3">
              <p className="text-2xl font-bold text-navy-900">{PRODUCTS.length}</p>
              <p className="text-xs font-medium text-navy-500">Products</p>
            </div>
            <div className="rounded-xl bg-navy-50 p-3">
              <p className="text-2xl font-bold text-navy-900">{SOURCE_DOCUMENTS.length}</p>
              <p className="text-xs font-medium text-navy-500">Sources</p>
            </div>
            <div className="rounded-xl bg-navy-50 p-3">
              <p className="text-2xl font-bold text-navy-900">{ATTRIBUTE_DEFINITIONS.length}</p>
              <p className="text-xs font-medium text-navy-500">Attributes</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-navy-600">Verified source values</span>
              <span className="text-sm font-bold text-navy-900">{coverage.pct}%</span>
            </div>
            <div
              className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-navy-100"
              role="progressbar"
              aria-valuenow={coverage.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Share of product attributes carrying a verified source value"
            >
              <div className="h-full rounded-full bg-daikin-600" style={{ width: `${coverage.pct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-navy-400">
              {coverage.verified.toLocaleString()} of {coverage.total.toLocaleString()} attribute cells carry a
              source value. The rest display “Information unavailable”.
            </p>
          </div>

          <ul className="mt-4 space-y-2 border-t border-edge pt-4">
            {SOURCE_DOCUMENTS.map((doc) => (
              <li key={doc.id} className="flex items-start gap-2.5">
                {doc.kind === "pdf" ? (
                  <FileText className="mt-0.5 size-4 shrink-0 text-navy-400" aria-hidden />
                ) : (
                  <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-navy-400" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-800">{doc.fileName}</p>
                  <p className="text-xs leading-relaxed text-navy-500">
                    {doc.productCount} products · imported {formatDate(doc.importedAt)}
                    {doc.excludedCells > 0 && ` · ${doc.excludedCells} formula-error cells excluded`}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {EXCLUDED_CELLS.length > 0 && (
            <p className="mt-3 rounded-lg bg-caution-50 px-3 py-2 text-xs leading-relaxed text-caution-700">
              Cells {EXCLUDED_CELLS.map((c) => c.ref).join(", ")} returned {EXCLUDED_CELLS[0]?.raw} and are
              excluded from verified values.
            </p>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-daikin-200 bg-gradient-to-r from-daikin-50 to-white p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex -space-x-3">
            {selected.slice(0, 4).map((p) => (
              <ProductVisual key={p.id} product={p} size="xs" className="border-2 border-white" />
            ))}
          </div>
          <div className="min-w-[16rem] flex-1">
            <Badge variant="verified" size="sm">
              <ShieldCheck aria-hidden />
              Source-backed workflow
            </Badge>
            <h2 className="mt-2 text-xl font-bold text-navy-900">
              Search → select → compare → explain → publish
            </h2>
            <p className="mt-1 text-base text-navy-600">
              Move from a selection to a printable, cited sales message without leaving the app.
            </p>
          </div>
          <Button
            size="lg"
            disabled={selected.length < 2}
            onClick={() => {
              recordComparison();
              navigate("/compare");
            }}
          >
            Open comparison
            <ArrowRight aria-hidden />
          </Button>
        </div>
      </section>
    </div>
  );
}
