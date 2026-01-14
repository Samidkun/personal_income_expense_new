import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/* eslint-disable @typescript-eslint/no-explicit-any */

// GET - List all tags
export async function GET() {
    try {
        const tags = await prisma.tag.findMany({
            orderBy: { name: 'asc' }
        })

        return NextResponse.json({
            success: true,
            data: tags
        })
    } catch (error) {
        console.error('Tags GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch tags' },
            { status: 500 }
        )
    }
}

// POST - Create tag
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, color } = body

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Name is required' },
                { status: 400 }
            )
        }

        const tag = await prisma.tag.create({
            data: {
                name,
                color: color || '#9CA3AF'
            }
        })

        return NextResponse.json({
            success: true,
            data: tag
        }, { status: 201 })
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { success: false, error: 'Tag already exists' },
                { status: 400 }
            )
        }
        console.error('Tag POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create tag' },
            { status: 500 }
        )
    }
}
