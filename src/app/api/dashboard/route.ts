/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

        // Get total balance from all wallets
        const wallets = await prisma.wallet.findMany()
        const totalBalance = wallets.reduce((sum: number, w: any) => sum + Number(w.balance), 0)

        // Get current month income & expense
        const currentMonthTransactions = await prisma.transaction.findMany({
            where: {
                date: { gte: startOfMonth }
            }
        })

        const totalIncome = currentMonthTransactions
            .filter((t: any) => t.type === 'INCOME')
            .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

        const totalExpense = currentMonthTransactions
            .filter((t: any) => t.type === 'EXPENSE')
            .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

        // Get last month for comparison
        const lastMonthTransactions = await prisma.transaction.findMany({
            where: {
                date: {
                    gte: startOfLastMonth,
                    lte: endOfLastMonth
                }
            }
        })

        const lastMonthIncome = lastMonthTransactions
            .filter((t: any) => t.type === 'INCOME')
            .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

        const lastMonthExpense = lastMonthTransactions
            .filter((t: any) => t.type === 'EXPENSE')
            .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

        // Calculate percentage change
        const incomeChange = lastMonthIncome > 0
            ? ((totalIncome - lastMonthIncome) / lastMonthIncome) * 100
            : 0

        const expenseChange = lastMonthExpense > 0
            ? ((totalExpense - lastMonthExpense) / lastMonthExpense) * 100
            : 0

        // Get recent transactions
        const recentTransactions = await prisma.transaction.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            include: {
                category: true,
                wallet: true
            }
        })

        // Get category breakdown for current month expenses
        const expensesByCategory = await prisma.transaction.groupBy({
            by: ['categoryId'],
            where: {
                type: 'EXPENSE',
                date: { gte: startOfMonth }
            },
            _sum: { amount: true }
        })

        const categories = await prisma.category.findMany({
            where: { type: 'EXPENSE' }
        })

        const categoryBreakdown = expensesByCategory
            .map((exp: any) => {
                const category = categories.find((c: any) => c.id === exp.categoryId)
                const total = Number(exp._sum.amount || 0)
                return {
                    categoryId: exp.categoryId,
                    categoryName: category?.name || 'Unknown',
                    categoryColor: category?.color || '#6B7280',
                    total,
                    percentage: totalExpense > 0 ? (total / totalExpense) * 100 : 0
                }
            })
            .sort((a: any, b: any) => b.total - a.total)
            .slice(0, 6)

        // Get monthly trend (last 6 months) - Optimized
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

        // Single query for trend data
        const trendTransactions = await prisma.transaction.findMany({
            where: {
                date: { gte: sixMonthsAgo }
            },
            select: { date: true, type: true, amount: true }
        })

        const monthlyTrend = []
        for (let i = 5; i >= 0; i--) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const monthLabel = targetDate.toLocaleDateString('id-ID', { month: 'short' })

            // Filter in memory
            const monthTx = trendTransactions.filter((t: any) => {
                const d = new Date(t.date)
                return d.getMonth() === targetDate.getMonth() && d.getFullYear() === targetDate.getFullYear()
            })

            const income = monthTx
                .filter((t: any) => t.type === 'INCOME')
                .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

            const expense = monthTx
                .filter((t: any) => t.type === 'EXPENSE')
                .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

            monthlyTrend.push({
                month: monthLabel,
                income,
                expense
            })
        }

        return NextResponse.json({
            success: true,
            data: {
                totalBalance,
                totalIncome,
                totalExpense,
                incomeChange,
                expenseChange,
                wallets,
                recentTransactions: recentTransactions.map((t: any) => ({
                    id: t.id,
                    amount: Number(t.amount),
                    type: t.type,
                    description: t.description,
                    date: t.date.toISOString(),
                    category: {
                        name: t.category.name,
                        icon: t.category.icon,
                        color: t.category.color
                    },
                    wallet: {
                        name: t.wallet.name
                    }
                })),
                categoryBreakdown,
                monthlyTrend
            }
        })
    } catch (error) {
        console.error('Dashboard API error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch dashboard data',
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        )
    }
}
