import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    profilePictureLink?: string | null;
    description?: string | null;
    createdAt?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      profilePictureLink?: string | null;
      description?: string | null;
      createdAt: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    profilePictureLink?: string | null;
    description?: string | null;
    createdAt?: string;
  }
}
