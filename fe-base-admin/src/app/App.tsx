import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { router } from '@/app/router'
import { queryClient } from '@/lib/query-client'
import { I18nProvider } from '@/shared/i18n/I18nProvider'
import { Toaster } from '@shared/components/ui/sonner'

export default function App() {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors position="bottom-right" closeButton={true} />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </I18nProvider>
  )
}
