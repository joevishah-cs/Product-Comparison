"use client";

import { useEffect, useState } from "react";
import { parseDashboardInsights, parseInsights } from "../../../lib/report/parsers";
import { buildReport, type ComparisonData, type ReportData, type Verdict } from "../../../lib/report/buildReport";
import { fetchAgentStream } from "../lib/useAgentStream";
import { AIStatusLoader } from "./AIStatusLoader";

interface BattleCardProps {
  productIds: string[];
  onBack?: () => void;
  preloadedInsights?: string;
  preloadedDashboard?: string;
  preloaded?: string;
  onGenerated?: (battlecard: string) => void;
}

const VERDICT_ICON: Record<Verdict, string> = {
  better: "✅",
  comparable: "⚠",
  behind: "❌",
  unknown: "—",
};

const VERDICT_LABEL: Record<Verdict, string> = {
  better: "Better",
  comparable: "Comparable",
  behind: "Behind",
  unknown: "N/A",
};

const EXPORT_OPTIONS = [
  { key: "pdf", icon: "📄", label: "Executive PDF Report", ready: true },
  { key: "ppt", icon: "📊", label: "PowerPoint Presentation", ready: false },
  { key: "xlsx", icon: "📈", label: "Excel Comparison Matrix", ready: false },
  { key: "battlecard", icon: "📝", label: "Sales Battle Card", ready: false },
  { key: "email", icon: "📧", label: "Email Summary", ready: false },
];

