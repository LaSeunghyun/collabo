'use client';

import { ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { initI18n } from '@/lib/i18n';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const i18next = initI18n();

  useEffect(() => {
    document.documentElement.lang = i18next.language;
  }, [i18next.language]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <I18nextProvider i18n={i18next}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </I18nextProvider>
    </ThemeProvider>
  );
}
