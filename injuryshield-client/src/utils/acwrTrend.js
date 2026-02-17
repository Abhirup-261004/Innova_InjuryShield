import { computeACWR } from "./acwrCalculator";

// Builds an ACWR series by “pretending” each day is the latest day and recomputing ACWR
export function buildAcwrTrend(workouts, days = 14) {
  if (!workouts || workouts.length === 0) return [];

  const sorted = [...workouts].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Determine last date present in data
  const lastDate = new Date(sorted[sorted.length - 1].date);

  // Helper: subtract days
  const subDays = (date, n) => {
    const d = new Date(date);
    d.setDate(d.getDate() - n);
    return d;
  };

  // For each day in range, filter workouts up to that “as-of” day and compute ACWR
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const asOf = subDays(lastDate, i);

    const upTo = sorted.filter((w) => new Date(w.date) <= asOf);

    const acwrData = computeACWR(upTo);

    series.push({
      day: asOf.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      acwr: acwrData.acwr,
      acuteAvg: Number(acwrData.acuteAvg.toFixed(1)),
      chronicAvg: Number(acwrData.chronicAvg.toFixed(1))
    });
  }

  return series;
}
