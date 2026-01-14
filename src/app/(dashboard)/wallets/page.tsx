'use client'

import { useEffect, useState, useCallback } from 'react'
import styles from './page.module.css'

interface Wallet {
    id: string
    name: string
    type: 'CASH' | 'BANK' | 'EWALLET'
    balance: number
    color: string
    icon: string
    currency: string
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

const walletTypeLabels = {
    CASH: 'Tunai',
    BANK: 'Bank',
    EWALLET: 'E-Wallet'
}

const walletColors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
    '#F59E0B', '#EF4444', '#14B8A6', '#6366F1'
]

export default function WalletsPage() {
    const [wallets, setWallets] = useState<Wallet[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [form, setForm] = useState({
        name: '',
        type: 'CASH' as 'CASH' | 'BANK' | 'EWALLET',
        balance: '',
        color: '#3B82F6',
        icon: '💵'
    })

    const fetchWallets = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/wallets')
            const data = await res.json()
            if (data.success) setWallets(data.data)
        } catch (error) {
            console.error('Error fetching wallets:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchWallets()
    }, [fetchWallets])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const url = editingId ? `/api/wallets/${editingId}` : '/api/wallets'
            const method = editingId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    balance: form.balance ? parseFloat(form.balance) : 0
                })
            })

            const data = await res.json()

            if (data.success) {
                setShowModal(false)
                setEditingId(null)
                resetForm()
                fetchWallets()
            } else {
                alert(data.error || 'Gagal menyimpan')
            }
        } catch (error) {
            console.error('Error saving wallet:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin hapus dompet ini?')) return

        try {
            const res = await fetch(`/api/wallets/${id}`, { method: 'DELETE' })
            const data = await res.json()

            if (data.success) {
                fetchWallets()
            } else {
                alert(data.error || 'Gagal menghapus')
            }
        } catch (error) {
            console.error('Error deleting:', error)
        }
    }

    const handleEdit = (wallet: Wallet) => {
        setForm({
            name: wallet.name,
            type: wallet.type,
            balance: String(wallet.balance),
            color: wallet.color,
            icon: wallet.icon
        })
        setEditingId(wallet.id)
        setShowModal(true)
    }

    const resetForm = () => {
        setForm({
            name: '',
            type: 'CASH',
            balance: '',
            color: '#3B82F6',
            icon: '💵'
        })
    }

    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)

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
                    <h1 className="page-title">Dompet</h1>
                    <p className="page-subtitle">Kelola sumber dana kamu</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        resetForm()
                        setEditingId(null)
                        setShowModal(true)
                    }}
                >
                    + Tambah Dompet
                </button>
            </header>

            {/* Total Balance */}
            <div className={`glass-card ${styles.totalCard}`}>
                <p className={styles.totalLabel}>Total Saldo</p>
                <p className={styles.totalValue}>{formatCurrency(totalBalance)}</p>
                <p className={styles.walletCount}>{wallets.length} dompet terdaftar</p>
            </div>

            {/* Wallet Grid */}
            <div className={styles.walletGrid}>
                {wallets.map(wallet => (
                    <div
                        key={wallet.id}
                        className={`card ${styles.walletCard}`}
                        style={{ borderTopColor: wallet.color }}
                    >
                        <div className={styles.walletHeader}>
                            <div className={styles.walletIcon} style={{ background: wallet.color }}>
                                {wallet.icon}
                            </div>
                            <div className={styles.walletActions}>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(wallet)}>✏️</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(wallet.id)}>🗑️</button>
                            </div>
                        </div>
                        <h3 className={styles.walletName}>{wallet.name}</h3>
                        <span className={`badge ${styles.walletType}`}>{walletTypeLabels[wallet.type]}</span>
                        <p className={styles.walletBalance}>{formatCurrency(wallet.balance)}</p>
                    </div>
                ))}
            </div>

            {wallets.length === 0 && (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">👛</div>
                        <h3 className="empty-state-title">Belum ada dompet</h3>
                        <p className="empty-state-desc">Tambahkan dompet untuk mulai mencatat</p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            + Tambah Dompet
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay open" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingId ? 'Edit Dompet' : 'Tambah Dompet'}
                            </h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Nama Dompet</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Contoh: Bank BCA"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tipe</label>
                                    <select
                                        className="form-select"
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value as 'CASH' | 'BANK' | 'EWALLET' })}
                                    >
                                        <option value="CASH">💵 Tunai</option>
                                        <option value="BANK">🏦 Bank</option>
                                        <option value="EWALLET">📱 E-Wallet</option>
                                    </select>
                                </div>

                                {!editingId && (
                                    <div className="form-group">
                                        <label className="form-label">Saldo Awal</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            value={form.balance}
                                            onChange={(e) => setForm({ ...form, balance: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Warna</label>
                                    <div className={styles.colorPicker}>
                                        {walletColors.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`${styles.colorBtn} ${form.color === color ? styles.active : ''}`}
                                                style={{ background: color }}
                                                onClick={() => setForm({ ...form, color })}
                                            />
                                        ))}
                                    </div>
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
