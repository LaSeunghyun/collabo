'use client';

import { useTranslation } from 'react-i18next';

import { AnnouncementComposer } from './_components/announcement-composer';
import { AnnouncementList } from './_components/announcement-list';

export default function AdminAnnouncementsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-10 py-12">
      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300/80">Announcements</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{t('admin.announcements.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            {t('admin.announcements.description')}
          </p>
        </div>
        <AnnouncementComposer />
      </section>

      <section>
        <AnnouncementList />
      </section>
    </div>
  );
}
