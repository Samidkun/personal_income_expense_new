import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { unlink } from 'fs/promises'
import path from 'path'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const attachment = await prisma.attachment.findUnique({
            where: { id }
        })

        if (!attachment) {
            return NextResponse.json(
                { success: false, error: 'Attachment not found' },
                { status: 404 }
            )
        }

        // Delete file from disk
        const filepath = path.join(process.cwd(), 'public', attachment.url)
        try {
            await unlink(filepath)
        } catch {
            // File might not exist, continue with DB deletion
        }

        // Delete from database
        await prisma.attachment.delete({
            where: { id }
        })

        return NextResponse.json({ success: true, message: 'Attachment deleted' })
    } catch (error) {
        console.error('Attachment DELETE error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete attachment' },
            { status: 500 }
        )
    }
}
