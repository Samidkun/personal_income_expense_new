import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createToken, setSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { password } = body

        if (!password) {
            return NextResponse.json(
                { success: false, error: 'Password required' },
                { status: 400 }
            )
        }

        const isValid = await verifyPassword(password)

        if (!isValid) {
            return NextResponse.json(
                { success: false, error: 'Password salah' },
                { status: 401 }
            )
        }

        const token = await createToken()
        await setSession(token)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        )
    }
}
