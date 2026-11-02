import { useGoogleLogin } from '@react-oauth/google';
import { setUser, type User } from '../lib/auth';
import { track } from '../lib/analytics';
import { pullProgress, pushProgress } from '../services/syncService';
import { logError } from '../services/errorLog';

interface Props {
  source: string;
  onSuccess: (user: User) => void;
  size?: 'medium' | 'large';
}

const GOOGLE_G = (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export function GoogleSignInButton({ source, onSuccess, size = 'medium' }: Props) {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const info = await res.json();
        const u: User = {
          name: info.name || info.email,
          email: info.email,
          picture: info.picture || '',
        };
        setUser(u);
        track('user_login', { method: 'google', source });
        pullProgress().then(() => { pushProgress(); onSuccess(u); });
      } catch (e) {
        console.error('Failed to get user info:', e);
        logError('google-signin', 401, 'userinfo fetch/parse failed');
      }
    },
    onError: () => {
      console.error('Google login failed');
      logError('google-signin', 401, 'google onError');
    },
  });

  const isLarge = size === 'large';

  return (
    <button
      onClick={() => login()}
      className={`
        inline-flex items-center justify-center gap-2.5
        ${isLarge ? 'h-11 px-6 text-sm' : 'h-10 px-5 text-[13px]'}
        font-medium rounded-full
        bg-white dark:bg-slate-800
        text-gray-700 dark:text-gray-200
        border border-gray-300 dark:border-slate-600
        hover:bg-gray-50 dark:hover:bg-slate-700
        active:bg-gray-100 dark:active:bg-slate-600
        transition-colors
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500
      `}
    >
      {GOOGLE_G}
      <span>Sign in with Google</span>
    </button>
  );
}
