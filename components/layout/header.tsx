'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, Bell, User } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';

import { useUIStore } from '@/lib/stores/use-ui-store';

const navItems = [
  { href: '/', key: 'navigation.home' },
  { href: '/projects', key: 'navigation.projects' },
  { href: '/partners', key: 'navigation.partners' },
  { href: '/community', key: 'navigation.community' },
  { href: '/help', key: 'navigation.help' }
];

export function Header() {
  const pathname = usePathname();
  const toggleMobileNav = useUIStore((state) => state.toggleMobileNav);
  const { t } = useTranslation();
  const { data: session, status } = useSession();

  const role = session?.user?.role ? String(session.user.role).toUpperCase() : null;
  const roleLabels: Record<string, string> = {
    CREATOR: '크리에이터',
    PARTICIPANT: '참여자',
    PARTNER: '파트너',
    ADMIN: '관리자'
  };

  const canLaunchProject = role === 'CREATOR' || role === 'ADMIN';
  const canManagePartners = role === 'PARTNER' || role === 'ADMIN';

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Toggle navigation"
            className="inline-flex lg:hidden"
            onClick={toggleMobileNav}
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="text-lg font-semibold">
            Collaborium
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-primary ${
                  pathname === item.href ? 'text-primary' : 'text-white/70'
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
            <Link href="/projects?tab=store" className="transition-colors hover:text-primary">
              {t('navigation.store')}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 lg:flex">
            <Search className="h-4 w-4" aria-hidden="true" />
            <input
              type="search"
              aria-label={t('actions.search')}
              placeholder={t('actions.search') ?? 'Search'}
              className="w-52 bg-transparent text-sm outline-none placeholder:text-white/40"
            />
          </div>
          <button type="button" aria-label="Notifications" className="hidden lg:inline-flex">
            <Bell className="h-5 w-5" />
          </button>
          {role ? (
            <span className="hidden items-center rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/80 lg:inline-flex">
              {roleLabels[role] ?? role}
            </span>
          ) : null}
          {canLaunchProject ? (
            <Link
              href="/projects/new"
              className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 lg:inline-flex"
            >
              {t('navigation.launch')}
            </Link>
          ) : null}
          {canManagePartners ? (
            <Link
              href="/partners"
              className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:text-white lg:inline-flex"
            >
              파트너 허브
            </Link>
          ) : null}
          <button
            type="button"
            aria-label="Account"
            className="hidden rounded-full border border-white/10 p-1.5 transition hover:border-white/30 lg:inline-flex"
            onClick={() => (status === 'authenticated' ? signOut({ callbackUrl: '/' }) : signIn())}
          >
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
