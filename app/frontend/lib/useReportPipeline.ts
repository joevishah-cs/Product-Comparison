"use client";

import { useEffect, useState } from "react";
import { fetchAgentStream } from "./useAgentStream";
import type { ComparisonData } from "../../../lib/report/buildReport";

const LOG = (stage: string, message: string) => {
  const now = new Date().toLocaleTimeString();
  console.log(`[${now}] [${stage}] ${message}`);
};

/**
 * Sequential pipeline: comparison → insights → dashboard → battlecard.
 * Each stage waits for the previous one to complete before starting.
 * With detailed terminal logging for debugging.
 */
export function useReportPipeline(
  productIds: string[],
  preloadedInsights: string | undefined,
  preloadedDashboard: string | undefined,
  preloadedBattlecard: string | undefined,
  preloadsAreCurrent: boolean,
  onInsightsGenerated: (text: string) => void,
  onDashboardGenerated: (text: string) => void,
  onBattlecardGenerated: (text: string) => void
) {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);

  const [insightsText, setInsightsText] = useState(preloadedInsights || "");
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsStatus, setInsightsStatus] = useState("Waiting for comparison...");

  const [dashboardText, setDashboardText] = useState(preloadedDashboard || "");
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardStatus, setDashboardStatus] = useState("Waiting for insights...");

  const [battlecardText, setBattlecardText] = useState(preloadedBattlecard || "");
  const [battlecardLoading, setBattlecardLoading] = useState(false);
  const [battlecardStatus, setBattlecardStatus] = useState("Waiting for dashboard...");

  const idsKey = [...productIds].sort().join(",");

  // Reset everything when the underlying product selection changes. If the
  // new selection matches a just-opened saved comparison, restore its cached
  // text instead of wiping it (avoids re-running AI for data we already have).
  useEffect(() => {
    LOG("RESET", `Product selection changed: ${idsKey} (preloaded=${preloadsAreCurrent})`);
    setComparison(null);
    setInsightsText(preloadsAreCurrent ? preloadedInsights || "" : "");
    setInsightsLoading(false);
    setDashboardText(preloadsAreCurrent ? preloadedDashboard || "" : "");
    setDashboardLoading(false);
    setBattlecardText(preloadsAreCurrent ? preloadedBattlecard || "" : "");
    setBattlecardLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // Stage 1: Base comparison data.
  useEffect(() => {
    if (productIds.length < 2) return;
    let cancelled = false;

    LOG("COMPARISON", `Fetching comparison for products: ${productIds.join(", ")}`);

    fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          LOG("COMPARISON", `✓ Complete. ${data.attributes?.length || 0} attributes, ${data.products?.length || 0} products`);
          setComparison(data);
        }
      })
      .catch((error) => {
        LOG("COMPARISON", `✗ Error: ${error instanceof Error ? error.message : String(error)}`);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // Stage 2: Insights AI — waits for comparison.
  useEffect(() => {
    if (productIds.length < 2) return;
    if (!comparison) return;
    if (preloadsAreCurrent && preloadedInsights) {
      LOG("INSIGHTS", "Using preloaded data");
      return;
    }
    if (insightsText || insightsLoading) return;

    let cancelled = false;
    LOG("INSIGHTS", "Starting (after comparison complete)");
    setInsightsLoading(true);
    setInsightsStatus("Initializing AI analysis...");

    fetchAgentStream(
      "/api/ai/insights",
      { productIds },
      "insights",
      (event) => {
        if (!cancelled) {
          LOG("INSIGHTS", `Status: ${event.detail}`);
          setInsightsStatus(event.detail);
        }
      }
    )
      .then((result) => {
        if (cancelled) return;
        LOG("INSIGHTS", `✓ Complete (${result.length} chars)`);
        setInsightsText(result);
        onInsightsGenerated(result);
      })
      .catch((error) => {
        const msg = error instanceof Error ? error.message : "Unknown error";
        LOG("INSIGHTS", `✗ Error: ${msg}`);
        if (!cancelled) {
          setInsightsStatus(`Error: ${msg}`);
        }
      })
      .finally(() => {
        if (!cancelled) setInsightsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, comparison]);

  // Stage 3: Dashboard AI — waits for insights.
  useEffect(() => {
    if (productIds.length < 2) return;
    if (insightsLoading) return;
    if (!insightsText) return;
    if (preloadsAreCurrent && preloadedDashboard) {
      LOG("DASHBOARD", "Using preloaded data");
      return;
    }
    if (dashboardText || dashboardLoading) return;

    let cancelled = false;
    LOG("DASHBOARD", "Starting (after insights complete)");
    setDashboardLoading(true);
    setDashboardStatus("Initializing dashboard briefing...");

    fetchAgentStream(
      "/api/ai/dashboard",
      { productIds },
      "dashboard",
      (event) => {
        if (!cancelled) {
          LOG("DASHBOARD", `Status: ${event.detail}`);
          setDashboardStatus(event.detail);
        }
      }
    )
      .then((result) => {
        if (cancelled) return;
        LOG("DASHBOARD", `✓ Complete (${result.length} chars)`);
        setDashboardText(result);
        onDashboardGenerated(result);
      })
      .catch((error) => {
        const msg = error instanceof Error ? error.message : "Unknown error";
        LOG("DASHBOARD", `✗ Error: ${msg}`);
        if (!cancelled) {
          setDashboardStatus(`Error: ${msg}`);
        }
      })
      .finally(() => {
        if (!cancelled) setDashboardLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insightsText, insightsLoading, idsKey]);

  // Stage 4: Report/Battlecard AI — waits for dashboard.
  useEffect(() => {
    if (productIds.length < 2) return;
    if (dashboardLoading) return;
    if (!dashboardText) return;
    if (preloadsAreCurrent && preloadedBattlecard) {
      LOG("BATTLECARD", "Using preloaded data");
      return;
    }
    if (battlecardText || battlecardLoading) return;

    let cancelled = false;
    LOG("BATTLECARD", "Starting (after dashboard complete)");
    setBattlecardLoading(true);
    setBattlecardStatus("Initializing competitive analysis report...");

    fetchAgentStream(
      "/api/ai/battlecard",
      { productIds },
      "battlecard",
      (event) => {
        if (!cancelled) {
          LOG("BATTLECARD", `Status: ${event.detail}`);
          setBattlecardStatus(event.detail);
        }
      }
    )
      .then((result) => {
        if (cancelled) return;
        LOG("BATTLECARD", `✓ Complete (${result.length} chars)`);
        setBattlecardText(result);
        onBattlecardGenerated(result);
      })
      .catch((error) => {
        const msg = error instanceof Error ? error.message : "Unknown error";
        LOG("BATTLECARD", `✗ Error: ${msg}`);
        if (!cancelled) {
          setBattlecardStatus(`Error: ${msg}`);
        }
      })
      .finally(() => {
        if (!cancelled) setBattlecardLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardText, dashboardLoading, idsKey]);

  // Derived (not stored) status text for stages still waiting on an earlier
  // one — computed at render time instead of via setState-in-effect.
  const effectiveDashboardStatus = !comparison
    ? "Waiting for comparison..."
    : insightsLoading
    ? "Waiting for insights..."
    : !insightsText
    ? "Insights generation failed; skipping dashboard"
    : dashboardStatus;

  const effectiveBattlecardStatus = !comparison
    ? "Waiting for comparison..."
    : insightsLoading
    ? "Waiting for insights..."
    : !insightsText
    ? "Insights generation failed; skipping report"
    : dashboardLoading
    ? "Waiting for dashboard..."
    : !dashboardText
    ? "Dashboard generation failed; skipping report"
    : battlecardStatus;

  return {
    comparison,
    insightsText,
    insightsLoading,
    insightsStatus,
    dashboardText,
    dashboardLoading,
    dashboardStatus: effectiveDashboardStatus,
    battlecardText,
    battlecardLoading,
    battlecardStatus: effectiveBattlecardStatus,
  };
}
