'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'

export default function SettingsPage() {
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        if (savedTheme) {
            setTheme(savedTheme)
        }
    }, [])

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme)
        if (newTheme === 'system') {
            localStorage.removeItem('theme')
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
        } else {
            localStorage.setItem('theme', newTheme)
            document.documentElement.setAttribute('data-theme', newTheme)
        }
    }

    const handleLogout = async () => {
        if (!confirm('Yakin ingin keluar?')) return

        try {
            await fetch('/api/auth', { method: 'DELETE' })
            window.location.href = '/login'
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return (
        <div className={styles.page}>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Pengaturan</h1>
                    <p className="page-subtitle">Konfigurasi aplikasi</p>
                </div>
            </header>

            <div className={styles.settingsGrid}>
                {/* Theme Settings */}
                <div className={`card ${styles.settingCard}`}>
                    <h3 className={styles.settingTitle}>🎨 Tema</h3>
                    <p className={styles.settingDesc}>Pilih tema tampilan</p>

                    <div className={styles.themeOptions}>
                        <button
                            className={`${styles.themeBtn} ${theme === 'light' ? styles.active : ''}`}
                            onClick={() => handleThemeChange('light')}
                        >
                            <span className={styles.themeIcon}>☀️</span>
                            <span>Terang</span>
                        </button>
                        <button
                            className={`${styles.themeBtn} ${theme === 'dark' ? styles.active : ''}`}
                            onClick={() => handleThemeChange('dark')}
                        >
                            <span className={styles.themeIcon}>🌙</span>
                            <span>Gelap</span>
                        </button>
                        <button
                            className={`${styles.themeBtn} ${theme === 'system' ? styles.active : ''}`}
                            onClick={() => handleThemeChange('system')}
                        >
                            <span className={styles.themeIcon}>💻</span>
                            <span>Sistem</span>
                        </button>
                    </div>
                </div>

                {/* API Settings */}
                <div className={`card ${styles.settingCard}`}>
                    <h3 className={styles.settingTitle}>🔌 Integrasi API</h3>
                    <p className={styles.settingDesc}>Konfigurasi API untuk fitur tambahan</p>

                    <div className={styles.apiList}>
                        <div className={styles.apiItem}>
                            <div className={styles.apiInfo}>
                                <span className={styles.apiName}>🤖 Google Gemini (AI)</span>
                                <span className={styles.apiStatus}>Belum dikonfigurasi</span>
                            </div>
                            <button className="btn btn-secondary btn-sm" disabled>Setup</button>
                        </div>
                        <div className={styles.apiItem}>
                            <div className={styles.apiInfo}>
                                <span className={styles.apiName}>📱 WhatsApp (Fonnte)</span>
                                <span className={styles.apiStatus}>Belum dikonfigurasi</span>
                            </div>
                            <button className="btn btn-secondary btn-sm" disabled>Setup</button>
                        </div>
                    </div>

                    <p className={styles.apiNote}>
                        💡 Fitur AI dan WhatsApp notification akan tersedia setelah API dikonfigurasi
                    </p>
                </div>

                {/* Data Settings */}
                <div className={`card ${styles.settingCard}`}>
                    <h3 className={styles.settingTitle}>📊 Data</h3>
                    <p className={styles.settingDesc}>Kelola data aplikasi</p>

                    <div className={styles.dataActions}>
                        <button className="btn btn-secondary" disabled>
                            📤 Export ke CSV
                        </button>
                        <button className="btn btn-secondary" disabled>
                            📄 Export ke PDF
                        </button>
                    </div>
                </div>

                {/* Account Settings */}
                <div className={`card ${styles.settingCard}`}>
                    <h3 className={styles.settingTitle}>🔐 Akun</h3>
                    <p className={styles.settingDesc}>Pengaturan keamanan</p>

                    <div className={styles.accountActions}>
                        <button className="btn btn-secondary" disabled>
                            Ganti Password
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={handleLogout}
                            disabled={saving}
                        >
                            🚪 Keluar
                        </button>
                    </div>
                </div>

                {/* About */}
                <div className={`card ${styles.settingCard}`}>
                    <h3 className={styles.settingTitle}>ℹ️ Tentang Aplikasi</h3>
                    <div className={styles.aboutInfo}>
                        <p><strong>SamidTrackFinance</strong></p>
                        <p>Personal Income & Expense Tracker</p>
                        <p className={styles.version}>Version 1.0.0</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
