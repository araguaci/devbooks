function BookCard({ book, completed, onToggle }) {
  const priorityClass = `priority-${book.priority?.toLowerCase() || 'p3'}`;
  const tags = book.tags || [book.category];
  const topic = book.topic || book.category;

  return (
    <article className={`book-card ${completed ? 'completed' : ''}`} title={book.motivo || undefined}>
      <div className="book-card-header">
        <span className={`priority-badge ${priorityClass}`}>{book.priority}</span>
        {book.rank < 999 && <span className="book-rank">#{book.rank}</span>}
        <span className="book-xp">{book.xp_value} XP</span>
      </div>
      <h3 className="book-title">{book.title}</h3>
      <p className="book-topic">{topic}</p>
      {tags?.length > 0 && (
        <div className="book-tags">
          {tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}
      <div className="book-card-actions">
        {book.url && (
          <a
            href={book.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-link"
            aria-label="Abrir livro"
          >
            📖 Abrir
          </a>
        )}
        <button
          type="button"
          className={`btn btn-toggle ${completed ? 'active' : ''}`}
          onClick={onToggle}
          aria-pressed={completed}
          aria-label={completed ? 'Desmarcar livro' : 'Marcar como lido'}
        >
          {completed ? '✓ Lido' : 'Marcar lido'}
        </button>
      </div>
    </article>
  );
}

export default BookCard;
