import { prisma } from '@/lib/prisma'
import { PasswordManager } from '@/lib/auth/password'
import { randomBytes } from 'crypto'
import { EmailService } from '@/services/email.service'
import { generateTokenWithExpiry } from '@/lib/verif_token';

export class AuthService {
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

    static async login(credentials: {
        email: string
        password: string
    }) {
        try {
            // Check if account is locked
            const lockedUser = await prisma.user.findFirst({
                where: {
                    email: credentials.email,
                    lockedUntil: { gt: new Date() }
                }
            })

            if (lockedUser) {
                return {
                    success: false,
                    error: 'Account is temporarily locked. Try again later.',
                    locked: true
                }
            }

            // Find user
            const user = await prisma.user.findUnique({
                where: { email: credentials.email }
            })

            if (!user) {
                // Simulate delay to prevent timing attacks
                await PasswordManager.hashPassword('dummy_password')
                return {
                    success: false,
                    error: 'Invalid credentials'
                }
            }

            // Verify password
            const isValid = await PasswordManager.verifyPassword(
                credentials.password,
                user.passwordHash
            )

            if (!isValid) {
                const attemptsLeft = await this.incrementLoginAttempts(user.id, user.loginAttempts) || 0;
                return {
                    success: false,
                    error: `Invalid credentials. ${attemptsLeft > 0 ? `${attemptsLeft} attempts remaining` : 'Account locked for 15 minutes'}`,
                    locked: user.loginAttempts + 1 >= 5
                }
            }

            // Successful login

            await this.resetLoginAttempts(user.id, user.status);
            await this.checkPasswordRehash(user.id, user.passwordHash, credentials.password);

            // Remove password hash from response
            const { passwordHash, ...safeUser } = user

            // TODO: Create Session / JWT Token
            // Session expires

            return {
                success: true,
                data: safeUser
            }
        } catch (error: any) {
            console.error('Login error:', error)
            return {
                success: false,
                error: 'Login failed'
            }
        }
    }

    static async incrementLoginAttempts(userId: number, loginAttempts: number) {
        try {
            let currentAttemps = loginAttempts + 1

            await prisma.user.update({
                where: { id: userId },
                data: {
                    loginAttempts: { increment: 1 },
                    ...(currentAttemps >= 5 ? {
                        lockedUntil: new Date(Date.now() + 15 * 60_000), // Lock for 15 minutes
                        status: 'LOCKED'
                    } : {})
                }
            })

            return 5 - (currentAttemps)
        } catch (error: any) {
            console.error('Increment login attempts error:', error)
        }
    }

    static async resetLoginAttempts(userId: number, status: string) {
        try {
            await prisma.user.update({
                where: { id: userId }, // user.id
                data: {
                    loginAttempts: 0,
                    lockedUntil: null,
                    lastLogin: new Date(),
                    ...(status === 'LOCKED' ? { status: 'ACTIVE' } : {}) // user.status
                }
            })
        } catch (error: any) {
            console.error('Reset login attempts error:', error)
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

    // TODO: SOFT DELETE inactive (1month) users
    // TODO: HARD DELETE unverified + inactive users
}