import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'SamidTrackFinance - Personal Income & Expense Tracker',
  description: 'Track your personal finances with ease. Manage income, expenses, budgets, and reminders.',
  keywords: ['finance', 'income', 'expense', 'budget', 'tracker', 'personal finance'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  )
}
