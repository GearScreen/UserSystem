import { PrismaClient } from "@/node_modules/.prisma/client";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Singleton prisma instance
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
});

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma