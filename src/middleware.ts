import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Define public paths that don't need authentication
    const publicPaths = ['/login', '/public']

    // Also ignore Next.js internals and static files
    if (
        path.startsWith('/_next') ||
        path.startsWith('/api/auth') ||
        path.startsWith('/uploads') ||
        path.includes('.')
    ) {
        return NextResponse.next()
    }

    const isPublicPath = publicPaths.includes(path)
    const token = request.cookies.get('auth-token')?.value || ''

    // Verify token
    const isAuthenticated = await verifyToken(token)

    // Redirect logic:
    // 1. If not authenticated and trying to access protected page -> Login
    if (!isPublicPath && !isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. If authenticated and on login page -> Dashboard
    if (isPublicPath && isAuthenticated && path === '/login') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
