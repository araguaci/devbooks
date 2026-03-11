export default function ChallengeCard({ challenge }) {
  const progress = Math.min(100, (challenge.books_completed / challenge.target_books) * 100);

  return (
    <section className="challenge-card">
      <h2>Desafio da Semana</h2>
      <p className="challenge-desc">{challenge.description}</p>
      <div className="challenge-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="challenge-count">
          {challenge.books_completed}/{challenge.target_books} livros
        </span>
      </div>
      {challenge.completed && (
        <span className="challenge-done">+{challenge.xp_bonus} XP bônus!</span>
      )}
    </section>
  );
}
