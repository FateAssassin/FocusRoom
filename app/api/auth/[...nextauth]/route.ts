import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth/auth-options";
import { getClientIp, rateLimit, retryAfterSeconds } from "@/app/lib/rate-limit";

const handler = NextAuth(authOptions);

const SIGNIN_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };

type NextAuthHandler = (req: Request, ctx: unknown) => Promise<Response>;

async function POST(req: Request, ctx: unknown) {
  const url = new URL(req.url);
  if (url.pathname.endsWith("/auth/callback/credentials")) {
    const ip = getClientIp(req);
    const limit = rateLimit(`signin:${ip}`, SIGNIN_LIMIT);
    if (!limit.ok) {
      return new Response("Too many sign-in attempts. Try again in a few minutes.", {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds(limit.resetAt)) },
      });
    }
  }
  return (handler as NextAuthHandler)(req, ctx);
}

export { handler as GET, POST };
