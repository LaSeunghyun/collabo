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

  // ?�용???�로???�보 가?�오�?
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
          <h1 className="text-3xl font-semibold text-white">???�보</h1>
          <p className="mt-2 text-sm text-white/60">로딩 �?..</p>
        </header>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20">
        <header className="pt-6">
          <h1 className="text-3xl font-semibold text-white">???�보</h1>
          <p className="mt-2 text-sm text-white/60">로그?�이 ?�요?�니??</p>
        </header>
        <section className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/70">로그????마이?�이지�??�용?????�습?�다.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">???�보</h1>
        <p className="mt-2 text-sm text-white/60">로그???????�리?�이??권한???�라 ?�?�보?��? 구성?�니??</p>
      </header>

      {/* ?�용???�보 ?�션 */}
      <section className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">
              {session?.user?.name || '?�용??}
            </h2>
            <p className="text-sm text-white/60">
              {session?.user?.email || '?�메???�보 ?�음'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Mail className="h-5 w-5 text-white/60" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                ?�메??
              </p>
              <p className="text-sm text-white/80">
                {session?.user?.email || '?�보 ?�음'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Calendar className="h-5 w-5 text-white/60" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                가?�일
              </p>
              <p className="text-sm text-white/80">
                {isLoadingProfile
                  ? '로딩 �?..'
                  : userProfile?.createdAt
                    ? new Date(userProfile.createdAt).toLocaleDateString('ko-KR')
                    : '?�보 ?�음'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 로그?�웃 버튼 ?�션 */}
      <section className="mt-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-red-400 transition hover:border-red-500/40 hover:bg-red-500/20"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-semibold">로그?�웃</span>
        </button>
      </section>

      {/* 추�? ?�보 ?�션 */}
      <section className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">계정 ?�보</h3>
        <p className="text-sm text-white/70">
          ?�재 ?�모 계정?�로 로그?�하??기본 ?�보�??�인?????�습?�다.
        </p>
        <div className="mt-4 space-y-2 text-xs text-white/50">
          <p>?????�리?�이??권한???�라 추�? 기능???�공?�니??</p>
          <p>???�로?�트 ?�성 �?관�?기능???�용?�려�??�리?�이???�증???�요?�니??</p>
        </div>
      </section>
    </div>
  );
}
