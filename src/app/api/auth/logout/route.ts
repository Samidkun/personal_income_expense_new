import { NextRequest, NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        await clearSession()
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Logout failed' },
            { status: 500 }
        )
    }
}
