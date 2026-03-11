export default function Leaderboard({ items }) {
  if (!items?.length) return <p className="empty-state">Nenhum participante ainda.</p>;

  return (
    <div className="leaderboard">
      {items.map((u, i) => (
        <div key={u.id} className="leaderboard-row">
          <span className="rank">#{i + 1}</span>
          <span className="name">{u.display_name || u.email?.split('@')[0] || 'Anônimo'}</span>
          <span className="xp">{u.total_xp} XP</span>
          <span className="streak">{u.current_streak} 🔥</span>
        </div>
      ))}
    </div>
  );
}
