import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - List all wallets
export async function GET() {
    try {
        const wallets = await prisma.wallet.findMany({
            orderBy: { createdAt: 'asc' }
        })

        return NextResponse.json({
            success: true,
            data: wallets.map(w => ({
                ...w,
                balance: Number(w.balance)
            }))
        })
    } catch (error) {
        console.error('Wallets GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch wallets' },
            { status: 500 }
        )
    }
}

// POST - Create wallet
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, type, balance, currency, color, icon } = body

        if (!name || !type) {
            return NextResponse.json(
                { success: false, error: 'Name and type are required' },
                { status: 400 }
            )
        }

        const wallet = await prisma.wallet.create({
            data: {
                name,
                type,
                balance: balance || 0,
                currency: currency || 'IDR',
                color: color || '#3B82F6',
                icon: icon || 'wallet'
            }
        })

        return NextResponse.json({
            success: true,
            data: { ...wallet, balance: Number(wallet.balance) }
        }, { status: 201 })
    } catch (error) {
        console.error('Wallet POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create wallet' },
            { status: 500 }
        )
    }
}
