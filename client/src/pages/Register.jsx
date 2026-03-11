import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { register, loginWithGoogle } from '../api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await register(email, password, displayName);
      authLogin(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;
    setError('');
    setLoading(true);
    try {
      const data = await loginWithGoogle(credentialResponse.credential);
      authLogin(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>DevBooks</h1>
          <p>Crie sua conta e comece a evoluir</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="field">
            <label htmlFor="displayName">Nome (opcional)</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <>
            <div className="auth-divider">
              <span>ou continue com</span>
            </div>
            <div className="auth-google">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Erro ao fazer login com Google')}
                useOneTap={false}
                theme="filled_black"
                size="large"
                text="continue_with"
                shape="rectangular"
              />
            </div>
          </>
        )}
        <p className="auth-footer">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
      <footer className="auth-page-footer">
        <span>Desenvolvido por <a href="https://artesdosul.com/" target="_blank" rel="noopener noreferrer">@artesdosul</a></span>
      </footer>
    </div>
  );
}
