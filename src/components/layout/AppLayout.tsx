'use client'

import { ReactNode, useEffect, useState } from 'react'
import Sidebar, { SidebarProvider, useSidebar } from './Sidebar'
import styles from './AppLayout.module.css'

function LayoutContent({ children }: { children: ReactNode }) {
    const { isOpen } = useSidebar()
    const [theme, setTheme] = useState<'light' | 'dark'>('light')

    useEffect(() => {
        // Check system preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null

        if (savedTheme) {
            setTheme(savedTheme)
            document.documentElement.setAttribute('data-theme', savedTheme)
        } else if (mediaQuery.matches) {
            setTheme('dark')
            document.documentElement.setAttribute('data-theme', 'dark')
        }

        // Listen for changes
        const listener = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light'
                setTheme(newTheme)
                document.documentElement.setAttribute('data-theme', newTheme)
            }
        }

        mediaQuery.addEventListener('change', listener)
        return () => mediaQuery.removeEventListener('change', listener)
    }, [])

    return (
        <div className={styles.layout}>
            <Sidebar />
            <main
                className={styles.main}
                style={{ marginLeft: isOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)' }}
            >
                {children}
            </main>
        </div>
    )
}

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <SidebarProvider>
            <LayoutContent>{children}</LayoutContent>
        </SidebarProvider>
    )
}
