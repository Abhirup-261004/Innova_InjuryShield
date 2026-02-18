// src/utils/ewma.js
const alphaFromWindow = (windowDays) => 2 / (windowDays + 1);

/**
 * EWMA update:
 * ewma[t] = alpha*x[t] + (1-alpha)*ewma[t-1]
 */
const ewmaSeries = (values, windowDays, seed = 0) => {
  const alpha = alphaFromWindow(windowDays);
  const out = [];
  let prev = seed;

  for (const x of values) {
    const next = alpha * x + (1 - alpha) * prev;
    out.push(next);
    prev = next;
  }
  return out;
};

module.exports = { alphaFromWindow, ewmaSeries };
