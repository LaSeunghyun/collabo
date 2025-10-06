'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';

interface AdminHeaderProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Î°úÍ≥† Î∞??úÎ™© */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Í¥ÄÎ¶??ºÌÑ∞</h1>
            </Link>
          </div>

          {/* ?∞Ï∏° Î©îÎâ¥ */}
          <div className="flex items-center space-x-4">
            {/* ?åÎ¶º */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            {/* ?§Ï†ï */}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>

            {/* ?¨Ïö©???ÑÎ°ú??*/}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name || 'Admin'}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {user.name || 'Í¥ÄÎ¶¨Ïûê'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>

              {/* ?ÑÎ°ú???úÎ°≠?§Ïö¥ */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">{user.name || 'Í¥ÄÎ¶¨Ïûê'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      ?ÑÎ°ú??
                    </Link>
                    
                    <Link
                      href="/admin/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      ?§Ï†ï
                    </Link>
                    
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Î°úÍ∑∏?ÑÏõÉ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Î™®Î∞î??Î©îÎâ¥ */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-6 py-4 space-y-2">
            <Link
              href="/admin"
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ?Ä?úÎ≥¥??
            </Link>
            <Link
              href="/admin/projects"
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ?ÑÎ°ú?ùÌä∏ Í≤Ä??
            </Link>
            <Link
              href="/admin/partners"
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ?åÌä∏???πÏù∏
            </Link>
            <Link
              href="/admin/reports"
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ?†Í≥† Í¥ÄÎ¶?
            </Link>
            <Link
              href="/admin/settlements"
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ?ïÏÇ∞ Í¥ÄÎ¶?
            </Link>
            <Link
              href="/admin/announcements"
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Í≥µÏ? Í¥ÄÎ¶?
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
