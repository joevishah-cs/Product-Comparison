"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface ComparisonData {
  products: Array<{ id: string; brand: string; model: string }>;
  attributes: Array<{
    key: string;
    label: string;
    category: string;
    direction: string;
    values: Record<string, { raw: string; numeric: number | null }>;
  }>;
  scores: Array<{
    productId: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  }>;
}

interface GraphicalComparisonProps {
  productIds: string[];
  onBack?: () => void;
  onNext?: () => void;
}

export function GraphicalComparison({ productIds, onBack, onNext }: GraphicalComparisonProps) {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productIds.length < 2) return;

    const fetchComparison = async () => {
      try {
        const res = await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds }),
        });
        const data = await res.json();
        setComparison(data);
      } catch (error) {
        console.error("Failed to fetch comparison:", error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchComparison();
  }, [productIds]);

  if (loading) {
    return (
      <div className="page">
        <section className="page-title">
          <h1>Loading charts...</h1>
        </section>
      </div>
    );
  }

  if (!comparison || comparison.products.length === 0) {
    return (
      <div className="page">
        <section className="empty analytical-empty">
          <h1>No products selected.</h1>
        </section>
      </div>
    );
  }

  const scoreData = comparison.products.map((p) => {
    const score = comparison.scores.find((s) => s.productId === p.id);
    return {
      name: p.model,
      score: score?.score ?? 50,
    };
  });

  const keyMetrics = ["SEER2", "EER2", "HSPF2", "Sound level", "Warranty"];
  const radarData: Record<string, any> = {};

  comparison.products.forEach((p) => {
    radarData[p.id] = { name: p.model };
  });

  keyMetrics.forEach((metric) => {
    const attr = comparison.attributes.find((a) => a.key === metric);
    if (attr) {
      comparison.products.forEach((p) => {
        const value = attr.values[p.id];
        let normalizedValue = 50;
        if (value?.numeric) {
          if (attr.direction === "higher") {
            normalizedValue = Math.min(100, (value.numeric / 25) * 100);
          } else if (attr.direction === "lower") {
            normalizedValue = Math.max(0, 100 - (value.numeric / 100) * 100);
          }
        }
        radarData[p.id][metric] = normalizedValue;
      });
    }
  });

  const radarChartData = keyMetrics.map((metric) => {
    const point: Record<string, any> = { metric };
    comparison.products.forEach((p) => {
      point[p.id] = radarData[p.id]?.[metric] ?? 50;
    });
    return point;
  });

  const getRaw = (key: string, productId: string) => comparison.attributes.find((a) => a.key === key)?.values[productId]?.raw;
  const getNumeric = (key: string, productId: string) => comparison.attributes.find((a) => a.key === key)?.values[productId]?.numeric ?? null;

  const efficiencyRows = comparison.products.map((p) => {
    const seer2 = getRaw("SEER2", p.id);
    const eer2 = getRaw("EER2", p.id);
    const hspf2 = getRaw("HSPF2", p.id);
    const seer2Num = getNumeric("SEER2", p.id) ?? 0;
    return {
      model: p.model,
      label: [seer2, eer2, hspf2].filter(Boolean).join(" · ") || "—",
      value: seer2Num,
    };
  });
  const maxEfficiency = Math.max(...efficiencyRows.map((r) => r.value), 1);

  const soundRows = comparison.products.map((p) => ({
    model: p.model,
    label: getRaw("Sound level", p.id) || "—",
    value: getNumeric("Sound level", p.id) ?? 0,
  }));
  const maxSound = Math.max(...soundRows.map((r) => r.value), 1);

  const heatingRangeRows = comparison.products.map((p) => ({
    model: p.model,
    label: getRaw("Heating operating range", p.id) || "—",
  }));
  const hasHeatingRange = comparison.attributes.some((a) => a.key === "Heating operating range");

  const warrantyRows = comparison.products.map((p) => {
    const label = getRaw("Warranty", p.id) || "—";
    const years = parseFloat((label.match(/(\d+(?:\.\d+)?)/) || [])[0] || "0");
    return { model: p.model, label, value: years };
  });
  const maxWarranty = Math.max(...warrantyRows.map((r) => r.value), 1);
  const hasWarranty = comparison.attributes.some((a) => a.key === "Warranty");

  return (
    <div className="page">
      <section className="page-title">
        <div>
          <p className="eyebrow">GRAPHICAL COMPARISON</p>
          <h1>Visual analysis of key metrics.</h1>
          <p>Score comparison and radar analysis.</p>
        </div>
      </section>

      <section className="charts">
        <div className="chart-grid">
          <article className="panel chart-card">
            <h3>Competitive Score</h3>
            <p>Overall fit score (0-100)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="panel chart-card">
            <h3>Multi-Metric Radar</h3>
            <p>Key specifications normalized</p>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis domain={[0, 100]} />
                {comparison.products.map((p, idx) => (
                  <Radar
                    key={p.id}
                    name={p.model}
                    dataKey={p.id}
                    stroke={idx === 0 ? "#2563eb" : `hsl(${idx * 60}, 70%, 50%)`}
                    fill={idx === 0 ? "#2563eb" : `hsl(${idx * 60}, 70%, 50%)`}
                    fillOpacity={0.5}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </article>
        </div>
      </section>

      <section className="charts">
        <div className="panel-head">
          <div>
            <p className="eyebrow">INTERACTIVE COMPARISON CHARTS</p>
            <h2>Performance in context</h2>
          </div>
          <span className="chip">Only source-supported metrics shown</span>
        </div>
        <div className="chart-grid">
          <article className="panel chart-card">
            <h3>Efficiency comparison</h3>
            <p>Higher is generally better</p>
            {efficiencyRows.map((row) => (
              <div className="chart-row" key={row.model}>
                <span>{row.model}</span>
                <div>
                  <i style={{ width: `${maxEfficiency > 0 ? (row.value / maxEfficiency) * 100 : 0}%` }} />
                </div>
                <b>{row.label}</b>
              </div>
            ))}
            <p className="source">⊙ Selected product source records</p>
          </article>

          <article className="panel chart-card">
            <h3>Sound performance</h3>
            <p>Lower dBA is better</p>
            {soundRows.map((row) => (
              <div className="chart-row" key={row.model}>
                <span>{row.model}</span>
                <div>
                  <i style={{ width: `${maxSound > 0 ? (row.value / maxSound) * 100 : 0}%` }} />
                </div>
                <b>{row.label}</b>
              </div>
            ))}
            <p className="source">⊙ Selected product source records</p>
          </article>

          {hasHeatingRange && (
            <article className="panel chart-card">
              <h3>Heating operating range</h3>
              <p>Lower minimum temperature extends cold-weather range.</p>
              {heatingRangeRows.map((row) => (
                <div className="chart-row" key={row.model}>
                  <span>{row.model}</span>
                  <div>
                    <i style={{ width: "100%" }} />
                  </div>
                  <b>{row.label}</b>
                </div>
              ))}
              <p className="source">⊙ Selected product source records</p>
            </article>
          )}

          {hasWarranty && (
            <article className="panel chart-card">
              <h3>Warranty coverage</h3>
              <p>Years shown when included in source</p>
              {warrantyRows.map((row) => (
                <div className="chart-row" key={row.model}>
                  <span>{row.model}</span>
                  <div>
                    <i style={{ width: `${maxWarranty > 0 ? (row.value / maxWarranty) * 100 : 0}%` }} />
                  </div>
                  <b>{row.label}</b>
                </div>
              ))}
              <p className="source">⊙ Selected product source records</p>
            </article>
          )}
        </div>
      </section>

      <section className="panel comparison-table analytical-table">
        <div className="panel-head">
          <div>
            <p className="eyebrow">CATEGORY STRENGTHS</p>
            <h2>Strengths and weaknesses by category</h2>
          </div>
        </div>
        <div style={{ padding: "2rem" }}>
          {comparison.scores.map((score) => {
            const product = comparison.products.find((p) => p.id === score.productId);
            return (
              <div key={score.productId} style={{ marginBottom: "2rem" }}>
                <h4>{product?.model}</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <p style={{ fontWeight: "bold", color: "#059669" }}>Strengths:</p>
                    <ul style={{ fontSize: "0.9rem" }}>
                      {score.strengths.slice(0, 3).map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p style={{ fontWeight: "bold", color: "#dc2626" }}>Weaknesses:</p>
                    <ul style={{ fontSize: "0.9rem" }}>
                      {score.weaknesses.slice(0, 3).map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end", padding: "0 20px 20px 20px" }}>
        <button className="secondary" onClick={onBack}>
          ← Back to AI Insights
        </button>
        <button className="primary" onClick={onNext}>
          View Sales BattleCard <span>→</span>
        </button>
      </section>
    </div>
  );
}
