import type { ReactNode } from 'react';

import { requireUser } from '@/lib/auth/guards';
import { ROLE_LABELS, UserRole } from '@/types/auth';

const navigationAnchors = [
  { href: '#overview', label: '?�황 ?�약' },
  { href: '#profile', label: '?�로??관�? },
  { href: '#insights', label: '추천 ?�사?�트' }
];

export default async function PartnerDashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const { user } = await requireUser({
    roles: [UserRole.PARTNER, UserRole.ADMIN],
    permissions: ['partner:manage'],
    redirectTo: '/partners/dashboard'
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20">
      <header className="pb-6 pt-12">
        <p className="text-xs uppercase tracking-[0.2em] text-primary/60">Partner</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">?�트???�브</h1>
        <p className="mt-3 text-sm text-white/60">
          {user.name ? `${user.name}?? ` : ''}
          {ROLE_LABELS[user.role]} 권한?�로 ?�업 ?�청�??�로???�황??빠르�??�인?�세??
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
