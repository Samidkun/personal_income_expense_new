import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - List all categories
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' | null

        const where = type ? { type } : {}

        const categories = await prisma.category.findMany({
            where,
            orderBy: [
                { isDefault: 'desc' },
                { name: 'asc' }
            ]
        })

        return NextResponse.json({
            success: true,
            data: categories
        })
    } catch (error) {
        console.error('Categories GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch categories' },
            { status: 500 }
        )
    }
}

// POST - Create category
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, icon, color, type } = body

        if (!name || !type) {
            return NextResponse.json(
                { success: false, error: 'Name and type are required' },
                { status: 400 }
            )
        }

        const category = await prisma.category.create({
            data: {
                name,
                icon: icon || 'tag',
                color: color || '#6B7280',
                type,
                isDefault: false
            }
        })

        return NextResponse.json({
            success: true,
            data: category
        }, { status: 201 })
    } catch (error) {
        console.error('Category POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create category' },
            { status: 500 }
        )
    }
}
