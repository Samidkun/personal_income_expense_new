import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default-secret-change-in-production'
)

const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'admin123'

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword?: string): Promise<boolean> {
    if (hashedPassword) {
        return bcrypt.compare(password, hashedPassword)
    }
    // Simple password check against env variable
    return password === AUTH_PASSWORD
}

export async function createToken(): Promise<string> {
    return new SignJWT({ authenticated: true })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<boolean> {
    try {
        await jwtVerify(token, JWT_SECRET)
        return true
    } catch {
        return false
    }
}

export async function getSession(): Promise<boolean> {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) return false

    return verifyToken(token)
}

export async function setSession(token: string): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    })
}

export async function clearSession(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete('auth-token')
}
