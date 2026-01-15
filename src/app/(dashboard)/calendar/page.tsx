'use client'

import { useState } from 'react'
import useSWR from 'swr'
import styles from './page.module.css'

interface Transaction {
    id: string
    amount: number
    type: 'INCOME' | 'EXPENSE'
    description: string | null
    date: string
    category: { name: string; icon: string; color: string }
}

interface DayData {
    date: Date
    transactions: Transaction[]
    income: number
    expense: number
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

export default function CalendarPage() {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const now = new Date()
    const [month, setMonth] = useState(now.getMonth())
    const [year, setYear] = useState(now.getFullYear())

    // SWR Data Fetching
    const startDate = new Date(year, month, 1).toISOString()
    const endDate = new Date(year, month + 1, 0).toISOString()

    // Only fetch if we have valid dates (which we always do here)
    const { data: transactions = [], isLoading } = useSWR<Transaction[]>(
        `/api/transactions?startDate=${startDate}&endDate=${endDate}&limit=100`,
        fetcher
    )
    const loading = isLoading

    // Generate calendar data
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const startingDay = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()

    const calendarDays: (DayData | null)[] = []

    // Empty cells for days before month starts
    for (let i = 0; i < startingDay; i++) {
        calendarDays.push(null)
    }

    // Fill in the days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        const dayTransactions = transactions.filter(t => {
            const txDate = new Date(t.date)
            return txDate.getDate() === day
        })

        const income = dayTransactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0)

        const expense = dayTransactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0)

        calendarDays.push({ date, transactions: dayTransactions, income, expense })
    }

    const monthName = new Date(year, month).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

    const selectedDayData = selectedDate
        ? calendarDays.find(d => d && d.date.getDate() === selectedDate.getDate())
        : null

    const isToday = (date: Date) => {
        const today = new Date()
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
    }

    return (
        <div className={styles.page}>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Kalender</h1>
                    <p className="page-subtitle">Lihat transaksi berdasarkan tanggal</p>
                </div>
            </header>

            {/* Month Navigation */}
            <div className={styles.monthNav}>
                <button
                    className="btn btn-ghost"
                    onClick={() => {
                        if (month === 0) {
                            setMonth(11)
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
                        if (month === 11) {
                            setMonth(0)
                            setYear(year + 1)
                        } else {
                            setMonth(month + 1)
                        }
                    }}
                >
                    Selanjutnya →
                </button>
            </div>

            <div className={styles.calendarContainer}>
                {/* Calendar Grid */}
                <div className={`card ${styles.calendar}`}>
                    {loading && (
                        <div className={styles.loadingOverlay}>
                            <div className="loading-spinner"></div>
                        </div>
                    )}

                    <div className={styles.weekdays}>
                        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                            <div key={day} className={styles.weekday}>{day}</div>
                        ))}
                    </div>

                    <div className={styles.days}>
                        {calendarDays.map((day, idx) => (
                            <div
                                key={idx}
                                className={`${styles.day} ${!day ? styles.empty : ''} ${day && isToday(day.date) ? styles.today : ''} ${selectedDate && day && day.date.getDate() === selectedDate.getDate() ? styles.selected : ''}`}
                                onClick={() => day && setSelectedDate(day.date)}
                            >
                                {day && (
                                    <>
                                        <span className={styles.dayNumber}>{day.date.getDate()}</span>
                                        {(day.income > 0 || day.expense > 0) && (
                                            <div className={styles.dayIndicators}>
                                                {day.income > 0 && <span className={styles.incomeIndicator} />}
                                                {day.expense > 0 && <span className={styles.expenseIndicator} />}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Day Detail */}
                <div className={`card ${styles.dayDetail}`}>
                    {selectedDayData ? (
                        <>
                            <h3 className={styles.detailTitle}>
                                {selectedDate?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>

                            <div className={styles.detailSummary}>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Pemasukan</span>
                                    <span className="amount income">{formatCurrency(selectedDayData.income)}</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Pengeluaran</span>
                                    <span className="amount expense">{formatCurrency(selectedDayData.expense)}</span>
                                </div>
                            </div>

                            {selectedDayData.transactions.length > 0 ? (
                                <div className={styles.txList}>
                                    {selectedDayData.transactions.map(tx => (
                                        <div key={tx.id} className={styles.txItem}>
                                            <div className={styles.txIcon} style={{ background: tx.category.color }}>
                                                {tx.category.icon}
                                            </div>
                                            <div className={styles.txInfo}>
                                                <p className={styles.txDesc}>{tx.description || tx.category.name}</p>
                                            </div>
                                            <span className={`amount ${tx.type === 'INCOME' ? 'income' : 'expense'}`}>
                                                {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.noTx}>Tidak ada transaksi</div>
                            )}
                        </>
                    ) : (
                        <div className={styles.noSelection}>
                            <span>📅</span>
                            <p>Pilih tanggal untuk melihat detail</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
