import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createToken, setSession, clearSession } from '@/lib/auth'

// POST - Login
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { password } = body

        if (!password) {
            return NextResponse.json(
                { success: false, error: 'Password is required' },
                { status: 400 }
            )
        }

        const isValid = await verifyPassword(password)

        if (!isValid) {
            return NextResponse.json(
                { success: false, error: 'Invalid password' },
                { status: 401 }
            )
        }

        const token = await createToken()
        await setSession(token)

        return NextResponse.json({
            success: true,
            message: 'Login successful'
        })
    } catch (error) {
        console.error('Auth POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Login failed' },
            { status: 500 }
        )
    }
}

// DELETE - Logout
export async function DELETE() {
    try {
        await clearSession()
        return NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        })
    } catch (error) {
        console.error('Auth DELETE error:', error)
        return NextResponse.json(
            { success: false, error: 'Logout failed' },
            { status: 500 }
        )
    }
}
