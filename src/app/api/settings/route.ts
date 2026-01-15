import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Theme } from '@prisma/client'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { theme, whatsappNumber, geminiApiKey, fonntApiKey, telegramChatId } = body

        // Map lowercase theme to Prisma Enum (UPPERCASE)
        let prismaTheme: Theme = Theme.SYSTEM
        if (theme === 'light') prismaTheme = Theme.LIGHT
        if (theme === 'dark') prismaTheme = Theme.DARK

        // Always update the FIRST settings record found (singleton pattern)
        // or create if not exists
        const settings = await prisma.settings.upsert({
            where: { id: 'default' },
            update: {
                theme: prismaTheme,
                whatsappNumber,
                geminiApiKey,
                fonntApiKey,
                telegramChatId,
            },
            create: {
                id: 'default',
                theme: prismaTheme,
                password: '', // Should be hashed, but for this simpler implementation we might ignore it here or handle separately
                whatsappNumber,
                geminiApiKey,
                fonntApiKey,
                telegramChatId,
            }
        })

        return NextResponse.json({ success: true, data: settings })
    } catch (error) {
        console.error('Error saving settings:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to save settings' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const settings = await prisma.settings.findUnique({
            where: { id: 'default' }
        })

        if (!settings) {
            return NextResponse.json({ success: false, error: 'Settings not found' })
        }

        // Don't send password hash
        const { password, ...safeSettings } = settings
        return NextResponse.json({ success: true, data: safeSettings })
    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch settings' },
            { status: 500 }
        )
    }
}
