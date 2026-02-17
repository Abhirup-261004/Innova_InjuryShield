function daysBetween(a, b) {
  const ms = 1000 * 60 * 60 * 24;
  return Math.floor((a.getTime() - b.getTime()) / ms);
}

export function computeACWR(workouts) {
  if (!workouts || workouts.length === 0) {
    return {
      acuteLoad: 0,
      chronicLoad: 0,
      acuteAvg: 0,
      chronicAvg: 0,
      acwr: 0
    };
  }

  // Sort workouts by date ASC
  const sorted = [...workouts].sort((x, y) => new Date(x.date) - new Date(y.date));
  const latestDate = new Date(sorted[sorted.length - 1].date);

  let acuteLoad = 0;   // last 7 days sum
  let chronicLoad = 0; // last 28 days sum

  for (const w of sorted) {
    const d = new Date(w.date);
    const diff = daysBetween(latestDate, d);

    const load = Number(w.load || 0);

    if (diff >= 0 && diff < 7) acuteLoad += load;
    if (diff >= 0 && diff < 28) chronicLoad += load;
  }

  const acuteAvg = acuteLoad / 7;
  const chronicAvg = chronicLoad / 28;

  // Avoid divide by 0
  const acwr = chronicAvg > 0 ? Number((acuteAvg / chronicAvg).toFixed(2)) : 0;

  return { acuteLoad, chronicLoad, acuteAvg, chronicAvg, acwr };
}
