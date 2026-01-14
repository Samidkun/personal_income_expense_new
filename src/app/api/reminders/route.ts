import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/* eslint-disable @typescript-eslint/no-explicit-any */

// GET - List all reminders
export async function GET() {
    try {
        const reminders = await prisma.reminder.findMany({
            orderBy: { dueDate: 'asc' }
        })

        return NextResponse.json({
            success: true,
            data: reminders.map((r: any) => ({
                ...r,
                amount: r.amount ? Number(r.amount) : null
            }))
        })
    } catch (error) {
        console.error('Reminders GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch reminders' },
            { status: 500 }
        )
    }
}

// POST - Create reminder
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { title, description, amount, dueDate, notifyDaysBefore } = body

        if (!title || !dueDate) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const reminder = await prisma.reminder.create({
            data: {
                title,
                description,
                amount: amount || null,
                dueDate: new Date(dueDate),
                notifyDaysBefore: notifyDaysBefore || 1
            }
        })

        return NextResponse.json({
            success: true,
            data: { ...reminder, amount: reminder.amount ? Number(reminder.amount) : null }
        }, { status: 201 })
    } catch (error) {
        console.error('Reminder POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create reminder' },
            { status: 500 }
        )
    }
}
