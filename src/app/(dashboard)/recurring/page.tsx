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
}

interface RecurringTransaction {
    id: string
    amount: number
    type: 'INCOME' | 'EXPENSE'
    description: string | null
    category: Category
    walletId: string
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
    startDate: string
    nextDate: string
    endDate: string | null
    isActive: boolean
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

const frequencyLabels: Record<string, string> = {
    DAILY: 'Harian',
    WEEKLY: 'Mingguan',
    MONTHLY: 'Bulanan',
    YEARLY: 'Tahunan'
}

export default function RecurringPage() {
    const [recurring, setRecurring] = useState<RecurringTransaction[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [wallets, setWallets] = useState<Wallet[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)

    const [form, setForm] = useState({
        amount: '',
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
        description: '',
        categoryId: '',
        walletId: '',
        frequency: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    })

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const [recRes, catRes, walRes] = await Promise.all([
                fetch('/api/recurring'),
                fetch('/api/categories'),
                fetch('/api/wallets')
            ])

            const [recData, catData, walData] = await Promise.all([
                recRes.json(),
                catRes.json(),
                walRes.json()
            ])

            if (recData.success) setRecurring(recData.data)
            if (catData.success) setCategories(catData.data)
            if (walData.success) setWallets(walData.data)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const url = editId ? `/api/recurring/${editId}` : '/api/recurring'
            const method = editId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    amount: parseFloat(form.amount),
                    endDate: form.endDate || null
                })
            })

            const data = await res.json()

            if (data.success) {
                setShowModal(false)
                resetForm()
                fetchData()
            } else {
                alert(data.error || 'Gagal menyimpan')
            }
        } catch (error) {
            console.error('Error saving:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus transaksi berulang ini?')) return

        try {
            const res = await fetch(`/api/recurring/${id}`, { method: 'DELETE' })
            const data = await res.json()

            if (data.success) {
                fetchData()
            }
        } catch (error) {
            console.error('Error deleting:', error)
        }
    }

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await fetch(`/api/recurring/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isActive })
            })
            fetchData()
        } catch (error) {
            console.error('Error toggling:', error)
        }
    }

    const handleEdit = (item: RecurringTransaction) => {
        setEditId(item.id)
        setForm({
            amount: item.amount.toString(),
            type: item.type,
            description: item.description || '',
            categoryId: item.category.id,
            walletId: item.walletId,
            frequency: item.frequency,
            startDate: item.startDate.split('T')[0],
            endDate: item.endDate ? item.endDate.split('T')[0] : ''
        })
        setShowModal(true)
    }

    const resetForm = () => {
        setEditId(null)
        setForm({
            amount: '',
            type: 'EXPENSE',
            description: '',
            categoryId: '',
            walletId: '',
            frequency: 'MONTHLY',
            startDate: new Date().toISOString().split('T')[0],
            endDate: ''
        })
    }

    const filteredCategories = categories.filter(c => c.type === form.type)

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
                    <h1 className="page-title">Transaksi Berulang</h1>
                    <p className="page-subtitle">Atur transaksi otomatis setiap periode</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
                    + Tambah Berulang
                </button>
            </header>

            {recurring.length > 0 ? (
                <div className={styles.recurringList}>
                    {recurring.map(item => (
                        <div key={item.id} className={`card ${styles.recurringCard} ${!item.isActive ? styles.inactive : ''}`}>
                            <div className={styles.cardHeader}>
                                <div className={styles.categoryIcon} style={{ background: item.category.color }}>
                                    {item.category.icon}
                                </div>
                                <div className={styles.cardInfo}>
                                    <h3 className={styles.cardTitle}>{item.description || item.category.name}</h3>
                                    <p className={styles.cardMeta}>
                                        <span className={`badge ${item.type === 'INCOME' ? 'badge-success' : 'badge-danger'}`}>
                                            {item.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                                        </span>
                                        <span className="badge">{frequencyLabels[item.frequency]}</span>
                                    </p>
                                </div>
                                <div className={styles.cardAmount}>
                                    <p className={`amount ${item.type === 'INCOME' ? 'income' : 'expense'}`}>
                                        {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                                    </p>
                                </div>
                            </div>

                            <div className={styles.cardDetails}>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Mulai</span>
                                    <span>{formatDate(item.startDate)}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Selanjutnya</span>
                                    <span className={styles.nextDate}>{formatDate(item.nextDate)}</span>
                                </div>
                                {item.endDate && (
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Berakhir</span>
                                        <span>{formatDate(item.endDate)}</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.cardActions}>
                                <button
                                    className={`btn btn-sm ${item.isActive ? 'btn-secondary' : 'btn-success'}`}
                                    onClick={() => handleToggleActive(item.id, item.isActive)}
                                >
                                    {item.isActive ? '⏸️ Pause' : '▶️ Aktifkan'}
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(item)}>
                                    ✏️ Edit
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(item.id)}>
                                    🗑️ Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">🔄</div>
                        <h3 className="empty-state-title">Belum ada transaksi berulang</h3>
                        <p className="empty-state-desc">
                            Tambahkan transaksi otomatis seperti gaji bulanan atau tagihan rutin
                        </p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            + Tambah Transaksi Berulang
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay open" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editId ? 'Edit' : 'Tambah'} Transaksi Berulang</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Tipe</label>
                                    <div className={styles.typeToggle}>
                                        <button
                                            type="button"
                                            className={`${styles.typeBtn} ${form.type === 'EXPENSE' ? styles.active : ''}`}
                                            onClick={() => setForm({ ...form, type: 'EXPENSE', categoryId: '' })}
                                        >
                                            💸 Pengeluaran
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.typeBtn} ${form.type === 'INCOME' ? styles.active : ''}`}
                                            onClick={() => setForm({ ...form, type: 'INCOME', categoryId: '' })}
                                        >
                                            💰 Pemasukan
                                        </button>
                                    </div>
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
                                    <label className="form-label">Keterangan</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Contoh: Gaji Bulanan"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>

                                <div className="form-row">
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
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Frekuensi</label>
                                    <select
                                        className="form-select"
                                        value={form.frequency}
                                        onChange={(e) => setForm({ ...form, frequency: e.target.value as typeof form.frequency })}
                                    >
                                        <option value="DAILY">Harian</option>
                                        <option value="WEEKLY">Mingguan</option>
                                        <option value="MONTHLY">Bulanan</option>
                                        <option value="YEARLY">Tahunan</option>
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Tanggal Mulai</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={form.startDate}
                                            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Tanggal Berakhir (Opsional)</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={form.endDate}
                                            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editId ? 'Simpan' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
