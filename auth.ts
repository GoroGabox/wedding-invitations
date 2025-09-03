// auth.ts
import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

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
        const user = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!user || !user.password) return null;
        const ok = await compare(creds.password.toString(), user.password);
        return ok
          ? { id: user.id, email: user.email, name: user.name, role: user.role }
          : null;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = Number(user.id);
        // @ts-ignore
        token.role = user.role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId as number;
        (session.user as any).role = (token as any).role ?? "USER";
      }
      return session;
    },
  },

  trustHost: true,
});
