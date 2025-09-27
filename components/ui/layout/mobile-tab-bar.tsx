'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
    { href: '/', label: '홈', icon: '🏠' },
    { href: '/projects', label: '프로젝트', icon: '🎵' },
    { href: '/partners', label: '파트너', icon: '🤝' },
    { href: '/community', label: '커뮤니티', icon: '💬' },
];

export function MobileTabBar() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 md:hidden z-50">
            <div className="grid grid-cols-4 h-16">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href ||
                        (tab.href !== '/' && pathname.startsWith(tab.href));

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex flex-col items-center justify-center space-y-1 ${isActive
                                    ? 'text-blue-400'
                                    : 'text-neutral-400 hover:text-neutral-300'
                                } transition-colors`}
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
