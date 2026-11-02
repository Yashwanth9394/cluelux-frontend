import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { grantAccess } from '../../lib/archiveStore';

interface AccessGateProps {
  onGranted: () => void;
  onBack: () => void;
}

// Test-build stand-in for sign-in. The code lives in an env value, never in source.
// Anything shipped to a browser is visible to that browser, so this only gates
// the unfinished feature - it is not security. Real sign-in is Google, later.
const TEST_CODE = (import.meta.env.VITE_TEST_ACCESS_CODE as string | undefined)?.trim();

export function AccessGate({ onGranted, onBack }: AccessGateProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!TEST_CODE) {
      setError('Sign-in is not set up in this build.');
      return;
    }
    if (code.trim() !== TEST_CODE) {
      setError('That code is not right. Check it and try again.');
      return;
    }
    grantAccess('test');
    onGranted();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-md mx-auto px-4 py-2">
          <Button variant="ghost" onClick={onBack} className="-ml-2 h-11 px-3 text-sm">
            <span aria-hidden="true" className="mr-1">←</span> Today's puzzle
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-8">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Cluelux archive</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Play more puzzles
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Sign in to play the last three days and a daily set of special puzzles.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-3" noValidate>
          <label htmlFor="access-code" className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
            Test code
          </label>
          <Input
            id="access-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError('');
            }}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'access-code-error' : undefined}
            className="h-11"
          />
          <p id="access-code-error" role="alert" className="min-h-5 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
          <Button type="submit" className="w-full h-11 bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800">Continue</Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-slate-400" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          or
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <Button variant="outline" disabled className="w-full h-11">
          Continue with Google
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Coming soon
          </span>
        </Button>
        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          Signing in with Google will save your progress and give you five special puzzles a day.
        </p>
      </main>
    </div>
  );
}
