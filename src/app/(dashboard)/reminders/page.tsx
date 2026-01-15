'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import styles from './page.module.css'

interface Reminder {
    id: string
    title: string
    description: string | null
    amount: number | null
    dueDate: string
    isCompleted: boolean
    notifyDaysBefore: number
}

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json().then(data => data.data))

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
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function getDaysUntil(dateString: string): number {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const due = new Date(dateString)
    due.setHours(0, 0, 0, 0)
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default function RemindersPage() {
    // Local state
    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending')

    const [form, setForm] = useState({
        title: '',
        description: '',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        notifyDaysBefore: '1'
    })

    // SWR Fetching
    const { data: reminders = [], isLoading } = useSWR<Reminder[]>('/api/reminders', fetcher)
    const loading = isLoading

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const url = editId ? `/api/reminders/${editId}` : '/api/reminders'
            const method = editId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    amount: form.amount ? parseFloat(form.amount) : null,
                    notifyDaysBefore: parseInt(form.notifyDaysBefore)
                })
            })

            const data = await res.json()

            if (data.success) {
                setShowModal(false)
                resetForm()
                mutate('/api/reminders')
            } else {
                alert(data.error || 'Gagal menyimpan')
            }
        } catch (error) {
            console.error('Error saving:', error)
        }
    }

    const handleToggleComplete = async (id: string, isCompleted: boolean) => {
        try {
            await fetch(`/api/reminders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCompleted: !isCompleted })
            })
            mutate('/api/reminders')
        } catch (error) {
            console.error('Error toggling:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus pengingat ini?')) return

        try {
            const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
            const data = await res.json()

            if (data.success) {
                mutate('/api/reminders')
            }
        } catch (error) {
            console.error('Error deleting:', error)
        }
    }

    const handleEdit = (item: Reminder) => {
        setEditId(item.id)
        setForm({
            title: item.title,
            description: item.description || '',
            amount: item.amount?.toString() || '',
            dueDate: item.dueDate.split('T')[0],
            notifyDaysBefore: item.notifyDaysBefore.toString()
        })
        setShowModal(true)
    }

    const resetForm = () => {
        setEditId(null)
        setForm({
            title: '',
            description: '',
            amount: '',
            dueDate: new Date().toISOString().split('T')[0],
            notifyDaysBefore: '1'
        })
    }

    const filteredReminders = reminders.filter(r => {
        if (filter === 'pending') return !r.isCompleted
        if (filter === 'completed') return r.isCompleted
        return true
    })

    const upcomingReminders = reminders.filter(r => {
        if (r.isCompleted) return false
        const days = getDaysUntil(r.dueDate)
        return days <= r.notifyDaysBefore && days >= 0
    })

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
                    <h1 className="page-title">Pengingat</h1>
                    <p className="page-subtitle">Kelola pengingat tagihan dan pembayaran</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
                    + Tambah Pengingat
                </button>
            </header>

            {/* Alert Banner */}
            {upcomingReminders.length > 0 && (
                <div className={styles.alertBanner}>
                    <span className={styles.alertIcon}>⚠️</span>
                    <span>Ada <strong>{upcomingReminders.length}</strong> pengingat yang akan jatuh tempo!</span>
                </div>
            )}

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
                <button
                    className={`${styles.filterTab} ${filter === 'pending' ? styles.active : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    📋 Belum Selesai ({reminders.filter(r => !r.isCompleted).length})
                </button>
                <button
                    className={`${styles.filterTab} ${filter === 'completed' ? styles.active : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    ✅ Selesai ({reminders.filter(r => r.isCompleted).length})
                </button>
                <button
                    className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    📑 Semua ({reminders.length})
                </button>
            </div>

            {filteredReminders.length > 0 ? (
                <div className={styles.reminderList}>
                    {filteredReminders.map(item => {
                        const daysUntil = getDaysUntil(item.dueDate)
                        const isOverdue = daysUntil < 0 && !item.isCompleted
                        const isUrgent = daysUntil <= item.notifyDaysBefore && daysUntil >= 0 && !item.isCompleted

                        return (
                            <div
                                key={item.id}
                                className={`card ${styles.reminderCard} ${item.isCompleted ? styles.completed : ''} ${isOverdue ? styles.overdue : ''} ${isUrgent ? styles.urgent : ''}`}
                            >
                                <div className={styles.cardMain}>
                                    <button
                                        className={styles.checkbox}
                                        onClick={() => handleToggleComplete(item.id, item.isCompleted)}
                                    >
                                        {item.isCompleted ? '✅' : '⬜'}
                                    </button>

                                    <div className={styles.cardInfo}>
                                        <h3 className={styles.cardTitle}>{item.title}</h3>
                                        {item.description && (
                                            <p className={styles.cardDesc}>{item.description}</p>
                                        )}
                                        <div className={styles.cardMeta}>
                                            <span className={styles.dueDate}>
                                                📅 {formatDate(item.dueDate)}
                                            </span>
                                            {!item.isCompleted && (
                                                <span className={`badge ${isOverdue ? 'badge-danger' : isUrgent ? 'badge-warning' : ''}`}>
                                                    {isOverdue
                                                        ? `Terlambat ${Math.abs(daysUntil)} hari`
                                                        : daysUntil === 0
                                                            ? 'Hari ini!'
                                                            : `${daysUntil} hari lagi`
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {item.amount && (
                                        <div className={styles.cardAmount}>
                                            <span className="amount expense">{formatCurrency(item.amount)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.cardActions}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(item)}>
                                        ✏️ Edit
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(item.id)}>
                                        🗑️ Hapus
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">🔔</div>
                        <h3 className="empty-state-title">Tidak ada pengingat</h3>
                        <p className="empty-state-desc">
                            {filter === 'completed'
                                ? 'Belum ada pengingat yang selesai'
                                : 'Tambahkan pengingat untuk tagihan atau pembayaran rutin'
                            }
                        </p>
                        {filter !== 'completed' && (
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                + Tambah Pengingat
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay open" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editId ? 'Edit' : 'Tambah'} Pengingat</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Judul *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Contoh: Bayar Listrik"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Keterangan</label>
                                    <textarea
                                        className="form-input"
                                        placeholder="Keterangan tambahan (opsional)"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        rows={2}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Jumlah (Opsional)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Tanggal Jatuh Tempo *</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={form.dueDate}
                                            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Ingatkan berapa hari sebelumnya?</label>
                                    <select
                                        className="form-select"
                                        value={form.notifyDaysBefore}
                                        onChange={(e) => setForm({ ...form, notifyDaysBefore: e.target.value })}
                                    >
                                        <option value="0">Hari H</option>
                                        <option value="1">1 hari sebelumnya</option>
                                        <option value="3">3 hari sebelumnya</option>
                                        <option value="7">1 minggu sebelumnya</option>
                                    </select>
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
