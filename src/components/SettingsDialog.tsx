import { useState, useRef, useEffect } from 'react';
import { getThemePreference, setThemePreference, type ThemePreference } from '../lib/theme';
import { getUser, setUser, clearUser, decodeJwt, type User } from '../lib/auth';
import { track } from '../lib/analytics';
import { GoogleLogin } from '@react-oauth/google';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference());
  const [user, setUserState] = useState<User | null>(getUser);
  const panelRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  const toggle = () => {
    const next: ThemePreference = isDark ? 'light' : 'dark';
    setTheme(next);
    setThemePreference(next);
  };

  const handleGoogleSuccess = (response: any) => {
    try {
      const decoded = decodeJwt(response.credential);
      const u: User = {
        name: decoded.name || decoded.email,
        email: decoded.email,
        picture: decoded.picture || '',
      };
      setUser(u);
      setUserState(u);
      track('user_login', { method: 'google', source: 'settings' });
    } catch (e) {
      console.error('Google login decode failed:', e);
    }
  };

  const handleSignOut = () => {
    clearUser();
    setUserState(null);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} />
      <div
        ref={panelRef}
        className="fixed top-12 right-4 z-50 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl p-4 space-y-4"
      >
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Settings</h3>

        {/* Dark mode toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
          <button
            onClick={toggle}
            role="switch"
            aria-checked={isDark}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
              isDark ? 'bg-amber-500' : 'bg-gray-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 dark:bg-slate-700" />

        {/* Account section */}
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img src={user.picture} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors text-left"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Sign in to save your progress</p>
            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.error('Google login failed')}
                size="medium"
                width="220"
                theme={isDark ? 'filled_black' : 'outline'}
                shape="pill"
              />
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500">Google sign-in not configured</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
