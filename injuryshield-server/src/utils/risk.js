exports.calculateRisk = (acwrData, checkin) => {
  if (!checkin) return 0;

  const acwr = acwrData?.acwr || 0;

  let risk = 0;

  // ACWR scoring
  if (acwr >= 1.5) risk += 35;
  else if (acwr >= 1.3) risk += 20;
  else if (acwr > 0) risk += 5;

  // Recovery scoring
  if (checkin.sleep < 6) risk += 15;
  if (checkin.fatigue > 7) risk += 15;
  if (checkin.soreness > 7) risk += 15;
  if (checkin.stress > 7) risk += 10;
  if (checkin.painAreas && checkin.painAreas.length > 0) risk += 20;

  if (risk > 100) risk = 100;
  return risk;
};
