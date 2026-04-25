import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth/auth-options";
import { countIncomingRequests } from "@/app/lib/db/friends";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ count: 0 });
    }
    const count = countIncomingRequests(Number(session.user.id));
    return NextResponse.json({ count });
}
