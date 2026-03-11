import { useState, useEffect, useMemo } from 'react';
import {
  getBooks,
  getProgress,
  getStats,
  getLeaderboard,
  getCurrentChallenge,
  getRankingLegend,
  toggleProgress,
} from '../api';
import BookCard from '../components/BookCard';
import StatsCard from '../components/StatsCard';
import ChallengeCard from '../components/ChallengeCard';
import Leaderboard from '../components/Leaderboard';

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 };

export default function Dashboard() {
  const [books, setBooks] = useState([]);
  const [progress, setProgress] = useState([]);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [legend, setLegend] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [booksRes, progressRes, statsRes, leaderRes, challengeRes, legendRes] = await Promise.all([
        getBooks(),
        getProgress(),
        getStats(),
        getLeaderboard(),
        getCurrentChallenge(),
        getRankingLegend(),
      ]);
      setBooks(booksRes);
      setProgress(progressRes);
      setStats(statsRes);
      setLeaderboard(leaderRes);
      setChallenge(challengeRes);
      setLegend(legendRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const completedIds = useMemo(() => new Set(progress.map((p) => p.book_id)), [progress]);

  const categories = useMemo(() => {
    const set = new Set(books.map((b) => b.category));
    return [...set].sort();
  }, [books]);

  const topics = useMemo(() => {
    const set = new Set(books.map((b) => b.topic).filter(Boolean));
    return [...set].sort();
  }, [books]);

  const allTags = useMemo(() => {
    const set = new Set(books.flatMap((b) => b.tags || []));
    return [...set].sort();
  }, [books]);

  const filteredBooks = useMemo(() => {
    let list = [...books];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          (b.topic || '').toLowerCase().includes(q) ||
          (b.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          b.slug.toLowerCase().includes(q)
      );
    }
    if (filterPriority) list = list.filter((b) => b.priority === filterPriority);
    if (filterCategory) list = list.filter((b) => b.category === filterCategory);
    if (filterTopic) list = list.filter((b) => b.topic === filterTopic);
    if (filterTag) list = list.filter((b) => (b.tags || []).includes(filterTag));
    list.sort((a, b) => (a.rank || 999) - (b.rank || 999) || a.title.localeCompare(b.title));
    return list;
  }, [books, search, filterPriority, filterCategory, filterTopic, filterTag]);

  const handleToggle = async (bookId) => {
    try {
      await toggleProgress(bookId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && !stats) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Carregando sua jornada...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {error && (
        <div className="toast toast-error" role="alert">
          {error}
          <button type="button" onClick={() => setError('')} aria-label="Fechar">×</button>
        </div>
      )}

      <section className="hero">
        <h1>Sua Jornada de Leitura</h1>
        <p>Marque os livros que você concluiu e acumule XP, badges e streaks.</p>
      </section>

      {stats && (
        <section className="stats-grid">
          <StatsCard
            label="XP Total"
            value={stats.total_xp}
            sub={`Nível ${stats.level}`}
            accent="orange"
          />
          <StatsCard
            label="Streak"
            value={stats.current_streak}
            sub={`Recorde: ${stats.longest_streak} dias`}
            accent="cyan"
          />
          <StatsCard
            label="Livros"
            value={stats.books_completed}
            sub={`de ${books.length}`}
            accent="green"
          />
        </section>
      )}

      {stats?.badges?.length > 0 && (
        <section className="badges-section">
          <h2>Conquistas</h2>
          <div className="badges-list">
            {stats.badges.map((b) => (
              <div key={b.slug} className="badge-item" title={b.description}>
                <span className="badge-icon">🏆</span>
                <span className="badge-name">{b.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {challenge && (
        <ChallengeCard challenge={challenge} />
      )}

      {Object.keys(legend).length > 0 && (
        <section className="ranking-legend">
          <h2>Legenda do Ranking</h2>
          <div className="legend-grid">
            {Object.entries(legend).map(([key, val]) => (
              <div key={key} className={`legend-item priority-${key.toLowerCase()}`}>
                <span className="legend-priority">{key}</span>
                <span className="legend-label">{val.label}</span>
                <span className="legend-desc">{val.desc}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="books-section">
        <div className="books-header">
          <h2>Biblioteca</h2>
          <div className="filters">
            <input
              type="search"
              placeholder="Buscar livros..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
              aria-label="Buscar livros"
            />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
              aria-label="Filtrar por prioridade"
            >
              <option value="">Todas prioridades</option>
              <option value="P0">P0</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
              aria-label="Filtrar por categoria"
            >
              <option value="">Todas categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="filter-select"
              aria-label="Filtrar por tópico"
            >
              <option value="">Todos tópicos</option>
              {topics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="filter-select"
              aria-label="Filtrar por tag"
            >
              <option value="">Todas tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="books-grid">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              completed={completedIds.has(book.id)}
              onToggle={() => handleToggle(book.id)}
              onPdfError={setError}
            />
          ))}
        </div>
        {filteredBooks.length === 0 && (
          <p className="empty-state">Nenhum livro encontrado.</p>
        )}
      </section>

      <section className="leaderboard-section">
        <h2>Ranking</h2>
        <Leaderboard items={leaderboard} />
      </section>
    </div>
  );
}
