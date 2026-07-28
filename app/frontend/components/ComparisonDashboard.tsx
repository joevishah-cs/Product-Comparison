"use client";

import { useEffect, useState } from "react";
import { parseDashboardInsights, type DashboardInsights } from "../../../lib/report/parsers";
import { fetchAgentStream } from "../lib/useAgentStream";
import { AIStatusLoader } from "./AIStatusLoader";

interface ComparisonData {
  products: Array<{ id: string; brand: string; model: string }>;
  attributes: Array<{
    key: string;
    label: string;
    category: string;
    direction: string;
    values: Record<string, { raw: string; numeric: number | null; source: string | null }>;
  }>;
  scores: Array<{
    productId: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  overallSimilarity: number;
}

function formatSource(source: string | null): string {
  if (!source) return "Selected product source records";
  const parts = source.split("•").map((p) => p.trim()).filter(Boolean);
  const unique = [...new Set(parts)];
  return unique.join(" • ");
}

interface PositioningCard {
  type: "edge" | "gap";
  title: string;
  description: string;
  source: string;
}

function buildPositioningCards(
  comparison: ComparisonData,
  daikinProduct: { id: string; model: string } | undefined
): PositioningCard[] {
  if (!daikinProduct) return [];

  const cards: PositioningCard[] = [];

  for (const attribute of comparison.attributes) {
    if (attribute.direction !== "higher" && attribute.direction !== "lower") continue;

    const daikinValue = attribute.values[daikinProduct.id];
    if (!daikinValue || daikinValue.numeric === null) continue;

    const competitorValues = comparison.products
      .filter((p) => p.id !== daikinProduct.id)
      .map((p) => attribute.values[p.id])
      .filter((v): v is { raw: string; numeric: number; source: string | null } => !!v && v.numeric !== null);

    if (competitorValues.length === 0) continue;

    const isHigherBetter = attribute.direction === "higher";
    const daikinWinsAgainst = competitorValues.filter((v) =>
      isHigherBetter ? daikinValue.numeric! > v.numeric : daikinValue.numeric! < v.numeric
    );
    const daikinLosesAgainst = competitorValues.filter((v) =>
      isHigherBetter ? daikinValue.numeric! < v.numeric : daikinValue.numeric! > v.numeric
    );

    const exampleCompetitor = (list: typeof competitorValues) => list[0]?.raw;

    if (daikinWinsAgainst.length === competitorValues.length) {
      cards.push({
        type: "edge",
        title: `Daikin edge: ${attribute.label}`,
        description: `${daikinProduct.model} lists ${daikinValue.raw}, ahead of the selected competitor values (for example ${exampleCompetitor(daikinWinsAgainst)}).`,
        source: formatSource(daikinValue.source),
      });
    } else if (daikinLosesAgainst.length === competitorValues.length) {
      cards.push({
        type: "gap",
        title: `Improve: ${attribute.label}`,
        description: `${exampleCompetitor(daikinLosesAgainst)} leads compared with ${daikinProduct.model} at ${daikinValue.raw}. Improvement focus: address the performance gap in product/portfolio planning; keep current claims model-specific.`,
        source: `${formatSource(daikinValue.source)} • ${attribute.key}`,
      });
    }
  }

  // Also surface boolean/neutral yes-no style attributes where Daikin has a value and every competitor lacks it (or vice versa)
  for (const attribute of comparison.attributes) {
    if (attribute.direction !== "neutral") continue;

    const daikinValue = attribute.values[daikinProduct.id];
    if (!daikinValue) continue;

    const daikinIsYes = /^yes$/i.test(daikinValue.raw.trim());
    const daikinIsNo = /^no$/i.test(daikinValue.raw.trim());
    if (!daikinIsYes && !daikinIsNo) continue;

    const competitorValues = comparison.products
      .filter((p) => p.id !== daikinProduct.id)
      .map((p) => attribute.values[p.id])
      .filter((v): v is { raw: string; numeric: number | null; source: string | null } => !!v);

    if (competitorValues.length === 0) continue;

    const allCompetitorsSay = (want: "yes" | "no") =>
      competitorValues.every((v) => new RegExp(`^${want}$`, "i").test(v.raw.trim()));

    if (daikinIsYes && allCompetitorsSay("no")) {
      cards.push({
        type: "edge",
        title: `Daikin edge: ${attribute.label}`,
        description: `${daikinProduct.model} lists Yes while every selected competitor with source data lists No.`,
        source: formatSource(daikinValue.source),
      });
    } else if (daikinIsNo && allCompetitorsSay("yes")) {
      cards.push({
        type: "gap",
        title: `Improve: ${attribute.label}`,
        description: `${daikinProduct.model} lists No while every selected competitor with source data lists Yes.`,
        source: formatSource(daikinValue.source),
      });
    }
  }

  return cards;
}

interface ComparisonDashboardProps {
  productIds: string[];
  units: Record<string, string>;
  onEdit: () => void;
  onNext?: () => void;
  preloaded?: string;
  onGenerated?: (dashboard: string) => void;
}

export function ComparisonDashboard({ productIds, units, onEdit, onNext, preloaded, onGenerated }: ComparisonDashboardProps) {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [dashboard, setDashboard] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardStatus, setDashboardStatus] = useState("Starting AI dashboard briefing...");

