import crypto from 'crypto';

export function generateVerificationToken() {
    // Generate a secure random token
    return crypto.randomBytes(32).toString('hex');
}

export function generateTokenWithExpiry(expiryHours = 24) {
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    return {
        token,
        expiresAt
    };
}