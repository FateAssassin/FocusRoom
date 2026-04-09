import db from "@/app/lib/db/db";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password, name } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "error-username" }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "error-email" }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: "error-password" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "error-password-length" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    db.prepare(`
      INSERT INTO users (email, password, name)
      VALUES (?, ?, ?)
    `).run(
      email,
      hashedPassword,
      name
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: "User with that email or username already exists, please choose a different one or sign in." }, { status: 400 });
  }
}