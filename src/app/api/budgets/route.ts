import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - List all budgets for a month/year
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

        const budgets = await prisma.budget.findMany({
            where: { month, year },
            include: { category: true },
            orderBy: { amount: 'desc' }
        })

        // Get spent amounts for each budget
        const startOfMonth = new Date(year, month - 1, 1)
        const endOfMonth = new Date(year, month, 0)

        const budgetsWithSpent = await Promise.all(
            budgets.map(async (budget: typeof budgets[number]) => {
                const spent = await prisma.transaction.aggregate({
                    where: {
                        categoryId: budget.categoryId,
                        type: 'EXPENSE',
                        date: { gte: startOfMonth, lte: endOfMonth }
                    },
                    _sum: { amount: true }
                })

                const spentAmount = Number(spent._sum.amount || 0)
                const budgetAmount = Number(budget.amount)
                const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0

                return {
                    ...budget,
                    amount: budgetAmount,
                    spent: spentAmount,
                    percentage: Math.min(percentage, 100),
                    isOverBudget: spentAmount > budgetAmount,
                    isNearLimit: percentage >= budget.alertThreshold
                }
            })
        )

        return NextResponse.json({
            success: true,
            data: budgetsWithSpent
        })
    } catch (error) {
        console.error('Budgets GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch budgets' },
            { status: 500 }
        )
    }
}

// POST - Create or update budget
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { categoryId, amount, month, year, alertThreshold } = body

        if (!categoryId || !amount || !month || !year) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const budget = await prisma.budget.upsert({
            where: {
                categoryId_month_year: { categoryId, month, year }
            },
            update: {
                amount,
                alertThreshold: alertThreshold ?? 80
            },
            create: {
                categoryId,
                amount,
                month,
                year,
                alertThreshold: alertThreshold ?? 80
            },
            include: { category: true }
        })

        return NextResponse.json({
            success: true,
            data: { ...budget, amount: Number(budget.amount) }
        }, { status: 201 })
    } catch (error) {
        console.error('Budget POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create budget' },
            { status: 500 }
        )
    }
}
