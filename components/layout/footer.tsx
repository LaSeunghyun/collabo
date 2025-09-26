'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-neutral-950/80 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 text-sm text-white/70 md:grid-cols-4">
        <div>
          <h3 className="text-base font-semibold text-white">{t('footer.brand.name')}</h3>
          <p className="mt-3 text-white/60">{t('footer.brand.description')}</p>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {t('footer.sections.platform.title')}
          </h4>
          <ul className="space-y-1">
            <li>
              <Link href="/projects" className="hover:text-white">
                {t('navigation.projects')}
              </Link>
            </li>
            <li>
              <Link href="/partners" className="hover:text-white">
                {t('navigation.partners')}
              </Link>
            </li>
            <li>
              <Link href="/community" className="hover:text-white">
                {t('navigation.community')}
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {t('footer.sections.support.title')}
          </h4>
          <ul className="space-y-1">
            <li>
              <Link href="/help" className="hover:text-white">
                {t('footer.sections.support.links.help')}
              </Link>
            </li>
            <li>
              <Link href="/partners" className="hover:text-white">
                {t('footer.sections.support.links.partnerJoin')}
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {t('footer.sections.contact.title')}
          </h4>
          <p>{t('footer.sections.contact.email')}</p>
          <p>{t('footer.sections.contact.address')}</p>
        </div>
      </div>
      <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/50">
        {t('footer.copyright', { year })}
      </div>
    </footer>
  );
}
