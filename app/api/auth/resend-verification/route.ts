import { NextRequest, NextResponse } from 'next/server'
import { generateTokenWithExpiry } from '@/lib/verif_token';
import { EmailService } from '@/services/email.service'
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (user.emailVerified) {
            return NextResponse.json(
                { error: 'Email already verified' },
                { status: 400 }
            );
        }

        // Generate new token
        const { token, expiresAt } = generateTokenWithExpiry(24);

        // Update user with new token
        await prisma.user.update({
            where: { email },
            data: {
                verificationToken: token,
                verificationExpiresAt: expiresAt
            }
        });

        // Send verification email
        await EmailService.sendVerificationEmail(email, token);

        return NextResponse.json({
            message: 'Verification link sent to your email'
        }, { status: 200 });
    } catch (error) {
        console.error('Resend verification error:', error);
        return NextResponse.json(
            { error: 'Failed to resend verification link' },
            { status: 500 }
        );
    }
}