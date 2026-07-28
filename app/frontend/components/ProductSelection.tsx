"use client";

import { useEffect, useState } from "react";

export interface Product {
  id: string;
  brand: string;
  model: string;
  family: string;
  equipmentType: string;
  attributes: Record<string, string>;
  source: string;
}

interface ProductSelectionProps {
  selected: string[];
  onToggle: (id: string) => void;
  onCompare: () => void;
  onSetUnits: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const isDaikin = (product: Product) => product.brand === "Daikin";

const key = (product: Product, label: string): string =>
  (product.attributes as Record<string, string>)[label] ?? "Information unavailable";

const short = (value: string) =>
  value.replace("Up to ", "≤ ").replace("Extremely Quiet, ", "");

const sourcePreview = (product: Product) =>
  key(product, "SEER2") !== "Information unavailable"
    ? `SEER2 ${short(key(product, "SEER2"))}`
    : short(key(product, "Sound level"));

const tonnageOptions = (product: Product): string[] => {
  const raw = key(product, "Tonnage options");
  if (raw === "Information unavailable") return [];
  return [...new Set(raw.match(/\d+(?:\.\d+)?/g) ?? [])].map((size) => `${size} Ton`);
};

export function ProductSelection({
  selected,
  onToggle,
  onCompare,
  onSetUnits,
}: ProductSelectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);

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

  if (loading) {
    return <div className="page"><section><h1>Loading products...</h1></section></div>;
  }

  const normalized = term.toLowerCase().replace(/[\s-]/g, "");
  const matching = products
    .filter((product) => {
      const haystack = `${product.brand} ${product.model} ${product.family} ${product.equipmentType} ${Object.values(product.attributes).join(" ")}`
        .toLowerCase()
        .replace(/[\s-]/g, "");
      return (
        !term ||
        haystack.includes(normalized) ||
        (normalized === "quiet" && key(product, "Sound level") !== "Information unavailable")
      );
    })
    .slice(0, 10);

  const daikin = matching.filter(isDaikin);
  const competitors = matching.filter((product) => !isDaikin(product));
  const selectedProducts = products.filter((p) => selected.includes(p.id));

  const choose = (product: Product) => {
    if (!selected.includes(product.id)) {
      onToggle(product.id);
    }
    setRecent((current) =>
      [product.model, ...current.filter((item) => item !== product.model)].slice(0, 3)
    );
    setTerm("");
  };

  const keydown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => Math.min(current + 1, Math.max(matching.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, 0));
    }
    if (event.key === "Enter" && matching[active]) {
      event.preventDefault();
      choose(matching[active]);
    }
  };

  const highlight = (text: string, term: string) => {
    const position = text.toLowerCase().indexOf(term.toLowerCase());
    return position < 0 || !term ? (
      text
    ) : (
      <>
        {text.slice(0, position)}
        <mark>{text.slice(position, position + term.length)}</mark>
        {text.slice(position + term.length)}
      </>
    );
  };

  return (
    <div className="page simple-dashboard">
      <section className="builder-hero">
        <p className="eyebrow">DAIKIN COMPETITIVE MARKETING INTELLIGENCE</p>
        <h1>Which products would you like to compare?</h1>
        <p>Search across Daikin and competitor models, select units, then compare.</p>
      </section>

      <div className="smart-builder">
        <div className="smart-search">
          <span>⌕</span>
          <input
            autoFocus
            value={term}
            onKeyDown={keydown}
            onChange={(event) => {
              setTerm(event.target.value);
              setActive(0);
            }}
            placeholder="Search Daikin or competitor products..."
            aria-label="Search products to compare"
          />
          <kbd>⌘ K</kbd>
        </div>

        {term && (
          <div className="suggestions" role="listbox">
            {daikin.length > 0 && (
              <div className="suggestion-group">
                <span>DAIKIN PRODUCTS</span>
                {daikin.map((product) => (
                  <button
                    className={
                      matching.indexOf(product) === active ? "suggestion active" : "suggestion"
                    }
                    key={product.id}
                    onClick={() => choose(product)}
                  >
                    <i className="dot green" />
                    <div>
                      <b>{highlight(product.model, term)}</b>
                      <small>
                        {product.brand} • {product.family} • {key(product, "Refrigerant")}
                      </small>
                    </div>
                    <em>{sourcePreview(product)}</em>
                  </button>
                ))}
              </div>
            )}
            {competitors.length > 0 && (
              <div className="suggestion-group">
                <span>COMPETITOR PRODUCTS</span>
                {competitors.map((product) => (
                  <button
                    className={
                      matching.indexOf(product) === active ? "suggestion active" : "suggestion"
                    }
                    key={product.id}
                    onClick={() => choose(product)}
                  >
                    <i className="dot amber" />
                    <div>
                      <b>{highlight(product.model, term)}</b>
                      <small>
                        {product.brand} • {product.family} • {key(product, "Refrigerant")}
                      </small>
                    </div>
                    <em>{sourcePreview(product)}</em>
                  </button>
                ))}
              </div>
            )}
            <div className="suggestion-meta">
              <span>BRANDS</span>
              {[...new Set(matching.map((p) => p.brand))]
                .slice(0, 5)
                .map((brand) => (
                  <button key={brand} onClick={() => setTerm(brand)}>
                    {brand}
                  </button>
                ))}
              <span>PRODUCT FAMILIES</span>
              {[...new Set(matching.map((p) => p.family))]
                .slice(0, 3)
                .map((family) => (
                  <button key={family} onClick={() => setTerm(family)}>
                    {family}
                  </button>
                ))}
            </div>
          </div>
        )}

        {!term && (
          <div className="search-hints">
            <span>
              Try:{" "}
              {["DH7", "Rheem 18", "R-32", "quiet"].map((hint) => (
                <button key={hint} onClick={() => setTerm(hint)}>
                  {hint}
                </button>
              ))}
            </span>
            {recent.length > 0 && <span>Recent: {recent.join(" • ")}</span>}
          </div>
        )}

        <div className="selected-strip">
          <div className="selected-head">
            <b>Selected products</b>
            <span>
              {selected.length}/8
            </span>
            {selected.length > 0 && (
              <button onClick={() => selected.slice().forEach(onToggle)}>Clear all</button>
            )}
          </div>

          {selected.length === 0 ? (
            <div className="select-empty">Search above to add a Daikin or competitor product. Start with any two products.</div>
          ) : (
            <div className="selected-cards">
              {selectedProducts.map((product) => (
                <article key={product.id}>
                  <div>
                    <span className={isDaikin(product) ? "brand daikin" : "brand"}>
                      {product.brand}
                    </span>
                    <button
                      onClick={() => onToggle(product.id)}
                      aria-label={`Remove ${product.model}`}
                    >
                      ×
                    </button>
                  </div>
                  <b>{product.model}</b>
                  <small>{product.family}</small>
                  {tonnageOptions(product).length > 0 ? (
                    <div className="unit-picker">
                      <span>Unit size</span>
                      {tonnageOptions(product).map((unit) => (
                        <button
                          className="unit"
                          key={unit}
                          onClick={() =>
                            onSetUnits((current) => ({
                              ...current,
                              [product.id]: unit,
                            }))
                          }
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <em>Model-level information only</em>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="builder-action">
          <span>
            {selected.length < 2
              ? "Select at least two products to compare"
              : "Ready to compare selected products"}
          </span>
          <button className="primary" disabled={selected.length < 2} onClick={onCompare}>
            Compare Selected Products <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
