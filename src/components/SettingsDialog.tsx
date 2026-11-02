import { useState, useRef, useEffect } from 'react';
import { getThemePreference, setThemePreference, type ThemePreference } from '../lib/theme';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference());
  const panelRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  const toggle = () => {
    const next: ThemePreference = isDark ? 'light' : 'dark';
    setTheme(next);
    setThemePreference(next);
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
        className="fixed top-12 right-4 z-50 w-56 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl p-4"
      >
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Settings</h3>
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
      </div>
    </>
  );
}
