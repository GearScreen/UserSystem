import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import argon2 from "argon2";

// Auth.js Config
export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
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
    callbacks: {
        async jwt({ token, user }) {
            // Add Role to JWT
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            // Add role to session
            if (token.role) {
                session.user.role = token.role;
            }
            return session;
        },
    },
});