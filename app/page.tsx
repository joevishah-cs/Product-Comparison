"use client";

import { useState } from "react";
import { ProductSelection } from "./frontend/components/ProductSelection";
import { ProductExplorer } from "./frontend/components/ProductExplorer";
import { ComparisonDashboard } from "./frontend/components/ComparisonDashboard";
import { SpecificationTable } from "./frontend/components/SpecificationTable";
import { AIInsights } from "./frontend/components/AIInsights";
import { GraphicalComparison } from "./frontend/components/GraphicalComparison";
import { BattleCard } from "./frontend/components/BattleCard";
import { SavedComparisons } from "./frontend/components/SavedComparisons";

type View = "Dashboard" | "Explorer" | "Compare" | "Specifications" | "Insights" | "Charts" | "BattleCard" | "Saved";

function Logo() {
  return (
    <div className="brand-mark" aria-label="Daikin logo placeholder">
      <i /> <span>DAIKIN</span>
    </div>
  );
}

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [view, setView] = useState<View>("Dashboard");
  const [selected, setSelected] = useState<string[]>([]);
  const [units, setUnits] = useState<Record<string, string>>({});
  const [preloadedInsights, setPreloadedInsights] = useState<string | undefined>(undefined);
  const [preloadedBattlecard, setPreloadedBattlecard] = useState<string | undefined>(undefined);
  const [preloadedDashboard, setPreloadedDashboard] = useState<string | undefined>(undefined);
  const [openSavedId, setOpenSavedId] = useState<string | null>(null);
  const [email, setEmail] = useState("demo@daikin.com");
  const [password, setPassword] = useState("DaikinDemo2026!");
  const [loginError, setLoginError] = useState("");

  const login = () => {
    if (email.toLowerCase() === "demo@daikin.com" && password === "DaikinDemo2026!") {
      setAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Use the configured competition demo credentials to continue.");
    }
  };

  const toggle = (id: string) => {
    setPreloadedInsights(undefined);
    setPreloadedBattlecard(undefined);
    setPreloadedDashboard(undefined);
    setOpenSavedId(null);
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : current.length < 8 ? [...current, id] : current
    );
  };

  const openSavedComparison = async (comparison: { id: string; productIds: string[] }) => {
    setSelected(comparison.productIds);
    setOpenSavedId(comparison.id);
    try {
      const res = await fetch(`/api/saved-comparisons/${comparison.id}`);
      const data = await res.json();
      setPreloadedInsights(data.insights || undefined);
      setPreloadedBattlecard(data.battlecard || undefined);
      setPreloadedDashboard(data.dashboard || undefined);
    } catch (error) {
      console.error("Failed to load saved comparison:", error);
    }
    setView("Compare");
  };

  const persistGenerated = (field: "insights" | "battlecard" | "dashboard", value: string) => {
    if (!openSavedId) return;
    fetch(`/api/saved-comparisons/${openSavedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    }).catch((error) => console.error(`Failed to cache ${field}:`, error));
  };

  const nav: Array<{ label: View; icon: string; title: string }> = [
    { label: "Dashboard", title: "Product Selection", icon: "⊕" },
    { label: "Explorer", title: "Product Explorer", icon: "🔍" },
    { label: "Compare", title: "Comparison Dashboard", icon: "⇄" },
    { label: "Specifications", title: "Specification Table", icon: "▦" },
    { label: "Insights", title: "AI Insights", icon: "✦" },
    { label: "Charts", title: "Graphical Analysis", icon: "📊" },
    { label: "BattleCard", title: "Competitive Analysis Report", icon: "⚔" },
    { label: "Saved", title: "Saved Comparisons", icon: "♡" },
  ];

  if (!authenticated) {
    return (
      <main className="login">
        <div className="login-orbit orbit-a" />
        <div className="login-orbit orbit-b" />
        <section className="login-copy">
          <Logo />
          <p className="eyebrow">DAIKIN COMPETITIVE MARKETING INTELLIGENCE</p>
          <h1>
            Turn verified product intelligence into <br />
            market momentum.
          </h1>
          <p>Compare. Position. Win.</p>
          <div className="login-proof">
            <span>
              28 <small>products</small>
            </span>
            <span>
              2 <small>verified sources</small>
            </span>
            <span>
              ∞ <small>stronger stories</small>
            </span>
          </div>
        </section>
        <section className="signin">
          <div>
            <p className="eyebrow">SECURE DEMO ACCESS</p>
            <h2>Welcome back</h2>
            <p>Build your next competitive advantage.</p>
          </div>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <div className="password">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>
          {loginError && <p className="form-error">{loginError}</p>}
          <button className="primary login-button" onClick={login}>
            Sign in <span>→</span>
          </button>
          <p className="legal">Demo mode uses a local session. Enterprise SSO is designed as a drop-in replacement.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Logo />
        <div className="workspace-pill">
          <span className="pulse" /> COMPETITIVE INTELLIGENCE
        </div>
        <nav aria-label="Primary navigation">
          {nav.map((item) => (
            <button
              className={view === item.label ? "nav-item active" : "nav-item"}
              onClick={() => setView(item.label)}
              key={item.label}
            >
              <b>{item.icon}</b>
              {item.title}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span>Data is source-backed</span>
          <strong>28 products • 2 sources</strong>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="crumb">
            <span>Competitive Intelligence</span>
            <b>/{nav.find((item) => item.label === view)?.title}</b>
          </div>
          <button className="round" aria-label="Notifications">
            ◌
          </button>
          <button className="avatar" aria-label="Demo user">
            DS
          </button>
        </header>

        {view === "Dashboard" && (
          <ProductSelection selected={selected} onToggle={toggle} onCompare={() => setView("Compare")} onSetUnits={setUnits} />
        )}
        {view === "Explorer" && (
          <ProductExplorer
            selectedInitial={selected}
            onSelect={(ids) => {
              setPreloadedInsights(undefined);
              setPreloadedBattlecard(undefined);
              setSelected(ids);
            }}
            onCompare={(ids) => {
              setPreloadedInsights(undefined);
              setPreloadedBattlecard(undefined);
              setSelected(ids);
              setView("Compare");
            }}
          />
        )}
        {view === "Compare" && (
          <ComparisonDashboard
            productIds={selected}
            units={units}
            onEdit={() => setView("Dashboard")}
            onNext={() => setView("Specifications")}
            preloaded={preloadedDashboard}
            onGenerated={(text) => {
              setPreloadedDashboard(text);
              persistGenerated("dashboard", text);
            }}
          />
        )}
        {view === "Specifications" && <SpecificationTable productIds={selected} units={units} onBack={() => setView("Compare")} onNext={() => setView("Insights")} />}
        {view === "Insights" && (
          <AIInsights
            productIds={selected}
            onBack={() => setView("Specifications")}
            onNext={() => setView("Charts")}
            preloaded={preloadedInsights}
            onGenerated={(text) => {
              setPreloadedInsights(text);
              persistGenerated("insights", text);
            }}
          />
        )}
        {view === "Charts" && <GraphicalComparison productIds={selected} onBack={() => setView("Insights")} onNext={() => setView("BattleCard")} />}
        {view === "BattleCard" && (
          <BattleCard
            productIds={selected}
            onBack={() => setView("Charts")}
            preloaded={preloadedBattlecard}
            preloadedInsights={preloadedInsights}
            preloadedDashboard={preloadedDashboard}
            onGenerated={(text) => {
              setPreloadedBattlecard(text);
              persistGenerated("battlecard", text);
            }}
          />
        )}
        {view === "Saved" && (
          <SavedComparisons currentProductIds={selected} onOpen={openSavedComparison} onSaved={setOpenSavedId} />
        )}
      </section>
    </main>
  );
}
