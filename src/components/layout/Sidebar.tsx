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
    // Add router
    const router = require('next/navigation').useRouter()
    const { isOpen, toggle } = useSidebar()
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    // Handlers
    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/login')
            router.refresh()
        } catch (error) {
            console.error('Logout failed', error)
        }
    }

    const toggleMobile = () => setIsMobileOpen(!isMobileOpen)
    const closeMobile = () => setIsMobileOpen(false)

    return (
        <>
            {/* Overlay Backdrop */}
            {isMobileOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99
                    }}
                    onClick={closeMobile}
                />
            )}

            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${isMobileOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <Link href="/" className={styles.logo} onClick={closeMobile}>
                        <span className={styles.logoIcon}>💸</span>
                        {/* Always show text on mobile if open, or if desktop open */}
                        {(isOpen || isMobileOpen) && <span className={styles.logoText}>SamidTrack</span>}
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
                            onClick={closeMobile}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {(isOpen || isMobileOpen) && <span className={styles.navLabel}>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className={styles.footer}>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        <span className={styles.navIcon}>🚪</span>
                        {(isOpen || isMobileOpen) && <span>Keluar</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Hamburger Button */}
            <button
                className={styles.mobileHamburger}
                onClick={toggleMobile}
            >
                ☰
            </button>

            {/* Mobile bottom nav - Quick Actions Only */}
            <nav className={styles.mobileNav}>
                {menuItems.slice(0, 4).map((item) => (
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
