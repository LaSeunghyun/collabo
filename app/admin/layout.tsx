import type { ReactNode } from 'react';

import { requireUser } from '@/lib/auth/guards';
import { ROLE_LABELS, UserRole } from '@/types/shared';

const navigationAnchors = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/projects', label: '프로젝트 검토' },
  { href: '/admin/partners', label: '파트너 관리' },
  { href: '/admin/reports', label: '신고 관리' },
  { href: '/admin/announcements', label: '공지사항' },
  { href: '/admin/moderation', label: '커뮤니티 관리' },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireUser({ roles: [UserRole.ADMIN] });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">관리자 패널</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigationAnchors.map((anchor) => (
                  <a
                    key={anchor.href}
                    href={anchor.href}
                    className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                  >
                    {anchor.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                {user.name} ({ROLE_LABELS[user.role]})
              </span>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}