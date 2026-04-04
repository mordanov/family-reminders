import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import ru from './ru.json'

const savedLang = localStorage.getItem('lang')
const browserLang = navigator.language.split('-')[0]
const defaultLang = savedLang || (['ru', 'en'].includes(browserLang) ? browserLang : 'en')

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: defaultLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
