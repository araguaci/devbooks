import { Link } from 'react-router-dom';

const features = [
  {
    icon: '📚',
    title: 'Biblioteca Curada',
    description: 'Mais de 90 livros técnicos selecionados, organizados por prioridade e categoria para sua evolução profissional.',
  },
  {
    icon: '⚡',
    title: 'Sistema de XP e Níveis',
    description: 'Ganhe experiência ao concluir livros, suba de nível e mantenha streaks para bônus extras.',
  },
  {
    icon: '🏆',
    title: 'Conquistas e Badges',
    description: 'Desbloqueie badges ao atingir metas: livros concluídos, sequências de leitura e desafios especiais.',
  },
  {
    icon: '📊',
    title: 'Ranking e Desafios',
    description: 'Compare seu progresso com outros leitores e participe de desafios semanais com recompensas em XP.',
  },
];

const frontendSkills = [
  {
    icon: '⚛️',
    title: 'React & Vite',
    description: 'Interface moderna construída com React 18 e Vite para performance e experiência fluida em qualquer dispositivo.',
  },
  {
    icon: '🎨',
    title: 'Design Responsivo',
    description: 'Layout adaptável e acessível, com paleta dark mode e componentes otimizados para mobile e desktop.',
  },
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-nav">
          <span className="landing-logo">DevBooks</span>
          <div className="landing-nav-links">
            <Link to="/login" className="landing-nav-link">Entrar</Link>
            <Link to="/register" className="landing-btn landing-btn-primary">Cadastrar</Link>
          </div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-bg" aria-hidden="true" />
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            Sua jornada de leitura técnica, <span className="landing-hero-accent">gamificada</span>
          </h1>
          <p className="landing-hero-subtitle">
            Acompanhe seu progresso, ganhe XP, desbloqueie conquistas e evolua como desenvolvedor com uma biblioteca curada de livros essenciais.
          </p>
          <div className="landing-hero-cta">
            <Link to="/register" className="landing-btn landing-btn-hero">
              Começar agora
            </Link>
            <Link to="/login" className="landing-btn landing-btn-outline">
              Já tenho conta
            </Link>
          </div>
        </div>
        <div className="landing-hero-image-wrap">
          <img
            src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80"
            alt="Livros técnicos e desenvolvimento"
            className="landing-hero-image"
          />
        </div>
      </section>

      <section className="landing-features">
        <h2 className="landing-features-title">Recursos do DevBooks</h2>
        <div className="landing-features-grid">
          {features.map((f, i) => (
            <article key={i} className="landing-feature-card">
              <span className="landing-feature-icon">{f.icon}</span>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-desc">{f.description}</p>
            </article>
          ))}
        </div>
        <h2 className="landing-features-title landing-features-title-sub">Frontend Skills</h2>
        <div className="landing-features-grid landing-features-grid-sm">
          {frontendSkills.map((f, i) => (
            <article key={`fs-${i}`} className="landing-feature-card">
              <span className="landing-feature-icon">{f.icon}</span>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-desc">{f.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta-content">
          <h2 className="landing-cta-title">Pronto para evoluir?</h2>
          <p className="landing-cta-subtitle">Cadastre-se gratuitamente e comece sua jornada hoje.</p>
          <Link to="/register" className="landing-btn landing-btn-primary landing-btn-lg">
            Criar conta gratuita
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <p>
          <a href="https://github.com/araguaci/devbooks/issues/new?template=sugestao-livro.md" target="_blank" rel="noopener noreferrer">
            Sugerir livro
          </a>
          {' · '}
          Desenvolvido por{' '}
          <a href="https://artesdosul.com/" target="_blank" rel="noopener noreferrer">
            @artesdosul
          </a>
        </p>
      </footer>
    </div>
  );
}
