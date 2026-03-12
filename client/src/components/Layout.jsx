import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">
          <span className="logo-icon">📚</span>
          <span>DevBooks</span>
        </Link>
        <nav className="nav">
          <span className="user-email">{user?.display_name || user?.email}</span>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Sair
          </button>
        </nav>
      </header>
      <main className="main">
        {children || <Outlet />}
      </main>
      <footer className="footer">
        <span>
          <a href="https://github.com/araguaci/devbooks/issues/new?template=sugestao-livro.md" target="_blank" rel="noopener noreferrer">Sugerir livro</a>
          {' · '}
          Desenvolvido por <a href="https://artesdosul.com/" target="_blank" rel="noopener noreferrer">@artesdosul</a>
        </span>
      </footer>
    </div>
  );
}
