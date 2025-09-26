'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusCircle, Users, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const tabs = [
  { href: '/', icon: Home, key: 'navigation.home' },
  { href: '/projects', icon: Compass, key: 'navigation.explore' },
  { href: '/projects/new', icon: PlusCircle, key: 'navigation.launch' },
  { href: '/community', icon: Users, key: 'navigation.community' },
  { href: '/profile', icon: User, key: 'navigation.profile' }
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t border-white/10 bg-neutral-950/95 px-2 py-2 text-xs text-white/70 backdrop-blur lg:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-label={t(tab.key)}
            className={`flex flex-col items-center gap-1 transition ${
              isActive ? 'text-primary' : 'hover:text-white'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{t(tab.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
