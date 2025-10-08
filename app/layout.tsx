import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';

import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Collaborium - Artist Collaboration Platform',
  description: '음악과 아티스트가 함께 만들어가는 크리에이티브 커뮤니티 플랫폼',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}