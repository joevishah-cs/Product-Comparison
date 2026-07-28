"use client";

import { useEffect, useState } from "react";

interface ComparisonData {
  products: Array<{ id: string; brand: string; model: string }>;
  attributes: Array<{
    key: string;
    label: string;
    category: string;
    direction: string;
    values: Record<string, { raw: string; numeric: number | null }>;
  }>;
}

interface SpecificationTableProps {
  productIds: string[];
  units: Record<string, string>;
  onBack?: () => void;
  onNext?: () => void;
}

export function SpecificationTable({ productIds, units, onBack, onNext }: SpecificationTableProps) {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

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
          <h1>Loading specifications...</h1>
        </section>
      </div>
    );
  }

  if (!comparison || comparison.products.length === 0) {
    return (
      <div className="page">
        <section className="empty analytical-empty">
          <h1>Select products to compare.</h1>
        </section>
      </div>
    );
  }

  const isDaikin = (productId: string) =>
    comparison.products.find((p) => p.id === productId)?.brand === "Daikin";

  let visibleAttributes = comparison.attributes;
  if (filter === "By Category") {
    visibleAttributes = comparison.attributes.filter(
      (a) => a.category === "Energy & Efficiency" || a.category === "Warranty & Support"
    );
  } else if (filter === "Missing Data") {
    visibleAttributes = comparison.attributes.filter((a) =>
      comparison.products.some((p) => !a.values[p.id]?.raw)
    );
  }

  return (
    <div className="page">
      <section className="page-title">
        <div>
          <p className="eyebrow">SPECIFICATION COMPARISON</p>
          <h1>Feature and attribute details.</h1>
          <p>Source-backed values with category grouping.</p>
        </div>
      </section>

      <section className="message-controls">
        {["All", "By Category", "Missing Data"].map((f) => (
          <button
            key={f}
            className={filter === f ? "filter active" : "filter"}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </section>

      <section className="panel comparison-table analytical-table">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Specification</th>
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
              {visibleAttributes.map((attribute) => (
                <tr key={attribute.key}>
                  <th>
                    {attribute.label}
                    <small>{attribute.category}</small>
                  </th>
                  {comparison.products.map((product) => {
                    const value = attribute.values[product.id];
                    const hasBetter = isDaikin(product.id) && value?.raw;

                    return (
                      <td
                        className={
                          hasBetter
                            ? "advantage-cell"
                            : !value?.raw
                              ? "unknown-cell"
                              : ""
                        }
                        key={product.id}
                      >
                        {hasBetter && <em>Daikin strength</em>}
                        <b>{value?.raw ?? "—"}</b>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end", padding: "0 20px" }}>
          <button className="secondary" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <button className="primary" onClick={onNext}>
            View AI Insights <span>→</span>
          </button>
        </div>
      </section>
    </div>
  );
}
