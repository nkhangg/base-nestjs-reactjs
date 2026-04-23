import { type ReactNode, useEffect, useState } from 'react'
import i18n from 'i18next'
import { initReactI18next, I18nextProvider } from 'react-i18next'
import vi from './locales/vi.json'
import en from './locales/en.json'

i18n.use(initReactI18next).init({
  lng: 'vi',
  fallbackLng: 'en',
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  interpolation: {
    escapeValue: false, // React đã escape rồi
  },
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    i18n.on('initialized', () => setReady(true))
    if (i18n.isInitialized) setReady(true)
  }, [])

  if (!ready) return null

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

export { i18n }
