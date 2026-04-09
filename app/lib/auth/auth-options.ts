import "server-only";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import db from "@/app/lib/db/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = db
          .prepare("SELECT * FROM users WHERE email = ?")
          .get(credentials.email) as
          | { id: number; email: string; name: string; password: string, profile_picture_link: string | null, description: string | null, created_at: string }
          | undefined;
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          profilePictureLink: user.profile_picture_link,
          description: user.description,
          createdAt: user.created_at,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.profilePictureLink = user.profilePictureLink;
        token.description = user.description;
        token.createdAt = user.createdAt;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.profilePictureLink = token.profilePictureLink as string | null;
        session.user.description = token.description as string | null;
        session.user.createdAt = token.createdAt as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
