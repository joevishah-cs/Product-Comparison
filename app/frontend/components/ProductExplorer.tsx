"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  brand: string;
  model: string;
  family?: string;
  equipmentType?: string;
  attributes: Record<string, string>;
}

interface ProductExplorerProps {
  onSelect: (productIds: string[]) => void;
  onCompare: (productIds: string[]) => void;
  selectedInitial?: string[];
}

export function ProductExplorer({ onSelect, onCompare, selectedInitial = [] }: ProductExplorerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>(selectedInitial);
  const [filterBrand, setFilterBrand] = useState("All brands");
  const [filterRefrigerant, setFilterRefrigerant] = useState("All");
  const [filterSound, setFilterSound] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const toggleProduct = (productId: string) => {
    const newSelected = selected.includes(productId)
      ? selected.filter((id) => id !== productId)
      : selected.length < 8
      ? [...selected, productId]
      : selected;

    setSelected(newSelected);
    onSelect(newSelected);
  };

  const parseSoundLevel = (raw: string): number | null => {
    const match = raw.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  };

  const filteredProducts = products.filter((p) => {
    if (filterBrand !== "All brands" && p.brand !== filterBrand) return false;
    if (filterRefrigerant !== "All") {
      const refrigerant = p.attributes["Refrigerant"] || "";
      if (!refrigerant.includes(filterRefrigerant)) return false;
    }
    if (filterSound !== "All") {
      const soundValue = parseSoundLevel(p.attributes["Sound level"] || "");
      if (soundValue === null) return false;
      if (filterSound === "Under 45 dBA" && soundValue >= 45) return false;
      if (filterSound === "45-55 dBA" && (soundValue < 45 || soundValue > 55)) return false;
      if (filterSound === "Over 55 dBA" && soundValue <= 55) return false;
    }
    return true;
  });

  const brands = ["All brands", ...new Set(products.map((p) => p.brand))];
  const refrigerants = ["All", "R-32", "R-454B"];
  const soundLevels = ["All", "Under 45 dBA", "45-55 dBA", "Over 55 dBA"];

  const getAttributeValue = (product: Product, key: string) => {
    return product.attributes[key] || "—";
  };

  if (loading) {
    return (
      <div className="page">
        <section className="page-title">
          <h1>Loading products...</h1>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="page-title">
        <div>
          <p className="eyebrow">PRODUCT EXPLORER</p>
          <h1>Find the right proof point.</h1>
          <p>28 source-backed products. Values are displayed exactly as imported.</p>
        </div>
        <button
          className="primary"
          onClick={() => onCompare(selected)}
          disabled={selected.length < 2}
          style={{ opacity: selected.length < 2 ? 0.5 : 1, cursor: selected.length < 2 ? "not-allowed" : "pointer" }}
        >
          Compare selected ({selected.length}) <span>→</span>
        </button>
      </section>

      <section className="filters-bar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "20px", backgroundColor: "#f9fafb", borderRadius: "8px", marginBottom: "20px" }}>
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
        >
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          value={filterRefrigerant}
          onChange={(e) => setFilterRefrigerant(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
        >
          {refrigerants.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={filterSound}
          onChange={(e) => setFilterSound(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
        >
          {soundLevels.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          onClick={() => setView(view === "grid" ? "list" : "grid")}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", marginLeft: "auto" }}
        >
          {view === "grid" ? "☰ List view" : "⊞ Grid view"}
        </button>
      </section>

      {view === "grid" ? (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", padding: "0 20px" }}>
          {filteredProducts.map((product) => {
            const isDaikin = product.brand === "Daikin";
            const isSelected = selected.includes(product.id);
            const highlighted = isDaikin || isSelected;
            const source = product.attributes["_source"] || "Daikin FIT Battlecard.pdf";

            return (
              <article
                key={product.id}
                style={{
                  border: highlighted ? "1px solid #d1d5db" : "1px solid #e5e7eb",
                  borderTop: highlighted ? "3px solid #2563eb" : "3px solid transparent",
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  overflow: "hidden",
                  boxShadow: isSelected ? "0 0 0 2px #2563eb33" : "none",
                }}
                onClick={() => toggleProduct(product.id)}
              >
                <div style={{ padding: "16px 16px 0 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      color: isDaikin ? "#2563eb" : "#6b7280",
                      textTransform: "uppercase",
                    }}
                  >
                    {isDaikin ? product.brand : "Competitor"}
                  </span>
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      border: `1.5px solid ${isSelected ? "#2563eb" : "#9ca3af"}`,
                      backgroundColor: isSelected ? "#2563eb" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isSelected ? "#ffffff" : "#9ca3af",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isSelected ? "✓" : "+"}
                  </div>
                </div>

                <div style={{ padding: "12px 16px 16px 16px" }}>
                  <div
                    style={{
                      background: "linear-gradient(135deg, #eaf2ff 0%, #dbe9ff 100%)",
                      borderRadius: "8px",
                      height: "96px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      padding: "0 16px",
                      position: "relative",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        border: "5px solid #2563eb",
                        opacity: 0.55,
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        left: "12px",
                        bottom: "8px",
                        fontSize: "0.7rem",
                        color: "#5b7bb0",
                      }}
                    >
                      Inverter heat pump
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 4px 0", fontSize: "1.15rem", fontWeight: 700, color: "#111827" }}>{product.model}</h3>
                  <p style={{ margin: "0 0 14px 0", fontSize: "0.85rem", color: "#6b7280" }}>
                    {isDaikin ? `${getAttributeValue(product, "Refrigerant")} Daikin FIT Series` : "Competitive inverter heat pump"}
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                    <div>
                      <p style={{ margin: "0 0 2px 0", fontSize: "0.65rem", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.03em" }}>
                        REFRIGERANT
                      </p>
                      <p style={{ margin: "0", fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>
                        {getAttributeValue(product, "Refrigerant")}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 2px 0", fontSize: "0.65rem", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.03em" }}>
                        EFFICIENCY
                      </p>
                      <p style={{ margin: "0", fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>
                        {getAttributeValue(product, "SEER2")}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 2px 0", fontSize: "0.65rem", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.03em" }}>
                        SOUND
                      </p>
                      <p style={{ margin: "0", fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>
                        {getAttributeValue(product, "Sound level")}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid #f3f4f6",
                      paddingTop: "10px",
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                    }}
                  >
                    <span>{isDaikin ? "Daikin profile" : "Competitive profile"}</span>
                    <span>○ {source}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section style={{ padding: "0 20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#ffffff", borderRadius: "8px", overflow: "hidden" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #d1d5db" }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "0.9rem" }}>Product</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "0.9rem" }}>Brand</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "0.9rem" }}>Refrigerant</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "0.9rem" }}>SEER2</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "0.9rem" }}>Sound Level</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "0.9rem" }}>Warranty</th>
                <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", fontSize: "0.9rem" }}>Select</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  style={{
                    borderBottom: "1px solid #d1d5db",
                    backgroundColor: selected.includes(product.id) ? "#eff6ff" : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleProduct(product.id)}
                >
                  <td style={{ padding: "12px", fontWeight: "600" }}>{product.model}</td>
                  <td style={{ padding: "12px", fontSize: "0.9rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color: product.brand === "Daikin" ? "#2563eb" : "#6b7280" }}>
                      {product.brand}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontSize: "0.9rem" }}>{getAttributeValue(product, "Refrigerant")}</td>
                  <td style={{ padding: "12px", fontSize: "0.9rem" }}>{getAttributeValue(product, "SEER2")}</td>
                  <td style={{ padding: "12px", fontSize: "0.9rem" }}>{getAttributeValue(product, "Sound level")}</td>
                  <td style={{ padding: "12px", fontSize: "0.9rem" }}>{getAttributeValue(product, "Warranty")}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {filteredProducts.length === 0 && (
        <section style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "#6b7280" }}>No products match your filters.</p>
        </section>
      )}

      <section style={{ display: "flex", gap: "12px", justifyContent: "flex-end", padding: "20px", marginTop: "20px" }}>
        <button
          className="secondary"
          onClick={() => {
            setSelected([]);
            onSelect([]);
          }}
        >
          Clear selection
        </button>
        <button
          className="primary"
          onClick={() => onCompare(selected)}
          disabled={selected.length < 2}
          style={{ opacity: selected.length < 2 ? 0.5 : 1, cursor: selected.length < 2 ? "not-allowed" : "pointer" }}
        >
          Compare selected ({selected.length}) <span>→</span>
        </button>
      </section>
    </div>
  );
}
