import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/services/auth.service'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // console.log('Register attempt:', body);

        // Basic validation
        if (!body.email || !body.password || !body.username) {
            return NextResponse.json(
                { success: false, error: 'Email, password and username are required' },
                { status: 400 }
            )
        }

        if (body.password.length > 128 || body.email.length > 256 || body.username.length > 16) {
            return NextResponse.json(
                { success: false, error: 'Email, Password or Username is too long' },
                { status: 400 }
            )
        }

        const result = await AuthService.register({
            email: body.email,
            password: body.password,
            username: body.username
        })

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { success: true, data: result.message },
            { status: 201 }
        )

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Registration failed' },
            { status: 500 }
        )
    }
}