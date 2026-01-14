'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function LoginPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            })

            const data = await res.json()

            if (data.success) {
                router.push('/')
                router.refresh()
            } else {
                setError(data.error || 'Password salah')
            }
        } catch {
            setError('Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.loginCard}>
                    <div className={styles.header}>
                        <span className={styles.logo}>💸</span>
                        <h1 className={styles.title}>SamidTrack</h1>
                        <p className={styles.subtitle}>Personal Income & Expense Tracker</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Masukkan password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className={styles.error}>
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={loading}
                        >
                            {loading ? 'Memuat...' : 'Masuk'}
                        </button>
                    </form>

                    <p className={styles.hint}>
                        💡 Password default: <code>admin123</code>
                    </p>
                </div>
            </div>
        </div>
    )
}
