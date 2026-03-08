import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { verifyUserCredentials } from "@/lib/server/users";

const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9._-]+$/i, "Используйте латиницу, цифры, точку, дефис или подчёркивание."),
  password: z.string().min(8).max(128),
});

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/auth",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Username + Password",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await verifyUserCredentials(parsed.data.username, parsed.data.password);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.displayName ?? user.username,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.username = user.username ?? user.name ?? "";
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.username =
          typeof token.username === "string" ? token.username : session.user.name ?? "";
      }

      return session;
    },
  },
};
