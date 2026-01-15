import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const months = parseInt(searchParams.get('months') || '12')

        const now = new Date()
        // Start date for the entire range (monthly trends)
        const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)

        // Start date for current month (daily breakdown & current stats)
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        // Start date for last 3 months (top spending)
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)

        // Fetch everything in parallel
        const [
            allRangeTransactions,
            categories
        ] = await Promise.all([
            // 1. Fetch ALL transactions for the selected range (e.g. 1 year)
            // This allows us to calculate monthly trends, daily spending, and summaries in memory
            // without making 12+ database calls.
            prisma.transaction.findMany({
                where: {
                    date: { gte: startDate }
                },
                select: {
                    date: true,
                    amount: true,
                    type: true,
                    categoryId: true
                },
                orderBy: { date: 'asc' }
            }),
            // 2. Fetch categories
            prisma.category.findMany()
        ])

        // --- Processing Monthly Trends ---
        const monthlyData = []
        for (let i = 0; i < months; i++) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1)
            const monthKey = targetDate.getMonth() + '-' + targetDate.getFullYear()

            // Filter transactions for this month (in memory)
            const monthTx = allRangeTransactions.filter((t: any) => {
                const d = new Date(t.date)
                return d.getMonth() === targetDate.getMonth() && d.getFullYear() === targetDate.getFullYear()
            })

            const income = monthTx.reduce((sum: number, t: any) => t.type === 'INCOME' ? sum + Number(t.amount) : sum, 0)
            const expense = monthTx.reduce((sum: number, t: any) => t.type === 'EXPENSE' ? sum + Number(t.amount) : sum, 0)

            monthlyData.push({
                month: targetDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
                income,
                expense,
                net: income - expense
            })
        }

        // --- Processing Current Month Data (Daily & Breakdown) ---
        const currentMonthTx = allRangeTransactions.filter((t: any) => new Date(t.date) >= currentMonthStart)

        // Category Breakdown (Income/Exp)
        const expensesByCategory: Record<string, number> = {}
        const incomeByCategory: Record<string, number> = {}

        // Daily Spending
        const dailySpendingMap: Record<string, { income: number; expense: number }> = {}

        currentMonthTx.forEach((t: any) => {
            const amt = Number(t.amount)
            const day = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

            // Category Sum
            if (t.type === 'EXPENSE') {
                expensesByCategory[t.categoryId] = (expensesByCategory[t.categoryId] || 0) + amt
            } else {
                incomeByCategory[t.categoryId] = (incomeByCategory[t.categoryId] || 0) + amt
            }

            // Daily Sum
            if (!dailySpendingMap[day]) dailySpendingMap[day] = { income: 0, expense: 0 }
            if (t.type === 'EXPENSE') dailySpendingMap[day].expense += amt
            else dailySpendingMap[day].income += amt
        })

        // Format Category Breakdown
        const categoryBreakdown = {
            expense: Object.entries(expensesByCategory).map(([catId, amount]) => {
                const cat = categories.find((c: any) => c.id === catId)
                return {
                    name: cat?.name || 'Unknown',
                    color: cat?.color || '#6B7280',
                    amount
                }
            }).sort((a, b) => b.amount - a.amount),
            income: Object.entries(incomeByCategory).map(([catId, amount]) => {
                const cat = categories.find((c: any) => c.id === catId)
                return {
                    name: cat?.name || 'Unknown',
                    color: cat?.color || '#10B981',
                    amount
                }
            }).sort((a, b) => b.amount - a.amount)
        }

        // --- Processing Top Spending (Last 3 Months) ---
        const threeMonthsTx = allRangeTransactions.filter((t: any) => new Date(t.date) >= threeMonthsAgo && t.type === 'EXPENSE')
        const topSpendingMap: Record<string, number> = {}
        threeMonthsTx.forEach((t: any) => {
            topSpendingMap[t.categoryId] = (topSpendingMap[t.categoryId] || 0) + Number(t.amount)
        })

        const topSpending = Object.entries(topSpendingMap).map(([catId, amount]) => {
            const cat = categories.find((c: any) => c.id === catId)
            return {
                name: cat?.name || 'Unknown',
                icon: cat?.icon || '📦',
                color: cat?.color || '#6B7280',
                amount
            }
        }).sort((a, b) => b.amount - a.amount).slice(0, 5)


        // --- Summary Stats ---
        const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0)
        const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0)
        const avgMonthlyIncome = totalIncome / months
        const avgMonthlyExpense = totalExpense / months

        return NextResponse.json({
            success: true,
            data: {
                monthlyData,
                categoryBreakdown,
                dailySpending: Object.entries(dailySpendingMap).map(([day, data]) => ({
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
