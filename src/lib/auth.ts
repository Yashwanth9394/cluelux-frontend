export interface User {
  name: string;
  email: string;
  picture: string;
}

const STORAGE_KEY = 'cluelux-user';

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
}

export function clearUser(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export function decodeJwt(token: string): Record<string, any> {
  const payload = token.split('.')[1];
  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
}
