'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">프로필</h1>
        <p className="mt-2 text-sm text-white/60">로그인된 사용자의 정보와 권한을 확인하세요</p>
      </header>

      <div className="mt-8 space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">기본 정보</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">이름</span>
              <span className="text-sm text-white">{user.name || '미설정'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">이메일</span>
              <span className="text-sm text-white">{user.email || '미설정'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">역할</span>
              <span className="text-sm text-white">{user.role}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">계정 관리</h2>
          <div className="space-y-4">
            <button 
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}