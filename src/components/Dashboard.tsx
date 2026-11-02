import { useState, useEffect } from 'react';

interface StatsData {
  generatedAt: string;
  widgets: { title: string; image: string }[];
  wordsScheduled: number;
  scheduleStart: string;
  scheduleEnd: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DIRECT_API_URL = API_BASE_URL.includes('cloudfront.net')
  ? 'https://qp5p347l9l.execute-api.us-east-1.amazonaws.com/prod'
  : API_BASE_URL;

export function Dashboard({ onBack, adminCode }: { onBack: () => void; adminCode: string }) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);

  // Check if already authenticated this session
  useEffect(() => {
    try {
      if (sessionStorage.getItem('cluelux-admin') === 'true') setAuthenticated(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetch(`${DIRECT_API_URL}/stats`, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [authenticated]);

  const handleLogin = () => {
    if (codeInput === adminCode) {
      setAuthenticated(true);
      try { sessionStorage.setItem('cluelux-admin', 'true'); } catch {}
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
        <div className="w-full max-w-xs">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">ClueLux Ops</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Enter admin code to continue</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-3">
            <input
              type="password"
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value); setCodeError(false); }}
              placeholder="Admin code"
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {codeError && <p className="text-xs text-red-400">Wrong code. Try again.</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Enter
            </button>
          </form>
          <button onClick={onBack} className="w-full text-center text-xs text-[var(--text-secondary)] mt-4 hover:text-[var(--text-primary)]">
            ← Back to game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ClueLux Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {stats ? `Updated ${new Date(stats.generatedAt).toLocaleString()}` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          ← Back to game
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          Failed to load stats: {error}
        </div>
      )}

      {stats && (
        <>
          {/* CloudWatch-rendered graphs (games, API, latency) */}
          {(stats.widgets ?? []).length === 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 text-sm text-[var(--text-secondary)] mb-6">
              No graphs returned. Game graphs fill in once people play; API graphs show traffic from the last 7 days.
            </div>
          ) : (
            <div className="space-y-5 mb-6">
              {(stats.widgets ?? []).map((w) => (
                <div key={w.title}>
                  <h2 className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-2">{w.title}</h2>
                  <div className="bg-white rounded-xl border border-[var(--border-primary)] overflow-hidden">
                    <img
                      src={`data:image/png;base64,${w.image}`}
                      alt={w.title}
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Schedule */}
          <Section title="Word Schedule">
            <div className="text-sm text-[var(--text-secondary)] space-y-1">
              <p><span className="font-medium text-[var(--text-primary)]">{stats.wordsScheduled}</span> words loaded</p>
              <p>Range: {formatDate(stats.scheduleStart)} → {formatDate(stats.scheduleEnd)}</p>
              {stats.scheduleEnd && (
                <p className="mt-2 text-amber-400">
                  {daysUntil(stats.scheduleEnd)} days of content remaining
                </p>
              )}
            </div>
          </Section>
        </>
      )}

      {/* Contact & Feedback — always visible */}
      <Section title="Contact & Feedback">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Have feedback, found a bug, or just want to say hi? We'd love to hear from you.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ContactCard
              icon="✉️"
              label="Email us"
              value="hello@cluelux.com"
              href="mailto:hello@cluelux.com"
            />
            <ContactCard
              icon="🐛"
              label="Report a bug"
              value="hello@cluelux.com"
              href="mailto:hello@cluelux.com?subject=Bug%20Report%20-%20ClueLux"
            />
            <ContactCard
              icon="💡"
              label="Feature request"
              value="hello@cluelux.com"
              href="mailto:hello@cluelux.com?subject=Feature%20Request%20-%20ClueLux"
            />
            <ContactCard
              icon="📣"
              label="Follow us"
              value="@playcluelux"
              href="https://instagram.com/playcluelux"
              external
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)] opacity-60 pt-2">
            ClueLux · A daily word puzzle · Built with care
          </p>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-3">{title}</h2>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
        {children}
      </div>
    </div>
  );
}

function ContactCard({ icon, label, value, href, external }: { icon: string; label: string; value: string; href: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-indigo-500/30 transition-colors group"
    >
      <span className="text-lg">{icon}</span>
      <div>
        <div className="text-xs font-medium text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">{label}</div>
        <div className="text-xs text-[var(--text-secondary)]">{value}</div>
      </div>
    </a>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysUntil(dateStr: string): number {
  const end = new Date(dateStr + 'T23:59:59');
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}
