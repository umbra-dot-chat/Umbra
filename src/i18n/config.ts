import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all English namespaces
import commonEn from './locales/en/common.json';
import sidebarEn from './locales/en/sidebar.json';
import settingsEn from './locales/en/settings.json';
import chatEn from './locales/en/chat.json';
import authEn from './locales/en/auth.json';
import friendsEn from './locales/en/friends.json';
import notificationsEn from './locales/en/notifications.json';

export const defaultNS = 'common';
export const supportedLanguages = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'ru'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageLabels: Record<SupportedLanguage, string> = {
  en: 'English',
  ko: '\ud55c\uad6d\uc5b4',
  ja: '\u65e5\u672c\u8a9e',
  zh: '\u4e2d\u6587',
  es: 'Espa\u00f1ol',
  fr: 'Fran\u00e7ais',
  de: 'Deutsch',
  pt: 'Portugu\u00eas',
  ru: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439',
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEn,
        sidebar: sidebarEn,
        settings: settingsEn,
        chat: chatEn,
        auth: authEn,
        friends: friendsEn,
        notifications: notificationsEn,
      },
    },
    fallbackLng: 'en',
    defaultNS,
    ns: ['common', 'sidebar', 'settings', 'chat', 'auth', 'friends', 'notifications'],
    interpolation: { escapeValue: false },
    debug: __DEV__,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'umbra-language',
    },
  });

export default i18n;
