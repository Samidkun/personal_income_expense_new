import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Get single wallet with transaction summary
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const wallet = await prisma.wallet.findUnique({
            where: { id },
            include: {
                transactions: {
                    take: 10,
                    orderBy: { date: 'desc' },
                    include: { category: true }
                }
            }
        })

        if (!wallet) {
            return NextResponse.json(
                { success: false, error: 'Wallet not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                ...wallet,
                balance: Number(wallet.balance),
                transactions: wallet.transactions.map(t => ({
                    ...t,
                    amount: Number(t.amount)
                }))
            }
        })
    } catch (error) {
        console.error('Wallet GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch wallet' },
            { status: 500 }
        )
    }
}

// PUT - Update wallet
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, type, color, icon, currency } = body

        const wallet = await prisma.wallet.update({
            where: { id },
            data: {
                name: name ?? undefined,
                type: type ?? undefined,
                color: color ?? undefined,
                icon: icon ?? undefined,
                currency: currency ?? undefined
            }
        })

        return NextResponse.json({
            success: true,
            data: { ...wallet, balance: Number(wallet.balance) }
        })
    } catch (error) {
        console.error('Wallet PUT error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update wallet' },
            { status: 500 }
        )
    }
}

// DELETE - Delete wallet (only if no transactions)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Check for transactions
        const transactionCount = await prisma.transaction.count({
            where: { walletId: id }
        })

        if (transactionCount > 0) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete wallet with transactions. Delete transactions first.' },
                { status: 400 }
            )
        }

        await prisma.wallet.delete({
            where: { id }
        })

        return NextResponse.json({ success: true, message: 'Wallet deleted' })
    } catch (error) {
        console.error('Wallet DELETE error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete wallet' },
            { status: 500 }
        )
    }
}
