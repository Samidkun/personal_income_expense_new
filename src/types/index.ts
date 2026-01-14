import { Decimal } from '@prisma/client/runtime/library'

export type TransactionType = 'INCOME' | 'EXPENSE'
export type WalletType = 'CASH' | 'BANK' | 'EWALLET'
export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type Theme = 'LIGHT' | 'DARK' | 'SYSTEM'

export interface Wallet {
    id: string
    name: string
    type: WalletType
    balance: Decimal | number
    currency: string
    color: string
    icon: string
    createdAt: Date
    updatedAt: Date
}

export interface Category {
    id: string
    name: string
    icon: string
    color: string
    type: TransactionType
    isDefault: boolean
    createdAt: Date
    updatedAt: Date
}

export interface Transaction {
    id: string
    amount: Decimal | number
    type: TransactionType
    description?: string | null
    date: Date
    categoryId: string
    category?: Category
    walletId: string
    wallet?: Wallet
    recurringId?: string | null
    tags?: Tag[]
    attachments?: Attachment[]
    createdAt: Date
    updatedAt: Date
}

export interface Tag {
    id: string
    name: string
    color: string
    createdAt: Date
}

export interface Attachment {
    id: string
    transactionId: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
    createdAt: Date
}

export interface Budget {
    id: string
    categoryId: string
    category?: Category
    amount: Decimal | number
    month: number
    year: number
    alertThreshold: number
    spent?: number
    percentage?: number
    createdAt: Date
    updatedAt: Date
}

export interface RecurringTransaction {
    id: string
    amount: Decimal | number
    type: TransactionType
    description?: string | null
    categoryId: string
    category?: Category
    walletId: string
    frequency: Frequency
    startDate: Date
    nextDate: Date
    endDate?: Date | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

export interface Reminder {
    id: string
    title: string
    description?: string | null
    amount?: Decimal | number | null
    dueDate: Date
    isCompleted: boolean
    whatsappSent: boolean
    notifyDaysBefore: number
    createdAt: Date
    updatedAt: Date
}

export interface Settings {
    id: string
    password: string
    whatsappNumber?: string | null
    defaultCurrency: string
    theme: Theme
    geminiApiKey?: string | null
    fonntApiKey?: string | null
    createdAt: Date
    updatedAt: Date
}

export interface DashboardStats {
    totalBalance: number
    totalIncome: number
    totalExpense: number
    incomeChange: number
    expenseChange: number
    wallets: Wallet[]
    recentTransactions: Transaction[]
    categoryBreakdown: {
        categoryId: string
        categoryName: string
        categoryColor: string
        total: number
        percentage: number
    }[]
    monthlyTrend: {
        month: string
        income: number
        expense: number
    }[]
}

export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    message?: string
}
