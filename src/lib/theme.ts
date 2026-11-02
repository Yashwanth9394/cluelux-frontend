/**
 * Theme preference - light, dark, or follow the system.
 * The same key is read by the inline script in index.html, which applies the
 * class before first paint so a saved dark theme never flashes light.
 */

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_KEY = 'cluelux_theme';

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies) - fall through.
  }
  return 'system';
}

function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(preference: ThemePreference): void {
  const dark = preference === 'dark' || (preference === 'system' && systemPrefersDark());
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
}

export function setThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, preference);
  } catch {
    // The theme still applies for this visit even if it can't be remembered.
  }
  applyTheme(preference);
}

/** Re-apply when the OS theme changes, but only while the preference is "system". */
export function watchSystemTheme(): () => void {
  if (typeof window.matchMedia !== 'function') return () => {};
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (getThemePreference() === 'system') applyTheme('system');
  };
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
