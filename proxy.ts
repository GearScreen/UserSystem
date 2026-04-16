import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimit = new Map<string, { count: number; resetTime: number }>()

export async function proxy(request: NextRequest) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
    const path = request.nextUrl.pathname;
    // console.log('Request from IP:', ip, ' to path:', path);

    // TODO: Refresh Session

    // TODO : Redirect if user is not authorized
    // NextResponse.redirect(new URL('/', request.url))

    if (path.startsWith('/api/users') && (limitRate(ip))) {
        return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429 }
            )
    }

    // Security headers
    const response = NextResponse.next()

    request.headers.set('x-user-ip', ip)
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    )

    return response
}

function limitRate(ip: string) {
    const now = Date.now()
    const ipLimit = rateLimit.get(ip)

    let resetTime = now + 60_000 // 1 minute window

    if (!ipLimit) {
        rateLimit.set(ip, { count: 1, resetTime })
        return false
    }

    rateLimit.set(ip, { count: ipLimit.count + 1, resetTime })

    if (ipLimit.count < 5) {
        return false
    }

    if (now < ipLimit.resetTime) {
        console.log("1 Minute Block")
        return true
    } else {
        rateLimit.set(ip, { count: 1, resetTime })
    }
}