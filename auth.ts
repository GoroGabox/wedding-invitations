// auth.ts
import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import type { Session } from "next-auth";
import type { User } from "next-auth";

export const { auth, signIn, signOut, handlers } = NextAuth({
  adapter: PrismaAdapter(prisma),

  // 👇 NECESARIO con Credentials
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Email y contraseña",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (creds, req) => {
        if (!creds?.email || !creds?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: String(creds.email) } });
        if (!user || !user.password) return null;
        const ok = await compare(creds.password.toString(), user.password);
        return ok
          ? { id: String(user.id), email: user.email, name: user.name, role: user.role }
          : null;
      },
    }),
  ],

  callbacks: {
  async session({ session, token }) {
    // token.sub siempre es string
    if (session.user) {
      session.user.id = token.sub as string;
      if (typeof token.role === "string") {
        session.user.role = token.role as any;
      }
    }
    return session;
  },
  async jwt({ token, user }) {
    if (user) {
      token.role = (user as User).role ?? token.role;
    }
    return token;
  },
},
  trustHost: true,
});
