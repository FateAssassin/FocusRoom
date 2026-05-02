import { updateUserDescription } from "@/app/lib/db/users";
import { authOptions } from "@/app/lib/auth/auth-options";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const userId = session.user.id;
    try {
        const { description } = await request.json() as { description: string };   
        if (typeof userId !== "number" || typeof description !== "string") {
            return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
        }
        updateUserDescription(userId, description);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    catch (error) {
        console.error("Error updating description:", error);
        return new Response(JSON.stringify({ error: "Failed to update description" }), { status: 500 });
    }
}
