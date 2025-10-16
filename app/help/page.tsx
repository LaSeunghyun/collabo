'use client';

import { useTranslation } from 'react-i18next';

export default function HelpPage() {
  const { t } = useTranslation();
  const faqKeys = ['fundingProcess', 'partnerReview', 'settlementReport'] as const;
  const faqs = faqKeys.map((key) => ({
    question: t(`help.faqs.${key}.question`),
    answer: t(`help.faqs.${key}.answer`)
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">{t('help.title')}</h1>
        <p className="mt-2 text-sm text-white/60">{t('help.description')}</p>
      </header>
      <section className="mt-10 space-y-4">
        {faqs.map((faq) => (
          <article key={faq.question} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">{faq.question}</h2>
            <p className="mt-2 text-sm text-white/60">{faq.answer}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
