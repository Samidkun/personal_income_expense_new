'use client'

import styles from './page.module.css'

export default function RemindersPage() {
    return (
        <div className={styles.page}>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Pengingat</h1>
                    <p className="page-subtitle">Atur pengingat tagihan dan pembayaran</p>
                </div>
            </header>

            <div className="card">
                <div className="empty-state">
                    <div className="empty-state-icon">🔔</div>
                    <h3 className="empty-state-title">Segera Hadir</h3>
                    <p className="empty-state-desc">
                        Fitur pengingat sedang dalam pengembangan.<br />
                        Setelah API WhatsApp dikonfigurasi, kamu bisa menerima notifikasi tagihan langsung ke WhatsApp.
                    </p>
                </div>
            </div>
        </div>
    )
}
