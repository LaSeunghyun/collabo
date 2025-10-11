'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en/common.json';
import ko from '@/locales/ko/common.json';

type TranslationRecord = Record<string, unknown>;

const mergeDeep = (target: TranslationRecord, source: TranslationRecord): TranslationRecord => {
  const output: TranslationRecord = { ...target };

  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const existing = output[key];
      output[key] = mergeDeep(
        typeof existing === 'object' && existing !== null ? (existing as TranslationRecord) : {},
        value as TranslationRecord
      );
    } else {
      output[key] = value;
    }
  });

  return output;
};

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
