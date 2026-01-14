import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!
const IV_LENGTH = 16

export class EncryptionService {
    static encrypt(text: string): string {
        const iv = crypto.randomBytes(IV_LENGTH)
        const cipher = crypto.createCipheriv('aes-256-gcm',
            Buffer.from(ENCRYPTION_KEY, 'hex'), iv)

        let encrypted = cipher.update(text, 'utf8', 'hex')
        encrypted += cipher.final('hex')
        const authTag = cipher.getAuthTag()

        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
    }

    static decrypt(text: string): string {
        const [iv, authTag, encrypted] = text.split(':')
        const decipher = crypto.createDecipheriv('aes-256-gcm',
            Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(iv, 'hex'))

        decipher.setAuthTag(Buffer.from(authTag, 'hex'))

        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    }
}