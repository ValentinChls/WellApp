import type { Metadata } from 'next'
import { Questrial } from 'next/font/google'
import './globals.css'
import { TRPCReactProvider } from '@/lib/trpc/react'

/**
 * Police de secours libre « Questrial » (poids 400), proche de Century Gothic.
 * Exposée en variable CSS pour que le preset Tailwind (font-sans) la prenne
 * après Century Gothic dans la pile de polices.
 */
const questrial = Questrial({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-fallback',
})

export const metadata: Metadata = {
  title: 'Wellpharma Admin',
  description: 'Espace d’administration du groupement Wellpharma.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={questrial.variable} suppressHydrationWarning>
      <body>
        {/* Fournit le client tRPC + React Query à toute l'application. */}
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  )
}
