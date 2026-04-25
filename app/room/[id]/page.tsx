import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth/auth-options";
import { getRoomById } from "@/app/lib/db/rooms";
import RoomView from "./room-view";

type RoomRow = {
    id: number;
    host_id: number;
    name: string;
    description: string | null;
    publicity: string;
    max_members: number | null;
    invite_code: string | null;
    created_at: string;
};

export default async function RoomPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const param = await params;
    const roomId = Number(param.id);
    if (!Number.isFinite(roomId)) notFound();

    const session = await getServerSession(authOptions);
    if (!session) {
        redirect(`/signin?callbackUrl=/room/${param.id}`);
    }

    const room = getRoomById(roomId) as RoomRow | undefined;
    if (!room) notFound();

    return (
        <RoomView
            room={{
                id: room.id,
                hostId: room.host_id,
                name: room.name,
                description: room.description,
                publicity: room.publicity,
                maxMembers: room.max_members,
                inviteCode: room.invite_code,
                createdAt: room.created_at,
            }}
            me={{
                id: Number(session.user.id),
                name: session.user.name ?? "Anonymous",
                pic: session.user.profilePictureLink ?? null,
            }}
        />
    );
}