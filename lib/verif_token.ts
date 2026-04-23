import crypto from 'crypto';

export function generateVerificationToken() {
    // Generate token
    return crypto.randomBytes(32).toString('hex');
}

export function generateTokenWithExpiry(expiryHours = 24) {
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60_000);

    return {
        token,
        expiresAt
    };
}