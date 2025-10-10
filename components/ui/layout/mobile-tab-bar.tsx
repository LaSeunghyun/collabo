'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { canAccessRoute } from '@/lib/auth/role-guards';
// import { useAnnouncementUnreadCount } from '@/hooks/use-announcement-read';

const baseTabs = [
  { href: '/', label: '??, icon: '?è†' },
  { href: '/projects', label: '?ÑÎ°ú?ùÌä∏', icon: '?éµ' },
  { href: '/artists', label: '?ÑÌã∞?§Ìä∏', icon: '?ë§' },
  { href: '/partners', label: '?åÌä∏??, icon: '?§ù' },
  { href: '/community', label: 'Ïª§Î??àÌã∞', icon: '?í¨' }
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  // const { data: unreadCount = 0 } = useAnnouncementUnreadCount(Boolean(session?.user));

  const tabs = [...baseTabs];
  tabs.splice(4, 0, { href: '/announcements', label: 'Í≥µÏ?', icon: '?ì¢' });

  if (session?.user && canAccessRoute(session.user, '/partners/dashboard')) {
    tabs.push({ href: '/partners/dashboard', label: '?Ä??, icon: '?ìä' });
  }

  if (session?.user && canAccessRoute(session.user, '/admin')) {
    tabs.push({ href: '/admin', label: 'Í¥ÄÎ¶?, icon: '?ôÔ∏è' });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 md:hidden z-50">
      <div
        className="grid h-16"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                'relative flex flex-col items-center justify-center space-y-1 transition-colors',
                isActive ? 'text-blue-400' : 'text-neutral-400 hover:text-neutral-300'
              ].join(' ')}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
