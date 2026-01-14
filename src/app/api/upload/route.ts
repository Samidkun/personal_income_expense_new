import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const transactionId = formData.get('transactionId') as string

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, PDF' },
                { status: 400 }
            )
        }

        // Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { success: false, error: 'File too large. Max 5MB' },
                { status: 400 }
            )
        }

        // Generate unique filename
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const ext = file.name.split('.').pop()
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

        // Create uploads directory if not exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads')
        await mkdir(uploadDir, { recursive: true })

        // Save file
        const filepath = path.join(uploadDir, filename)
        await writeFile(filepath, buffer)

        const url = `/uploads/${filename}`

        // If transactionId provided, create attachment record
        if (transactionId) {
            const attachment = await prisma.attachment.create({
                data: {
                    transactionId,
                    filename,
                    originalName: file.name,
                    mimeType: file.type,
                    size: file.size,
                    url
                }
            })

            return NextResponse.json({
                success: true,
                data: attachment
            }, { status: 201 })
        }

        return NextResponse.json({
            success: true,
            data: { filename, url }
        }, { status: 201 })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to upload file' },
            { status: 500 }
        )
    }
}

// GET - List attachments for a transaction
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const transactionId = searchParams.get('transactionId')

        if (!transactionId) {
            return NextResponse.json(
                { success: false, error: 'Transaction ID required' },
                { status: 400 }
            )
        }

        const attachments = await prisma.attachment.findMany({
            where: { transactionId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({
            success: true,
            data: attachments
        })
    } catch (error) {
        console.error('Attachments GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch attachments' },
            { status: 500 }
        )
    }
}
