import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Get single transaction
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                category: true,
                wallet: true,
                tags: { include: { tag: true } },
                attachments: true
            }
        })

        if (!transaction) {
            return NextResponse.json(
                { success: false, error: 'Transaction not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                ...transaction,
                amount: Number(transaction.amount),
                tags: transaction.tags.map((tt: { tag: unknown }) => tt.tag)
            }
        })
    } catch (error) {
        console.error('Transaction GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch transaction' },
            { status: 500 }
        )
    }
}

// PUT - Update transaction
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { amount, type, description, date, categoryId, walletId, tagIds } = body

        // Get old transaction for balance adjustment
        const oldTransaction = await prisma.transaction.findUnique({
            where: { id }
        })

        if (!oldTransaction) {
            return NextResponse.json(
                { success: false, error: 'Transaction not found' },
                { status: 404 }
            )
        }

        // Revert old wallet balance
        const oldAmountChange = oldTransaction.type === 'INCOME'
            ? -Number(oldTransaction.amount)
            : Number(oldTransaction.amount)

        await prisma.wallet.update({
            where: { id: oldTransaction.walletId },
            data: { balance: { increment: oldAmountChange } }
        })

        // Update tags if provided
        if (tagIds !== undefined) {
            await prisma.transactionTag.deleteMany({
                where: { transactionId: id }
            })

            if (tagIds.length > 0) {
                await prisma.transactionTag.createMany({
                    data: tagIds.map((tagId: string) => ({ transactionId: id, tagId }))
                })
            }
        }

        // Update transaction
        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                amount: amount ?? undefined,
                type: type ?? undefined,
                description: description ?? undefined,
                date: date ? new Date(date) : undefined,
                categoryId: categoryId ?? undefined,
                walletId: walletId ?? undefined
            },
            include: {
                category: true,
                wallet: true
            }
        })

        // Apply new wallet balance
        const newWalletId = walletId || oldTransaction.walletId
        const newAmount = amount ?? Number(oldTransaction.amount)
        const newType = type || oldTransaction.type
        const newAmountChange = newType === 'INCOME' ? newAmount : -newAmount

        await prisma.wallet.update({
            where: { id: newWalletId },
            data: { balance: { increment: newAmountChange } }
        })

        return NextResponse.json({
            success: true,
            data: { ...transaction, amount: Number(transaction.amount) }
        })
    } catch (error) {
        console.error('Transaction PUT error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update transaction' },
            { status: 500 }
        )
    }
}

// DELETE - Delete transaction
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const transaction = await prisma.transaction.findUnique({
            where: { id }
        })

        if (!transaction) {
            return NextResponse.json(
                { success: false, error: 'Transaction not found' },
                { status: 404 }
            )
        }

        // Revert wallet balance
        const amountChange = transaction.type === 'INCOME'
            ? -Number(transaction.amount)
            : Number(transaction.amount)

        await prisma.wallet.update({
            where: { id: transaction.walletId },
            data: { balance: { increment: amountChange } }
        })

        // Delete transaction (cascade will handle tags)
        await prisma.transaction.delete({
            where: { id }
        })

        return NextResponse.json({ success: true, message: 'Transaction deleted' })
    } catch (error) {
        console.error('Transaction DELETE error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete transaction' },
            { status: 500 }
        )
    }
}
