import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/* eslint-disable @typescript-eslint/no-explicit-any */

// GET - Get single recurring transaction
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const recurring = await prisma.recurringTransaction.findUnique({
            where: { id },
            include: { category: true }
        })

        if (!recurring) {
            return NextResponse.json(
                { success: false, error: 'Recurring transaction not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: { ...recurring, amount: Number(recurring.amount) }
        })
    } catch (error) {
        console.error('Recurring GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch recurring transaction' },
            { status: 500 }
        )
    }
}

// PUT - Update recurring transaction
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { amount, type, description, categoryId, walletId, frequency, startDate, endDate, isActive } = body

        const recurring = await prisma.recurringTransaction.update({
            where: { id },
            data: {
                amount: amount ?? undefined,
                type: type ?? undefined,
                description: description ?? undefined,
                categoryId: categoryId ?? undefined,
                walletId: walletId ?? undefined,
                frequency: frequency ?? undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : endDate === null ? null : undefined,
                isActive: isActive ?? undefined
            },
            include: { category: true }
        })

        return NextResponse.json({
            success: true,
            data: { ...recurring, amount: Number(recurring.amount) }
        })
    } catch (error) {
        console.error('Recurring PUT error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update recurring transaction' },
            { status: 500 }
        )
    }
}

// DELETE - Delete recurring transaction
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.recurringTransaction.delete({
            where: { id }
        })

        return NextResponse.json({ success: true, message: 'Recurring transaction deleted' })
    } catch (error) {
        console.error('Recurring DELETE error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete recurring transaction' },
            { status: 500 }
        )
    }
}
