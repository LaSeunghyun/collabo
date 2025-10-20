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
    console.log('🔐 [FRONTEND] 로그인 시도 시작:', { email, hasPassword: !!password, rememberMe });
    setIsLoading(true);
    setError('');

    try {
      console.log('📤 [FRONTEND] NextAuth signIn 호출 시작');
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      console.log('📥 [FRONTEND] NextAuth signIn 결과:', result);

      if (result?.error) {
        console.log('❌ [FRONTEND] NextAuth signIn 오류:', result.error);
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        return;
      }

      console.log('💾 [FRONTEND] 세션 저장소에 키 저장');
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(SESSION_PERSISTENCE_KEY, SESSION_PERSISTENCE_SEED);
      }

      console.log('🔍 [FRONTEND] 세션 확인 중');
      const session = await getSession();
      console.log('📋 [FRONTEND] 세션 정보:', { hasSession: !!session, userId: session?.user?.id });
      
      if (session) {
        console.log('✅ [FRONTEND] 로그인 성공, 홈페이지로 리다이렉트');
        router.push('/');
      } else {
        console.log('❌ [FRONTEND] 세션 없음, 로그인 실패');
        setError('세션 생성에 실패했습니다.');
      }
    } catch (error) {
      console.log('❌ [FRONTEND] 로그인 처리 중 오류:', error);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      console.log('🏁 [FRONTEND] 로그인 처리 완료');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">로그인</h2>
          <p className="mt-2 text-sm text-gray-300">아티스트 펀딩 협업 플랫폼에 오신 것을 환영합니다</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white shadow-sm placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="이메일을 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white shadow-sm placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="비밀번호를 입력하세요"
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
                <span>이 브라우저 기억하기</span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </div>
          </div>

          {error && <div className="text-center text-sm text-red-400">{error}</div>}

          <div className="text-center text-sm text-gray-300">
            계정이 없으신가요?{' '}
            <Link href="/auth/signup" className="font-medium text-purple-400 hover:text-purple-300">
              회원가입하기
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
