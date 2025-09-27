'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold">
            Collaborium
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/projects" className="hover:text-neutral-300 transition-colors">
              프로젝트
            </Link>
            <Link href="/partners" className="hover:text-neutral-300 transition-colors">
              파트너
            </Link>
            <Link href="/community" className="hover:text-neutral-300 transition-colors">
              커뮤니티
            </Link>
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
