'use client'

import { useEffect, useState, useCallback } from 'react'
import styles from './page.module.css'

interface DashboardStats {
    totalBalance: number
    totalIncome: number
    totalExpense: number
    incomeChange: number
    expenseChange: number
    recentTransactions: Array<{
        id: string
        amount: number
        type: 'INCOME' | 'EXPENSE'
        description: string | null
        date: string
        category: { name: string; icon: string; color: string }
        wallet: { name: string }
    }>
    categoryBreakdown: Array<{
        categoryId: string
        categoryName: string
        categoryColor: string
        total: number
        percentage: number
    }>
    monthlyTrend: Array<{
        month: string
        income: number
        expense: number
    }>
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/dashboard')
            const data = await res.json()

            if (data.success) {
                setStats(data.data)
            } else {
                setError(data.error || 'Gagal memuat data')
            }
        } catch {
            setError('Terjadi kesalahan saat memuat data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchDashboard()
    }, [fetchDashboard])

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <h3 className="empty-state-title">Terjadi Kesalahan</h3>
                <p className="empty-state-desc">{error}</p>
                <button className="btn btn-primary" onClick={fetchDashboard}>
                    Coba Lagi
                </button>
            </div>
        )
    }

    return (
        <div className={styles.dashboard}>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Ringkasan keuangan bulan ini</p>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className={`glass-card stat-card ${styles.balanceCard}`}>
                    <p className="stat-label">Total Saldo</p>
                    <p className="stat-value">{formatCurrency(stats?.totalBalance || 0)}</p>
                    <p className={styles.walletCount}>Dari semua dompet</p>
                </div>

                <div className="glass-card stat-card income">
                    <p className="stat-label">Pemasukan</p>
                    <p className="stat-value amount income">{formatCurrency(stats?.totalIncome || 0)}</p>
                    <span className={`stat-change ${(stats?.incomeChange || 0) >= 0 ? 'positive' : 'negative'}`}>
                        {(stats?.incomeChange || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.incomeChange || 0).toFixed(1)}%
                    </span>
                </div>

                <div className="glass-card stat-card expense">
                    <p className="stat-label">Pengeluaran</p>
                    <p className="stat-value amount expense">{formatCurrency(stats?.totalExpense || 0)}</p>
                    <span className={`stat-change ${(stats?.expenseChange || 0) <= 0 ? 'positive' : 'negative'}`}>
                        {(stats?.expenseChange || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.expenseChange || 0).toFixed(1)}%
                    </span>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Recent Transactions */}
                <div className={`card ${styles.recentCard}`}>
                    <div className={styles.cardHeader}>
                        <h3>Transaksi Terbaru</h3>
                        <a href="/transactions" className="btn btn-ghost btn-sm">Lihat Semua →</a>
                    </div>

                    {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                        <div className={styles.transactionList}>
                            {stats.recentTransactions.map((tx) => (
                                <div key={tx.id} className={styles.transactionItem}>
                                    <div className={styles.txIcon} style={{ background: tx.category.color }}>
                                        {tx.category.icon}
                                    </div>
                                    <div className={styles.txInfo}>
                                        <p className={styles.txDesc}>{tx.description || tx.category.name}</p>
                                        <p className={styles.txMeta}>
                                            {tx.wallet.name} • {formatDate(tx.date)}
                                        </p>
                                    </div>
                                    <p className={`amount ${tx.type === 'INCOME' ? 'income' : 'expense'}`}>
                                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyList}>
                            <p>Belum ada transaksi</p>
                            <a href="/transactions" className="btn btn-primary btn-sm">Tambah Transaksi</a>
                        </div>
                    )}
                </div>

                {/* Category Breakdown */}
                <div className={`card ${styles.categoryCard}`}>
                    <div className={styles.cardHeader}>
                        <h3>Pengeluaran per Kategori</h3>
                    </div>

                    {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                        <div className={styles.categoryList}>
                            {stats.categoryBreakdown.map((cat) => (
                                <div key={cat.categoryId} className={styles.categoryItem}>
                                    <div className={styles.categoryInfo}>
                                        <div
                                            className={styles.categoryDot}
                                            style={{ background: cat.categoryColor }}
                                        />
                                        <span>{cat.categoryName}</span>
                                    </div>
                                    <div className={styles.categoryValue}>
                                        <span className={styles.categoryAmount}>{formatCurrency(cat.total)}</span>
                                        <span className={styles.categoryPercent}>{cat.percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className={styles.categoryBar}>
                                        <div
                                            className={styles.categoryProgress}
                                            style={{
                                                width: `${cat.percentage}%`,
                                                background: cat.categoryColor
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyList}>
                            <p>Belum ada data kategori</p>
                        </div>
                    )}
                </div>

                {/* Monthly Trend Chart */}
                <div className={`card ${styles.chartCard}`}>
                    <div className={styles.cardHeader}>
                        <h3>Tren Bulanan</h3>
                    </div>

                    {stats?.monthlyTrend && stats.monthlyTrend.length > 0 ? (
                        <div className={styles.chartContainer}>
                            <div className={styles.barChart}>
                                {stats.monthlyTrend.map((month, idx) => {
                                    const maxValue = Math.max(
                                        ...stats.monthlyTrend.flatMap(m => [m.income, m.expense])
                                    )
                                    const incomeHeight = maxValue > 0 ? (month.income / maxValue) * 100 : 0
                                    const expenseHeight = maxValue > 0 ? (month.expense / maxValue) * 100 : 0

                                    return (
                                        <div key={idx} className={styles.barGroup}>
                                            <div className={styles.bars}>
                                                <div
                                                    className={`${styles.bar} ${styles.incomeBar}`}
                                                    style={{ height: `${incomeHeight}%` }}
                                                    title={`Pemasukan: ${formatCurrency(month.income)}`}
                                                />
                                                <div
                                                    className={`${styles.bar} ${styles.expenseBar}`}
                                                    style={{ height: `${expenseHeight}%` }}
                                                    title={`Pengeluaran: ${formatCurrency(month.expense)}`}
                                                />
                                            </div>
                                            <span className={styles.barLabel}>{month.month}</span>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className={styles.chartLegend}>
                                <span className={styles.legendItem}>
                                    <span className={`${styles.legendDot} ${styles.incomeDot}`}></span>
                                    Pemasukan
                                </span>
                                <span className={styles.legendItem}>
                                    <span className={`${styles.legendDot} ${styles.expenseDot}`}></span>
                                    Pengeluaran
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyList}>
                            <p>Belum ada data bulanan</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
