import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/services/user.service'
// import { getUserIdFromToken } from '@/lib/auth/jwt' //TODO

export async function POST(request: NextRequest) {
    try {
        // Get user ID from session/token
        const userId = await 1 // getUserIdFromToken(request)
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()

        if (!body.currentPassword || !body.newPassword) {
            return NextResponse.json(
                { success: false, error: 'Current and new password are required' },
                { status: 400 }
            )
        }

        const result = await UserService.changePassword(userId, {
            currentPassword: body.currentPassword,
            newPassword: body.newPassword
        })

        if (!result.success) {
            return NextResponse.json(
                { success: false, result },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { success: true, result }
        )

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Failed to change password' },
            { status: 500 }
        )
    }
}