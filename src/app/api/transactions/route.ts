import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - List transactions with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' | null
        const categoryId = searchParams.get('categoryId')
        const walletId = searchParams.get('walletId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const search = searchParams.get('search')

        const where: Record<string, unknown> = {}

        if (type) where.type = type
        if (categoryId) where.categoryId = categoryId
        if (walletId) where.walletId = walletId
        if (startDate || endDate) {
            where.date = {}
            if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate)
            if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate)
        }
        if (search) {
            where.description = { contains: search, mode: 'insensitive' }
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    category: true,
                    wallet: true,
                    tags: { include: { tag: true } }
                },
                orderBy: { date: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.transaction.count({ where })
        ])

        return NextResponse.json({
            success: true,
            data: transactions.map((t: typeof transactions[number]) => ({
                ...t,
                amount: Number(t.amount),
                tags: t.tags.map((tt: { tag: unknown }) => tt.tag)
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Transactions GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch transactions' },
            { status: 500 }
        )
    }
}

// POST - Create transaction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { amount, type, description, date, categoryId, walletId, tagIds } = body

        if (!amount || !type || !categoryId || !walletId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Create transaction
        const transaction = await prisma.transaction.create({
            data: {
                amount,
                type,
                description,
                date: date ? new Date(date) : new Date(),
                categoryId,
                walletId,
                tags: tagIds?.length ? {
                    create: tagIds.map((tagId: string) => ({ tagId }))
                } : undefined
            },
            include: {
                category: true,
                wallet: true
            }
        })

        // Update wallet balance
        const amountChange = type === 'INCOME' ? amount : -amount
        await prisma.wallet.update({
            where: { id: walletId },
            data: {
                balance: { increment: amountChange }
            }
        })

        // --- BUDGET ALERT LOGIC ---
        if (type === 'EXPENSE') {
            try {
                // 1. Check if there is a budget for this category
                const now = new Date(date || new Date())
                const month = now.getMonth() + 1 // 1-indexed
                const year = now.getFullYear()

                const budget = await prisma.budget.findFirst({
                    where: {
                        categoryId,
                        month,
                        year
                    },
                    include: { category: true }
                })

                if (budget) {
                    // 2. Calculate total spending for this category in this month
                    const startOfMonth = new Date(year, month - 1, 1)
                    const endOfMonth = new Date(year, month, 0, 23, 59, 59)

                    const aggregations = await prisma.transaction.aggregate({
                        _sum: { amount: true },
                        where: {
                            categoryId,
                            type: 'EXPENSE',
                            date: {
                                gte: startOfMonth,
                                lte: endOfMonth
                            }
                        }
                    })

                    const totalSpent = Number(aggregations._sum.amount || 0)
                    const budgetLimit = Number(budget.amount)
                    const percentage = (totalSpent / budgetLimit) * 100

                    // 3. Send Alert if Threshold Reached (e.g. 80%)
                    if (percentage >= budget.alertThreshold) {
                        // Get Telegram Chat ID
                        const settings = await prisma.settings.findUnique({ where: { id: 'default' } })

                        if (settings?.telegramChatId) {
                            const { sendTelegramMessage } = await import('@/lib/telegram')
                            const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })

                            let alertLevel = '⚠️ Peringatan Budget'
                            let emoji = '⚠️'
                            if (percentage >= 100) {
                                alertLevel = '🚨 OVER BUDGET!'
                                emoji = '🚨'
                            }

                            const message = `<b>${emoji} ${alertLevel}</b>

Kategori: <b>${budget.category.name}</b>
Terpakai: <b>${formatter.format(totalSpent)}</b>
Budget: ${formatter.format(budgetLimit)}
Persentase: <b>${percentage.toFixed(1)}%</b>

${percentage >= 100 ? 'Stop jajan! Udah tekor nih!' : 'Hati-hati, jatah menipis!'}`

                            await sendTelegramMessage(settings.telegramChatId, message)
                        }
                    }
                }
            } catch (alertError) {
                console.error('Failed to send budget alert:', alertError)
                // Don't fail the transaction just because alert failed
            }
        }
        // --------------------------

        return NextResponse.json({
            success: true,
            data: { ...transaction, amount: Number(transaction.amount) }
        }, { status: 201 })
    } catch (error) {
        console.error('Transaction POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create transaction' },
            { status: 500 }
        )
    }
}
