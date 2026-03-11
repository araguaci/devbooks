export default function StatsCard({ label, value, sub, accent = 'orange' }) {
  return (
    <div className={`stats-card accent-${accent}`}>
      <span className="stats-label">{label}</span>
      <span className="stats-value">{value}</span>
      {sub && <span className="stats-sub">{sub}</span>}
    </div>
  );
}
