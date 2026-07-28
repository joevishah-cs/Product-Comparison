"use client";

import { useEffect, useState } from "react";
import { parseInsights } from "../../../lib/report/parsers";
import { fetchAgentStream } from "../lib/useAgentStream";
import { AIStatusLoader } from "./AIStatusLoader";

interface AIInsightsProps {
  productIds: string[];
  onBack?: () => void;
  onNext?: () => void;
  preloaded?: string;
  onGenerated?: (insights: string) => void;
}

const SECTION_STYLES: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  "VERIFIED FACT": { color: "#1e40af", bg: "#eff6ff", border: "#3b82f6", icon: "✓" },
  "COMPETITIVE ANALYSIS": { color: "#92400e", bg: "#fffbeb", border: "#f59e0b", icon: "⚔" },
  "SUGGESTED MESSAGE": { color: "#065f46", bg: "#ecfdf5", border: "#10b981", icon: "💬" },
  "CLAIM REQUIRING VALIDATION": { color: "#831843", bg: "#fdf2f8", border: "#ec4899", icon: "⚠" },
  "CLAIMS REQUIRING VALIDATION": { color: "#831843", bg: "#fdf2f8", border: "#ec4899", icon: "⚠" },
};

function normalizeSectionTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ").toUpperCase();
}

export function AIInsights({ productIds, onBack, onNext, preloaded, onGenerated }: AIInsightsProps) {
  const [insights, setInsights] = useState(preloaded || "");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("Starting AI analysis...");

  useEffect(() => {
    if (productIds.length === 0) return;
    if (preloaded) {
      setInsights(preloaded);
      return;
    }

    const fetchInsights = async () => {
      setLoading(true);
      setStatusText("Starting AI analysis...");
      try {
        const result = await fetchAgentStream(
          "/api/ai/insights",
          { productIds },
          "insights",
          (event) => setStatusText(event.detail)
        );
        setInsights(result);
        onGenerated?.(result);
      } catch (error) {
        console.error("Failed to fetch insights:", error);
        setInsights("Failed to generate insights. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [productIds, preloaded]);

  if (!productIds.length) {
    return (
      <div className="page">
        <section className="empty analytical-empty">
          <h1>No products selected.</h1>
          <p>Select products to generate AI insights.</p>
        </section>
      </div>
    );
  }

  const sections = parseInsights(insights);

  return (
    <div className="page">
      <section className="page-title">
        <div>
          <p className="eyebrow">AI INSIGHTS</p>
          <h1>Competitive analysis and positioning.</h1>
          <p>AI-generated insights grounded in source data.</p>
        </div>
      </section>

      {loading ? (
        <section>
          <AIStatusLoader title="Generating AI insights" status={statusText} />
        </section>
      ) : sections.length === 0 ? (
        <section style={{ padding: "2rem" }}>
          <p style={{ color: "#6b7280" }}>No insights available.</p>
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: "20px",
            padding: "0 20px",
          }}
        >
          {sections.map((section, idx) => {
            const style = SECTION_STYLES[normalizeSectionTitle(section.title)] || {
              color: "#374151",
              bg: "#f9fafb",
              border: "#9ca3af",
              icon: "•",
            };

            // Group flat lines into sub-groups: a level-0 line starts a new group heading,
            // level-1/2 lines are bullets under the current group.
            const groups: Array<{ heading: string | null; bullets: string[] }> = [];
            let activeGroup: { heading: string | null; bullets: string[] } | null = null;

            for (const line of section.lines) {
              if (line.level === 0) {
                if (activeGroup) groups.push(activeGroup);
                activeGroup = { heading: line.text, bullets: [] };
              } else {
                if (!activeGroup) activeGroup = { heading: null, bullets: [] };
                activeGroup.bullets.push(line.text);
              }
            }
            if (activeGroup) groups.push(activeGroup);

            return (
              <article
                key={idx}
                style={{
                  border: `2px solid ${style.border}`,
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: style.bg,
                    padding: "14px 20px",
                    borderBottom: `2px solid ${style.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>{style.icon}</span>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      color: style.color,
                      textTransform: "uppercase",
                    }}
                  >
                    {section.title}
                  </h3>
                </div>

                <div style={{ padding: "18px 20px", maxHeight: "480px", overflowY: "auto" }}>
                  {groups.map((group, gIdx) => (
                    <div key={gIdx} style={{ marginBottom: gIdx < groups.length - 1 ? "16px" : 0 }}>
                      {group.heading && (
                        <p
                          style={{
                            margin: "0 0 6px 0",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {group.heading}
                        </p>
                      )}
                      {group.bullets.length > 0 && (
                        <ul style={{ margin: 0, paddingLeft: "18px" }}>
                          {group.bullets.map((bullet, bIdx) => {
                            const isSourceBacked = /\(source-backed\)/i.test(bullet);
                            const cleanText = bullet.replace(/\s*\(source-backed\)\s*$/i, "");
                            return (
                              <li
                                key={bIdx}
                                style={{
                                  fontSize: "0.88rem",
                                  color: "#374151",
                                  lineHeight: "1.6",
                                  marginBottom: "4px",
                                }}
                              >
                                {cleanText}
                                {isSourceBacked && (
                                  <span
                                    style={{
                                      marginLeft: "8px",
                                      fontSize: "0.7rem",
                                      fontWeight: 600,
                                      color: "#059669",
                                      backgroundColor: "#d1fae5",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    ✓ source-backed
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "24px",
          justifyContent: "flex-end",
          padding: "0 20px 20px 20px",
        }}
      >
        <button className="secondary" onClick={onBack}>
          ← Back to Specifications
        </button>
        <button className="primary" onClick={onNext}>
          View Graphical Analysis <span>→</span>
        </button>
      </section>
    </div>
  );
}
