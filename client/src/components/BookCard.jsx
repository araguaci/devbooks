import { useState } from 'react';

function BookCard({ book, completed, onToggle, onPdfError }) {
  const priorityClass = `priority-${book.priority?.toLowerCase() || 'p3'}`;
  const tags = book.tags || [book.category];
  const topic = book.topic || book.category;
  const [loading, setLoading] = useState(false);

  const fetchWithRetry = async (url, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
      const res = await fetch(url);
      if (res.ok) return res;
      if (i < retries) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Erro ${res.status} ao carregar PDF`);
    }
  };

  const handleOpenPdf = async (e) => {
    e.preventDefault();
    if (!book.url || loading) return;
    setLoading(true);
    try {
      const res = await fetchWithRetry(book.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      URL.revokeObjectURL(url);
    } catch (err) {
      onPdfError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

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
            onClick={handleOpenPdf}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-link ${loading ? 'loading' : ''}`}
            aria-label="Abrir livro"
            aria-busy={loading}
          >
            {loading ? '⏳ Carregando...' : '📖 Abrir'}
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
