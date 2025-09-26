'use client';

import { useTranslation } from 'react-i18next';

import { CommunityBoard } from '@/components/sections/community-board';

export default function CommunityPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">{t('community.title')}</h1>
        <p className="mt-2 text-sm text-white/60">{t('community.description')}</p>
      </header>
      <section className="mt-10">
        <CommunityBoard />
      </section>
    </div>
  );
}
