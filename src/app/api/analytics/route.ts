import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const months = parseInt(searchParams.get('months') || '12')

        const now = new Date()
        const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)

        // Monthly breakdown
        const monthlyData = []
        for (let i = 0; i < months; i++) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1)
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - months + 2 + i, 0)

            const transactions = await prisma.transaction.findMany({
                where: {
                    date: { gte: monthStart, lte: monthEnd }
                }
            })

            const income = transactions
                .filter((t: any) => t.type === 'INCOME')
                .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

            const expense = transactions
                .filter((t: any) => t.type === 'EXPENSE')
                .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

            monthlyData.push({
                month: monthStart.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
                income,
                expense,
                net: income - expense
            })
        }

        // Category breakdown for current month
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const expensesByCategory = await prisma.transaction.groupBy({
            by: ['categoryId'],
            where: {
                type: 'EXPENSE',
                date: { gte: currentMonthStart }
            },
            _sum: { amount: true }
        })

        const incomeByCategory = await prisma.transaction.groupBy({
            by: ['categoryId'],
            where: {
                type: 'INCOME',
                date: { gte: currentMonthStart }
            },
            _sum: { amount: true }
        })

        const categories = await prisma.category.findMany()

        const categoryBreakdown = {
            expense: expensesByCategory.map((exp: any) => {
                const category = categories.find((c: any) => c.id === exp.categoryId)
                return {
                    name: category?.name || 'Unknown',
                    color: category?.color || '#6B7280',
                    amount: Number(exp._sum.amount || 0)
                }
            }).sort((a: any, b: any) => b.amount - a.amount),
            income: incomeByCategory.map((inc: any) => {
                const category = categories.find((c: any) => c.id === inc.categoryId)
                return {
                    name: category?.name || 'Unknown',
                    color: category?.color || '#10B981',
                    amount: Number(inc._sum.amount || 0)
                }
            }).sort((a: any, b: any) => b.amount - a.amount)
        }

        // Daily spending for current month
        const dailyTransactions = await prisma.transaction.findMany({
            where: {
                date: { gte: currentMonthStart }
            },
            orderBy: { date: 'asc' }
        })

        const dailySpending: Record<string, { income: number; expense: number }> = {}
        dailyTransactions.forEach((t: any) => {
            const day = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
            if (!dailySpending[day]) {
                dailySpending[day] = { income: 0, expense: 0 }
            }
            if (t.type === 'INCOME') {
                dailySpending[day].income += Number(t.amount)
            } else {
                dailySpending[day].expense += Number(t.amount)
            }
        })

        // Top spending categories (last 3 months)
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        const topCategories = await prisma.transaction.groupBy({
            by: ['categoryId'],
            where: {
                type: 'EXPENSE',
                date: { gte: threeMonthsAgo }
            },
            _sum: { amount: true }
        })

        const topSpending = topCategories
            .map((tc: any) => {
                const category = categories.find((c: any) => c.id === tc.categoryId)
                return {
                    name: category?.name || 'Unknown',
                    icon: category?.icon || '📦',
                    color: category?.color || '#6B7280',
                    amount: Number(tc._sum.amount || 0)
                }
            })
            .sort((a: any, b: any) => b.amount - a.amount)
            .slice(0, 5)

        // Summary stats
        const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0)
        const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0)
        const avgMonthlyIncome = totalIncome / months
        const avgMonthlyExpense = totalExpense / months

        return NextResponse.json({
            success: true,
            data: {
                monthlyData,
                categoryBreakdown,
                dailySpending: Object.entries(dailySpending).map(([day, data]) => ({
                    day,
                    ...data
                })),
                topSpending,
                summary: {
                    totalIncome,
                    totalExpense,
                    avgMonthlyIncome,
                    avgMonthlyExpense,
                    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0
                }
            }
        })
    } catch (error) {
        console.error('Analytics error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch analytics' },
            { status: 500 }
        )
    }
}
