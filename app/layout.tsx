import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';

import { Providers } from './providers';
import { Header } from '@/components/ui';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Collaborium - Artist Collaboration Platform',
  description: '?Œì•…ê³??„í‹°?¤íŠ¸ê°€ ?¨ê»˜ ë§Œë“¤?´ê????¬ë¦¬?ì´?°ë¸Œ ì»¤ë??ˆí‹° ?Œë«??,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
