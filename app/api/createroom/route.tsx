import { getRoomByHostId, createRoom } from "@/app/lib/db/rooms";

export async function POST(req: Request) {
    const { roomName, description, publicity, maxMembers, hostId } = await req.json();
    const existingRoom = getRoomByHostId(hostId);
    if (existingRoom) {
        return new Response("Host already has a room", { status: 400 });
    }
    if (!roomName || !hostId) {
        return new Response("Missing required fields", { status: 400 });
    }
    const newRoom = {
        id: Math.floor(Math.random() * 1000000),
        host_id: hostId,
        name: roomName,
        description: description || "",
        publicity: publicity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        max_members: maxMembers || 10,  
        invite_code: Math.random().toString(36).substring(2, 8),
        empty_since: null,
    };
    createRoom(newRoom);
    return new Response(JSON.stringify(newRoom), { status: 201 });
}