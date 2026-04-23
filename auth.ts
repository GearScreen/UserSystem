import NextAuth from "next-auth"
import "next-auth/jwt"

import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";

import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import Twitter from "next-auth/providers/twitter"

// Auth.js Config
export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" }, // Required for middleware & performance
    providers: [
        GitHub,
        Google,
        Twitter,
        Credentials({
            async authorize(credentials) {
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                });

                if (!user || !user.password) return null;

                const isValid = await argon2.verify(user.password, credentials.password as string);

                if (!isValid) return null;

                return { id: user.id, email: user.email, role: user.role };
            },
        }),
    ],
    basePath: "/auth",
    callbacks: {
        async jwt({ token, user }) {
            // Step 1: When the user logs in, add the role to the JWT
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            // Step 2: Make the role available in the session object
            if (token.role) {
                session.user.role = token.role;
            }
            return session;
        },
    },
});

declare module "next-auth" {
    interface Session {
        accessToken?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string
    }
}