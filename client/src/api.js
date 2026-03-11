const API = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function headers(includeAuth = false) {
  const h = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const t = getToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

export async function register(email, password, displayName) {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, password, displayName: displayName || null }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar');
  return data;
}

export async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');
  return data;
}

export async function getMe() {
  const res = await fetch(`${API}/me`, { headers: headers(true) });
  if (res.status === 401) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao carregar usuário');
  return data;
}

export async function getBooks() {
  const res = await fetch(`${API}/books`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao carregar livros');
  return data;
}

export async function getRankingLegend() {
  const res = await fetch(`${API}/ranking/legend`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return {};
  return data;
}

export async function getProgress() {
  const res = await fetch(`${API}/progress`, { headers: headers(true) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao carregar progresso');
  return data;
}

export async function toggleProgress(bookId) {
  const res = await fetch(`${API}/progress/toggle/${bookId}`, {
    method: 'POST',
    headers: headers(true),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao atualizar progresso');
  return data;
}

export async function getStats() {
  const res = await fetch(`${API}/stats`, { headers: headers(true) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao carregar estatísticas');
  return data;
}

export async function getLeaderboard(limit = 20) {
  const res = await fetch(`${API}/leaderboard?limit=${limit}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao carregar ranking');
  return data;
}

export async function getBadges() {
  const res = await fetch(`${API}/badges`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao carregar badges');
  return data;
}

export async function getCurrentChallenge() {
  const res = await fetch(`${API}/challenges/current`, { headers: headers(true) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao carregar desafio');
  return data;
}
