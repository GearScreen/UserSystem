import { NextRequest } from 'next/server';

import { Prisma } from '@prisma/client';
import { prisma } from "@/lib/prisma";
import { PasswordManager } from '@/lib/password'
import { EmailService } from '@/services/email.service'

import { randomBytes } from 'crypto'
import { generateTokenWithExpiry } from '@/lib/verif_token';
import jwt from "jsonwebtoken";

export class UserService {
    // CREATE - User
    static async register(userData: {
        email: string
        password: string
        username: string
    }) {
        try {
            // Validate password strength
            const validation = PasswordManager.validatePasswordStrength(userData.password)
            if (!validation.isValid) {
                // console.log('Password validation failed:', validation.errors);
                return {
                    success: false,
                    error: validation.errors
                }
            }

            // User Exist?
            const existingUser = await prisma.user.findUnique({
                where: { email: userData.email }
            })

            const passwordHash = await PasswordManager.hashPassword(userData.password)

            const feedback_message = 'Check your email for next steps'; // Avoid user enumeration

            if (existingUser) {
                return {
                    success: true,
                    message: feedback_message
                }
            }

            // Generate email verification token
            const { token, expiresAt } = generateTokenWithExpiry(24);

            // Create user
            await prisma.user.create({
                data: {
                    email: userData.email,
                    username: userData.username,
                    passwordHash: passwordHash,
                    verificationToken: token,
                    verificationExpiresAt: expiresAt,
                }
            })

            await EmailService.sendWelcomeEmail(userData.email, String(userData.username));
            await EmailService.sendVerificationEmail(userData.email, token);

            return {
                success: true,
                message: feedback_message
            }

        } catch (error: any) {
            console.error('Registration error:', error)
            return {
                success: false,
                error: 'Registration failed'
            }
        }
    }

    // READ - All
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

    // READ - by ID
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

