'use client'

import styles from './page.module.css'

export default function RecurringPage() {
    return (
        <div className={styles.page}>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Transaksi Berulang</h1>
                    <p className="page-subtitle">Atur transaksi otomatis setiap periode</p>
                </div>
            </header>

            <div className="card">
                <div className="empty-state">
                    <div className="empty-state-icon">🔄</div>
                    <h3 className="empty-state-title">Segera Hadir</h3>
                    <p className="empty-state-desc">
                        Fitur transaksi berulang sedang dalam pengembangan.<br />
                        Kamu bisa set gaji bulanan, tagihan rutin, dan lainnya secara otomatis.
                    </p>
                </div>
            </div>
        </div>
    )
}
