export type WeightedMetric = { key: string; weight: number; value: number | null; direction: "higher" | "lower" };

export function scenarioFit(metrics: WeightedMetric[]): { score: number; coverage: number } {
  const usable = metrics.filter((metric) => metric.value !== null);
  if (!usable.length) return { score: 0, coverage: 0 };
  const totalWeight = usable.reduce((sum, metric) => sum + metric.weight, 0);
  const normalized = usable.reduce((sum, metric) => {
    const value = metric.value ?? 0;
    const score = metric.direction === "higher" ? Math.min(value / 25, 1) : Math.max(0, 1 - value / 100);
    return sum + score * metric.weight;
  }, 0);
  return { score: Math.round((normalized / totalWeight) * 100), coverage: Math.round((usable.length / metrics.length) * 100) };
}
