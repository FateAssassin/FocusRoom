import db from "@/app/lib/db/db";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { getClientIp, rateLimit, retryAfterSeconds } from "@/app/lib/rate-limit";

const REGISTER_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = rateLimit(`register:${ip}`, REGISTER_LIMIT);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Try again in a few minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds(limit.resetAt)) },
      },
    );
  }

  const { email, password, name } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "error-username" }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "error-email" }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "error-email-format" }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: "error-password" }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: "error-length-password" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    db.prepare(`
      INSERT INTO users (email, password, name)
      VALUES (?, ?, ?)
    `).run(
      email.trim(),
      hashedPassword,
      name
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "User with that email or username already exists, please choose a different one or sign in." }, { status: 400 });
  }
}
