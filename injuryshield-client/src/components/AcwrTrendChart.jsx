import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from "recharts";

function AcwrTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <p>No trend data available</p>;
  }

  return (
    <div style={{ width: "100%", height: 250 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 2]} />
          <Tooltip />

          <ReferenceLine y={0.8} stroke="#22c55e" strokeDasharray="3 3" />
          <ReferenceLine y={1.3} stroke="#f59e0b" strokeDasharray="3 3" />
          <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="3 3" />

          <Line type="monotone" dataKey="acwr" stroke="#22c55e" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AcwrTrendChart;
