import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/services/user.service'

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

        const result = await UserService.login({
            email: body.email,
            password: body.password
        }, request)

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

        return NextResponse.json({
            success: true,
            data: result.data,
            token: result.token,
        })
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Login failed' },
            { status: 500 }
        )
    }
}