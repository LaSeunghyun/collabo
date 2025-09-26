'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en/common.json';
import ko from '@/locales/ko/common.json';

const resources = {
  en: { translation: en },
  ko: { translation: ko }
};

const initI18n = () => {
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: 'ko',
      fallbackLng: 'ko',
      interpolation: { escapeValue: false }
    });
  }

  return i18n;
};

export { initI18n };
