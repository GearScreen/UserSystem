import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/services/auth.service'
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // console.log("Login attempt with body:", body);

        if (!body.email || !body.password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            )
        }

        const result = await AuthService.login({
            email: body.email,
            password: body.password
        })

        if (!result.success) {
            const status = result.locked ? 423 : 401 // 423 = Locked
            return NextResponse.json(
                { success: false, error: result.error },
                { status }
            )
        }

        if (result?.data?.id == null || result?.data?.email == null) {
            return NextResponse.json(
                { success: false, error: 'Invalid user data' },
                { status: 400 }
            )
        }

        // Generate JWT token -> in auth service?
        const token = jwt.sign(
            { userId: result.data.id, email: result.data.email },
            process.env.JWT_SECRET as string, { expiresIn: parseInt(process.env.JWT_EXPIRES_IN as string) }
        )
        // console.log("Generated JWT Token:", token);

        return NextResponse.json({
            success: true,
            data: result.data,
            token
        })
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Login failed' },
            { status: 500 }
        )
    }
}