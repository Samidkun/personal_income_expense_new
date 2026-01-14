'use client'

import { useState, createContext, useContext, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

interface SidebarContextType {
    isOpen: boolean
    toggle: () => void
}

const SidebarContext = createContext<SidebarContextType>({
    isOpen: true,
    toggle: () => { },
})

export function useSidebar() {
    return useContext(SidebarContext)
}

const menuItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/transactions', label: 'Transaksi', icon: '💰' },
    { href: '/wallets', label: 'Dompet', icon: '👛' },
    { href: '/budgets', label: 'Budget', icon: '🎯' },
    { href: '/calendar', label: 'Kalender', icon: '📅' },
    { href: '/analytics', label: 'Analitik', icon: '📈' },
    { href: '/recurring', label: 'Berulang', icon: '🔄' },
    { href: '/reminders', label: 'Pengingat', icon: '🔔' },
    { href: '/categories', label: 'Kategori', icon: '🏷️' },
    { href: '/settings', label: 'Pengaturan', icon: '⚙️' },
]

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(true)

    return (
        <SidebarContext.Provider value={{ isOpen, toggle: () => setIsOpen(!isOpen) }}>
            {children}
        </SidebarContext.Provider>
    )
}

export default function Sidebar() {
    const pathname = usePathname()
    const { isOpen, toggle } = useSidebar()

    return (
        <>
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <Link href="/" className={styles.logo}>
                        <span className={styles.logoIcon}>💸</span>
                        {isOpen && <span className={styles.logoText}>SamidTrack</span>}
                    </Link>
                    <button className={styles.toggleBtn} onClick={toggle}>
                        {isOpen ? '◀' : '▶'}
                    </button>
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {isOpen && <span className={styles.navLabel}>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className={styles.footer}>
                    <button className={styles.logoutBtn}>
                        <span className={styles.navIcon}>🚪</span>
                        {isOpen && <span>Keluar</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile bottom nav */}
            <nav className={styles.mobileNav}>
                {menuItems.slice(0, 5).map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.mobileNavItem} ${pathname === item.href ? styles.active : ''}`}
                    >
                        <span className={styles.mobileNavIcon}>{item.icon}</span>
                        <span className={styles.mobileNavLabel}>{item.label}</span>
                    </Link>
                ))}
            </nav>
        </>
    )
}
