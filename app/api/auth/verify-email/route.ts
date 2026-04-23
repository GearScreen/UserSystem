import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Verification token is required' },
                { status: 400 }
            );
        }

        // Find user by token
        const user = await prisma.user.findUnique({
            where: { verificationToken: token }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid verification token' },
                { status: 400 }
            );
        }

        // Check Already Verified
        if (user.emailVerified) {
            return NextResponse.json(
                { message: 'Email already verified' },
                { status: 200 }
            );
        }

        // Checck Token Expired
        if (new Date() > new Date(user.verificationExpiresAt)) {
            return NextResponse.json(
                { error: 'Verification link has expired' },
                { status: 400 }
            );
        }

        // Verify user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationExpiresAt: null
            }
        });

        return NextResponse.json({
            message: 'Email verified successfully'
        }, { status: 200 });
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        );
    }
}