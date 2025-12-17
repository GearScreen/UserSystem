import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        // Test 1: Raw SQL query
        const rawTest = await prisma.$queryRaw`SELECT 1 as connection_test`

        // Test 2: Try to list tables (if any)
        const tables = await prisma.$queryRaw`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        LIMIT 5`

        // Test 3: Check connection pool stats
        const connectionInfo = await prisma.$queryRaw`SHOW STATUS LIKE 'Threads_connected'`

        return NextResponse.json({
            success: true,
            message: 'Database connection successful!',
            timestamp: new Date().toISOString(),
            tests: {
                rawQuery: rawTest,
                tablesFound: Array.isArray(tables) ? tables.length : 0,
                sampleTables: Array.isArray(tables) ? tables.slice(0, 3) : [],
                connectionInfo: connectionInfo
            }
        })
    } catch (error) {
        return Response.json({ error: 'Database connection failed' }, { status: 500 })
    }
}