const { computeACWR } = require("./acwr");

exports.buildAcwrTrend = (workouts, days = 14) => {
  if (!workouts || workouts.length === 0) return [];

  const sorted = [...workouts].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const lastDate = new Date(sorted[sorted.length - 1].date);

  const subDays = (date, n) => {
    const d = new Date(date);
    d.setDate(d.getDate() - n);
    return d;
  };

  const series = [];

  for (let i = days - 1; i >= 0; i--) {
    const asOf = subDays(lastDate, i);
    const upTo = sorted.filter(
      (w) => new Date(w.date) <= asOf
    );

    const acwrData = computeACWR(upTo);

    series.push({
      date: asOf.toISOString().split("T")[0],
      acwr: acwrData.acwr,
      acuteAvg: Number(acwrData.acuteAvg.toFixed(1)),
      chronicAvg: Number(acwrData.chronicAvg.toFixed(1))
    });
  }

  return series;
};