  useEffect(() => {
    if (productIds.length < 2) return;

    const fetchComparison = async () => {
      setLoading(true);
      try {
        const compareRes = await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds }),
        });
        const compareData = await compareRes.json();
        setComparison(compareData);
      } catch (error) {
        console.error("Failed to fetch comparison data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchDashboard = async () => {
      if (preloaded) {
        setDashboard(parseDashboardInsights(preloaded));
        setDashboardLoading(false);
        return;
      }

      setDashboardLoading(true);
      setDashboardStatus("Starting AI dashboard briefing...");
      try {
        const result = await fetchAgentStream(
          "/api/ai/dashboard",
          { productIds },
          "dashboard",
          (event) => setDashboardStatus(event.detail)
        );
        if (result) {
          setDashboard(parseDashboardInsights(result));
          onGenerated?.(result);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard insights:", error);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchComparison();
    fetchDashboard();
  }, [productIds, preloaded]);

  if (loading) {
    return (
      <div className="page">
        <section className="comparison-overview">
          <h1>Loading comparison...</h1>
        </section>
      </div>
    );
  }

  if (!comparison || comparison.products.length === 0) {
    return (
      <div className="page">
        <section className="empty analytical-empty">
          <h1>Select products to start a comparison.</h1>
          <p>Use the Dashboard search to choose two to eight Daikin or competitor products.</p>
          <button className="primary" onClick={onEdit}>
            Go to Dashboard <span>→</span>
          </button>
        </section>
      </div>
    );
  }

  const isDaikin = (productId: string) =>
    comparison.products.find((p) => p.id === productId)?.brand === "Daikin";

  const topScore = comparison.scores.reduce((a, b) => (a.score > b.score ? a : b));
  const daikinProduct = comparison.products.find((p) => isDaikin(p.id));
  const daikinScore = comparison.scores.find((s) => s.productId === daikinProduct?.id);

  const positioningCards = buildPositioningCards(comparison, daikinProduct);
  const edgeCards = positioningCards.filter((c) => c.type === "edge");
  const gapCards = positioningCards.filter((c) => c.type === "gap");

  return (
    <div className="page analytical">
      <section className="comparison-overview">
        <div>
          <p className="eyebrow">AI COMPARISON DASHBOARD</p>
          <h1>Competitive positioning at a glance.</h1>
          <p>Overall similarity: {comparison.overallSimilarity}%</p>
        </div>
        <button className="secondary" onClick={onEdit}>
          ← Edit selection
        </button>
      </section>

      <section className="selected-summary">
        {comparison.products.map((product) => {
          const score = comparison.scores.find((s) => s.productId === product.id);
          return (
            <article
              className={isDaikin(product.id) ? "selected-summary-card daikin-card" : "selected-summary-card"}
              key={product.id}
            >
              <span className={isDaikin(product.id) ? "brand daikin" : "brand"}>{product.brand}</span>
              <b>{product.model}</b>
              <small>{units[product.id] ?? "Model-level information only"}</small>
              <div className="score-badge">
                <strong>{score?.score ?? 50}</strong>
              </div>
            </article>
          );
        })}
      </section>

      <section className="summary-cards">
        <article className="metric">
          <span>Overall Similarity</span>
          <strong>{comparison.overallSimilarity}%</strong>
          <small>Attribute variance</small>
        </article>
        <article className="metric">
          <span>Top Competitor Score</span>
          <strong>{topScore?.score ?? 50}</strong>
          <small>{comparison.products.find((p) => p.id === topScore?.productId)?.model}</small>
        </article>
        <article className="metric">
          <span>Attributes Compared</span>
          <strong>{comparison.attributes.length}</strong>
          <small>Source-backed values</small>
        </article>
        <article className="metric">
          <span>Categories</span>
          <strong>{new Set(comparison.attributes.map((a) => a.category)).size}</strong>
          <small>Energy, Warranty, Installation...</small>
        </article>
      </section>

      <section className="panel competitive-overview analytical-table">
        <div className="panel-head">
          <div>
            <p className="eyebrow">DAIKIN POSITIONING SUMMARY</p>
            <h2>Lead with proof. Improve with context.</h2>
          </div>
          <span className="source">⊙ Every detected Daikin edge is listed below</span>
        </div>
        {positioningCards.length > 0 ? (
          <div className="positioning-grid">
            {edgeCards.map((card, idx) => (
              <article key={`edge-${idx}`} className="positioning-card edge">
                <p className="positioning-kicker">VERIFIED DAIKIN EDGE</p>
                <h4>{card.title}</h4>
                <p className="positioning-desc">{card.description}</p>
                <p className="source">⊙ {card.source}</p>
              </article>
            ))}
            {gapCards.map((card, idx) => (
              <article key={`gap-${idx}`} className="positioning-card gap">
                <p className="positioning-kicker">COMPETITIVE GAP / ACTION</p>
                <h4>{card.title}</h4>
                <p className="positioning-desc">{card.description}</p>
                <p className="source">⊙ {card.source}</p>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
            No source-backed edges or gaps detected for the selected products.
          </div>
        )}
      </section>

      <section className="panel comparison-table analytical-table">
        <div className="panel-head">
          <div>
            <p className="eyebrow">KEY ADVANTAGE SCORECARDS</p>
            <h2>Fast answers for the team</h2>
          </div>
        </div>
        {dashboard && dashboard.scorecards.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", padding: "2rem" }}>
            {dashboard.scorecards.map((card, idx) => (
              <article key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", backgroundColor: "#f9fafb" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", marginBottom: "8px" }}>{card.label}</p>
                <h4 style={{ margin: "0", fontSize: "1.1rem" }}>{card.leader}</h4>
                <p style={{ fontSize: "0.9rem", color: "#999", marginTop: "8px" }}>
                  {card.description.includes("Highest") ? card.description : "AI-identified leader"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <AIStatusLoader title="Generating advantage scorecards" status={dashboardLoading ? dashboardStatus : "No scorecards available."} />
        )}
      </section>

      <section className="panel comparison-table analytical-table">
        <div className="panel-head">
          <div>
            <p className="eyebrow">DETAILED FEATURE COMPARISON</p>
            <h2>Evidence at attribute level</h2>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                {comparison.products.map((product) => (
                  <th key={product.id}>
                    <span className={isDaikin(product.id) ? "brand daikin" : "brand"}>
                      {product.brand}
                    </span>
                    <b>{product.model}</b>
                    <small>{units[product.id] ?? "Model"}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.attributes.slice(0, 15).map((attribute) => (
                <tr key={attribute.key}>
                  <th>
                    {attribute.label}
                    <small>{attribute.category}</small>
                  </th>
                  {comparison.products.map((product) => {
                    const value = attribute.values[product.id];
                    return (
                      <td
                        className={
                          value?.numeric === null ? "unknown-cell" : ""
                        }
                        key={product.id}
                      >
                        <b>{value?.raw ?? "—"}</b>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel marketing-takeaways analytical-table">
        <div className="panel-head">
          <div>
            <p className="eyebrow">MARKETING TAKEAWAYS</p>
            <h2>Simple, source-aware direction</h2>
          </div>
        </div>
        {dashboard && dashboard.takeaways.fact ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", padding: "2rem" }}>
            <article style={{ backgroundColor: "#f0f9ff", borderLeft: "4px solid #3b82f6", padding: "16px", borderRadius: "4px" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#1e40af", marginBottom: "8px", textTransform: "uppercase" }}>Verified Fact</p>
              <p style={{ margin: "0", fontSize: "0.95rem", color: "#1e3a8a", lineHeight: "1.5" }}>
                {dashboard.takeaways.fact}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "8px" }}>○ Source-backed data</p>
            </article>

            <article style={{ backgroundColor: "#fef3c7", borderLeft: "4px solid #f59e0b", padding: "16px", borderRadius: "4px" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#92400e", marginBottom: "8px", textTransform: "uppercase" }}>Competitive Interpretation</p>
              <p style={{ margin: "0", fontSize: "0.95rem", color: "#78350f", lineHeight: "1.5" }}>
                {dashboard.takeaways.interpretation}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "8px" }}>○ Competitive analysis</p>
            </article>

            <article style={{ backgroundColor: "#f0fdf4", borderLeft: "4px solid #10b981", padding: "16px", borderRadius: "4px" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#065f46", marginBottom: "8px", textTransform: "uppercase" }}>Suggested Marketing Message</p>
              <p style={{ margin: "0", fontSize: "0.95rem", color: "#1f3a3a", lineHeight: "1.5" }}>
                {dashboard.takeaways.message}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "8px" }}>○ Sales-ready</p>
            </article>

            <article style={{ backgroundColor: "#fdf2f8", borderLeft: "4px solid #ec4899", padding: "16px", borderRadius: "4px" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#831843", marginBottom: "8px", textTransform: "uppercase" }}>Claim Requiring Validation</p>
              <p style={{ margin: "0", fontSize: "0.95rem", color: "#500724", lineHeight: "1.5" }}>
                {dashboard.takeaways.validation}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "8px" }}>○ Validation needed</p>
            </article>
          </div>
        ) : (
          <AIStatusLoader title="Generating marketing takeaways" status={dashboardLoading ? dashboardStatus : "No takeaways available."} />
        )}
      </section>

      <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end", padding: "0 20px 20px 20px" }}>
        <button className="secondary" onClick={onEdit}>
          ← Back to Selection
        </button>
        <button className="primary" onClick={onNext}>
          View Specifications <span>→</span>
        </button>
      </div>
    </div>
  );
}
