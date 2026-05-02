import type { Metadata } from "next"
import { authOptions } from "@/app/lib/auth/auth-options"
import { getRoomByHostId } from "@/app/lib/db/rooms"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import CreateRoomForm from "./form"
import ExistingRoomRedirect from "./ExistingRoomRedirect"

export const metadata: Metadata = {
    title: "Create a room",
    description: "Set up a new FocusRoom focus session and invite your friends.",
    robots: { index: false, follow: false },
    alternates: { canonical: "/rooms/create" },
}

export default async function CreateRoomPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/signin");
    }
    const result = getRoomByHostId(Number(session.user.id));

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="card ">
                <p className="text-lg">Create room</p>
                {result ? <ExistingRoomRedirect roomId={result.id} /> : <CreateRoomForm hostId={Number(session.user.id)} />}
            </div>
        </div>
    )
}