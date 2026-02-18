// src/components/AcwrEwmaChart.jsx
import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function LineSVG({ data, width = 900, height = 240 }) {
  const padding = 16;

  const points = useMemo(() => {
    if (!data.length) return "";

    const ys = data.map((d) => d.acwr);
    const minY = 0; // ACWR baseline
    const maxY = Math.max(2, ...ys); // keep chart readable

    const scaleX = (i) =>
      padding + (i * (width - padding * 2)) / Math.max(1, data.length - 1);

    const scaleY = (y) => {
      const t = (y - minY) / (maxY - minY || 1);
      return height - padding - t * (height - padding * 2);
    };

    return data
      .map((d, i) => `${scaleX(i)},${scaleY(clamp(d.acwr, minY, maxY))}`)
      .join(" ");
  }, [data, width, height]);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ borderRadius: 12 }}>
      {/* reference bands */}
      <line x1="0" y1="120" x2={width} y2="120" opacity="0.2" />
      {/* polyline */}
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

function AcwrEwmaChart() {
  const [trend, setTrend] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        // tweak defaults here if you want
        const { data } = await API.get("/analytics/acwr-ewma?acute=7&chronic=28&lookback=60");
        setTrend(data);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load ACWR EWMA trend");
      }
    };
    load();
  }, []);

  const latest = trend.length ? trend[trend.length - 1] : null;

  if (err) return <p style={{ padding: 16, color: "red" }}>{err}</p>;
  if (!trend.length) return <p style={{ padding: 16 }}>No ACWR data yet.</p>;

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 8 }}>ACWR (EWMA)</h3>

      {latest && (
        <div style={{ marginBottom: 10, opacity: 0.9 }}>
          <b>Latest:</b> {latest.day} • ACWR <b>{latest.acwr}</b> • Band: <b>{latest.band}</b>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Acute: {latest.acute} • Chronic: {latest.chronic} • Load: {latest.load}
          </div>
        </div>
      )}

      <LineSVG data={trend} />

      <div style={{ fontSize: 12, marginTop: 10, opacity: 0.75 }}>
        Bands: under &lt; 0.8 • optimal 0.8–1.3 • caution 1.3–1.5 • high &gt; 1.5
      </div>
    </div>
  );
}

export default AcwrEwmaChart;
