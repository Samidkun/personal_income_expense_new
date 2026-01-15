'use client'

import { useState } from 'react'
import styles from './AiInsights.module.css'

type InsightMode = 'SUMMARY' | 'TIPS' | 'ROAST' | 'FORECAST'

export default function AiInsights() {
    const [mode, setMode] = useState<InsightMode>('SUMMARY')
    const [result, setResult] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [lastFetch, setLastFetch] = useState<number>(0)

    const handleGenerate = async () => {
        // Prevent spamming (simple 5s cooldown)
        if (Date.now() - lastFetch < 5000) return

        setLoading(true)
        setResult(null)
        setLastFetch(Date.now())

        try {
            const now = new Date()
            const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString() // Start of month
            const endDate = now.toISOString()

            const res = await fetch('/api/ai/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    mode
                })
            })

            const data = await res.json()

            if (data.success) {
                setResult(data.data)
            } else {
                setResult('Gagal mengambil insight: ' + data.error)
            }
        } catch (error) {
            setResult('Terjadi kesalahan koneksi.')
        } finally {
            setLoading(false)
        }
    }

    // Simple parser for basic markdown bolding and lists
    const renderMarkdown = (text: string) => {
        return text.split('\n').map((line, i) => {
            // Header
            if (line.startsWith('### ')) {
                return <h3 key={i} className={styles.mdH3}>{line.replace('### ', '')}</h3>
            }
            if (line.startsWith('## ')) {
                return <h2 key={i} className={styles.mdH2}>{line.replace('## ', '')}</h2>
            }
            // List item
            if (line.trim().startsWith('- ')) {
                return <li key={i} className={styles.mdLi}>{parseBold(line.replace('- ', ''))}</li>
            }
            // Paragraph
            if (line.trim() === '') {
                return <div key={i} className={styles.mdSpacer} />
            }
            return <p key={i} className={styles.mdP}>{parseBold(line)}</p>
        })
    }

    const parseBold = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g)
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>
            }
            return part
        })
    }

    const modes: { id: InsightMode; label: string; icon: string }[] = [
        { id: 'SUMMARY', label: 'Ringkasan', icon: '📝' },
        { id: 'TIPS', label: 'Saran', icon: '💡' },
        { id: 'ROAST', label: 'Roasting', icon: '🔥' },
        { id: 'FORECAST', label: 'Ramalan', icon: '🔮' },
    ]

    return (
        <div className={`card ${styles.container}`}>
            <div className={styles.header}>
                <h3 className={styles.title}>✨ AI Insights</h3>
                <div className={styles.tabs}>
                    {modes.map(m => (
                        <button
                            key={m.id}
                            className={`${styles.tab} ${mode === m.id ? styles.activeTab : ''}`}
                            onClick={() => { setMode(m.id); setResult(null); }}
                            disabled={loading}
                        >
                            <span className={styles.tabIcon}>{m.icon}</span>
                            <span className={styles.tabLabel}>{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.content}>
                {!result && !loading && (
                    <div className={styles.placeholder}>
                        <p>Pilih mode dan minta AI menganalisis keuanganmu bulan ini.</p>
                        <button className="btn btn-primary" onClick={handleGenerate}>
                            Mulai Analisis
                        </button>
                    </div>
                )}

                {loading && (
                    <div className={styles.loading}>
                        <div className="loading-spinner"></div>
                        <p>Sedang berpikir...</p>
                    </div>
                )}

                {result && (
                    <div className={styles.result}>
                        <div className={styles.markdownContent}>
                            {renderMarkdown(result)}
                        </div>
                        <div className={styles.actions}>
                            <button className="btn btn-outline btn-sm" onClick={handleGenerate}>
                                🔄 Regenerate
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
