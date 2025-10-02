import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from 'next';
import { ReactNode } from 'react';

import './globals.css';

import { Footer } from '@/components/ui/layout/footer';
import { Header } from '@/components/ui/layout/header';
import { MobileTabBar } from '@/components/ui/layout/mobile-tab-bar';
import { Providers } from '@/app/providers';

export const metadata: Metadata = {
  title: 'Collaborium – Artist Collaboration Platform',
  description: '팬과 아티스트가 함께 만들어가는 펀딩 · 커뮤니티 플랫폼'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-neutral-950 text-white">
        <Providers>
          <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
            <Header />
            <main className="flex-1 pt-20 lg:pt-24">{children}</main>
            <Footer />
            <MobileTabBar />
          </div>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
