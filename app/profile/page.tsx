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

  // ?¬ìš©???„ë¡œ???•ë³´ ê°€?¸ì˜¤ê¸?
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
          <h1 className="text-3xl font-semibold text-white">???•ë³´</h1>
          <p className="mt-2 text-sm text-white/60">ë¡œë”© ì¤?..</p>
        </header>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20">
        <header className="pt-6">
          <h1 className="text-3xl font-semibold text-white">???•ë³´</h1>
          <p className="mt-2 text-sm text-white/60">ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??</p>
        </header>
        <section className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/70">ë¡œê·¸????ë§ˆì´?˜ì´ì§€ë¥??´ìš©?????ˆìŠµ?ˆë‹¤.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">???•ë³´</h1>
        <p className="mt-2 text-sm text-white/60">ë¡œê·¸???????¬ë¦¬?ì´??ê¶Œí•œ???°ë¼ ?€?œë³´?œê? êµ¬ì„±?©ë‹ˆ??</p>
      </header>

      {/* ?¬ìš©???•ë³´ ?¹ì…˜ */}
      <section className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">
              {session?.user?.name || '?¬ìš©??}
            </h2>
            <p className="text-sm text-white/60">
              {session?.user?.email || '?´ë©”???•ë³´ ?†ìŒ'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Mail className="h-5 w-5 text-white/60" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                ?´ë©”??
              </p>
              <p className="text-sm text-white/80">
                {session?.user?.email || '?•ë³´ ?†ìŒ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Calendar className="h-5 w-5 text-white/60" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                ê°€?…ì¼
              </p>
              <p className="text-sm text-white/80">
                {isLoadingProfile
                  ? 'ë¡œë”© ì¤?..'
                  : userProfile?.createdAt
                    ? new Date(userProfile.createdAt).toLocaleDateString('ko-KR')
                    : '?•ë³´ ?†ìŒ'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ë¡œê·¸?„ì›ƒ ë²„íŠ¼ ?¹ì…˜ */}
      <section className="mt-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-red-400 transition hover:border-red-500/40 hover:bg-red-500/20"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-semibold">ë¡œê·¸?„ì›ƒ</span>
        </button>
      </section>

      {/* ì¶”ê? ?•ë³´ ?¹ì…˜ */}
      <section className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">ê³„ì • ?•ë³´</h3>
        <p className="text-sm text-white/70">
          ?„ì¬ ?°ëª¨ ê³„ì •?¼ë¡œ ë¡œê·¸?¸í•˜??ê¸°ë³¸ ?•ë³´ë¥??•ì¸?????ˆìŠµ?ˆë‹¤.
        </p>
        <div className="mt-4 space-y-2 text-xs text-white/50">
          <p>?????¬ë¦¬?ì´??ê¶Œí•œ???°ë¼ ì¶”ê? ê¸°ëŠ¥???œê³µ?©ë‹ˆ??</p>
          <p>???„ë¡œ?íŠ¸ ?ì„± ë°?ê´€ë¦?ê¸°ëŠ¥???´ìš©?˜ë ¤ë©??¬ë¦¬?ì´???¸ì¦???„ìš”?©ë‹ˆ??</p>
        </div>
      </section>
    </div>
  );
}
