'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@shared/components/ui/sonner'
import { I18nProvider } from '@shared/i18n/I18nProvider'
import { AppStoreProvider } from '@store'
import { queryClient } from '@lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <AppStoreProvider>
            {children}
            <Toaster richColors position="bottom-right" closeButton />
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </AppStoreProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
