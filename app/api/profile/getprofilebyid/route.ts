import { getUserById } from "@/app/lib/db/users";

export async function GET(req: Request) {
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