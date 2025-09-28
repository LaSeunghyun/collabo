'use client';

import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, Mail, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserProfile {
  createdAt?: string;
  name?: string | null;
  email?: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  // 사용자 프로필 정보 가져오기
  useEffect(() => {
    if (session?.user?.id) {
      setIsLoadingProfile(true);
      fetch(`/api/users/${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          setUserProfile(data);
        })
        .catch(err => {
          console.error('Failed to fetch user profile:', err);
        })
        .finally(() => {
          setIsLoadingProfile(false);
        });
    }
  }, [session?.user?.id]);

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20">
        <header className="pt-6">
          <h1 className="text-3xl font-semibold text-white">내 정보</h1>
          <p className="mt-2 text-sm text-white/60">로딩 중...</p>
        </header>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20">
        <header className="pt-6">
          <h1 className="text-3xl font-semibold text-white">내 정보</h1>
          <p className="mt-2 text-sm text-white/60">로그인이 필요합니다.</p>
        </header>
        <section className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/70">로그인 후 마이페이지를 이용할 수 있습니다.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">내 정보</h1>
        <p className="mt-2 text-sm text-white/60">로그인 후 팬/크리에이터 권한에 따라 대시보드가 구성됩니다.</p>
      </header>

      {/* 사용자 정보 섹션 */}
      <section className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">
              {session?.user?.name || '사용자'}
            </h2>
            <p className="text-sm text-white/60">
              {session?.user?.email || '이메일 정보 없음'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Mail className="h-5 w-5 text-white/60" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                이메일
              </p>
              <p className="text-sm text-white/80">
                {session?.user?.email || '정보 없음'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Calendar className="h-5 w-5 text-white/60" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                가입일
              </p>
              <p className="text-sm text-white/80">
                {isLoadingProfile
                  ? '로딩 중...'
                  : userProfile?.createdAt
                    ? new Date(userProfile.createdAt).toLocaleDateString('ko-KR')
                    : '정보 없음'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 로그아웃 버튼 섹션 */}
      <section className="mt-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-red-400 transition hover:border-red-500/40 hover:bg-red-500/20"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-semibold">로그아웃</span>
        </button>
      </section>

      {/* 추가 정보 섹션 */}
      <section className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">계정 정보</h3>
        <p className="text-sm text-white/70">
          현재 데모 계정으로 로그인하여 기본 정보를 확인할 수 있습니다.
        </p>
        <div className="mt-4 space-y-2 text-xs text-white/50">
          <p>• 팬/크리에이터 권한에 따라 추가 기능이 제공됩니다.</p>
          <p>• 프로젝트 생성 및 관리 기능을 이용하려면 크리에이터 인증이 필요합니다.</p>
        </div>
      </section>
    </div>
  );
}
