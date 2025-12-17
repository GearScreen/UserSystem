import { NextResponse } from 'next/server'
import { UserService } from '@/services/user.service'

export async function GET() {
    try {
        const result = await UserService.getUserStats()

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { success: true, ...result.data }
        )

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}