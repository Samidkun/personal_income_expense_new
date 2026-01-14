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

interface Wallet {
    id: string
    name: string
    type: string
}

interface Transaction {
    id: string
    amount: number
    type: 'INCOME' | 'EXPENSE'
    description: string | null
    date: string
    category: Category
    wallet: Wallet
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

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [wallets, setWallets] = useState<Wallet[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Filters
    const [filterType, setFilterType] = useState<'all' | 'INCOME' | 'EXPENSE'>('all')
    const [filterCategory, setFilterCategory] = useState('')
    const [filterWallet, setFilterWallet] = useState('')

    // Form
    const [form, setForm] = useState({
        amount: '',
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
        description: '',
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        walletId: ''
    })

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (filterType !== 'all') params.set('type', filterType)
            if (filterCategory) params.set('categoryId', filterCategory)
            if (filterWallet) params.set('walletId', filterWallet)

            const [txRes, catRes, walletRes] = await Promise.all([
                fetch(`/api/transactions?${params}`),
                fetch('/api/categories'),
                fetch('/api/wallets')
            ])

            const [txData, catData, walletData] = await Promise.all([
                txRes.json(),
                catRes.json(),
                walletRes.json()
            ])

            if (txData.success) setTransactions(txData.data)
            if (catData.success) setCategories(catData.data)
            if (walletData.success) setWallets(walletData.data)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }, [filterType, filterCategory, filterWallet])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const url = editingId ? `/api/transactions/${editingId}` : '/api/transactions'
            const method = editingId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    amount: parseFloat(form.amount)
                })
            })

            const data = await res.json()

            if (data.success) {
                setShowModal(false)
                setEditingId(null)
                resetForm()
                fetchData()
            } else {
                alert(data.error || 'Gagal menyimpan transaksi')
            }
        } catch (error) {
            console.error('Error saving transaction:', error)
            alert('Terjadi kesalahan')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin hapus transaksi ini?')) return

        try {
            const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
            const data = await res.json()

            if (data.success) {
                fetchData()
            } else {
                alert(data.error || 'Gagal menghapus')
            }
        } catch (error) {
            console.error('Error deleting:', error)
        }
    }

    const handleEdit = (tx: Transaction) => {
        setForm({
            amount: String(tx.amount),
            type: tx.type,
            description: tx.description || '',
            date: new Date(tx.date).toISOString().split('T')[0],
            categoryId: tx.category.id,
            walletId: tx.wallet.id
        })
        setEditingId(tx.id)
        setShowModal(true)
    }

    const resetForm = () => {
        setForm({
            amount: '',
            type: 'EXPENSE',
            description: '',
            date: new Date().toISOString().split('T')[0],
            categoryId: '',
            walletId: ''
        })
    }

    const filteredCategories = categories.filter(c => c.type === form.type)

    if (loading && transactions.length === 0) {
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
                    <h1 className="page-title">Transaksi</h1>
                    <p className="page-subtitle">Kelola pemasukan dan pengeluaran</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        resetForm()
                        setEditingId(null)
                        setShowModal(true)
                    }}
                >
                    + Tambah Transaksi
                </button>
            </header>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <select
                        className="form-select"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as 'all' | 'INCOME' | 'EXPENSE')}
                    >
                        <option value="all">Semua Tipe</option>
                        <option value="INCOME">Pemasukan</option>
                        <option value="EXPENSE">Pengeluaran</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <select
                        className="form-select"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <select
                        className="form-select"
                        value={filterWallet}
                        onChange={(e) => setFilterWallet(e.target.value)}
                    >
                        <option value="">Semua Dompet</option>
                        {wallets.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Transaction List */}
            <div className="card">
                {transactions.length > 0 ? (
                    <div className={styles.transactionList}>
                        {transactions.map(tx => (
                            <div key={tx.id} className={styles.txRow}>
                                <div className={styles.txIcon} style={{ background: tx.category.color }}>
                                    {tx.category.icon}
                                </div>
                                <div className={styles.txInfo}>
                                    <p className={styles.txDesc}>{tx.description || tx.category.name}</p>
                                    <p className={styles.txMeta}>
                                        {tx.wallet.name} • {formatDate(tx.date)}
                                    </p>
                                </div>
                                <div className={styles.txRight}>
                                    <p className={`amount ${tx.type === 'INCOME' ? 'income' : 'expense'}`}>
                                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </p>
                                    <div className={styles.txActions}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(tx)}>✏️</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(tx.id)}>🗑️</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">💰</div>
                        <h3 className="empty-state-title">Belum ada transaksi</h3>
                        <p className="empty-state-desc">Mulai catat pemasukan dan pengeluaranmu</p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            + Tambah Transaksi
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay open" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}
                            </h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {/* Type Toggle */}
                                <div className={styles.typeToggle}>
                                    <button
                                        type="button"
                                        className={`${styles.typeBtn} ${form.type === 'EXPENSE' ? styles.active : ''} ${styles.expense}`}
                                        onClick={() => setForm({ ...form, type: 'EXPENSE', categoryId: '' })}
                                    >
                                        Pengeluaran
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.typeBtn} ${form.type === 'INCOME' ? styles.active : ''} ${styles.income}`}
                                        onClick={() => setForm({ ...form, type: 'INCOME', categoryId: '' })}
                                    >
                                        Pemasukan
                                    </button>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Jumlah</label>
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
                                    <label className="form-label">Kategori</label>
                                    <select
                                        className="form-select"
                                        value={form.categoryId}
                                        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                        required
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {filteredCategories.map(c => (
                                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Dompet</label>
                                    <select
                                        className="form-select"
                                        value={form.walletId}
                                        onChange={(e) => setForm({ ...form, walletId: e.target.value })}
                                        required
                                    >
                                        <option value="">Pilih Dompet</option>
                                        {wallets.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tanggal</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Deskripsi (opsional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Catatan..."
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? 'Simpan' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
