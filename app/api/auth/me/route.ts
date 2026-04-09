import { verifyToken } from "@/app/lib/auth/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const token = cookieStore.get("token");

  if (!token) return NextResponse.json({ user: null });

  const user = verifyToken(token);

  return NextResponse.json({ user });
}