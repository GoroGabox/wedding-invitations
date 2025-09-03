// auth.ts
import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { Role } from "@prisma/client";

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
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as Role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        const role = token.role as Role;
        if (role) session.user.role = role;
      }
      return session;
    },
  },
  trustHost: true,
});
