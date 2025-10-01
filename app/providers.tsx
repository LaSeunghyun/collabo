'use client';

import { ReactNode, useEffect, useLayoutEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, signOut, useSession } from 'next-auth/react';

import { initI18n } from '@/lib/i18n';
import {
  SESSION_PERSISTENCE_ACTIVE,
  SESSION_PERSISTENCE_KEY,
  SESSION_PERSISTENCE_PENDING_SIGN_OUT,
  SESSION_PERSISTENCE_SEED
} from '@/lib/auth/session-persistence';

const queryClient = new QueryClient();

function SessionPersistenceManager() {
  const { status } = useSession();

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const flag = window.sessionStorage.getItem(SESSION_PERSISTENCE_KEY);

    if (status === 'authenticated') {
      if (!flag) {
        window.sessionStorage.setItem(SESSION_PERSISTENCE_KEY, SESSION_PERSISTENCE_PENDING_SIGN_OUT);
        void signOut({ callbackUrl: '/auth/signin' });
        return;
      }

      if (flag === SESSION_PERSISTENCE_PENDING_SIGN_OUT) {
        return;
      }

      if (flag === SESSION_PERSISTENCE_SEED) {
        window.sessionStorage.setItem(SESSION_PERSISTENCE_KEY, SESSION_PERSISTENCE_ACTIVE);
        return;
      }

      if (flag !== SESSION_PERSISTENCE_ACTIVE) {
        window.sessionStorage.setItem(SESSION_PERSISTENCE_KEY, SESSION_PERSISTENCE_ACTIVE);
      }
    }

    if (status === 'unauthenticated') {
      window.sessionStorage.removeItem(SESSION_PERSISTENCE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const i18next = initI18n();

  useEffect(() => {
    document.documentElement.lang = i18next.language;
  }, [i18next.language]);

  return (
    <SessionProvider>
      <SessionPersistenceManager />
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <I18nextProvider i18n={i18next}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </I18nextProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}


