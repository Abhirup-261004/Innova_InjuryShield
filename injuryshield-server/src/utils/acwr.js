// src/utils/acwr.js  (BACKEND - CommonJS)

function daysBetween(a, b) {
  const ms = 1000 * 60 * 60 * 24;
  return Math.floor((a.getTime() - b.getTime()) / ms);
}

function computeACWR(workouts) {
  if (!workouts || workouts.length === 0) {
    return {
      acuteLoad: 0,
      chronicLoad: 0,
      acuteAvg: 0,
      chronicAvg: 0,
      acwr: 0,
      baselineDays: 0,
      hasBaseline: false,
    };
  }

  const sorted = [...workouts].sort(
    (x, y) => new Date(x.date) - new Date(y.date)
  );

  const firstDate = new Date(sorted[0].date);
  const latestDate = new Date(sorted[sorted.length - 1].date);

  let acuteLoad = 0;
  let chronicLoad = 0;

  for (const w of sorted) {
    const d = new Date(w.date);
    const diff = daysBetween(latestDate, d);
    const load = Number(w.load || 0);

    if (diff >= 0 && diff < 7) acuteLoad += load;
    if (diff >= 0 && diff < 28) chronicLoad += load;
  }

  // Effective days since first workout (prevents forced “4” early)
  const daysSinceFirst = daysBetween(latestDate, firstDate) + 1;
  const acuteDays = Math.min(7, Math.max(1, daysSinceFirst));
  const chronicDays = Math.min(28, Math.max(1, daysSinceFirst));

  const acuteAvg = acuteLoad / acuteDays;
  const chronicAvg = chronicLoad / chronicDays;

  // Avoid divide by 0
  const acwr =
    chronicAvg > 0 ? Number((acuteAvg / chronicAvg).toFixed(2)) : 0;

  // Baseline flag (tune as needed)
  const hasBaseline = chronicDays >= 14;

  return {
    acuteLoad,
    chronicLoad,
    acuteAvg: Number(acuteAvg.toFixed(2)),
    chronicAvg: Number(chronicAvg.toFixed(2)),
    acwr,
    baselineDays: chronicDays,
    hasBaseline,
  };
}

module.exports = { computeACWR };