export function BattleCard({
  productIds,
  onBack,
  preloadedInsights,
  preloadedDashboard,
  preloaded,
  onGenerated,
}: BattleCardProps) {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [battlecard, setBattlecard] = useState(preloaded || "");
  const [insightsText, setInsightsText] = useState(preloadedInsights || "");
  const [dashboardText, setDashboardText] = useState(preloadedDashboard || "");
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [generatedDate, setGeneratedDate] = useState("");
  const [statusText, setStatusText] = useState("Starting competitive analysis report...");

  useEffect(() => {
    setGeneratedDate(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }));
  }, []);

  useEffect(() => {
    if (productIds.length < 2) return;

    const fetchAll = async () => {
      setLoading(true);
      setStatusText("Fetching comparison data...");
      try {
        const compareRes = await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds }),
        });
        const compareData = await compareRes.json();
        setComparison(compareData);

        const tasks: Promise<void>[] = [];

        if (preloadedInsights) {
          setInsightsText(preloadedInsights);
        } else {
          tasks.push(
            fetchAgentStream(
              "/api/ai/insights",
              { productIds },
              "insights",
              (event) => setStatusText(`Insights: ${event.detail}`)
            )
              .then((result) => setInsightsText(result))
              .catch((error) => console.error("Failed to fetch insights:", error))
          );
        }

        if (preloadedDashboard) {
          setDashboardText(preloadedDashboard);
        } else {
          tasks.push(
            fetchAgentStream(
              "/api/ai/dashboard",
              { productIds },
              "dashboard",
              (event) => setStatusText(`Dashboard: ${event.detail}`)
            )
              .then((result) => setDashboardText(result))
              .catch((error) => console.error("Failed to fetch dashboard insights:", error))
          );
        }

        if (preloaded) {
          setBattlecard(preloaded);
        } else {
          tasks.push(
            fetchAgentStream(
              "/api/ai/battlecard",
              { productIds },
              "battlecard",
              (event) => setStatusText(`Battle card: ${event.detail}`)
            )
              .then((result) => {
                setBattlecard(result);
                onGenerated?.(result);
              })
              .catch((error) => console.error("Failed to fetch battlecard:", error))
          );
        }

        await Promise.all(tasks);
      } catch (error) {
        console.error("Failed to build report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [productIds, preloaded, preloadedInsights, preloadedDashboard]);

  if (!productIds.length || productIds.length < 2) {
    return (
      <div className="page">
        <section className="empty analytical-empty">
          <h1>Select at least two products.</h1>
          <p>Choose a Daikin product and a competitor to generate the competitive analysis report.</p>
        </section>
      </div>
    );
  }

  if (loading || !comparison) {
    return (
      <div className="page">
        <section className="page-title">
          <div>
            <p className="eyebrow">AI COMPETITIVE ANALYSIS REPORT</p>
            <h1>Building your competitive analysis report</h1>
          </div>
        </section>
        <AIStatusLoader title="Assembling report sections" status={statusText} />
      </div>
    );
  }

  const dashboard = dashboardText ? parseDashboardInsights(dashboardText) : null;
  const insightSections = insightsText ? parseInsights(insightsText) : [];
  const report: ReportData = buildReport(comparison, dashboard, insightSections, battlecard);
  report.generatedDate = generatedDate;

  const daikinModel = report.daikinProduct?.model ?? "Daikin";
  const competitorModel = report.competitorProducts[0]?.model ?? "Competitor";
  const fileSlug = `${daikinModel}_vs_${competitorModel}`.replace(/\s+/g, "_");

  const handlePrint = () => {
    window.print();
    setExportOpen(false);
  };

  return (
    <div className="page report-page">
      <section className="page-title">
        <div>
          <p className="eyebrow">AI COMPETITIVE ANALYSIS REPORT</p>
          <h1>{daikinModel} vs {competitorModel}</h1>
          <p>Dynamically generated from live comparison, AI insights, and battle card data.</p>
        </div>
        <div className="button-row" style={{ position: "relative" }}>
          <button className="secondary" onClick={() => setExportOpen((v) => !v)}>
            Export <span>▾</span>
          </button>
          {exportOpen && (
            <div className="export-menu">
              {EXPORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className="export-menu-item"
                  disabled={!opt.ready}
                  onClick={opt.ready ? handlePrint : undefined}
                  title={opt.ready ? `Download ${fileSlug}.pdf` : "Coming soon"}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                  {!opt.ready && <em>Soon</em>}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <article className="panel report-section report-cover">
        <p className="eyebrow">AI COMPETITIVE ANALYSIS REPORT</p>
        <h2>{daikinModel} vs {competitorModel}</h2>
        <div className="report-cover-grid">
          <div>
            <span>Daikin Product</span>
            <b>{daikinModel}</b>
          </div>
          <div>
            <span>Competitor Product</span>
            <b>{competitorModel}</b>
          </div>
          <div>
            <span>Generated Date</span>
            <b>{report.generatedDate}</b>
          </div>
          <div>
            <span>Generated By</span>
            <b>AI Competitive Intelligence Platform</b>
          </div>
        </div>
      </article>

      <article className="panel report-section">
        <p className="eyebrow">1. EXECUTIVE SUMMARY</p>
        <h2>At a glance</h2>
        <p className="report-summary">{report.executiveSummary}</p>
      </article>

      {report.productOverview.length > 0 && (
        <article className="panel report-section">
          <p className="eyebrow">2. PRODUCT OVERVIEW</p>
          <h2>Side-by-side basics</h2>
          <div className="table-scroll comparison-table">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>{daikinModel}</th>
                  <th>{competitorModel}</th>
                </tr>
              </thead>
              <tbody>
                {report.productOverview.map((row) => (
                  <tr key={row.item}>
                    <th>{row.item}</th>
                    <td><b>{row.daikin}</b></td>
                    <td><b>{row.competitor}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      <article className="panel report-section">
        <p className="eyebrow">3. TECHNICAL COMPARISON</p>
        <h2>Verified specification comparison</h2>
        <div className="table-scroll comparison-table">
          <table>
            <thead>
              <tr>
                <th>Attribute</th>
                <th>{daikinModel}</th>
                <th>{competitorModel}</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {report.technicalRows.map((row) => (
                <tr key={row.label}>
                  <th>
                    {row.label}
                    <small>{row.category}</small>
                  </th>
                  <td><b>{row.daikin}</b></td>
                  <td><b>{row.competitor}</b></td>
                  <td>
                    <span className={`verdict-pill verdict-${row.verdict}`}>
                      {VERDICT_ICON[row.verdict]} {VERDICT_LABEL[row.verdict]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel report-section">
        <p className="eyebrow">4. VISUAL COMPARISON</p>
        <h2>Efficiency and noise at a glance</h2>
        <div className="chart-grid">
          <div className="chart-card">
            <h3>Efficiency (SEER2)</h3>
            {comparison.products.map((p) => {
              const val = comparison.attributes.find((a) => a.key === "SEER2")?.values[p.id]?.numeric ?? 0;
              const max = Math.max(
                ...comparison.products.map(
                  (pp) => comparison.attributes.find((a) => a.key === "SEER2")?.values[pp.id]?.numeric ?? 0
                ),
                1
              );
              return (
                <div className="chart-row" key={p.id}>
                  <span>{p.model}</span>
                  <div>
                    <i style={{ width: `${(val / max) * 100}%` }} />
                  </div>
                  <b>{comparison.attributes.find((a) => a.key === "SEER2")?.values[p.id]?.raw ?? "—"}</b>
                </div>
              );
            })}
          </div>
          <div className="chart-card">
            <h3>Sound level (dBA)</h3>
            {comparison.products.map((p) => {
              const val = comparison.attributes.find((a) => a.key === "Sound level")?.values[p.id]?.numeric ?? 0;
              const max = Math.max(
                ...comparison.products.map(
                  (pp) => comparison.attributes.find((a) => a.key === "Sound level")?.values[pp.id]?.numeric ?? 0
                ),
                1
              );
              return (
                <div className="chart-row" key={p.id}>
                  <span>{p.model}</span>
                  <div>
                    <i style={{ width: `${(val / max) * 100}%` }} />
                  </div>
                  <b>{comparison.attributes.find((a) => a.key === "Sound level")?.values[p.id]?.raw ?? "—"}</b>
                </div>
              );
            })}
          </div>
        </div>
      </article>

      <article className="panel report-section">
        <p className="eyebrow">5. AI COMPETITIVE INSIGHTS</p>
        <h2>Strengths, weaknesses, and differentiators</h2>
        <div className="report-triple-grid">
          <div>
            <h4>Strengths</h4>
            <ul>
              {report.strengths.length > 0 ? (
                report.strengths.map((s) => <li key={s}>{s}</li>)
              ) : (
                <li>No verified strengths detected for this pairing.</li>
              )}
            </ul>
          </div>
          <div>
            <h4>Weaknesses</h4>
            <ul>
              {report.weaknesses.length > 0 ? (
                report.weaknesses.map((w) => <li key={w}>{w}</li>)
              ) : (
                <li>No verified weaknesses detected for this pairing.</li>
              )}
            </ul>
          </div>
          <div>
            <h4>Key Differentiators</h4>
            <ul>
              {report.differentiators.length > 0 ? (
                report.differentiators.map((d, i) => <li key={i}>{d}</li>)
              ) : (
                <li>Generating differentiators from AI insights...</li>
              )}
            </ul>
          </div>
        </div>
      </article>

      <article className="panel report-section">
        <p className="eyebrow">6. MARKETING RECOMMENDATIONS</p>
        <h2>Positioning direction</h2>
        <div className="report-double-grid">
          <div>
            <h4>Recommended Messaging</h4>
            <ul>
              {report.recommendedMessaging.length > 0 ? (
                report.recommendedMessaging.map((m, i) => <li key={i}>{m}</li>)
              ) : (
                <li>Generating recommended messaging...</li>
              )}
            </ul>
          </div>
          <div>
            <h4>Target Audience</h4>
            <ul>
              {report.targetAudience.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </article>

      <article className="panel report-section">
        <p className="eyebrow">7. SALES BATTLE CARD</p>
        <h2>Field-ready talking points</h2>
        <div className="report-double-grid">
          <div>
            <h4>Top Selling Points</h4>
            <ul>
              {report.topSellingPoints.length > 0 ? (
                report.topSellingPoints.map((s, i) => <li key={i}>{s}</li>)
              ) : (
                <li>No standout selling points detected.</li>
              )}
            </ul>
          </div>
          <div>
            <h4>Common Customer Objection</h4>
            <p className="report-body-text">{report.objection}</p>
            <h4>Suggested Response</h4>
            <p className="report-body-text">{report.suggestedResponse}</p>
          </div>
        </div>
      </article>

      {report.gapRows.length > 0 && (
        <article className="panel report-section">
          <p className="eyebrow">8. PRODUCT GAP ANALYSIS</p>
          <h2>Where the competitor currently leads</h2>
          <div className="table-scroll comparison-table">
            <table>
              <thead>
                <tr>
                  <th>Competitor Capability</th>
                  <th>Daikin Status</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {report.gapRows.map((row) => (
                  <tr key={row.capability}>
                    <th>{row.capability}</th>
                    <td>{row.daikinStatus}</td>
                    <td>{row.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      <article className="panel report-section report-final">
        <p className="eyebrow">9. FINAL RECOMMENDATION</p>
        <h2>Overall recommendation</h2>
        <div className="report-final-grid">
          <div className="report-final-score">
            <span>Overall Competitive Score</span>
            <strong>{report.overallScore}<small>/100</small></strong>
          </div>
          <div>
            <span>Recommended Positioning</span>
            <b>{report.recommendedPositioning}</b>
          </div>
          <div>
            <span>Suggested Marketing Focus</span>
            <b>{report.suggestedMarketingFocus}</b>
          </div>
          <div>
            <span>Overall Similarity</span>
            <b>{report.overallSimilarity}%</b>
          </div>
        </div>
      </article>

      <section style={{ display: "flex", gap: "12px", justifyContent: "flex-end", padding: "0 20px 20px 20px" }}>
        <button className="secondary" onClick={onBack}>
          ← Back to Graphical Analysis
        </button>
        <button className="primary" onClick={handlePrint}>
          Download Executive PDF Report <span>→</span>
        </button>
      </section>
    </div>
  );
}
