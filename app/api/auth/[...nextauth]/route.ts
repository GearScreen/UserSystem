import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt"

// import GitHubProvider from "next-auth/providers/github"
// import { compare } from "bcryptjs"

import { UserService } from "@/services/user.service"
import { prisma } from "@/lib/prisma"
import { PasswordManager } from '@/lib/password'

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: string
            name?: string | null
            email?: string | null
            image?: string | null
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: string
    }
}

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing credentials")
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user || !user.passwordHash) {
                    throw new Error("No user found")
                }

                const isValid = await PasswordManager.verifyPassword(
                    credentials.password,
                    user.passwordHash
                )

                if (!isValid) {
                    throw new Error("Invalid password")
                }

                return {
                    id: String(user.id),
                    email: user.email,
                    name: user.username,
                    role: user.role,
                }
            }
        }),
    ],

    callbacks: {
        // Customize the session object
        async session({ session, token }) {
            if (session.user) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: session.user.email! }
                })

                if (dbUser) {
                    session.user.id = String(dbUser.id)
                    session.user.role = String(dbUser.role)
                }
            }
            return session
        },

        // Customize the JWT token
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id
                // token.role = user.role
            }
            return token
        }
    },

    pages: {
        signIn: "/auth/signin",  // Custom signin page
        error: "/auth/error",     // Custom error page
    },

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }