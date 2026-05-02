import { getUserById } from "@/app/lib/db/users";
import { authOptions } from "@/app/lib/auth/auth-options";
import { getServerSession } from "next-auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }
  const user = getUserById(Number(id));
  if (!user) {
    return new Response("User not found", { status: 404 });
  }
  return new Response(JSON.stringify(user), {
    headers: { "Content-Type": "application/json" },
  });
}