'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { canAccessRoute } from '@/lib/auth/role-guards';
import { useAnnouncementUnreadCount } from '@/hooks/use-announcement-read';

export function Header() {
  const { data: session } = useSession();
  const { data: unreadCount = 0 } = useAnnouncementUnreadCount(Boolean(session?.user));

  const navigationItems = [
    { href: '/projects', label: '프로젝트' },
    { href: '/artists', label: '아티스트' },
    { href: '/partners', label: '파트너' },
    { href: '/community', label: '커뮤니티' },
    { href: '/announcements', label: '공지사항', unreadCount }
  ];

  if (session?.user && canAccessRoute(session.user, '/partners/dashboard')) {
    navigationItems.push({ href: '/partners/dashboard', label: '파트너 허브' });
  }

  if (session?.user && canAccessRoute(session.user, '/admin')) {
    navigationItems.push({ href: '/admin', label: '관리' });
  }

  return (
    <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold">
            Collaborium
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const showBadge = typeof item.unreadCount === 'number' && item.unreadCount > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative hover:text-neutral-300 transition-colors"
                >
                  {item.label}
                  {showBadge ? (
                    <span className="absolute -right-3 -top-2 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {item.unreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4">
            {session ? (
              <Link 
                href="/profile" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                프로필
              </Link>
            ) : (
              <Link 
                href="/api/auth/signin" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
