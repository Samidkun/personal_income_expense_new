import type { Metadata } from 'next'
import { AppLayout } from '@/components/layout'

export const metadata: Metadata = {
    title: 'Dashboard | SamidTrackFinance',
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <AppLayout>{children}</AppLayout>
}
