import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhHK from './locales/zh-HK.json'
import en from './locales/en.json'
import type { LocaleCode } from '../types/models'

const STORAGE_KEY = 'tp-locale'

export function getStoredLocale(): LocaleCode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'zh-HK') return stored
  return 'zh-HK'
}

export function setStoredLocale(locale: LocaleCode) {
  localStorage.setItem(STORAGE_KEY, locale)
}

void i18n.use(initReactI18next).init({
  resources: {
    'zh-HK': { translation: zhHK },
    en: { translation: en },
  },
  lng: getStoredLocale(),
  fallbackLng: 'zh-HK',
  interpolation: { escapeValue: false },
})

export default i18n
