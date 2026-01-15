'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'

export default function SettingsPage() {
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        telegramChatId: '',
        whatsappNumber: '',
        geminiApiKey: ''
    })
    const [testingTelegram, setTestingTelegram] = useState(false)

    useEffect(() => {
        // Load local theme
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        if (savedTheme) setTheme(savedTheme)

        // Fetch settings from API
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    // Update state with saved settings
                    // NOTE: theme in DB might override local storage if we wanted specific behavior, 
                    // but for now we trust local mostly or just use DB as backup. 
                    // Let's just sync API keys and Chat ID
                    setSettings(prev => ({
                        ...prev,
                        telegramChatId: data.data.telegramChatId || '',
                        whatsappNumber: data.data.whatsappNumber || '',
                        geminiApiKey: data.data.geminiApiKey || ''
                    }))
                }
            })
            .catch(err => console.error('Failed to load settings:', err))
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
        // Also save to DB implicitly or explicitly? 
        // For now, let's save when the user clicks a "Save" button or just let it be local only for theme to avoid lag
    }

    const handleSaveSettings = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...settings,
                    theme // also save theme preference
                })
            })
            const data = await res.json()
            if (data.success) {
                alert('Pengaturan berhasil disimpan!')
            } else {
                alert('Gagal menyimpan pengaturan')
            }
        } catch (error) {
            console.error('Save error:', error)
            alert('Terjadi kesalahan')
        } finally {
            setSaving(false)
        }
    }

    const testTelegram = async () => {
        if (!settings.telegramChatId) {
            alert('Masukkan Chat ID dulu!')
            return
        }
        setTestingTelegram(true)
        try {
            const res = await fetch('/api/settings/test-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId: settings.telegramChatId })
            })
            const data = await res.json()
            if (data.success) {
                alert('Tes Berhasil! Cek pesan di Telegram kamu.')
            } else {
                alert('Gagal mengirim pesan: ' + (data.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('Test Telegram Error:', error)
            alert('Error connect to server')
        } finally {
            setTestingTelegram(false)
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
                    <p className={styles.settingDesc}>Konfigurasi notifikasi & AI</p>

                    <div className={styles.apiList}>
                        {/* Telegram Config */}
                        <div className={styles.apiItem} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <div className={styles.apiInfo} style={{ width: '100%', justifyContent: 'space-between' }}>
                                <span className={styles.apiName}>✈️ Telegram Notification</span>
                                <span className={styles.apiStatus}>{settings.telegramChatId ? 'Aktif ✅' : 'Belum Setup ❌'}</span>
                            </div>
                            <div style={{ width: '100%', marginTop: '0.5rem' }}>
                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Telegram Chat ID</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Contoh: 123456789"
                                        value={settings.telegramChatId}
                                        onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                                    />
                                    <button
                                        className="btn btn-secondary"
                                        onClick={testTelegram}
                                        disabled={testingTelegram || !settings.telegramChatId}
                                    >
                                        {testingTelegram ? '...' : 'Tes'}
                                    </button>
                                </div>
                                <p className={styles.apiNote} style={{ marginTop: '0.5rem' }}>
                                    Cara dapat ID: Chat ke <strong>@userinfobot</strong> di Telegram.
                                </p>
                            </div>
                        </div>

                        {/* Other APIs Placeholders */}
                        <div className={styles.apiItem}>
                            <div className={styles.apiInfo}>
                                <span className={styles.apiName}>🤖 Google Gemini (AI)</span>
                                <span className={styles.apiStatus}>Terkonfigurasi (Env) ✅</span>
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        onClick={handleSaveSettings}
                        disabled={saving}
                    >
                        {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                </div>

                {/* Account Settings */}
                <div className={`card ${styles.settingCard}`}>
                    <h3 className={styles.settingTitle}>🔐 Akun</h3>
                    <p className={styles.settingDesc}>Pengaturan keamanan</p>

                    <div className={styles.accountActions}>
                        <button
                            className="btn btn-danger"
                            onClick={handleLogout}
                        >
                            🚪 Keluar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
