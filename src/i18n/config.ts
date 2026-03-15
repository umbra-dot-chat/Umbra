import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all namespaces for each supported language
import commonEn from './locales/en/common.json';
import sidebarEn from './locales/en/sidebar.json';
import settingsEn from './locales/en/settings.json';
import chatEn from './locales/en/chat.json';
import authEn from './locales/en/auth.json';
import friendsEn from './locales/en/friends.json';
import notificationsEn from './locales/en/notifications.json';

import commonKo from './locales/ko/common.json';
import sidebarKo from './locales/ko/sidebar.json';
import settingsKo from './locales/ko/settings.json';
import chatKo from './locales/ko/chat.json';
import authKo from './locales/ko/auth.json';
import friendsKo from './locales/ko/friends.json';
import notificationsKo from './locales/ko/notifications.json';

import commonJa from './locales/ja/common.json';
import sidebarJa from './locales/ja/sidebar.json';
import settingsJa from './locales/ja/settings.json';
import chatJa from './locales/ja/chat.json';
import authJa from './locales/ja/auth.json';
import friendsJa from './locales/ja/friends.json';
import notificationsJa from './locales/ja/notifications.json';

import commonZh from './locales/zh/common.json';
import sidebarZh from './locales/zh/sidebar.json';
import settingsZh from './locales/zh/settings.json';
import chatZh from './locales/zh/chat.json';
import authZh from './locales/zh/auth.json';
import friendsZh from './locales/zh/friends.json';
import notificationsZh from './locales/zh/notifications.json';

import commonEs from './locales/es/common.json';
import sidebarEs from './locales/es/sidebar.json';
import settingsEs from './locales/es/settings.json';
import chatEs from './locales/es/chat.json';
import authEs from './locales/es/auth.json';
import friendsEs from './locales/es/friends.json';
import notificationsEs from './locales/es/notifications.json';

import commonFr from './locales/fr/common.json';
import sidebarFr from './locales/fr/sidebar.json';
import settingsFr from './locales/fr/settings.json';
import chatFr from './locales/fr/chat.json';
import authFr from './locales/fr/auth.json';
import friendsFr from './locales/fr/friends.json';
import notificationsFr from './locales/fr/notifications.json';

import commonDe from './locales/de/common.json';
import sidebarDe from './locales/de/sidebar.json';
import settingsDe from './locales/de/settings.json';
import chatDe from './locales/de/chat.json';
import authDe from './locales/de/auth.json';
import friendsDe from './locales/de/friends.json';
import notificationsDe from './locales/de/notifications.json';

import commonPt from './locales/pt/common.json';
import sidebarPt from './locales/pt/sidebar.json';
import settingsPt from './locales/pt/settings.json';
import chatPt from './locales/pt/chat.json';
import authPt from './locales/pt/auth.json';
import friendsPt from './locales/pt/friends.json';
import notificationsPt from './locales/pt/notifications.json';

import commonRu from './locales/ru/common.json';
import sidebarRu from './locales/ru/sidebar.json';
import settingsRu from './locales/ru/settings.json';
import chatRu from './locales/ru/chat.json';
import authRu from './locales/ru/auth.json';
import friendsRu from './locales/ru/friends.json';
import notificationsRu from './locales/ru/notifications.json';

export const defaultNS = 'common';
export const supportedLanguages = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'ru'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageLabels: Record<SupportedLanguage, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  zh: '中文',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ru: 'Русский',
};

const ns = ['common', 'sidebar', 'settings', 'chat', 'auth', 'friends', 'notifications'] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: commonEn, sidebar: sidebarEn, settings: settingsEn, chat: chatEn, auth: authEn, friends: friendsEn, notifications: notificationsEn },
      ko: { common: commonKo, sidebar: sidebarKo, settings: settingsKo, chat: chatKo, auth: authKo, friends: friendsKo, notifications: notificationsKo },
      ja: { common: commonJa, sidebar: sidebarJa, settings: settingsJa, chat: chatJa, auth: authJa, friends: friendsJa, notifications: notificationsJa },
      zh: { common: commonZh, sidebar: sidebarZh, settings: settingsZh, chat: chatZh, auth: authZh, friends: friendsZh, notifications: notificationsZh },
      es: { common: commonEs, sidebar: sidebarEs, settings: settingsEs, chat: chatEs, auth: authEs, friends: friendsEs, notifications: notificationsEs },
      fr: { common: commonFr, sidebar: sidebarFr, settings: settingsFr, chat: chatFr, auth: authFr, friends: friendsFr, notifications: notificationsFr },
      de: { common: commonDe, sidebar: sidebarDe, settings: settingsDe, chat: chatDe, auth: authDe, friends: friendsDe, notifications: notificationsDe },
      pt: { common: commonPt, sidebar: sidebarPt, settings: settingsPt, chat: chatPt, auth: authPt, friends: friendsPt, notifications: notificationsPt },
      ru: { common: commonRu, sidebar: sidebarRu, settings: settingsRu, chat: chatRu, auth: authRu, friends: friendsRu, notifications: notificationsRu },
    },
    fallbackLng: 'en',
    defaultNS,
    ns: [...ns],
    interpolation: { escapeValue: false },
    debug: __DEV__,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'umbra-language',
    },
  });

export default i18n;
