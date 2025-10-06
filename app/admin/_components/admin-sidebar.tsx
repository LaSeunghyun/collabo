'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  Flag,
  DollarSign,
  Megaphone,
  Settings,
  BarChart3,
  Package
} from 'lucide-react';

const navigation = [
  {
    name: '?Ä?úÎ≥¥??,
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: '?ÑÎ°ú?ùÌä∏ Í≤Ä??,
    href: '/admin/projects',
    icon: FileText,
  },
  {
    name: '?åÌä∏???πÏù∏',
    href: '/admin/partners',
    icon: Users,
  },
  {
    name: '?†Í≥† Í¥ÄÎ¶?,
    href: '/admin/reports',
    icon: Flag,
  },
  {
    name: '?ïÏÇ∞ Í¥ÄÎ¶?,
    href: '/admin/settlements',
    icon: DollarSign,
  },
  {
    name: 'Í≥µÏ? Í¥ÄÎ¶?,
    href: '/admin/announcements',
    icon: Megaphone,
  },
  {
    name: '?¥Ìñâ Í¥ÄÎ¶?,
    href: '/admin/fulfillment',
    icon: Package,
  },
  {
    name: 'Î∂ÑÏÑù ?ÑÍµ¨',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: '?§Ï†ï',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200">
        <div className="flex flex-col flex-grow">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
