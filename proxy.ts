import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>()

export async function proxy(request: NextRequest) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    // const ip = forwardedFor?.split(',')[0].trim() || "Unknown"
    const ip = request.headers.get("x-real-ip") || "Unknown";
    const path = request.nextUrl.pathname;
    // console.log('Request from IP:', ip, ' to path:', path);

    // TODO: Refresh Session

    // Rate limiting for auth endpoints
    if (path.startsWith('/api/users')) {
        // console.log('Applying rate limiting for IP:', ip);
        const now = Date.now()
        const limit = rateLimit.get(ip)

        // TODO : Redirect if user is not authorized
        // NextResponse.redirect(new URL('/', request.url))

        if (limit) {
            if (now < limit.resetTime) {
                if (limit.count >= 10) { // 10 requests per window
                    return NextResponse.json(
                        { error: 'Too many requests' },
                        { status: 429 }
                    )
                }
                rateLimit.set(ip, { count: limit.count + 1, resetTime: limit.resetTime })
            } else {
                rateLimit.set(ip, { count: 1, resetTime: now + 60 * 1000 }) // 1 minute window
            }
        } else {
            rateLimit.set(ip, { count: 1, resetTime: now + 60 * 1000 })
        }
    }

    // Security headers
    const response = NextResponse.next()

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