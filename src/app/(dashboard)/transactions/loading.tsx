import styles from './page.module.css'

export default function Loading() {
    return (
        <div className={styles.page}>
            <header className="page-header">
                <div>
                    <div className="skeleton" style={{ width: '150px', height: '32px', marginBottom: '8px' }}></div>
                    <div className="skeleton" style={{ width: '200px', height: '20px' }}></div>
                </div>
                <div className="skeleton" style={{ width: '150px', height: '40px', borderRadius: '8px' }}></div>
            </header>

            <div className={styles.filters}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton" style={{ flex: 1, height: '40px', borderRadius: '8px' }}></div>
                ))}
            </div>

            <div className="card">
                <div className={styles.transactionList}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={styles.txRow} style={{ opacity: 0.7 }}>
                            <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
                            <div className={styles.txInfo} style={{ width: '100%' }}>
                                <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '8px' }}></div>
                                <div className="skeleton" style={{ width: '40%', height: '16px' }}></div>
                            </div>
                            <div className={styles.txRight}>
                                <div className="skeleton" style={{ width: '80px', height: '20px', marginBottom: '8px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
