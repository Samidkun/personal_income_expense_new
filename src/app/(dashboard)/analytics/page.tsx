'use client'

import { useEffect, useState, useCallback } from 'react'
import styles from './page.module.css'

interface MonthlyData {
    month: string
    income: number
    expense: number
    net: number
}

interface CategoryData {
    name: string
    color: string
    amount: number
}

interface DailyData {
    day: string
    income: number
    expense: number
}

interface TopSpending {
    name: string
    icon: string
    color: string
    amount: number
}

interface AnalyticsData {
    monthlyData: MonthlyData[]
    categoryBreakdown: {
        expense: CategoryData[]
        income: CategoryData[]
    }
    dailySpending: DailyData[]
    topSpending: TopSpending[]
    summary: {
        totalIncome: number
        totalExpense: number
        avgMonthlyIncome: number
        avgMonthlyExpense: number
        savingsRate: number
    }
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'monthly' | 'category' | 'daily'>('monthly')

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/analytics?months=12')
            const result = await res.json()

            if (result.success) {
                setData(result.data)
            }
        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAnalytics()
    }, [fetchAnalytics])

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            if (format === 'csv') {
                window.open('/api/export?format=csv', '_blank')
            } else {
                const res = await fetch('/api/export?format=json')
                const data = await res.json()
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `transactions_${new Date().toISOString().split('T')[0]}.json`
                a.click()
            }
        } catch (error) {
            console.error('Export error:', error)
        }
    }

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="card">
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <h3 className="empty-state-title">Tidak Ada Data</h3>
                    <p className="empty-state-desc">Belum ada data analitik untuk ditampilkan</p>
                </div>
            </div>
        )
    }

    const maxMonthly = Math.max(...data.monthlyData.flatMap(m => [m.income, m.expense]))
    const totalExpenseCategory = data.categoryBreakdown.expense.reduce((sum, c) => sum + c.amount, 0)

    return (
        <div className={styles.page}>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Analitik</h1>
                    <p className="page-subtitle">Visualisasi dan tren keuangan</p>
                </div>
                <div className={styles.exportBtns}>
                    <button className="btn btn-secondary" onClick={() => handleExport('csv')}>
                        📥 Export CSV
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleExport('json')}>
                        📄 Export JSON
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="stats-grid">
                <div className="glass-card stat-card">
                    <p className="stat-label">Total Pemasukan (12 bulan)</p>
                    <p className="stat-value amount income">{formatCurrency(data.summary.totalIncome)}</p>
                </div>
                <div className="glass-card stat-card">
                    <p className="stat-label">Total Pengeluaran (12 bulan)</p>
                    <p className="stat-value amount expense">{formatCurrency(data.summary.totalExpense)}</p>
                </div>
                <div className="glass-card stat-card">
                    <p className="stat-label">Rata-rata Bulanan</p>
                    <p className="stat-value">{formatCurrency(data.summary.avgMonthlyExpense)}</p>
                </div>
                <div className="glass-card stat-card">
                    <p className="stat-label">Savings Rate</p>
                    <p className={`stat-value ${data.summary.savingsRate >= 0 ? 'income' : 'expense'}`}>
                        {data.summary.savingsRate.toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'monthly' ? styles.active : ''}`}
                    onClick={() => setActiveTab('monthly')}
                >
                    📊 Tren Bulanan
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'category' ? styles.active : ''}`}
                    onClick={() => setActiveTab('category')}
                >
                    🏷️ Per Kategori
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'daily' ? styles.active : ''}`}
                    onClick={() => setActiveTab('daily')}
                >
                    📅 Harian
                </button>
            </div>

            {/* Monthly Trend */}
            {activeTab === 'monthly' && (
                <div className={`card ${styles.chartCard}`}>
                    <h3 className={styles.chartTitle}>Tren Bulanan (12 bulan)</h3>
                    <div className={styles.barChart}>
                        {data.monthlyData.map((month, idx) => (
                            <div key={idx} className={styles.barGroup}>
                                <div className={styles.bars}>
                                    <div
                                        className={`${styles.bar} ${styles.incomeBar}`}
                                        style={{ height: `${maxMonthly > 0 ? (month.income / maxMonthly) * 100 : 0}%` }}
                                        title={`Pemasukan: ${formatCurrency(month.income)}`}
                                    />
                                    <div
                                        className={`${styles.bar} ${styles.expenseBar}`}
                                        style={{ height: `${maxMonthly > 0 ? (month.expense / maxMonthly) * 100 : 0}%` }}
                                        title={`Pengeluaran: ${formatCurrency(month.expense)}`}
                                    />
                                </div>
                                <span className={styles.barLabel}>{month.month}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.chartLegend}>
                        <span className={styles.legendItem}>
                            <span className={`${styles.legendDot} ${styles.incomeDot}`}></span> Pemasukan
                        </span>
                        <span className={styles.legendItem}>
                            <span className={`${styles.legendDot} ${styles.expenseDot}`}></span> Pengeluaran
                        </span>
                    </div>
                </div>
            )}

            {/* Category Breakdown */}
            {activeTab === 'category' && (
                <div className={`card ${styles.chartCard}`}>
                    <h3 className={styles.chartTitle}>Pengeluaran per Kategori (Bulan Ini)</h3>
                    {data.categoryBreakdown.expense.length > 0 ? (
                        <>
                            <div className={styles.pieChart}>
                                {data.categoryBreakdown.expense.map((cat, idx) => {
                                    const percentage = totalExpenseCategory > 0 ? (cat.amount / totalExpenseCategory) * 100 : 0
                                    return (
                                        <div key={idx} className={styles.pieItem}>
                                            <div className={styles.pieLegend}>
                                                <span className={styles.pieDot} style={{ background: cat.color }}></span>
                                                <span>{cat.name}</span>
                                            </div>
                                            <div className={styles.pieBar}>
                                                <div
                                                    className={styles.pieProgress}
                                                    style={{ width: `${percentage}%`, background: cat.color }}
                                                />
                                            </div>
                                            <div className={styles.pieValue}>
                                                <span>{formatCurrency(cat.amount)}</span>
                                                <span className={styles.piePercent}>{percentage.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <p>Belum ada data pengeluaran bulan ini</p>
                        </div>
                    )}
                </div>
            )}

            {/* Daily Spending */}
            {activeTab === 'daily' && (
                <div className={`card ${styles.chartCard}`}>
                    <h3 className={styles.chartTitle}>Transaksi Harian (Bulan Ini)</h3>
                    {data.dailySpending.length > 0 ? (
                        <div className={styles.dailyList}>
                            {data.dailySpending.map((day, idx) => (
                                <div key={idx} className={styles.dailyItem}>
                                    <span className={styles.dailyDate}>{day.day}</span>
                                    <div className={styles.dailyAmounts}>
                                        {day.income > 0 && (
                                            <span className="amount income">+{formatCurrency(day.income)}</span>
                                        )}
                                        {day.expense > 0 && (
                                            <span className="amount expense">-{formatCurrency(day.expense)}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>Belum ada transaksi bulan ini</p>
                        </div>
                    )}
                </div>
            )}

            {/* Top Spending */}
            <div className={`card ${styles.topCard}`}>
                <h3 className={styles.chartTitle}>Top 5 Pengeluaran (3 bulan)</h3>
                <div className={styles.topList}>
                    {data.topSpending.map((item, idx) => (
                        <div key={idx} className={styles.topItem}>
                            <span className={styles.topRank}>#{idx + 1}</span>
                            <div className={styles.topIcon} style={{ background: item.color }}>
                                {item.icon}
                            </div>
                            <span className={styles.topName}>{item.name}</span>
                            <span className="amount expense">{formatCurrency(item.amount)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
