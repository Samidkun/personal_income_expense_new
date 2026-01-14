'use client'

import styles from './page.module.css'

export default function AnalyticsPage() {
    return (
        <div className={styles.page}>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Analitik</h1>
                    <p className="page-subtitle">Visualisasi dan tren keuangan</p>
                </div>
            </header>

            <div className="card">
                <div className="empty-state">
                    <div className="empty-state-icon">📈</div>
                    <h3 className="empty-state-title">Segera Hadir</h3>
                    <p className="empty-state-desc">
                        Fitur analitik lanjutan sedang dalam pengembangan.<br />
                        Akan tersedia grafik detail, perbandingan bulanan, dan insight keuangan.
                    </p>
                </div>
            </div>
        </div>
    )
}
