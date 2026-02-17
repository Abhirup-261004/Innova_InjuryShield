function RiskGauge({ score }) {

  let color = "#22c55e";

  if (score > 70) color = "#ef4444";
  else if (score > 40) color = "#f59e0b";

  return (
    <div style={{ textAlign: "center" }}>
      <h3>Injury Risk Score</h3>
      <div
        style={{
          fontSize: "48px",
          fontWeight: "bold",
          color: color
        }}
      >
        {score}
      </div>
    </div>
  );
}

export default RiskGauge;
