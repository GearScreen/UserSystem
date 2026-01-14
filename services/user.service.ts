import { prisma } from '@/lib/prisma'
import { CreateUserInput, UpdateUserInput } from '@/types/user'

export class UserService {

    // CREATE - Add new user
    static async createUser(data: CreateUserInput) {
        try {
            const user = await prisma.user.create({
                data: {
                    email: data.email,
                    passwordHash: data.passwordHash,
                    username: data.username,
                    role: data.role,
                }
            })
            return { success: true, data: user }
        } catch (error: any) {
            // Handle unique constraint violations
            if (error.code === 'P2002') {
                return { success: false, error: 'Email already exists' }
            }
            return { success: false, error: error.message }
        }
    }

    // READ - Get single user by ID
    static async getUserById(id: number) {
        try {
            const user = await prisma.user.findUnique({
                where: { id }
            })

            if (!user) {
                return { success: false, error: 'User not found', code: 404 }
            }

            return { success: true, data: user }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    // READ - Get user by email
    static async getUserByEmail(email: string) {
        try {
            const user = await prisma.user.findUnique({
                where: { email }
            })

            if (!user) {
                return { success: false, error: 'User not found', code: 404 }
            }

            return { success: true, data: user }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    // READ - Get all users
    static async getUsers() {
        try {
            const users = await prisma.user.findMany()

            return {
                success: true, users
            }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    // UPDATE - Update user
    static async updateUser(id: number, data: UpdateUserInput) {
        try {
            const user = await prisma.user.update({
                where: { id },
                data: {
                    username: data.username,
                    passwordHash: data.passwordHash,
                    role: data.role,
                    status: data.status,
                    createdAt: new Date()
                }
            })

            return { success: true, data: user }
        } catch (error: any) {
            if (error.code === 'P2025') {
                return { success: false, error: 'User not found', code: 404 }
            }
            return { success: false, error: error.message }
        }
    }

    // DELETE - Soft delete (update status)
    static async softDeleteUser(id: number) {
        try {
            const user = await prisma.user.update({
                where: { id },
                data: {
                    status: 'INACTIVE',
                    // updatedAt: new Date()
                }
            })

            return { success: true, data: user }
        } catch (error: any) {
            if (error.code === 'P2025') {
                return { success: false, error: 'User not found', code: 404 }
            }
            return { success: false, error: error.message }
        }
    }

    // DELETE - Hard delete (remove from database)
    static async deleteUser(id: number) {
        try {
            await prisma.user.delete({
                where: { id }
            })

            return { success: true, message: 'User deleted successfully' }
        } catch (error: any) {
            if (error.code === 'P2025') {
                return { success: false, error: 'User not found', code: 404 }
            }
            return { success: false, error: error.message }
        }
    }

    // TODO: SOFT DELETE inactive (1month) users
    // TODO: HARD DELETE unverified + inactive users

    // STATS - Get user statistics
    static async getUserStats() {
        try {
            const [totalUsers, activeUsers, admins, byRole] = await Promise.all([
                prisma.user.count(),
                prisma.user.count({ where: { status: 'ACTIVE' } }),
                prisma.user.count({ where: { role: 'ADMIN' } }),
                prisma.user.groupBy({
                    by: ['role'],
                    _count: true
                }),
                prisma.user.groupBy({
                    by: ['status'],
                    _count: true
                })
            ])

            return {
                success: true,
                data: {
                    totalUsers,
                    activeUsers,
                    inactiveUsers: totalUsers - activeUsers,
                    admins,
                    byRole,
                    summary: {
                        activePercentage: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(1) : 0,
                        adminPercentage: totalUsers > 0 ? (admins / totalUsers * 100).toFixed(1) : 0
                    }
                }
            }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }
}