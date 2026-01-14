'use client'

import { useEffect, useState, useCallback } from 'react'
import styles from './page.module.css'

interface Category {
    id: string
    name: string
    icon: string
    color: string
    type: 'INCOME' | 'EXPENSE'
    isDefault: boolean
}

const categoryIcons = ['🍔', '🚗', '🛒', '🎮', '📄', '🏥', '📚', '🏠', '💼', '💻', '📈', '🎁', '💰', '📦', '✈️', '🎬', '🏋️', '👕', '💄', '🐶']
const categoryColors = [
    '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444',
    '#10B981', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
]

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')

    const [form, setForm] = useState({
        name: '',
        icon: '📦',
        color: '#3B82F6',
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE'
    })

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/categories')
            const data = await res.json()
            if (data.success) setCategories(data.data)
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })

            const data = await res.json()

            if (data.success) {
                setShowModal(false)
                setForm({ name: '', icon: '📦', color: '#3B82F6', type: activeTab })
                fetchCategories()
            } else {
                alert(data.error || 'Gagal menyimpan')
            }
        } catch (error) {
            console.error('Error saving category:', error)
        }
    }

    const filteredCategories = categories.filter(c => c.type === activeTab)

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
                    <h1 className="page-title">Kategori</h1>
                    <p className="page-subtitle">Kelola kategori pemasukan dan pengeluaran</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setForm({ ...form, type: activeTab })
                        setShowModal(true)
                    }}
                >
                    + Tambah Kategori
                </button>
            </header>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'EXPENSE' ? styles.active : ''}`}
                    onClick={() => setActiveTab('EXPENSE')}
                >
                    Pengeluaran
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'INCOME' ? styles.active : ''}`}
                    onClick={() => setActiveTab('INCOME')}
                >
                    Pemasukan
                </button>
            </div>

            {/* Category Grid */}
            <div className={styles.categoryGrid}>
                {filteredCategories.map(category => (
                    <div key={category.id} className={`card ${styles.categoryCard}`}>
                        <div
                            className={styles.categoryIcon}
                            style={{ background: category.color }}
                        >
                            {category.icon}
                        </div>
                        <h3 className={styles.categoryName}>{category.name}</h3>
                        {category.isDefault && (
                            <span className={`badge ${styles.defaultBadge}`}>Default</span>
                        )}
                    </div>
                ))}
            </div>

            {filteredCategories.length === 0 && (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">🏷️</div>
                        <h3 className="empty-state-title">Belum ada kategori</h3>
                        <p className="empty-state-desc">Tambah kategori untuk mengorganisir transaksi</p>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay open" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Tambah Kategori</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Nama Kategori</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Contoh: Makanan"
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
                                        onChange={(e) => setForm({ ...form, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                                    >
                                        <option value="EXPENSE">Pengeluaran</option>
                                        <option value="INCOME">Pemasukan</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Icon</label>
                                    <div className={styles.iconPicker}>
                                        {categoryIcons.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                className={`${styles.iconBtn} ${form.icon === icon ? styles.active : ''}`}
                                                onClick={() => setForm({ ...form, icon })}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Warna</label>
                                    <div className={styles.colorPicker}>
                                        {categoryColors.map(color => (
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
