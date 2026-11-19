export function PrivacyPolicy({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold tracking-tight">ClueLux</span>
          <button
            onClick={onBack}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            ← Back to game
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: November 1, 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">What ClueLux is</h2>
            <p>
              ClueLux is a free daily word puzzle game. You can play without creating an account.
              If you choose to sign in with Google, you get additional features like progress sync
              across devices and access to the archive.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">What we collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>If you play without signing in:</strong> anonymous usage analytics
                (pages visited, games played, buttons clicked). We use PostHog for this.
                No personal information is collected. We don't use cookies for tracking.
              </li>
              <li>
                <strong>If you sign in with Google:</strong> your name, email address, and
                profile picture — only what Google provides through their standard sign-in.
                We store this to identify your account and sync your game progress.
              </li>
              <li>
                <strong>Game data:</strong> your stats (wins, streaks, guess distribution)
                are stored locally on your device. If you sign in, they're also stored on
                our servers so you can access them from other devices.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">What we don't collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Payment information (ClueLux is free)</li>
              <li>Location data</li>
              <li>Contacts or phone data</li>
              <li>Passwords (Google handles authentication directly)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">How we use your data</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To save and sync your game progress across devices</li>
              <li>To understand how people play so we can improve the game</li>
              <li>To show aggregate stats (e.g., "423 people played today")</li>
            </ul>
            <p className="mt-2">We don't sell your data. We don't run ads. We don't share your information with third parties for marketing.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Third-party services</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Google Sign-In</strong> — for authentication. Google's privacy policy applies to their sign-in service.</li>
              <li><strong>PostHog</strong> — for anonymous product analytics. Data is processed in the US.</li>
              <li><strong>AWS</strong> — for hosting and data storage. Data is stored in the US (us-east-1).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Your choices</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You can play without signing in — no account required</li>
              <li>You can sign out at any time from Settings</li>
              <li>To delete your data, email us and we'll remove it within 7 days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Contact</h2>
            <p>
              Questions about your data? Email us at{' '}
              <a href="mailto:hello@cluelux.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                hello@cluelux.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
