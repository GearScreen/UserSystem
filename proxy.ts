import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { auth } from "@/auth";

const rateLimit = new Map<string, { count: number; resetTime: number }>()

export async function proxy(request: NextRequest) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
    // const path = request.nextUrl.pathname;
    // console.log('Request from IP:', ip, ' to path:', path);
    request.headers.set('x-user-ip', ip)

    const isStatic = request.nextUrl.pathname.startsWith('/_next')

    if (!isStatic && limitRate(ip)) {
        return NextResponse.json(
            { error: "Too many requests" },
            { status: 429 }
        )
    }

    // TODO : Redirect if user is not authorized (Based on session)
    // NextResponse.redirect(new URL('/', request.url))

    const session = await auth();

    if (session) {
        if (session.user.role === "USER") {
            console.log("USER Access");
        }
        if (session.user.role === "MODERATOR") {
            console.log("MODERATOR Access");
        }
        if (session.user.role === "ADMIN") {
            console.log("ADMIN Access");
        }
    }

    const isDev = process.env.NODE_ENV === 'development';
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

    // Security headers
    const response = NextResponse.next()
    response.headers.set('x-nonce', nonce);
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Content-Security-Policy
    const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' ${isDev ? "'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set('Content-Security-Policy', cspHeader);

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

    if (ipLimit.count < 30) {
        return false
    }

    if (now < ipLimit.resetTime) {
        console.log(`1 Minute Block for IP : ${ip}`)
        return true
    } else {
        rateLimit.set(ip, { count: 1, resetTime })
    }
}