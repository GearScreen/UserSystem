import NextAuth from "next-auth"
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";

import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";
import "next-auth/jwt"

import GitHub from "next-auth/providers/github"
// import Google from "next-auth/providers/google"
// import Twitter from "next-auth/providers/twitter"

// Auth.js Login
export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma as any),
    session: { strategy: "jwt" },
    providers: [
        GitHub,
        // Google,
        // Twitter,
        Credentials({
            async authorize(credentials, request) {
                const email = credentials?.email as string;
                const password = credentials?.password as string;

                const forwardedFor = request.headers.get('x-forwarded-for');
                const ip = forwardedFor?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';

                // Brute Force Attack -> Rate Limit
                let isBlocked = await isIpBlocked(ip)
                if (isBlocked) {
                    await argon2.verify(process.env.DUMMY_HASH!, password);
                    throw new Error("Too many requests");
                }

                // Find user
                const user = await prisma.user.findUnique({
                    where: { email: email }
                });

                if (!user || !user.passwordHash) {
                    // Timing Attack -> Dummy Check
                    await argon2.verify(process.env.DUMMY_HASH!, password);
                    recordLoginAttempt(ip, email, false)
                    return null;
                }

                // Verify User
                const isValid = await argon2.verify(user.passwordHash, password);

                recordLoginAttempt(ip, email, isValid)

                if (!isValid) {
                    console.log("Invalid Credentials");
                    throw new Error("Invalid Credentials");
                }

                // Check if account is Locked/Banned
                if (user.lockedUntil) {
                    throw new Error('Account is temporarily locked. Try again later.');
                }

                // Cleanup Failed Attempts
                await prisma.loginAttempt.deleteMany({ where: { ipAddress: ip, emailUsed: email, success: false } });

                console.log("Logged in");
                return { id: user.id.toString(), email: user.email || "", role: user.role, username: user.username || "" };
            },
        }),
    ],
    //basePath: "/auth",
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.username = user.username;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.username = token.username;
                session.user.role = token.role;
            }
            return session;
        },
    },
});

async function isIpBlocked(ip: string) {
    try {
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
    } catch (error: any) {
        console.error('IP Block error:', error)
        return true
    }
}

async function recordLoginAttempt(ip: string, email: string, success: boolean) {
    try {
        // console.log(`Recording login attempt : ip = ${ip}, email = ${email}, success = ${success}`);
        await prisma.loginAttempt.create({
            data: {
                emailUsed: email,
                ipAddress: ip,
                success: success,
            },
        });
    } catch (error: any) {
        console.error('Increment login attempts error:', error)
    }
}

declare module "next-auth" {
    interface User {
        id: string;
        email: string;
        role: string;
        username: string;
    }

    interface Session {
        accessToken?: string;
        user: {
            id: string;
            username: string;
            role: string;
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string
        id: string;
        role: string;
        username: string;
    }
}