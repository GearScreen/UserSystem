import argon2 from 'argon2'

export class PasswordManager {
    static async hashPassword(password: string): Promise<string> {
        return await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 2 ** 16,   // 64MB memory usage
            timeCost: 3,           // Number of iterations
            parallelism: 4,        // Number of parallel threads
            hashLength: 32,        // Hash output length in bytes
        })
    }

    static async verifyPassword(
        password: string,
        hashedPassword: string
    ): Promise<boolean> {
        try {
            return await argon2.verify(hashedPassword, password)
        } catch {
            return false
        }
    }

    static needsRehash(hashedPassword: string): boolean {
        return argon2.needsRehash(hashedPassword, {
            memoryCost: 65536,
            timeCost: 3,
        })
    }

    static validatePasswordStrength(password: string): {
        isValid: boolean
        errors: string[]
    } {
        const errors: string[] = []

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long')
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter')
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter')
        }

        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number')
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character')
        }

        const commonPasswords = [
            'password', '123456', 'qwerty', 'admin', 'welcome'
        ]

        if (commonPasswords.includes(password.toLowerCase())) {
            errors.push('Password is too common')
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }
}