    // UPDATE - Update user
    static async updateUser(id: number, data: Prisma.UserUpdateInput) {
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

    // DELETE - Soft (update status)
    static async softDeleteUser(id: number) {
        try {
            const user = await prisma.user.update({
                where: { id },
                data: {
                    status: 'INACTIVE',
                    updatedAt: new Date(),
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

    // DELETE - Hard (remove from database)
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

    static async login(credentials: {
        email: string
        password: string
    }, request: NextRequest) {
        try {
            const errMessage = 'Invalid credentials'

            const forwardedFor = request.headers.get('x-forwarded-for');
            const ip = forwardedFor?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';

            // check IP block
            const isIpBlocked = await this.isIpBlocked(ip)
            if (isIpBlocked) {
                return {
                    success: false,
                    error: "Too many requests", // Same message as Rate Limiting
                    locked: true
                }
            }

            // Find user
            const user = await prisma.user.findUnique({
                where: { email: credentials.email }
            })

            if (!user) {
                // Simulate delay -> prevent timing attacks
                await PasswordManager.hashPassword('dummy_password')
                return {
                    success: false,
                    error: errMessage,
                }
            }

            // Verify password
            const isValid = await PasswordManager.verifyPassword(
                credentials.password,
                user.passwordHash
            )

            await this.recordLoginAttempt(ip, credentials.email, isValid);

            if (!isValid) {
                return {
                    success: false,
                    error: errMessage,
                }
            }

            // Check if account is locked
            if (user.lockedUntil) {
                return {
                    success: false,
                    error: 'Account is temporarily locked. Try again later.',
                    locked: true
                }
            }

            // Successful login

            // await this.resetLoginAttempts(user.id, user.status);
            await this.checkPasswordRehash(user.id, user.passwordHash, credentials.password);

            // Remove password hash from response
            const { passwordHash, ...safeUser } = user

            // Sign JWT
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET as string, { expiresIn: parseInt(process.env.JWT_EXPIRES_IN as string) }
            )

            return {
                success: true,
                data: safeUser,
                token: token,
            }
        } catch (error: any) {
            console.error('Login error:', error)
            return {
                success: false,
                error: 'Login failed'
            }
        }
    }

    static async isIpBlocked(ip: string) {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        const recentFailures = await prisma.loginAttempt.count({
            where: {
                ipAddress: ip,
                success: false,
                createdAt: { gte: fifteenMinutesAgo },
            },
        });

        if (recentFailures >= 5) {
            return true;
        }

        return false;
    }

    static async recordLoginAttempt(ip: string, email: string, isValid: boolean) {
        try {
            // console.log(`Recording login attempt : ip = ${ip}, email = ${email}, isValid = ${isValid}`);
            await prisma.loginAttempt.create({
                data: {
                    emailUsed: email,
                    ipAddress: ip,
                    success: isValid,
                },
            });
        } catch (error: any) {
            console.error('Increment login attempts error:', error)
        }
    }

    static async checkPasswordRehash(userId: number, passwordHash: string, password: string) {
        try {
            if (PasswordManager.needsRehash) {
                const needsRehash = PasswordManager.needsRehash(passwordHash)
                if (needsRehash) {
                    const newHash = await PasswordManager.hashPassword(password)
                    await prisma.user.update({
                        where: { id: userId },
                        data: { passwordHash: newHash }
                    })
                }
            }
        } catch (error: any) {
            console.error('Password rehash error:', error)
        }
    }

    static async changePassword(userId: number, data: {
        currentPassword: string
        newPassword: string
    }) {
        try {
            // Get user
            const user = await prisma.user.findUnique({
                where: { id: userId }
            })

            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                }
            }

            // Verify current password
            const isValid = await PasswordManager.verifyPassword(
                data.currentPassword,
                user.passwordHash
            )

            if (!isValid) {
                return {
                    success: false,
                    error: 'Current password is incorrect'
                }
            }

            // Validate new password strength
            const validation = PasswordManager.validatePasswordStrength(data.newPassword)
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                }
            }

            // Hash new password
            const newPasswordHash = await PasswordManager.hashPassword(data.newPassword)

            // Update password
            await prisma.user.update({
                where: { id: userId },
                data: {
                    passwordHash: newPasswordHash,
                    updatedAt: new Date()
                }
            })

            return {
                success: true,
                message: 'Password changed successfully'
            }

        } catch (error: any) {
            console.error('Change password error:', error)
            return {
                success: false,
                error: 'Failed to change password'
            }
        }
    }

    // Reset password (forgot password flow)
    static async initiatePasswordReset(email: string) {
        try {
            const user = await prisma.user.findUnique({
                where: { email }
            })

            const feedback_message = 'If an account exists, you will receive a reset link'

            if (!user) {
                // Don't reveal if user exists or not
                return {
                    success: true,
                    message: feedback_message
                }
            }

            // Generate reset token
            const resetToken = randomBytes(32).toString('hex')
            const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken,
                    resetExpires
                }
            })

            // TODO: Send email with reset link
            // await sendResetEmail(user.email, resetToken)

            return {
                success: true,
                message: feedback_message
            }

        } catch (error: any) {
            console.error('Password reset error:', error)
            return {
                success: false,
                error: 'Failed to initiate password reset'
            }
        }
    }

    static async completePasswordReset(token: string, newPassword: string) {
        try {
            const user = await prisma.user.findFirst({
                where: {
                    resetToken: token,
                    resetExpires: { gt: new Date() }
                }
            })

            if (!user) {
                return {
                    success: false,
                    error: 'Invalid or expired reset token'
                }
            }

            // Validate new password
            const validation = PasswordManager.validatePasswordStrength(newPassword)
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                }
            }

            // Hash new password
            const newPasswordHash = await PasswordManager.hashPassword(newPassword)

            // Update password and clear reset token
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash: newPasswordHash,
                    resetToken: null,
                    resetExpires: null,
                    loginAttempts: 0,
                    lockedUntil: null,
                    status: 'ACTIVE',
                    updatedAt: new Date()
                }
            })

            return {
                success: true,
                message: 'Password reset successful'
            }

        } catch (error: any) {
            console.error('Complete reset error:', error)
            return {
                success: false,
                error: 'Failed to reset password'
            }
        }
    }

    // STATS - Get users statistics (Only for Admins)
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