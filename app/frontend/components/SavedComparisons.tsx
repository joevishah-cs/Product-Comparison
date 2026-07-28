"use client";

import { useEffect, useState } from "react";

interface SavedComparisonSummary {
  id: string;
  name: string;
  productIds: string[];
  notes: string | null;
  hasInsights: boolean;
  hasBattlecard: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  brand: string;
  model: string;
}

interface SavedComparisonsProps {
  currentProductIds: string[];
  onOpen: (comparison: { id: string; productIds: string[] }) => void;
  onSaved?: (id: string) => void;
}

export function SavedComparisons({ currentProductIds, onOpen, onSaved }: SavedComparisonsProps) {
  const [saved, setSaved] = useState<SavedComparisonSummary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const loadSaved = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/saved-comparisons");
      const data = await res.json();
      setSaved(data.comparisons || []);
    } catch (error) {
      console.error("Failed to load saved comparisons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch((error) => console.error("Failed to load products:", error));
  }, []);

  const modelFor = (id: string) => products.find((p) => p.id === id)?.model || id;

  const handleSave = async () => {
    if (!name.trim() || currentProductIds.length < 2) return;
    setSaving(true);
    try {
      const res = await fetch("/api/saved-comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), productIds: currentProductIds, notes: notes.trim() || undefined }),
      });
      const data = await res.json();
      if (data.id) onSaved?.(data.id);
      setName("");
      setNotes("");
      setShowSaveForm(false);
      await loadSaved();
    } catch (error) {
      console.error("Failed to save comparison:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/saved-comparisons/${id}`, { method: "DELETE" });
      setSaved((current) => current.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete saved comparison:", error);
    }
  };

  return (
    <div className="page">
      <section className="page-title">
        <div>
          <p className="eyebrow">SAVED COMPARISONS</p>
          <h1>Carry the analysis forward.</h1>
          <p>Save a comparison once — reopen it later without recalculating AI insights or battle cards.</p>
        </div>
        <button
          className="primary"
          onClick={() => setShowSaveForm((s) => !s)}
          disabled={currentProductIds.length < 2}
          style={{ opacity: currentProductIds.length < 2 ? 0.5 : 1, cursor: currentProductIds.length < 2 ? "not-allowed" : "pointer" }}
        >
          Save current comparison
        </button>
      </section>

      {showSaveForm && (
        <section
          style={{
            margin: "0 20px 20px 20px",
            padding: "20px",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            backgroundColor: "#f9fafb",
          }}
        >
          {currentProductIds.length < 2 ? (
            <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
              Select at least 2 products (via Explorer or Compare Products) before saving.
            </p>
          ) : (
            <>
              <p style={{ margin: "0 0 12px 0", fontSize: "0.85rem", color: "#6b7280" }}>
                Saving: {currentProductIds.map(modelFor).join(" • ")}
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
                <input
                  type="text"
                  placeholder="Comparison name (e.g. Quiet operation & all-climate fit)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ flex: "1 1 320px", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
                />
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ flex: "1 1 240px", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
                />
              </div>
              <button className="primary" onClick={handleSave} disabled={saving || !name.trim()}>
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </section>
      )}

      {loading ? (
        <section style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "#6b7280" }}>Loading saved comparisons…</p>
        </section>
      ) : saved.length === 0 ? (
        <section style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "#6b7280" }}>No saved comparisons yet.</p>
        </section>
      ) : (
        <section style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {saved.map((s) => (
            <article
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "20px",
                backgroundColor: "#ffffff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    backgroundColor: "#eaf2ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2563eb",
                    fontSize: "1.2rem",
                    flexShrink: 0,
                  }}
                >
                  ⇄
                </div>
                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em", color: "#9ca3af", textTransform: "uppercase" }}>
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </p>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", fontWeight: 700, color: "#111827" }}>{s.name}</h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>
                    {s.productIds.map(modelFor).join(" • ")}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: s.hasInsights && s.hasBattlecard ? "#059669" : "#92400e",
                    backgroundColor: s.hasInsights && s.hasBattlecard ? "#d1fae5" : "#fffbeb",
                    padding: "4px 10px",
                    borderRadius: "999px",
                  }}
                >
                  {s.hasInsights && s.hasBattlecard ? "Cached" : "Draft"}
                </span>
                <button className="secondary" onClick={() => handleDelete(s.id)}>
                  Delete
                </button>
                <button className="primary" onClick={() => onOpen({ id: s.id, productIds: s.productIds })}>
                  Open comparison <span>→</span>
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
