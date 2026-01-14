import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/* eslint-disable @typescript-eslint/no-explicit-any */

// GET - List all recurring transactions
export async function GET() {
    try {
        const recurring = await prisma.recurringTransaction.findMany({
            include: { category: true },
            orderBy: { nextDate: 'asc' }
        })

        return NextResponse.json({
            success: true,
            data: recurring.map((r: any) => ({
                ...r,
                amount: Number(r.amount)
            }))
        })
    } catch (error) {
        console.error('Recurring GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch recurring transactions' },
            { status: 500 }
        )
    }
}

// POST - Create recurring transaction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { amount, type, description, categoryId, walletId, frequency, startDate, endDate } = body

        if (!amount || !type || !categoryId || !walletId || !frequency || !startDate) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const start = new Date(startDate)

        const recurring = await prisma.recurringTransaction.create({
            data: {
                amount,
                type,
                description,
                categoryId,
                walletId,
                frequency,
                startDate: start,
                nextDate: start,
                endDate: endDate ? new Date(endDate) : null,
                isActive: true
            },
            include: { category: true }
        })

        return NextResponse.json({
            success: true,
            data: { ...recurring, amount: Number(recurring.amount) }
        }, { status: 201 })
    } catch (error) {
        console.error('Recurring POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create recurring transaction' },
            { status: 500 }
        )
    }
}

// PUT - Process due recurring transactions (create actual transactions)
export async function PUT() {
    try {
        const now = new Date()

        // Find all active recurring transactions that are due
        const dueRecurring = await prisma.recurringTransaction.findMany({
            where: {
                isActive: true,
                nextDate: { lte: now },
                OR: [
                    { endDate: null },
                    { endDate: { gte: now } }
                ]
            }
        })

        const created = []

        for (const recurring of dueRecurring) {
            // Create the transaction
            const transaction = await prisma.transaction.create({
                data: {
                    amount: recurring.amount,
                    type: recurring.type,
                    description: recurring.description,
                    date: recurring.nextDate,
                    categoryId: recurring.categoryId,
                    walletId: recurring.walletId,
                    recurringId: recurring.id
                }
            })

            // Update wallet balance
            const amountChange = recurring.type === 'INCOME'
                ? Number(recurring.amount)
                : -Number(recurring.amount)

            await prisma.wallet.update({
                where: { id: recurring.walletId },
                data: { balance: { increment: amountChange } }
            })

            // Calculate next date
            let nextDate = new Date(recurring.nextDate)
            switch (recurring.frequency) {
                case 'DAILY':
                    nextDate.setDate(nextDate.getDate() + 1)
                    break
                case 'WEEKLY':
                    nextDate.setDate(nextDate.getDate() + 7)
                    break
                case 'MONTHLY':
                    nextDate.setMonth(nextDate.getMonth() + 1)
                    break
                case 'YEARLY':
                    nextDate.setFullYear(nextDate.getFullYear() + 1)
                    break
            }

            // Check if should deactivate
            const shouldDeactivate = recurring.endDate && nextDate > recurring.endDate

            await prisma.recurringTransaction.update({
                where: { id: recurring.id },
                data: {
                    nextDate: shouldDeactivate ? recurring.nextDate : nextDate,
                    isActive: !shouldDeactivate
                }
            })

            created.push(transaction)
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${created.length} recurring transactions`,
            data: created
        })
    } catch (error) {
        console.error('Recurring PUT error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process recurring transactions' },
            { status: 500 }
        )
    }
}
