import { updateUserDescription } from "@/app/lib/db/users";

export async function POST(request: Request) {
    try {
        const { userId, description } = await request.json() as { userId: number; description: string };   
        console.log("Received request to update description for user ID", userId, "to:", description);
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
