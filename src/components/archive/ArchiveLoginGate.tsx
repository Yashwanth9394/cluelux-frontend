import { Button } from '../ui/button';
import { GoogleSignInButton } from '../GoogleSignInButton';

interface Props {
  onLoggedIn: () => void;
  onBack: () => void;
}

export function ArchiveLoginGate({ onLoggedIn, onBack }: Props) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-md mx-auto px-4 py-2">
          <Button variant="ghost" onClick={onBack} className="-ml-2 h-11 px-3 text-sm">
            <span aria-hidden="true" className="mr-1">←</span> Today's puzzle
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-12 text-center">
        <div className="text-4xl mb-4">🔓</div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          You've used your free play
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-xs mx-auto">
          Sign in with Google to unlock unlimited archive puzzles, special words, and save your progress.
        </p>

        <div className="mt-8 flex justify-center">
          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <GoogleSignInButton
              source="archive_gate"
              size="large"
              onSuccess={() => onLoggedIn()}
            />
          ) : (
            <p className="text-sm text-slate-400">Google sign-in is being set up. Check back soon!</p>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Free · No credit card · Just your Google account
          </p>
        </div>
      </main>
    </div>
  );
}
