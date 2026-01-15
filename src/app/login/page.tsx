'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            })

            const data = await res.json()

            if (data.success) {
                // Force hard refresh to ensure middleware picks up the cookie immediately
                window.location.href = '/'
            } else {
                setError(data.error || 'Password salah')
                setLoading(false)
            }
        } catch (err) {
            console.error('Login error:', err)
            setError('Terjadi kesalahan')
            setLoading(false)
        }
    }

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: 'white'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                padding: '2rem',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💸</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Selamat Datang</h1>
                    <p style={{ color: '#94a3b8' }}>SamidTrack Finance</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                background: 'rgba(0, 0, 0, 0.2)',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            marginBottom: '1.5rem',
                            borderRadius: '0.5rem',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#fca5a5',
                            fontSize: '0.875rem',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: loading ? '#475569' : '#3b82f6',
                            color: 'white',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading ? 'Memproses...' : 'Masuk 🚀'}
                    </button>
                </form>
            </div>
        </div>
    )
}
