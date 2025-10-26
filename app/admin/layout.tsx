import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth/guards';
import { ROLE_LABELS, UserRole } from '@/types/prisma';

// 동적 렌더링 강제 - 빌드 시 데이터베이스 접근 방지
export const dynamic = 'force-dynamic';

const navigationAnchors = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/projects', label: '프로젝트 검수' },
  { href: '/admin/partners', label: '파트너 승인' },
  { href: '/admin/reports', label: '신고 관리' },
  { href: '/admin/settlements', label: '정산 관리' }
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  let user;

  try {
    const result = await requireUser({
      roles: [UserRole.ADMIN],
      redirectTo: '/admin'
    });
    user = result.user;
  } catch (error) {
    // 인증 실패 시 로그인 페이지로 리다이렉트
    console.error('Admin layout authentication failed:', error);
    redirect('/auth/signin?callbackUrl=/admin');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24">
      <header className="pb-6 pt-12">
        <p className="text-xs uppercase tracking-[0.2em] text-primary/60">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">관리 센터</h1>
        <p className="mt-3 text-sm text-white/60">
          {user.name ? `${user.name}님, ` : ''}
          {ROLE_LABELS[user.role as UserRole]} 역할로 플랫폼의 품질과 안정성을 관리할 수 있습니다.
        </p>
        <nav className="mt-6 flex flex-wrap gap-3">
          {navigationAnchors.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/80 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <div className="space-y-10 pb-8">{children}</div>
    </div>
  );
}
