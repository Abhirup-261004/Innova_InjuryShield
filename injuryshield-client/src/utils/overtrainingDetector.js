export function detectOvertraining(workouts) {
  if (!workouts || workouts.length < 3) {
    return {
      isOvertraining: false,
      reasons: [],
      stats: { consecutiveHighDays: 0, loadSpikePercent: 0 }
    };
  }

  // Sort by date (just in case)
  const sorted = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));

  const loads = sorted.map((w) => Number(w.load || 0));

  // High-load threshold based on user's own average
  const avgLoad = loads.reduce((s, v) => s + v, 0) / loads.length;
  const highThreshold = avgLoad * 1.25; // 25% above average = "high" day

  // 1) Consecutive high-load days (look at last 3 workouts)
  let consecutiveHighDays = 0;
  for (let i = loads.length - 1; i >= 0; i--) {
    if (loads[i] >= highThreshold) consecutiveHighDays++;
    else break;
    if (consecutiveHighDays >= 3) break;
  }

  // 2) Load spike (recent 3 avg vs previous 3 avg)
  let loadSpikePercent = 0;
  if (loads.length >= 6) {
    const recent3 = loads.slice(-3);
    const prev3 = loads.slice(-6, -3);

    const avgRecent = recent3.reduce((s, v) => s + v, 0) / 3;
    const avgPrev = prev3.reduce((s, v) => s + v, 0) / 3;

    if (avgPrev > 0) {
      loadSpikePercent = Math.round(((avgRecent - avgPrev) / avgPrev) * 100);
    }
  }

  const reasons = [];
  if (consecutiveHighDays >= 3) reasons.push("3+ consecutive high-load sessions detected");
  if (loadSpikePercent >= 40) reasons.push(`Workload spike of ${loadSpikePercent}% compared to recent baseline`);

  return {
    isOvertraining: reasons.length > 0,
    reasons,
    stats: { consecutiveHighDays, loadSpikePercent }
  };
}
