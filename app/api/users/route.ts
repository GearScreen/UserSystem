import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/services/user.service'

import { Prisma } from '@prisma/client';

// Read User(s)
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const id = searchParams.get('id');

        if (id) {
            // console.log("Fetching user with ID:", id);
            // Return specific user
            if (isNaN(Number(id))) {
                return NextResponse.json(
                    { error: 'Invalid user ID' },
                    { status: 400 }
                );
            }

            const user = await UserService.getUserById(Number(id));
            if (!user) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json(user);
        }

        let result = await UserService.getUsers();

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { success: true, ...result.users }
        )

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Update User
export async function PUT(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const id = Number(searchParams.get('id'));

        if (id) {
            if (isNaN(id)) {
                return NextResponse.json(
                    { error: 'Invalid user ID' },
                    { status: 400 }
                );
            }
            console.log("Updating user with ID:", id);

            const body: Prisma.UserUpdateInput = await request.json()
            const result = await UserService.updateUser(id, body)

            if (!result.success) {
                const status = result.code || 400
                return NextResponse.json(
                    { success: false, error: result.error },
                    { status }
                )
            }

            return NextResponse.json(
                { success: true, data: result.data }
            )
        }

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Delete User
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const id = Number(searchParams.get('id'));
        const hardDelete = searchParams.get('hard') === 'true'

        if (id) {
            if (isNaN(id)) {
                return NextResponse.json(
                    { error: 'Invalid user ID' },
                    { status: 400 }
                );
            }
            console.log(hardDelete? "Hard " : " Soft" + "Deleting user with ID:", id);

            const result = hardDelete
                ? await UserService.deleteUser(id)
                : await UserService.softDeleteUser(id)

            if (!result.success) {
                const status = result.code || 400
                return NextResponse.json(
                    { success: false, error: result.error },
                    { status }
                )
            }

            return NextResponse.json(
                { success: true, result }
            )
        }

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}