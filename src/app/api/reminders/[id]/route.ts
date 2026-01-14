import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/* eslint-disable @typescript-eslint/no-explicit-any */

// GET - Get single reminder
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const reminder = await prisma.reminder.findUnique({
            where: { id }
        })

        if (!reminder) {
            return NextResponse.json(
                { success: false, error: 'Reminder not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: { ...reminder, amount: reminder.amount ? Number(reminder.amount) : null }
        })
    } catch (error) {
        console.error('Reminder GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch reminder' },
            { status: 500 }
        )
    }
}

// PUT - Update reminder
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { title, description, amount, dueDate, notifyDaysBefore, isCompleted } = body

        const reminder = await prisma.reminder.update({
            where: { id },
            data: {
                title: title ?? undefined,
                description: description ?? undefined,
                amount: amount !== undefined ? (amount || null) : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                notifyDaysBefore: notifyDaysBefore ?? undefined,
                isCompleted: isCompleted ?? undefined
            }
        })

        return NextResponse.json({
            success: true,
            data: { ...reminder, amount: reminder.amount ? Number(reminder.amount) : null }
        })
    } catch (error) {
        console.error('Reminder PUT error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update reminder' },
            { status: 500 }
        )
    }
}

// DELETE - Delete reminder
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.reminder.delete({
            where: { id }
        })

        return NextResponse.json({ success: true, message: 'Reminder deleted' })
    } catch (error) {
        console.error('Reminder DELETE error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete reminder' },
            { status: 500 }
        )
    }
}
