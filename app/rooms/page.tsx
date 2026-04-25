import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth/auth-options";
import { getAllRooms, getRoomByHostId } from "../lib/db/rooms";
import RoomsBrowser, { type RoomSummary } from "./rooms-browser";

type RoomRow = {
    id: number;
    name: string;
    description: string | null;
    publicity: string;
    created_at: string;
    max_members: number | null;
    invite_code: string | null;
};

export default async function RoomsPage() {
    const session = await getServerSession(authOptions);
    let existingRoom: RoomRow | null = null;
    if (session) {
        const existing = getRoomByHostId(Number(session.user.id));
        console.log(existing);
        if (existing) {
            existingRoom = existing as RoomRow;
        }
    }
            
    const all = getAllRooms() as RoomRow[];
    const publicRooms: RoomSummary[] = all
        .filter((r) => r.publicity !== "private")
        .map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            publicity: r.publicity,
            created_at: r.created_at,
            max_members: r.max_members,
            invite_code: r.invite_code,
        }));

    const createHref = session ? "/rooms/create" : "/signin?callbackUrl=/rooms/create";

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
                <header className="mb-8 md:mb-12 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Rooms</h1>
                    <p className="text-gray-500 mt-2 text-sm md:text-base max-w-xl mx-auto">
                        Join a focus session with friends, or start your own. Everyone on the
                        same timer, in sync.
                    </p>
                </header>

                <RoomsBrowser rooms={publicRooms} existingRoom={existingRoom} createHref={createHref} />
            </div>
        </div>
    );
}
