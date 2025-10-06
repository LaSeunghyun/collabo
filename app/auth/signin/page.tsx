'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { SESSION_PERSISTENCE_KEY, SESSION_PERSISTENCE_SEED } from '@/lib/auth/session-persistence';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          rememberMe,
          client: 'web'
        })
      });

      if (!loginResponse.ok) {
        const payload = await loginResponse.json().catch(() => ({ error: 'ë¡œê·¸?¸ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.' }));
        setError(payload.error ?? 'ë¡œê·¸?¸ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.');
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError('?´ë©”???ëŠ” ë¹„ë?ë²ˆí˜¸ê°€ ?¬ë°”ë¥´ì? ?ŠìŠµ?ˆë‹¤.');
        return;
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(SESSION_PERSISTENCE_KEY, SESSION_PERSISTENCE_SEED);
      }

      const session = await getSession();
      if (session) {
        router.push('/');
      }
    } catch (error) {
      console.error(error);
      setError('ë¡œê·¸??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">ë¡œê·¸??/h2>
          <p className="mt-2 text-sm text-gray-300">?„í‹°?¤íŠ¸ ?€???‘ì—… ?Œë«?¼ì— ?¤ì‹  ê²ƒì„ ?˜ì˜?©ë‹ˆ??/p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                ?´ë©”??
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white shadow-sm placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="?´ë©”?¼ì„ ?…ë ¥?˜ì„¸??
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                ë¹„ë?ë²ˆí˜¸
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white shadow-sm placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="ë¹„ë?ë²ˆí˜¸ë¥??…ë ¥?˜ì„¸??
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm text-gray-300">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                />
                <span>??ë¸Œë¼?°ì? ê¸°ì–µ?˜ê¸°</span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'ë¡œê·¸??ì¤?..' : 'ë¡œê·¸??}
              </button>
            </div>
          </div>

          {error && <div className="text-center text-sm text-red-400">{error}</div>}

          <div className="text-center text-sm text-gray-300">
            ê³„ì •???†ìœ¼? ê???{' '}
            <Link href="/auth/signup" className="font-medium text-purple-400 hover:text-purple-300">
              ?Œì›ê°€?…í•˜ê¸?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
