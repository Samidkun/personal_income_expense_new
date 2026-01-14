'use client'

import { useEffect, useState, useCallback } from 'react'
import styles from './page.module.css'

interface Category {
    id: string
    name: string
    icon: string
    color: string
    type: 'INCOME' | 'EXPENSE'
}

interface Budget {
    id: string
    categoryId: string
    category: Category
    amount: number
    spent: number
    percentage: number
    isOverBudget: boolean
    isNearLimit: boolean
    month: number
    year: number
    alertThreshold: number
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)

    const now = new Date()
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [year, setYear] = useState(now.getFullYear())

    const [form, setForm] = useState({
        categoryId: '',
        amount: '',
        alertThreshold: '80'
    })

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const [budgetRes, catRes] = await Promise.all([
                fetch(`/api/budgets?month=${month}&year=${year}`),
                fetch('/api/categories?type=EXPENSE')
            ])

            const [budgetData, catData] = await Promise.all([
                budgetRes.json(),
                catRes.json()
            ])

            if (budgetData.success) setBudgets(budgetData.data)
            if (catData.success) setCategories(catData.data)
        } catch (error) {
            console.error('Error fetching budgets:', error)
        } finally {
            setLoading(false)
        }
    }, [month, year])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const res = await fetch('/api/budgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryId: form.categoryId,
                    amount: parseFloat(form.amount),
                    month,
                    year,
                    alertThreshold: parseInt(form.alertThreshold)
                })
            })

            const data = await res.json()

            if (data.success) {
                setShowModal(false)
                setForm({ categoryId: '', amount: '', alertThreshold: '80' })
                fetchData()
            } else {
                alert(data.error || 'Gagal menyimpan')
            }
        } catch (error) {
            console.error('Error saving budget:', error)
        }
    }

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
    const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    const usedCategoryIds = budgets.map(b => b.categoryId)
    const availableCategories = categories.filter(c => !usedCategoryIds.includes(c.id))

    const monthName = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Budget</h1>
                    <p className="page-subtitle">Atur batas pengeluaran bulanan</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowModal(true)}
                    disabled={availableCategories.length === 0}
                >
                    + Tambah Budget
                </button>
            </header>

            {/* Month Selector */}
            <div className={styles.monthSelector}>
                <button
                    className="btn btn-ghost"
                    onClick={() => {
                        if (month === 1) {
                            setMonth(12)
                            setYear(year - 1)
                        } else {
                            setMonth(month - 1)
                        }
                    }}
                >
                    ← Sebelumnya
                </button>
                <span className={styles.currentMonth}>{monthName}</span>
                <button
                    className="btn btn-ghost"
                    onClick={() => {
                        if (month === 12) {
                            setMonth(1)
                            setYear(year + 1)
                        } else {
                            setMonth(month + 1)
                        }
                    }}
                >
                    Selanjutnya →
                </button>
            </div>

            {/* Overall Summary */}
            <div className={`glass-card ${styles.summaryCard}`}>
                <div className={styles.summaryHeader}>
                    <div>
                        <p className={styles.summaryLabel}>Total Budget</p>
                        <p className={styles.summaryValue}>{formatCurrency(totalBudget)}</p>
                    </div>
                    <div className={styles.summaryRight}>
                        <p className={styles.summaryLabel}>Terpakai</p>
                        <p className={styles.summaryValue}>{formatCurrency(totalSpent)}</p>
                    </div>
                </div>
                <div className={styles.overallProgress}>
                    <div
                        className={`${styles.overallBar} ${overallPercentage > 100 ? styles.over : ''}`}
                        style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                    />
                </div>
                <p className={styles.remaining}>
                    Sisa: {formatCurrency(totalBudget - totalSpent)}
                </p>
            </div>

            {/* Budget List */}
            <div className={styles.budgetGrid}>
                {budgets.map(budget => (
                    <div
                        key={budget.id}
                        className={`card ${styles.budgetCard} ${budget.isOverBudget ? styles.over : budget.isNearLimit ? styles.warning : ''}`}
                    >
                        <div className={styles.budgetHeader}>
                            <div className={styles.categoryIcon} style={{ background: budget.category.color }}>
                                {budget.category.icon}
                            </div>
                            <div>
                                <h3 className={styles.categoryName}>{budget.category.name}</h3>
                                <p className={styles.budgetAmount}>Budget: {formatCurrency(budget.amount)}</p>
                            </div>
                        </div>

                        <div className={styles.progressContainer}>
                            <div className={styles.progressBar}>
                                <div
                                    className={`${styles.progress} ${budget.isOverBudget ? styles.progressOver : budget.isNearLimit ? styles.progressWarning : ''}`}
                                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                />
                            </div>
                            <div className={styles.progressInfo}>
                                <span>{formatCurrency(budget.spent)} terpakai</span>
                                <span className={budget.isOverBudget ? styles.overText : ''}>
                                    {budget.percentage.toFixed(0)}%
                                </span>
                            </div>
                        </div>

                        {budget.isOverBudget && (
                            <div className={styles.alertBadge}>⚠️ Melebihi budget!</div>
                        )}
                    </div>
                ))}
            </div>

            {budgets.length === 0 && (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">🎯</div>
                        <h3 className="empty-state-title">Belum ada budget</h3>
                        <p className="empty-state-desc">Set batas pengeluaran untuk mengontrol keuangan</p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            + Tambah Budget
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay open" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Tambah Budget</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Kategori</label>
                                    <select
                                        className="form-select"
                                        value={form.categoryId}
                                        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                        required
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {availableCategories.map(c => (
                                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Batas Budget</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Alert Threshold (%)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="80"
                                        min="1"
                                        max="100"
                                        value={form.alertThreshold}
                                        onChange={(e) => setForm({ ...form, alertThreshold: e.target.value })}
                                    />
                                    <p className="form-hint" style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.25rem' }}>
                                        Notifikasi saat penggunaan mencapai persentase ini
                                    </p>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Tambah
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
